// App entry: routing, header/nav shell, bootstrapping, window bridge
import { StorageManager, migrateData, materializeRecurring } from './storage.js';
import { state, app } from './state.js';
import { applyTheme, refreshIcons, showToast, escapeHtml } from './ui.js';
import { initDashboardCharts, initAnalyticsCharts, initReportCharts } from './charts.js';
import { initCloud } from './cloud.js';

import * as onboarding from './views/onboarding.js';
import { renderDashboard } from './views/dashboard.js';
import * as transactions from './views/transactions.js';
import * as analytics from './views/analytics.js';
import * as more from './views/more.js';

// ─── Header & Navigation ───────────────────────────────────────────────────────
function renderHeader() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const user = StorageManager.getUserProfile();
    const greeting = user?.name ? `Hi, ${escapeHtml(user.name)}!` : 'Budget Tracker';

    const syncDot = state.cloudUser
        ? `<span class="w-2 h-2 rounded-full ${state.syncStatus === 'synced' ? 'bg-green-300' : state.syncStatus === 'error' ? 'bg-red-300' : 'bg-yellow-300 animate-pulse'}" title="Sync: ${state.syncStatus}"></span>`
        : '';

    return `
        <header class="gradient-bg text-white p-4 md:p-6 no-print">
            <div class="max-w-7xl mx-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold flex items-center gap-2">${greeting} ${syncDot}</h1>
                        <p class="text-sm md:text-base opacity-90 mt-1">${today}</p>
                    </div>
                    <button onclick="setView('settings')" class="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition" title="Settings">
                        <i data-lucide="settings" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </header>
    `;
}

function renderBottomNav() {
    const navItems = [
        { id: 'dashboard', icon: 'layout-dashboard', label: 'Dashboard' },
        { id: 'add', icon: 'plus-circle', label: 'Add' },
        { id: 'history', icon: 'history', label: 'History' },
        { id: 'analytics', icon: 'bar-chart-3', label: 'Analytics' },
        { id: 'more', icon: 'menu', label: 'More' }
    ];
    // Sub-views highlight their parent tab
    const activeTab = ['report', 'goals', 'recurring', 'settings'].includes(state.view) ? 'more' : state.view;

    return `
        <nav class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-50 no-print">
            <div class="max-w-7xl mx-auto">
                <div class="flex justify-around items-center p-2">
                    ${navItems.map(item => `
                        <button onclick="setView('${item.id}')"
                            class="flex flex-col items-center p-2 rounded-lg transition ${activeTab === item.id ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}">
                            <i data-lucide="${item.icon}" class="w-5 h-5 md:w-6 md:h-6"></i>
                            <span class="text-xs mt-1">${item.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </nav>
    `;
}

// ─── Root Render ───────────────────────────────────────────────────────────────
const views = {
    dashboard: renderDashboard,
    add: transactions.renderAddExpense,
    history: transactions.renderHistory,
    analytics: analytics.renderAnalytics,
    report: analytics.renderMonthlyReport,
    more: more.renderMore,
    goals: more.renderGoals,
    recurring: more.renderRecurring,
    settings: more.renderSettings
};

function renderApp() {
    const root = document.getElementById('app');

    if (!StorageManager.isOnboardingComplete()) {
        root.innerHTML = onboarding.renderOnboarding();
        refreshIcons();
        return;
    }

    const renderView = views[state.view] || renderDashboard;
    root.innerHTML = `
        <div class="flex flex-col min-h-screen">
            ${renderHeader()}
            <main class="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
                ${renderView()}
            </main>
            ${renderBottomNav()}
        </div>
    `;
    refreshIcons();

    if (state.view === 'dashboard') setTimeout(initDashboardCharts, 0);
    else if (state.view === 'analytics') setTimeout(initAnalyticsCharts, 0);
    else if (state.view === 'report') setTimeout(initReportCharts, 0);
}

app.rerender = renderApp;

function setView(view) {
    if (view !== 'add') state.editingId = null;
    state.view = view;
    renderApp();
}

// ─── Bridge handlers to window (templates use inline onclick/onsubmit) ─────────
Object.assign(window, {
    setView,
    // onboarding
    nextOnboardingStep: onboarding.nextOnboardingStep,
    prevOnboardingStep: onboarding.prevOnboardingStep,
    saveProfileAndContinue: onboarding.saveProfileAndContinue,
    saveIncomeAndContinue: onboarding.saveIncomeAndContinue,
    saveCurrencyAndContinue: onboarding.saveCurrencyAndContinue,
    completeOnboarding: onboarding.completeOnboarding,
    // transactions
    handleTransactionSubmit: transactions.handleTransactionSubmit,
    setTransactionType: transactions.setTransactionType,
    startEditTransaction: transactions.startEditTransaction,
    cancelEdit: transactions.cancelEdit,
    deleteExpense: transactions.deleteExpense,
    filterHistory: transactions.filterHistory,
    setHistoryBucket: transactions.setHistoryBucket,
    searchHistory: transactions.searchHistory,
    // analytics / report
    setPeriod: analytics.setPeriod,
    setReportMonth: analytics.setReportMonth,
    // goals
    addGoal: more.addGoal,
    contributeToGoal: more.contributeToGoal,
    deleteGoal: more.deleteGoal,
    // recurring
    addRecurring: more.addRecurring,
    toggleRecurring: more.toggleRecurring,
    deleteRecurring: more.deleteRecurring,
    // settings & data
    saveSettingsProfile: more.saveSettingsProfile,
    handleToggleDarkMode: more.handleToggleDarkMode,
    saveCategoryBudgetsForm: more.saveCategoryBudgetsForm,
    handleSignIn: more.handleSignIn,
    handleSignOut: more.handleSignOut,
    resetAllData: more.resetAllData,
    exportData: more.exportData,
    exportCSV: more.exportCSV,
    importData: more.importData
});

// ─── Boot ──────────────────────────────────────────────────────────────────────
function boot() {
    applyTheme();
    migrateData();

    const created = materializeRecurring();
    renderApp();
    if (created > 0) {
        showToast(`${created} recurring transaction${created === 1 ? '' : 's'} added automatically`, 'info');
    }

    initCloud(); // no-op unless js/firebase-config.js is filled in
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
} else {
    boot();
}
