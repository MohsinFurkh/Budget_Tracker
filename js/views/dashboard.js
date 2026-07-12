// Dashboard view: summary cards, 50/20/30 allocation, goals, budget limits, charts
import { TRANSACTION_TYPES, getCategoryName, getCategoryColor, getCategoryIcon, getTypeBadge } from '../config.js';
import { StorageManager } from '../storage.js';
import { getCurrentMonthTransactions, bucketTotals, getBudgetWarnings } from '../data.js';
import { getCurrencySymbol, escapeHtml } from '../ui.js';

export function renderDashboard() {
    const expenses = StorageManager.getExpenses();
    const monthlyIncome = StorageManager.getIncome();
    const currentMonthTransactions = getCurrentMonthTransactions(expenses);
    const totals = bucketTotals(currentMonthTransactions);

    const totalNeeds = totals[TRANSACTION_TYPES.NEEDS];
    const totalWants = totals[TRANSACTION_TYPES.WANTS];
    const totalSavings = totals[TRANSACTION_TYPES.SAVINGS];
    const totalOutflow = totalNeeds + totalWants + totalSavings;
    const remaining = monthlyIncome - totalOutflow;
    const remainingPercent = monthlyIncome > 0 ? (remaining / monthlyIncome) * 100 : 0;

    const needsTarget = monthlyIncome * 0.5;
    const wantsTarget = monthlyIncome * 0.2;
    const savingsTarget = monthlyIncome * 0.3;

    const needsPercent = monthlyIncome > 0 ? (totalNeeds / monthlyIncome) * 100 : 0;
    const wantsPercent = monthlyIncome > 0 ? (totalWants / monthlyIncome) * 100 : 0;
    const savingsPercent = monthlyIncome > 0 ? (totalSavings / monthlyIncome) * 100 : 0;

    const currencySymbol = getCurrencySymbol();
    const goals = StorageManager.getGoals();
    const budgetStatus = getBudgetWarnings(expenses);

    return `
        <div class="space-y-6">
            <!-- Main Summary -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 card-shadow text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-white/80 text-sm">Monthly Income</p>
                            <p class="text-3xl font-bold">${currencySymbol}${monthlyIncome.toLocaleString()}</p>
                        </div>
                        <button onclick="setView('settings')" class="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition" title="Edit in Settings">
                            <i data-lucide="edit-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                <div class="${remaining >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} rounded-xl p-6 card-shadow text-white">
                    <p class="text-white/80 text-sm">Remaining Balance</p>
                    <p class="text-3xl font-bold">${currencySymbol}${remaining.toLocaleString()}</p>
                    <p class="text-white/80 text-sm mt-1">${remainingPercent.toFixed(1)}% of income</p>
                </div>
            </div>

            <!-- 50/20/30 Budget Allocation -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Budget Allocation (50 / 20 / 30)</h3>
                <div class="space-y-5">
                    ${renderBucketBar('Needs', 'home', 'amber', totalNeeds, needsTarget, needsPercent, 50, currencySymbol)}
                    ${renderBucketBar('Wants', 'shopping-bag', 'purple', totalWants, wantsTarget, wantsPercent, 20, currencySymbol)}
                    ${renderBucketBar('Savings & Goals', 'trending-up', 'emerald', totalSavings, savingsTarget, savingsPercent, 30, currencySymbol, true)}
                </div>
            </div>

            <!-- Bucket Summary Cards -->
            <div class="grid grid-cols-3 gap-3">
                ${renderBucketCard('Needs', 'home', 'amber', totalNeeds, currencySymbol)}
                ${renderBucketCard('Wants', 'shopping-bag', 'purple', totalWants, currencySymbol)}
                ${renderBucketCard('Savings', 'trending-up', 'emerald', totalSavings, currencySymbol)}
            </div>

            ${goals.length > 0 ? renderGoalsSummary(goals, currencySymbol) : ''}
            ${budgetStatus.length > 0 ? renderBudgetLimits(budgetStatus, currencySymbol) : ''}

            <!-- Total Outflow Progress -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600 dark:text-gray-300">Total Outflow vs Income</span>
                    <span class="font-medium ${totalOutflow > monthlyIncome ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}">${currencySymbol}${totalOutflow.toLocaleString()} / ${currencySymbol}${monthlyIncome.toLocaleString()}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div class="h-4 rounded-full transition-all duration-500 flex" style="width: ${monthlyIncome > 0 ? Math.min((totalOutflow / monthlyIncome) * 100, 100) : 0}%">
                        <div class="bg-amber-500 h-full" style="width: ${totalOutflow > 0 ? (totalNeeds / totalOutflow) * 100 : 0}%"></div>
                        <div class="bg-purple-500 h-full" style="width: ${totalOutflow > 0 ? (totalWants / totalOutflow) * 100 : 0}%"></div>
                        <div class="bg-emerald-500 h-full" style="width: ${totalOutflow > 0 ? (totalSavings / totalOutflow) * 100 : 0}%"></div>
                    </div>
                </div>
                <div class="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-amber-500 rounded-full"></span> Needs</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-purple-500 rounded-full"></span> Wants</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 bg-emerald-500 rounded-full"></span> Savings</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    ${totalOutflow > monthlyIncome ? '⚠️ Warning: Outflow exceeds income!' : '✓ Outflow within income limit'}
                </p>
            </div>

            <!-- Charts -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Daily Spending</h3>
                    <canvas id="dailyChart" height="200"></canvas>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">By Bucket</h3>
                    <canvas id="categoryChart" height="200"></canvas>
                </div>
            </div>

            <!-- Recent Transactions -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100">Recent Transactions</h3>
                    <button onclick="setView('history')" class="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">View All</button>
                </div>
                <div class="space-y-3">
                    ${currentMonthTransactions.slice(-5).reverse().map(t => renderExpenseItem(t)).join('') ||
                        '<p class="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">No transactions this month yet.</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderBucketBar(label, icon, color, total, target, percent, targetPct, currencySymbol, isSavings = false) {
    const over = !isSavings && total > target;
    const widthPct = targetPct > 0 ? Math.min((percent / targetPct) * 100, 100) : 0;
    let statusText;
    if (isSavings) {
        statusText = total >= target ? '🎉 Target met!' : `${currencySymbol}${(target - total).toLocaleString()} more to reach target`;
    } else {
        statusText = over ? '⚠️ Over target' : '✓ Within target';
    }
    return `
        <div>
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-${color}-100 dark:bg-${color}-900/40 rounded-lg flex items-center justify-center">
                        <i data-lucide="${icon}" class="w-4 h-4 text-${color}-600 dark:text-${color}-400"></i>
                    </div>
                    <div>
                        <span class="font-medium text-gray-800 dark:text-gray-100">${label}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">(Target: ${targetPct}%)</span>
                    </div>
                </div>
                <div class="text-right">
                    <span class="font-semibold ${over ? 'text-red-600' : 'text-gray-800 dark:text-gray-100'}">${currencySymbol}${total.toLocaleString()}</span>
                    <span class="text-gray-400 text-sm"> / ${currencySymbol}${target.toLocaleString()}</span>
                </div>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div class="h-3 rounded-full transition-all duration-500 ${over ? 'bg-red-500' : `bg-${color}-500`}" style="width: ${widthPct}%"></div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${percent.toFixed(1)}% of income used ${statusText}</p>
        </div>
    `;
}

function renderBucketCard(label, icon, color, total, currencySymbol) {
    return `
        <div class="p-4 bg-${color}-50 dark:bg-${color}-900/20 rounded-xl border border-${color}-200 dark:border-${color}-800">
            <div class="w-8 h-8 bg-${color}-100 dark:bg-${color}-900/40 rounded-lg flex items-center justify-center mb-2">
                <i data-lucide="${icon}" class="w-4 h-4 text-${color}-600 dark:text-${color}-400"></i>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400">${label}</p>
            <p class="text-lg font-bold text-gray-800 dark:text-gray-100">${currencySymbol}${total.toLocaleString()}</p>
        </div>
    `;
}

function renderGoalsSummary(goals, currencySymbol) {
    return `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100">Savings Goals</h3>
                <button onclick="setView('goals')" class="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">Manage</button>
            </div>
            <div class="space-y-4">
                ${goals.slice(0, 3).map(g => {
                    const pct = g.target > 0 ? Math.min((g.saved / g.target) * 100, 100) : 0;
                    return `
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-medium text-gray-700 dark:text-gray-200">🎯 ${escapeHtml(g.name)}</span>
                                <span class="text-gray-500 dark:text-gray-400">${currencySymbol}${g.saved.toLocaleString()} / ${currencySymbol}${g.target.toLocaleString()}</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div class="h-2.5 rounded-full bg-sky-500 transition-all duration-500" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderBudgetLimits(budgetStatus, currencySymbol) {
    return `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100">Category Budgets (this month)</h3>
                <button onclick="setView('settings')" class="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">Edit</button>
            </div>
            <div class="space-y-3">
                ${budgetStatus.map(w => {
                    const pct = w.limit > 0 ? Math.min((w.spent / w.limit) * 100, 100) : 0;
                    const over = w.spent > w.limit;
                    const near = !over && w.spent >= w.limit * 0.8;
                    return `
                        <div>
                            <div class="flex justify-between text-sm mb-1">
                                <span class="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                                    <i data-lucide="${getCategoryIcon(w.catId)}" class="w-3.5 h-3.5" style="color: ${getCategoryColor(w.catId)}"></i>
                                    ${getCategoryName(w.catId)}
                                    ${over ? '<span class="text-xs text-red-500 font-semibold">OVER</span>' : near ? '<span class="text-xs text-amber-500 font-semibold">80%+</span>' : ''}
                                </span>
                                <span class="${over ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}">${currencySymbol}${w.spent.toLocaleString()} / ${currencySymbol}${w.limit.toLocaleString()}</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div class="h-2 rounded-full transition-all duration-500 ${over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-emerald-500'}" style="width: ${pct}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

export function renderExpenseItem(expense) {
    const currencySymbol = getCurrencySymbol();
    const typeBadge = getTypeBadge(expense.type || TRANSACTION_TYPES.NEEDS);
    const catColor = getCategoryColor(expense.category);
    const catIcon = getCategoryIcon(expense.category);

    return `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${catColor}20">
                    <i data-lucide="${catIcon}" class="w-5 h-5" style="color: ${catColor}"></i>
                </div>
                <div>
                    <p class="font-medium text-gray-800 dark:text-gray-100">${escapeHtml(expense.description)}</p>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500 dark:text-gray-400">${new Date(expense.date).toLocaleDateString()}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full" style="background-color: ${typeBadge.bg}; color: ${typeBadge.color}">${typeBadge.label}</span>
                        ${expense.recurringId ? '<i data-lucide="repeat" class="w-3 h-3 text-gray-400" title="Recurring"></i>' : ''}
                    </div>
                </div>
            </div>
            <span class="font-semibold text-gray-800 dark:text-gray-100">${currencySymbol}${expense.amount.toFixed(2)}</span>
        </div>
    `;
}
