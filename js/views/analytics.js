// Analytics view (trends, comparisons, insights) and printable Monthly Report
import {
    TRANSACTION_TYPES, categories, getBucketForCategory,
    getTransactionTypeLabel, getCategoryName, getCategoryColor, getCategoryIcon
} from '../config.js';
import { StorageManager } from '../storage.js';
import { state, app } from '../state.js';
import {
    getCategoryTotals, getMonthComparison, getMonthTransactions, bucketTotals, generateInsights
} from '../data.js';
import { getCurrencySymbol } from '../ui.js';

export function renderAnalytics() {
    const expenses = StorageManager.getExpenses();
    const categoryTotals = getCategoryTotals(expenses);
    const currencySymbol = getCurrencySymbol();
    const cmp = getMonthComparison(expenses);

    const changeBadge = cmp.change === null
        ? '<span class="text-gray-400 text-sm">no data last month</span>'
        : cmp.change >= 0
            ? `<span class="text-red-500 text-sm font-medium flex items-center gap-1"><i data-lucide="trending-up" class="w-4 h-4"></i>+${cmp.change.toFixed(1)}% vs last month</span>`
            : `<span class="text-emerald-500 text-sm font-medium flex items-center gap-1"><i data-lucide="trending-down" class="w-4 h-4"></i>${cmp.change.toFixed(1)}% vs last month</span>`;

    return `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Analytics</h2>

            <!-- Quick Stats -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Spent This Month</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">${currencySymbol}${cmp.thisTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    ${changeBadge}
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Month</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">${currencySymbol}${cmp.lastTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Daily Spend (this month)</p>
                    <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">${currencySymbol}${cmp.avgDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
            </div>

            <!-- Main Charts -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly Trend</h3>
                    <canvas id="trendChart" height="250"></canvas>
                </div>
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Bucket Distribution</h3>
                    <canvas id="distributionChart" height="250"></canvas>
                </div>
            </div>

            <!-- Category Breakdown -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Category Breakdown</h3>
                <div class="space-y-3">
                    ${Object.entries(categoryTotals)
                        .sort((a, b) => b[1] - a[1])
                        .map(([catId, total]) => {
                            const cat = categories.find(c => c.id === catId);
                            if (!cat) return '';
                            const grandTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
                            const percentage = grandTotal > 0 ? (total / grandTotal * 100).toFixed(1) : 0;
                            const bucketLabel = getTransactionTypeLabel(getBucketForCategory(catId));
                            return `
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${cat.color}20">
                                        <i data-lucide="${cat.icon}" class="w-5 h-5" style="color: ${cat.color}"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex justify-between mb-1">
                                            <span class="font-medium text-gray-800 dark:text-gray-100">${cat.name} <span class="text-xs text-gray-400">(${bucketLabel})</span></span>
                                            <span class="font-medium text-gray-800 dark:text-gray-100">${currencySymbol}${total.toFixed(2)}</span>
                                        </div>
                                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div class="h-2 rounded-full" style="width: ${percentage}%; background-color: ${cat.color}"></div>
                                        </div>
                                    </div>
                                    <span class="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">${percentage}%</span>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>

            <!-- Year over Year -->
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Year Comparison</h3>
                <canvas id="comparisonChart" height="200"></canvas>
            </div>

            <!-- Insights -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white">
                <h3 class="font-semibold mb-3">Smart Insights</h3>
                <ul class="space-y-2 text-sm opacity-90">
                    ${generateInsights(expenses, currencySymbol).map(insight => `
                        <li class="flex items-start gap-2">
                            <i data-lucide="lightbulb" class="w-4 h-4 mt-0.5 flex-shrink-0"></i>
                            <span>${insight}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
}

// ─── Monthly Report ────────────────────────────────────────────────────────────
export function renderMonthlyReport() {
    const expenses = StorageManager.getExpenses();
    const currencySymbol = getCurrencySymbol();
    const monthlyIncome = StorageManager.getIncome();

    const [year, month] = state.reportMonth.split('-').map(Number);
    const reportMonthExpenses = getMonthTransactions(expenses, year, month - 1);
    const totals = bucketTotals(reportMonthExpenses);
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

    const pct = amount => monthlyIncome > 0 ? ((amount / monthlyIncome) * 100).toFixed(1) : '0.0';
    const needsPct = pct(totals[TRANSACTION_TYPES.NEEDS]);
    const wantsPct = pct(totals[TRANSACTION_TYPES.WANTS]);
    const savingsPct = pct(totals[TRANSACTION_TYPES.SAVINGS]);

    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const categoryTotals = getCategoryTotals(reportMonthExpenses);

    return `
        <div class="space-y-6 max-w-4xl mx-auto print-area">
            <div class="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-5 rounded-xl card-shadow gap-4 no-print">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Monthly Report</h2>
                <div class="flex gap-2">
                    <input type="month" value="${state.reportMonth}" onchange="setReportMonth(event.target.value)"
                        class="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <button onclick="window.print()" class="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition">
                        <i data-lucide="printer" class="w-4 h-4"></i> Print / PDF
                    </button>
                </div>
            </div>

            <h2 class="hidden print:block text-2xl font-bold">Budget Report — ${monthName}</h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 p-5 rounded-xl card-shadow flex flex-col items-center justify-center">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4 w-full text-left">Distribution</h3>
                    ${grandTotal > 0 ? `<div class="w-full max-w-xs"><canvas id="reportChart" height="250"></canvas></div>` :
                        `<div class="py-12 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                            <i data-lucide="pie-chart" class="w-12 h-12 mb-2 opacity-50"></i>
                            <p>No transactions for this month</p>
                        </div>`}
                </div>

                <div class="bg-white dark:bg-gray-800 p-5 rounded-xl card-shadow overflow-hidden">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Summary Table</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="border-b-2 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                                    <th class="py-3 font-medium">Bucket</th>
                                    <th class="py-3 font-medium text-center">Target</th>
                                    <th class="py-3 font-medium text-center">Actual</th>
                                    <th class="py-3 font-medium text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100 dark:divide-gray-700 dark:text-gray-200">
                                <tr>
                                    <td class="py-3 flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-amber-500"></div> Needs</td>
                                    <td class="py-3 text-center text-gray-500 dark:text-gray-400">50%</td>
                                    <td class="py-3 text-center font-medium ${parseFloat(needsPct) > 50 ? 'text-red-600' : ''}">${needsPct}%</td>
                                    <td class="py-3 text-right font-medium">${currencySymbol}${totals[TRANSACTION_TYPES.NEEDS].toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td class="py-3 flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-purple-500"></div> Wants</td>
                                    <td class="py-3 text-center text-gray-500 dark:text-gray-400">20%</td>
                                    <td class="py-3 text-center font-medium ${parseFloat(wantsPct) > 20 ? 'text-red-600' : ''}">${wantsPct}%</td>
                                    <td class="py-3 text-right font-medium">${currencySymbol}${totals[TRANSACTION_TYPES.WANTS].toFixed(2)}</td>
                                </tr>
                                <tr>
                                    <td class="py-3 flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-emerald-500"></div> Savings</td>
                                    <td class="py-3 text-center text-gray-500 dark:text-gray-400">30%</td>
                                    <td class="py-3 text-center font-medium ${parseFloat(savingsPct) >= 30 ? 'text-emerald-600' : ''}">${savingsPct}%</td>
                                    <td class="py-3 text-right font-medium">${currencySymbol}${totals[TRANSACTION_TYPES.SAVINGS].toFixed(2)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="bg-gray-50 dark:bg-gray-700/50 font-bold text-gray-800 dark:text-gray-100">
                                    <td class="py-3 px-2 rounded-l-lg">Total Outflow</td>
                                    <td class="py-3 text-center">100%</td>
                                    <td class="py-3 text-center">${monthlyIncome > 0 ? ((grandTotal / monthlyIncome) * 100).toFixed(1) : '0.0'}%</td>
                                    <td class="py-3 px-2 text-right rounded-r-lg">${currencySymbol}${grandTotal.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            ${Object.keys(categoryTotals).length > 0 ? `
                <div class="bg-white dark:bg-gray-800 p-5 rounded-xl card-shadow">
                    <h3 class="font-semibold text-gray-800 dark:text-gray-100 mb-4">Category Detail — ${monthName}</h3>
                    <div class="space-y-2">
                        ${Object.entries(categoryTotals)
                            .sort((a, b) => b[1] - a[1])
                            .map(([catId, total]) => `
                                <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                    <span class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                                        <i data-lucide="${getCategoryIcon(catId)}" class="w-4 h-4" style="color: ${getCategoryColor(catId)}"></i>
                                        ${getCategoryName(catId)}
                                        <span class="text-xs text-gray-400">(${getTransactionTypeLabel(getBucketForCategory(catId))})</span>
                                    </span>
                                    <span class="font-medium text-sm text-gray-800 dark:text-gray-100">${currencySymbol}${total.toFixed(2)}</span>
                                </div>
                            `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// ─── Handlers ──────────────────────────────────────────────────────────────────
export function setPeriod(period) {
    state.period = period;
    app.rerender();
}

export function setReportMonth(monthStr) {
    if (!monthStr) return;
    state.reportMonth = monthStr;
    app.rerender();
}
