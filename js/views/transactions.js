// Add/Edit transaction form and transaction history with search + filters
import {
    TRANSACTION_TYPES, getCategoriesByType, getBucketForCategory,
    getTransactionTypeLabel, getTransactionTypeColor, getTransactionPlaceholder,
    getCategoryName, getCategoryColor, getCategoryIcon, getTypeBadge
} from '../config.js';
import { StorageManager } from '../storage.js';
import { state, app } from '../state.js';
import { groupExpensesByMonth } from '../data.js';
import { getCurrencySymbol, escapeHtml, showToast } from '../ui.js';

// ─── Add / Edit Transaction ────────────────────────────────────────────────────
export function renderAddExpense() {
    const editing = state.editingId ? StorageManager.getExpenseById(state.editingId) : null;
    if (state.editingId && !editing) state.editingId = null;

    const today = new Date().toISOString().split('T')[0];
    const currencySymbol = getCurrencySymbol();
    const txType = editing ? (editing.type || getBucketForCategory(editing.category)) : state.txType;
    const typeCategories = getCategoriesByType(txType);
    const typeLabel = getTransactionTypeLabel(txType);
    const typeColor = getTransactionTypeColor(txType);

    const typeOption = (type, icon, color, label, pct) => `
        <label class="cursor-pointer">
            <input type="radio" name="transactionType" value="${type}"
                ${txType === type ? 'checked' : ''}
                class="peer sr-only" onchange="setTransactionType('${type}')">
            <div class="flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 peer-checked:border-${color}-500 peer-checked:bg-${color}-50 dark:peer-checked:bg-${color}-900/30 transition">
                <i data-lucide="${icon}" class="w-5 h-5 text-${color}-500"></i>
                <span class="text-xs font-medium dark:text-gray-200">${label}</span>
                <span class="text-[10px] text-gray-400">${pct}</span>
            </div>
        </label>`;

    return `
        <div class="max-w-md mx-auto">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">${editing ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <form onsubmit="handleTransactionSubmit(event)" class="bg-white dark:bg-gray-800 rounded-xl p-6 card-shadow space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget Bucket</label>
                    <div class="grid grid-cols-3 gap-2">
                        ${typeOption(TRANSACTION_TYPES.NEEDS, 'home', 'amber', 'Needs', '50%')}
                        ${typeOption(TRANSACTION_TYPES.WANTS, 'shopping-bag', 'purple', 'Wants', '20%')}
                        ${typeOption(TRANSACTION_TYPES.SAVINGS, 'trending-up', 'emerald', 'Savings', '30%')}
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">${currencySymbol}</span>
                        <input type="number" name="amount" required min="0.01" step="0.01"
                            value="${editing ? editing.amount : ''}"
                            class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-${typeColor}-500 focus:border-transparent outline-none"
                            placeholder="0.00">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <input type="text" name="description" required
                        value="${editing ? escapeHtml(editing.description) : ''}"
                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-${typeColor}-500 focus:border-transparent outline-none"
                        placeholder="${getTransactionPlaceholder(txType)}">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">${typeLabel} Category</label>
                    <div class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        ${typeCategories.map((cat, idx) => `
                            <label class="cursor-pointer">
                                <input type="radio" name="category" value="${cat.id}" required class="peer sr-only"
                                    ${(editing ? editing.category === cat.id : idx === 0) ? 'checked' : ''}>
                                <div class="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 peer-checked:border-${typeColor}-500 peer-checked:bg-${typeColor}-50 dark:peer-checked:bg-${typeColor}-900/30 transition">
                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: ${cat.color}20">
                                        <i data-lucide="${cat.icon}" class="w-4 h-4" style="color: ${cat.color}"></i>
                                    </div>
                                    <span class="text-sm font-medium dark:text-gray-200">${cat.name}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                    <input type="date" name="date" required value="${editing ? editing.date : today}"
                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-${typeColor}-500 focus:border-transparent outline-none">
                </div>

                <button type="submit" class="w-full bg-${typeColor}-600 hover:bg-${typeColor}-700 text-white font-medium py-3 rounded-lg transition">
                    ${editing ? 'Save Changes' : `Add ${typeLabel}`}
                </button>
                ${editing ? `
                    <button type="button" onclick="cancelEdit()" class="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        Cancel
                    </button>` : ''}
            </form>
        </div>
    `;
}

// ─── History ───────────────────────────────────────────────────────────────────
export function renderHistory() {
    let expenses = StorageManager.getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));

    const now = new Date();
    if (state.historyFilter === 'month') {
        expenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
    } else if (state.historyFilter === 'year') {
        expenses = expenses.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
    }

    if (state.historyBucket !== 'all') {
        expenses = expenses.filter(e => e.type === state.historyBucket);
    }

    if (state.historySearch.trim()) {
        const q = state.historySearch.trim().toLowerCase();
        expenses = expenses.filter(e =>
            (e.description || '').toLowerCase().includes(q) ||
            getCategoryName(e.category).toLowerCase().includes(q)
        );
    }

    const grouped = groupExpensesByMonth(expenses);
    const currencySymbol = getCurrencySymbol();
    const totalShown = expenses.reduce((s, e) => s + e.amount, 0);

    return `
        <div>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Transaction History</h2>
                <div class="flex gap-2">
                    <select onchange="setHistoryBucket(this.value)" class="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm">
                        <option value="all" ${state.historyBucket === 'all' ? 'selected' : ''}>All Buckets</option>
                        <option value="needs" ${state.historyBucket === 'needs' ? 'selected' : ''}>Needs</option>
                        <option value="wants" ${state.historyBucket === 'wants' ? 'selected' : ''}>Wants</option>
                        <option value="savings" ${state.historyBucket === 'savings' ? 'selected' : ''}>Savings</option>
                    </select>
                    <select onchange="filterHistory(this.value)" class="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm">
                        <option value="all" ${state.historyFilter === 'all' ? 'selected' : ''}>All Time</option>
                        <option value="month" ${state.historyFilter === 'month' ? 'selected' : ''}>This Month</option>
                        <option value="year" ${state.historyFilter === 'year' ? 'selected' : ''}>This Year</option>
                    </select>
                </div>
            </div>

            <div class="relative mb-4">
                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="search" id="historySearchInput" value="${escapeHtml(state.historySearch)}"
                    oninput="searchHistory(this.value)"
                    class="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Search description or category...">
            </div>

            ${expenses.length > 0 ? `
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">${expenses.length} transaction${expenses.length === 1 ? '' : 's'} • Total ${currencySymbol}${totalShown.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            ` : ''}

            ${Object.entries(grouped).map(([month, monthExpenses]) => `
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10">${month}</h3>
                    <div class="bg-white dark:bg-gray-800 rounded-xl card-shadow overflow-hidden">
                        ${monthExpenses.map((expense, idx) => `
                            <div class="flex items-center justify-between p-4 ${idx !== monthExpenses.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}">
                                <div class="flex items-center gap-3 min-w-0">
                                    <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style="background-color: ${getCategoryColor(expense.category)}20">
                                        <i data-lucide="${getCategoryIcon(expense.category)}" class="w-5 h-5" style="color: ${getCategoryColor(expense.category)}"></i>
                                    </div>
                                    <div class="min-w-0">
                                        <p class="font-medium text-gray-800 dark:text-gray-100 truncate">${escapeHtml(expense.description)} ${expense.recurringId ? '<i data-lucide="repeat" class="w-3 h-3 inline text-gray-400"></i>' : ''}</p>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">${getCategoryName(expense.category)} • ${new Date(expense.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 flex-shrink-0">
                                    <div class="text-right">
                                        <span class="font-semibold text-gray-800 dark:text-gray-100">${currencySymbol}${expense.amount.toFixed(2)}</span>
                                        <div><span class="text-xs px-2 py-0.5 rounded-full" style="background-color: ${getTypeBadge(expense.type).bg}; color: ${getTypeBadge(expense.type).color}">${getTypeBadge(expense.type).label}</span></div>
                                    </div>
                                    <button onclick="startEditTransaction('${expense.id}')" class="text-gray-400 hover:text-indigo-600 p-1" title="Edit">
                                        <i data-lucide="pencil" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="deleteExpense('${expense.id}')" class="text-red-400 hover:text-red-600 p-1" title="Delete">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}

            ${expenses.length === 0 ? `
                <div class="text-center py-12">
                    <i data-lucide="inbox" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4"></i>
                    <p class="text-gray-500 dark:text-gray-400">${state.historySearch || state.historyBucket !== 'all' ? 'No transactions match your filters' : 'No transactions yet'}</p>
                    <button onclick="setView('add')" class="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline">Add your first transaction</button>
                </div>
            ` : ''}
        </div>
    `;
}

// ─── Handlers ──────────────────────────────────────────────────────────────────
export function handleTransactionSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        amount: parseFloat(form.amount.value),
        description: form.description.value.trim(),
        category: form.category.value,
        date: form.date.value,
        type: form.transactionType.value
    };

    if (state.editingId) {
        StorageManager.updateExpense(state.editingId, data);
        state.editingId = null;
        showToast('Transaction updated');
        state.view = 'history';
    } else {
        StorageManager.addExpense(data);
        showToast(`${getTransactionTypeLabel(data.type)} transaction added`);
        state.view = 'dashboard';
    }
    app.rerender();
}

export function setTransactionType(type) {
    state.txType = type;
    // Changing bucket while editing: treat as re-categorization
    if (state.editingId) {
        const tx = StorageManager.getExpenseById(state.editingId);
        if (tx) {
            const cats = getCategoriesByType(type);
            StorageManager.updateExpense(state.editingId, { type, category: cats[0].id });
        }
    }
    app.rerender();
}

export function startEditTransaction(id) {
    const tx = StorageManager.getExpenseById(id);
    if (!tx) return;
    state.editingId = id;
    state.txType = tx.type || getBucketForCategory(tx.category);
    state.view = 'add';
    app.rerender();
}

export function cancelEdit() {
    state.editingId = null;
    state.view = 'history';
    app.rerender();
}

export function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        StorageManager.deleteExpense(id);
        showToast('Transaction deleted', 'info');
        app.rerender();
    }
}

export function filterHistory(value) {
    state.historyFilter = value;
    app.rerender();
}

export function setHistoryBucket(value) {
    state.historyBucket = value;
    app.rerender();
}

let searchDebounce = null;
export function searchHistory(value) {
    state.historySearch = value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
        app.rerender();
        // Restore focus to the search box after re-render
        const input = document.getElementById('historySearchInput');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    }, 250);
}
