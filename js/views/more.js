// "More" menu, Savings Goals, Recurring Transactions, and Settings views
import {
    TRANSACTION_TYPES, categories, currencies, getCategoriesByType,
    getCategoryName, getCategoryColor, getCategoryIcon,
    getTransactionTypeLabel
} from '../config.js';
import { StorageManager, uid, materializeRecurring, migrateData } from '../storage.js';
import { state, app } from '../state.js';
import { getCurrencySymbol, escapeHtml, showToast, toggleDarkMode, applyTheme } from '../ui.js';
import { isCloudConfigured, signInWithGoogle, signOutUser } from '../cloud.js';

// ─── More menu ─────────────────────────────────────────────────────────────────
export function renderMore() {
    const items = [
        { view: 'report', icon: 'file-text', label: 'Monthly Report', desc: 'Printable 50/20/30 summary per month' },
        { view: 'goals', icon: 'target', label: 'Savings Goals', desc: 'Track progress toward your goals' },
        { view: 'recurring', icon: 'repeat', label: 'Recurring Transactions', desc: 'Rent, subscriptions, EMIs — added automatically' },
        { view: 'settings', icon: 'settings', label: 'Settings', desc: 'Profile, budgets, data, account & appearance' }
    ];

    return `
        <div class="max-w-md mx-auto space-y-3">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">More</h2>
            ${items.map(item => `
                <button onclick="setView('${item.view}')" class="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 card-shadow hover:shadow-md transition text-left">
                    <div class="w-11 h-11 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i data-lucide="${item.icon}" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800 dark:text-gray-100">${item.label}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${item.desc}</p>
                    </div>
                    <i data-lucide="chevron-right" class="w-5 h-5 text-gray-300 dark:text-gray-600"></i>
                </button>
            `).join('')}
        </div>
    `;
}

// ─── Savings Goals ─────────────────────────────────────────────────────────────
export function renderGoals() {
    const goals = StorageManager.getGoals();
    const currencySymbol = getCurrencySymbol();

    return `
        <div class="max-w-2xl mx-auto space-y-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Savings Goals</h2>

            <form onsubmit="addGoal(event)" class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow space-y-3">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100">New Goal</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" name="goalName" required placeholder="Goal name (e.g., New Laptop)"
                        class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <input type="number" name="goalTarget" required min="1" step="0.01" placeholder="Target amount"
                        class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                </div>
                <button type="submit" class="w-full sm:w-auto px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition">
                    Create Goal
                </button>
            </form>

            ${goals.length === 0 ? `
                <div class="text-center py-12">
                    <i data-lucide="target" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400">No goals yet. Create one above to start saving with purpose.</p>
                </div>
            ` : goals.map(g => {
                const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0;
                const done = g.saved >= g.target;
                return `
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 ${done ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-sky-100 dark:bg-sky-900/40'} rounded-xl flex items-center justify-center">
                                    <i data-lucide="${done ? 'party-popper' : 'target'}" class="w-5 h-5 ${done ? 'text-emerald-600' : 'text-sky-600'}"></i>
                                </div>
                                <div>
                                    <p class="font-semibold text-gray-800 dark:text-gray-100">${escapeHtml(g.name)}</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">${currencySymbol}${g.saved.toLocaleString()} of ${currencySymbol}${g.target.toLocaleString()} (${pct.toFixed(0)}%)</p>
                                </div>
                            </div>
                            <button onclick="deleteGoal('${g.id}')" class="text-red-400 hover:text-red-600 p-1" title="Delete goal">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
                            <div class="h-3 rounded-full ${done ? 'bg-emerald-500' : 'bg-sky-500'} transition-all duration-500" style="width: ${pct}%"></div>
                        </div>
                        ${done ? `
                            <p class="text-sm text-emerald-600 font-medium">🎉 Goal reached!</p>
                        ` : `
                            <form onsubmit="contributeToGoal(event, '${g.id}')" class="flex gap-2">
                                <input type="number" name="amount" required min="0.01" step="0.01" placeholder="Add contribution"
                                    class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none">
                                <button type="submit" class="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium transition">
                                    Contribute
                                </button>
                            </form>
                            <p class="text-xs text-gray-400 mt-2">Contributions are also recorded as Savings transactions.</p>
                        `}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

export function addGoal(e) {
    e.preventDefault();
    const goals = StorageManager.getGoals();
    goals.push({
        id: uid(),
        name: e.target.goalName.value.trim(),
        target: parseFloat(e.target.goalTarget.value),
        saved: 0,
        createdAt: new Date().toISOString()
    });
    StorageManager.saveGoals(goals);
    showToast('Goal created');
    app.rerender();
}

export function contributeToGoal(e, goalId) {
    e.preventDefault();
    const amount = parseFloat(e.target.amount.value);
    const goals = StorageManager.getGoals();
    const goal = goals.find(g => String(g.id) === String(goalId));
    if (!goal || !(amount > 0)) return;

    goal.saved += amount;
    StorageManager.saveGoals(goals);
    StorageManager.addExpense({
        amount,
        description: `Goal: ${goal.name}`,
        category: 'goal_based_savings',
        type: TRANSACTION_TYPES.SAVINGS,
        date: new Date().toISOString().split('T')[0],
        goalId: goal.id
    });
    showToast(`Added to "${goal.name}" — recorded as a Savings transaction`);
    app.rerender();
}

export function deleteGoal(goalId) {
    if (!confirm('Delete this goal? Past contributions stay in your transaction history.')) return;
    StorageManager.saveGoals(StorageManager.getGoals().filter(g => String(g.id) !== String(goalId)));
    showToast('Goal deleted', 'info');
    app.rerender();
}

// ─── Recurring Transactions ────────────────────────────────────────────────────
export function renderRecurring() {
    const rules = StorageManager.getRecurring();
    const currencySymbol = getCurrencySymbol();
    const allCats = [...getCategoriesByType(TRANSACTION_TYPES.NEEDS).map(c => ({ ...c, bucket: 'needs' })),
                     ...getCategoriesByType(TRANSACTION_TYPES.WANTS).map(c => ({ ...c, bucket: 'wants' })),
                     ...getCategoriesByType(TRANSACTION_TYPES.SAVINGS).map(c => ({ ...c, bucket: 'savings' }))];

    return `
        <div class="max-w-2xl mx-auto space-y-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Recurring Transactions</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 -mt-4">Rules run automatically: each month the transaction is added on the chosen day when you open the app.</p>

            <form onsubmit="addRecurring(event)" class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow space-y-3">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100">New Recurring Rule</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="text" name="description" required placeholder="Description (e.g., House Rent)"
                        class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <input type="number" name="amount" required min="0.01" step="0.01" placeholder="Amount (${currencySymbol})"
                        class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    <select name="category" required class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm">
                        ${allCats.map(c => `<option value="${c.id}">${getTransactionTypeLabel(c.bucket)} — ${c.name}</option>`).join('')}
                    </select>
                    <div class="flex items-center gap-2">
                        <label class="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">Day of month</label>
                        <input type="number" name="dayOfMonth" required min="1" max="31" value="1"
                            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                </div>
                <button type="submit" class="w-full sm:w-auto px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition">
                    Add Rule
                </button>
            </form>

            ${rules.length === 0 ? `
                <div class="text-center py-12">
                    <i data-lucide="repeat" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400">No recurring rules yet. Add rent, subscriptions, or EMIs above.</p>
                </div>
            ` : `
                <div class="bg-white dark:bg-gray-800 rounded-xl card-shadow overflow-hidden">
                    ${rules.map((r, idx) => `
                        <div class="flex items-center justify-between p-4 ${idx !== rules.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''} ${r.active ? '' : 'opacity-50'}">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: ${getCategoryColor(r.category)}20">
                                    <i data-lucide="${getCategoryIcon(r.category)}" class="w-5 h-5" style="color: ${getCategoryColor(r.category)}"></i>
                                </div>
                                <div class="min-w-0">
                                    <p class="font-medium text-gray-800 dark:text-gray-100 truncate">${escapeHtml(r.description)}</p>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">${getCategoryName(r.category)} • Day ${r.dayOfMonth} • ${currencySymbol}${r.amount.toLocaleString()}/mo</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-2 flex-shrink-0">
                                <button onclick="toggleRecurring('${r.id}')" class="text-xs px-3 py-1.5 rounded-full font-medium ${r.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}">
                                    ${r.active ? 'Active' : 'Paused'}
                                </button>
                                <button onclick="deleteRecurring('${r.id}')" class="text-red-400 hover:text-red-600 p-1" title="Delete rule">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
}

export function addRecurring(e) {
    e.preventDefault();
    const form = e.target;
    const category = form.category.value;
    const rules = StorageManager.getRecurring();
    rules.push({
        id: uid(),
        description: form.description.value.trim(),
        amount: parseFloat(form.amount.value),
        category,
        type: categories.some(c => c.id === category)
            ? (getCategoriesByType(TRANSACTION_TYPES.NEEDS).some(c => c.id === category) ? 'needs'
                : getCategoriesByType(TRANSACTION_TYPES.WANTS).some(c => c.id === category) ? 'wants' : 'savings')
            : 'needs',
        dayOfMonth: Math.min(31, Math.max(1, parseInt(form.dayOfMonth.value, 10))),
        // Start from the 1st of the current month so this month's occurrence
        // is created immediately if its day has already passed
        startDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`,
        lastAdded: null,
        active: true
    });
    StorageManager.saveRecurring(rules);
    const created = materializeRecurring();
    showToast(created > 0 ? 'Rule added — transaction created for this month' : 'Recurring rule added');
    app.rerender();
}

export function toggleRecurring(id) {
    const rules = StorageManager.getRecurring();
    const rule = rules.find(r => String(r.id) === String(id));
    if (!rule) return;
    rule.active = !rule.active;
    // When resuming, don't backfill months that passed while paused
    if (rule.active) {
        const now = new Date();
        rule.lastAdded = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    StorageManager.saveRecurring(rules);
    showToast(rule.active ? 'Rule resumed (starts next month)' : 'Rule paused', 'info');
    app.rerender();
}

export function deleteRecurring(id) {
    if (!confirm('Delete this recurring rule? Already-created transactions are kept.')) return;
    StorageManager.saveRecurring(StorageManager.getRecurring().filter(r => String(r.id) !== String(id)));
    showToast('Recurring rule deleted', 'info');
    app.rerender();
}

// ─── Settings ──────────────────────────────────────────────────────────────────
export function renderSettings() {
    const user = StorageManager.getUserProfile() || {};
    const income = StorageManager.getIncome();
    const settings = StorageManager.getSettings();
    const budgets = StorageManager.getCategoryBudgets();
    const currencySymbol = getCurrencySymbol();
    const cloudOn = isCloudConfigured();

    return `
        <div class="max-w-2xl mx-auto space-y-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h2>

            <!-- Account / Sync -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <i data-lucide="cloud" class="w-4 h-4"></i> Account & Sync
                </h3>
                ${state.cloudUser ? `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            ${state.cloudUser.photoURL ? `<img src="${state.cloudUser.photoURL}" class="w-10 h-10 rounded-full" alt="">` : `
                                <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center">
                                    <i data-lucide="user" class="w-5 h-5 text-indigo-600"></i>
                                </div>`}
                            <div>
                                <p class="font-medium text-gray-800 dark:text-gray-100">${escapeHtml(state.cloudUser.displayName || 'Google Account')}</p>
                                <p class="text-sm text-gray-500 dark:text-gray-400">${escapeHtml(state.cloudUser.email || '')}</p>
                                <p class="text-xs mt-0.5 ${state.syncStatus === 'synced' ? 'text-emerald-500' : state.syncStatus === 'error' ? 'text-red-500' : 'text-gray-400'}">
                                    ${state.syncStatus === 'synced' ? '● Synced to cloud' : state.syncStatus === 'syncing' ? '● Syncing…' : state.syncStatus === 'error' ? '● Sync error' : ''}
                                </p>
                            </div>
                        </div>
                        <button onclick="handleSignOut()" class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            Sign Out
                        </button>
                    </div>
                ` : cloudOn ? `
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Sign in to back up your data and sync it across devices.</p>
                    <button onclick="handleSignIn()" class="flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Sign in with Google
                    </button>
                ` : `
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Google sign-in and cloud sync are ready to enable — add your Firebase project config in
                        <code class="text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">js/firebase-config.js</code>
                        (setup steps are in that file and the README). Until then, all data stays on this device.
                    </p>
                `}
            </div>

            <!-- Profile -->
            <form onsubmit="saveSettingsProfile(event)" class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow space-y-3">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                    <i data-lucide="user" class="w-4 h-4"></i> Profile
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
                        <input type="text" name="name" value="${escapeHtml(user.name || '')}" required
                            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Monthly Income</label>
                        <input type="number" name="income" value="${income}" required min="1" step="0.01"
                            class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Currency</label>
                        <select name="currency" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm">
                            ${currencies.map(c => `<option value="${c.code}" ${user.currency === c.code ? 'selected' : ''}>${c.symbol} ${c.code} — ${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <button type="submit" class="px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition">Save Profile</button>
            </form>

            <!-- Appearance -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <i data-lucide="palette" class="w-4 h-4"></i> Appearance
                </h3>
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Easier on the eyes at night</p>
                    </div>
                    <button onclick="handleToggleDarkMode()" class="relative w-12 h-6 rounded-full transition ${settings.darkMode ? 'bg-indigo-600' : 'bg-gray-300'}">
                        <span class="absolute top-0.5 ${settings.darkMode ? 'right-0.5' : 'left-0.5'} w-5 h-5 bg-white rounded-full shadow transition-all"></span>
                    </button>
                </div>
            </div>

            <!-- Category Budgets -->
            <form onsubmit="saveCategoryBudgetsForm(event)" class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-1 flex items-center gap-2">
                    <i data-lucide="gauge" class="w-4 h-4"></i> Category Budget Limits
                </h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">Optional monthly spending caps per category. Leave blank for no limit. Progress shows on the dashboard.</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-h-72 overflow-y-auto pr-1">
                    ${categories.map(cat => `
                        <div class="flex items-center justify-between gap-3 py-1">
                            <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 min-w-0">
                                <i data-lucide="${cat.icon}" class="w-4 h-4 flex-shrink-0" style="color: ${cat.color}"></i>
                                <span class="truncate">${cat.name}</span>
                            </label>
                            <div class="relative w-28 flex-shrink-0">
                                <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">${currencySymbol}</span>
                                <input type="number" name="budget_${cat.id}" min="0" step="0.01"
                                    value="${budgets[cat.id] || ''}" placeholder="—"
                                    class="w-full pl-6 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button type="submit" class="mt-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg text-sm transition">Save Limits</button>
            </form>

            <!-- Data -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <i data-lucide="database" class="w-4 h-4"></i> Data
                </h3>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button onclick="exportData()" class="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <i data-lucide="download" class="w-4 h-4"></i> JSON
                    </button>
                    <button onclick="exportCSV()" class="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <i data-lucide="table" class="w-4 h-4"></i> CSV
                    </button>
                    <button onclick="document.getElementById('importFile').click()" class="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <i data-lucide="upload" class="w-4 h-4"></i> Import
                    </button>
                    <button onclick="resetAllData()" class="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-red-300 dark:border-red-800 text-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i> Reset
                    </button>
                </div>
                <input type="file" id="importFile" class="hidden" accept=".json,.csv" onchange="importData(event)">
                <p class="text-xs text-gray-400 mt-2">Export = download a backup. Import accepts JSON backups or CSV files (date, type, category, description, amount).</p>
            </div>
        </div>
    `;
}

// ─── Settings handlers ─────────────────────────────────────────────────────────
export function saveSettingsProfile(e) {
    e.preventDefault();
    const form = e.target;
    const profile = StorageManager.getUserProfile() || {};
    profile.name = form.name.value.trim();
    profile.currency = form.currency.value;
    StorageManager.saveUserProfile(profile);
    StorageManager.saveIncome(parseFloat(form.income.value));
    showToast('Profile saved');
    app.rerender();
}

export function handleToggleDarkMode() {
    toggleDarkMode();
    app.rerender();
}

export function saveCategoryBudgetsForm(e) {
    e.preventDefault();
    const form = e.target;
    const budgets = {};
    categories.forEach(cat => {
        const val = parseFloat(form[`budget_${cat.id}`]?.value);
        if (val > 0) budgets[cat.id] = val;
    });
    StorageManager.saveCategoryBudgets(budgets);
    showToast('Budget limits saved');
    app.rerender();
}

export function handleSignIn() { signInWithGoogle(); }
export function handleSignOut() { signOutUser(); }

export function resetAllData() {
    if (!confirm('This deletes ALL local data: transactions, goals, recurring rules and settings. Export a backup first!\n\nContinue?')) return;
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
    StorageManager.resetAll();
    applyTheme();
    state.view = 'dashboard';
    state.onboardingStep = 1;
    app.rerender();
    showToast('All data has been reset', 'info');
}

// ─── Export / Import ───────────────────────────────────────────────────────────
function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function exportData() {
    downloadFile(
        JSON.stringify(StorageManager.snapshot(), null, 2),
        `budget-data-${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
    );
    showToast('Backup downloaded');
}

export function exportCSV() {
    const expenses = StorageManager.getExpenses();
    const esc = v => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
    };
    const header = 'date,type,category,description,amount';
    const rows = expenses
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(e => [e.date, e.type, e.category, esc(e.description), e.amount].join(','));
    downloadFile([header, ...rows].join('\n'), `budget-transactions-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    showToast('CSV downloaded');
}

function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else field += ch;
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field); field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field); field = '';
            if (row.some(f => f !== '')) rows.push(row);
            row = [];
        } else {
            field += ch;
        }
    }
    row.push(field);
    if (row.some(f => f !== '')) rows.push(row);
    return rows;
}

function importCSVText(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) throw new Error('CSV file is empty');

    const header = rows[0].map(h => h.trim().toLowerCase());
    const col = name => header.indexOf(name);
    const iDate = col('date'), iType = col('type'), iCat = col('category'),
          iDesc = col('description'), iAmt = col('amount');
    if (iDate === -1 || iAmt === -1) {
        throw new Error('CSV must have at least "date" and "amount" columns');
    }

    let imported = 0;
    rows.slice(1).forEach(r => {
        const amount = parseFloat(r[iAmt]);
        const date = (r[iDate] || '').trim();
        if (!(amount > 0) || isNaN(new Date(date))) return;
        const category = iCat !== -1 && r[iCat] ? r[iCat].trim() : 'misc_essential';
        const type = iType !== -1 && ['needs', 'wants', 'savings'].includes((r[iType] || '').trim().toLowerCase())
            ? r[iType].trim().toLowerCase()
            : undefined;
        StorageManager.addExpense({
            amount,
            date: new Date(date).toISOString().split('T')[0],
            category,
            type: type || 'needs',
            description: iDesc !== -1 ? (r[iDesc] || 'Imported') : 'Imported'
        });
        imported++;
    });
    return imported;
}

export function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const text = e.target.result;
            if (file.name.toLowerCase().endsWith('.csv')) {
                const count = importCSVText(text);
                showToast(`Imported ${count} transactions from CSV`);
            } else {
                const data = JSON.parse(text);
                if (data.expenses !== undefined) {
                    StorageManager.restore(data);
                    localStorage.removeItem('budget_migration_v2');
                    migrateData();
                    applyTheme();
                    showToast('Backup imported successfully');
                } else {
                    showToast('Invalid backup file format', 'error');
                    return;
                }
            }
            app.rerender();
        } catch (error) {
            console.error('Import failed:', error);
            showToast('Import failed: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
