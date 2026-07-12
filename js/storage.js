// Storage layer: localStorage persistence, data migration, recurring
// transaction materialization, and a sync hook for cloud backup.
import { CATEGORY_MIGRATION, getBucketForCategory } from './config.js';

// Called after every write so cloud sync can push changes (set by app.js)
let syncHook = null;
export function setSyncHook(fn) { syncHook = fn; }
function notifyChange() { if (syncHook) syncHook(); }

export function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const StorageManager = {
    EXPENSES_KEY: 'budget_expenses',
    INCOME_KEY: 'monthly_income',
    USER_KEY: 'user_profile',
    ONBOARDING_KEY: 'onboarding_complete',
    RECURRING_KEY: 'recurring_transactions',
    GOALS_KEY: 'savings_goals',
    BUDGETS_KEY: 'category_budgets',
    SETTINGS_KEY: 'app_settings',

    _get(key, fallback) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch {
            return fallback;
        }
    },
    _set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
        notifyChange();
    },

    getExpenses() { return this._get(this.EXPENSES_KEY, []); },
    saveExpenses(expenses) { this._set(this.EXPENSES_KEY, expenses); },

    getIncome() { return this._get(this.INCOME_KEY, 5000); },
    saveIncome(income) { this._set(this.INCOME_KEY, income); },

    getUserProfile() { return this._get(this.USER_KEY, null); },
    saveUserProfile(profile) { this._set(this.USER_KEY, profile); },

    isOnboardingComplete() { return localStorage.getItem(this.ONBOARDING_KEY) === 'true'; },
    completeOnboarding() { localStorage.setItem(this.ONBOARDING_KEY, 'true'); },
    resetOnboarding() { localStorage.removeItem(this.ONBOARDING_KEY); },

    addExpense(expense) {
        const expenses = this.getExpenses();
        expenses.push({ ...expense, id: expense.id ?? uid() });
        this.saveExpenses(expenses);
        return expenses;
    },

    updateExpense(id, changes) {
        const expenses = this.getExpenses().map(e =>
            String(e.id) === String(id) ? { ...e, ...changes } : e
        );
        this.saveExpenses(expenses);
        return expenses;
    },

    deleteExpense(id) {
        const expenses = this.getExpenses().filter(e => String(e.id) !== String(id));
        this.saveExpenses(expenses);
        return expenses;
    },

    getExpenseById(id) {
        return this.getExpenses().find(e => String(e.id) === String(id)) || null;
    },

    // ── Recurring transactions ────────────────────────────────────────────
    getRecurring() { return this._get(this.RECURRING_KEY, []); },
    saveRecurring(items) { this._set(this.RECURRING_KEY, items); },

    // ── Savings goals ─────────────────────────────────────────────────────
    getGoals() { return this._get(this.GOALS_KEY, []); },
    saveGoals(goals) { this._set(this.GOALS_KEY, goals); },

    // ── Per-category budget limits: { [categoryId]: number } ─────────────
    getCategoryBudgets() { return this._get(this.BUDGETS_KEY, {}); },
    saveCategoryBudgets(budgets) { this._set(this.BUDGETS_KEY, budgets); },

    // ── App settings ──────────────────────────────────────────────────────
    getSettings() { return this._get(this.SETTINGS_KEY, { darkMode: false }); },
    saveSettings(settings) { this._set(this.SETTINGS_KEY, settings); },

    // ── Full snapshot for export / cloud sync ─────────────────────────────
    snapshot() {
        return {
            version: 2,
            expenses: this.getExpenses(),
            income: this.getIncome(),
            user: this.getUserProfile(),
            recurring: this.getRecurring(),
            goals: this.getGoals(),
            categoryBudgets: this.getCategoryBudgets(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    },

    restore(data) {
        if (Array.isArray(data.expenses)) this.saveExpenses(data.expenses);
        if (data.income !== undefined) this.saveIncome(data.income);
        if (data.user) this.saveUserProfile(data.user);
        if (Array.isArray(data.recurring)) this.saveRecurring(data.recurring);
        if (Array.isArray(data.goals)) this.saveGoals(data.goals);
        if (data.categoryBudgets && typeof data.categoryBudgets === 'object') this.saveCategoryBudgets(data.categoryBudgets);
        if (data.settings && typeof data.settings === 'object') this.saveSettings(data.settings);
        this.completeOnboarding();
    },

    resetAll() {
        [this.EXPENSES_KEY, this.INCOME_KEY, this.USER_KEY, this.ONBOARDING_KEY,
         this.RECURRING_KEY, this.GOALS_KEY, this.BUDGETS_KEY, this.SETTINGS_KEY,
         'budget_migration_v2'].forEach(k => localStorage.removeItem(k));
    }
};

// ─── Data Migration ────────────────────────────────────────────────────────────
export function migrateData() {
    const MIGRATION_KEY = 'budget_migration_v2';
    if (localStorage.getItem(MIGRATION_KEY) === 'done') return;

    const expenses = StorageManager.getExpenses();
    if (expenses.length === 0) {
        localStorage.setItem(MIGRATION_KEY, 'done');
        return;
    }

    let migrated = false;
    const updatedExpenses = expenses.map(expense => {
        const updated = { ...expense };
        if (CATEGORY_MIGRATION[updated.category]) {
            updated.category = CATEGORY_MIGRATION[updated.category];
            migrated = true;
        }
        const oldTypes = ['expense', 'investment', 'transfer', 'commitment'];
        if (!updated.type || oldTypes.includes(updated.type)) {
            updated.type = getBucketForCategory(updated.category);
            migrated = true;
        }
        return updated;
    });

    if (migrated) StorageManager.saveExpenses(updatedExpenses);
    localStorage.setItem(MIGRATION_KEY, 'done');
}

// ─── Recurring transaction materialization ─────────────────────────────────────
// For each active rule, creates transactions for every due month up to today.
// Returns the number of transactions created.
export function materializeRecurring() {
    const rules = StorageManager.getRecurring();
    if (rules.length === 0) return 0;

    const now = new Date();
    let created = 0;
    const pad = n => String(n).padStart(2, '0');

    rules.forEach(rule => {
        if (!rule.active) return;
        const start = new Date(rule.startDate + 'T00:00:00');
        if (isNaN(start)) return;

        let y, m;
        if (rule.lastAdded) {
            const [ly, lm] = rule.lastAdded.split('-').map(Number);
            y = ly; m = lm - 1 + 1;          // month after lastAdded
            if (m > 11) { m = 0; y++; }
        } else {
            y = start.getFullYear(); m = start.getMonth();
        }

        while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth())) {
            const daysInMonth = new Date(y, m + 1, 0).getDate();
            const day = Math.min(rule.dayOfMonth, daysInMonth);
            const occurrence = new Date(y, m, day);

            if (occurrence > now) break;
            if (occurrence >= start) {
                StorageManager.addExpense({
                    amount: rule.amount,
                    description: rule.description,
                    category: rule.category,
                    type: rule.type,
                    date: `${y}-${pad(m + 1)}-${pad(day)}`,
                    recurringId: rule.id
                });
                rule.lastAdded = `${y}-${pad(m + 1)}`;
                created++;
            }
            m++;
            if (m > 11) { m = 0; y++; }
        }
    });

    if (created > 0) StorageManager.saveRecurring(rules);
    return created;
}
