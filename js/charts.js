// Chart.js rendering for dashboard, analytics, and monthly report
import { TRANSACTION_TYPES } from './config.js';
import { StorageManager } from './storage.js';
import { state } from './state.js';
import { isDarkMode } from './ui.js';
import {
    getCurrentMonthTransactions, bucketTotals,
    getMonthlyData, getYearlyComparison, getMonthTransactions
} from './data.js';

const BUCKET_COLORS = ['#F59E0B', '#A855F7', '#10B981'];
const BUCKET_LABELS = ['Needs (50%)', 'Wants (20%)', 'Savings (30%)'];

function applyChartTheme() {
    if (!window.Chart) return;
    const dark = isDarkMode();
    Chart.defaults.color = dark ? '#9CA3AF' : '#6B7280';
    Chart.defaults.borderColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
}

function destroyChart(name) {
    if (state.chartInstances[name]) {
        state.chartInstances[name].destroy();
        delete state.chartInstances[name];
    }
}

export function initDashboardCharts() {
    if (!window.Chart) return;
    applyChartTheme();

    const expenses = StorageManager.getExpenses();
    const ctx1 = document.getElementById('dailyChart');
    const ctx2 = document.getElementById('categoryChart');
    if (!ctx1 || !ctx2) return;

    destroyChart('daily');
    destroyChart('category');

    // Daily spending (last 7 days)
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days[date.toLocaleDateString('en-US', { weekday: 'short' })] = 0;
    }
    expenses.filter(e => {
        const daysDiff = (new Date() - new Date(e.date)) / (1000 * 60 * 60 * 24);
        return daysDiff >= 0 && daysDiff <= 7;
    }).forEach(e => {
        const key = new Date(e.date).toLocaleDateString('en-US', { weekday: 'short' });
        if (last7Days[key] !== undefined) last7Days[key] += e.amount;
    });

    state.chartInstances.daily = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: Object.keys(last7Days),
            datasets: [{
                label: 'Daily Spending',
                data: Object.values(last7Days),
                backgroundColor: '#667eea',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    const totals = bucketTotals(getCurrentMonthTransactions(expenses));
    state.chartInstances.category = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: BUCKET_LABELS,
            datasets: [{
                data: [
                    totals[TRANSACTION_TYPES.NEEDS],
                    totals[TRANSACTION_TYPES.WANTS],
                    totals[TRANSACTION_TYPES.SAVINGS]
                ],
                backgroundColor: BUCKET_COLORS,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
    });
}

export function initAnalyticsCharts() {
    if (!window.Chart) return;
    applyChartTheme();

    const expenses = StorageManager.getExpenses();
    const ctx1 = document.getElementById('trendChart');
    const ctx2 = document.getElementById('distributionChart');
    const ctx3 = document.getElementById('comparisonChart');
    if (!ctx1 || !ctx2 || !ctx3) return;

    destroyChart('trend');
    destroyChart('distribution');
    destroyChart('comparison');

    // Trend chart
    const monthlyData = getMonthlyData(expenses);
    const sortedMonths = Object.keys(monthlyData)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(-12);

    state.chartInstances.trend = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Total Spending',
                data: sortedMonths.map(m => monthlyData[m]),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Bucket distribution
    const totals = { needs: 0, wants: 0, savings: 0 };
    expenses.forEach(e => {
        const bucket = e.type;
        if (totals[bucket] !== undefined) totals[bucket] += e.amount;
    });

    state.chartInstances.distribution = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: BUCKET_LABELS,
            datasets: [{
                data: [totals.needs, totals.wants, totals.savings],
                backgroundColor: BUCKET_COLORS,
                borderWidth: 2,
                borderColor: isDarkMode() ? '#1F2937' : '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'right' } }
        }
    });

    // Year comparison
    const yearlyData = getYearlyComparison(expenses);
    const years = Object.keys(yearlyData).sort();

    if (years.length >= 2) {
        const colors = ['#667eea', '#764ba2', '#4ECDC4'];
        state.chartInstances.comparison = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: years.map((year, idx) => ({
                    label: year,
                    data: yearlyData[year],
                    backgroundColor: colors[idx % colors.length]
                }))
            },
            options: {
                responsive: true,
                scales: { x: { stacked: false }, y: { beginAtZero: true } }
            }
        });
    } else {
        ctx3.parentElement.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">Need data from multiple years for comparison</p>';
    }
}

export function initReportCharts() {
    if (!window.Chart) return;
    applyChartTheme();

    const ctx = document.getElementById('reportChart');
    if (!ctx) return;
    destroyChart('report');

    const expenses = StorageManager.getExpenses();
    const [year, month] = state.reportMonth.split('-').map(Number);
    const totals = bucketTotals(getMonthTransactions(expenses, year, month - 1));

    const data = [
        totals[TRANSACTION_TYPES.NEEDS],
        totals[TRANSACTION_TYPES.WANTS],
        totals[TRANSACTION_TYPES.SAVINGS]
    ];
    if (data.every(val => val === 0)) return;

    state.chartInstances.report = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: BUCKET_LABELS,
            datasets: [{ data, backgroundColor: BUCKET_COLORS, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
    });
}
