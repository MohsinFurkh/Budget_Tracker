// Budget Tracker App

// Transaction Types
const TRANSACTION_TYPES = {
    EXPENSE: 'expense',
    INVESTMENT: 'investment',
    TRANSFER: 'transfer',
    COMMITMENT: 'commitment'
};

// Expense Categories
const expenseCategories = [
    { id: 'food', name: 'Food & Dining', icon: 'utensils', color: '#FF6B6B' },
    { id: 'transport', name: 'Transportation', icon: 'car', color: '#4ECDC4' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#45B7D1' },
    { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#96CEB4' },
    { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#FFEAA7' },
    { id: 'health', name: 'Health & Medical', icon: 'heart-pulse', color: '#DDA0DD' },
    { id: 'education', name: 'Education', icon: 'book-open', color: '#98D8C8' },
    { id: 'other_expense', name: 'Other Expenses', icon: 'more-horizontal', color: '#F7DC6F' }
];

// Investment Categories
const investmentCategories = [
    { id: 'sip_mutual_fund', name: 'SIP - Mutual Funds', icon: 'trending-up', color: '#10B981' },
    { id: 'stocks', name: 'Stocks', icon: 'bar-chart-2', color: '#3B82F6' },
    { id: 'daughter_1', name: 'Daughter Account 1', icon: 'piggy-bank', color: '#EC4899' },
    { id: 'daughter_2', name: 'Daughter Account 2', icon: 'piggy-bank', color: '#F59E0B' },
    { id: 'other_investment', name: 'Other Investments', icon: 'landmark', color: '#8B5CF6' }
];

// Transfer Categories
const transferCategories = [
    { id: 'home_transfer', name: 'Money to Home', icon: 'send', color: '#06B6D4' }
];

// Commitment Categories (Fixed monthly outflows)
const commitmentCategories = [
    { id: 'house_rent', name: 'House Rent', icon: 'home', color: '#EF4444' },
    { id: 'loan_emi', name: 'Loan EMI', icon: 'credit-card', color: '#DC2626' }
];

// All categories combined for backward compatibility
const categories = [...expenseCategories, ...investmentCategories, ...transferCategories, ...commitmentCategories];

// Storage Manager
const StorageManager = {
    EXPENSES_KEY: 'budget_expenses',
    INCOME_KEY: 'monthly_income',  // Changed from budget to income
    USER_KEY: 'user_profile',
    ONBOARDING_KEY: 'onboarding_complete',

    getExpenses() {
        const data = localStorage.getItem(this.EXPENSES_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveExpenses(expenses) {
        localStorage.setItem(this.EXPENSES_KEY, JSON.stringify(expenses));
    },

    // Income methods (replaced budget)
    getIncome() {
        const data = localStorage.getItem(this.INCOME_KEY);
        return data ? JSON.parse(data) : 5000;
    },

    saveIncome(income) {
        localStorage.setItem(this.INCOME_KEY, JSON.stringify(income));
    },

    // Backward compatibility - redirect budget calls to income
    getBudget() {
        return this.getIncome();
    },

    saveBudget(budget) {
        this.saveIncome(budget);
    },

    getUserProfile() {
        const data = localStorage.getItem(this.USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    saveUserProfile(profile) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
    },

    isOnboardingComplete() {
        return localStorage.getItem(this.ONBOARDING_KEY) === 'true';
    },

    completeOnboarding() {
        localStorage.setItem(this.ONBOARDING_KEY, 'true');
    },

    resetOnboarding() {
        localStorage.removeItem(this.ONBOARDING_KEY);
    },

    addExpense(expense) {
        const expenses = this.getExpenses();
        expenses.push({ ...expense, id: Date.now() });
        this.saveExpenses(expenses);
        return expenses;
    },

    deleteExpense(id) {
        const expenses = this.getExpenses().filter(e => e.id !== id);
        this.saveExpenses(expenses);
        return expenses;
    }
};

// App State
let currentView = 'dashboard';
let selectedPeriod = 'month';
let selectedReportMonth = new Date().toISOString().slice(0, 7);
let historyFilter = 'all';
let chartInstances = {};
let onboardingStep = 1;
const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
];
let selectedCurrency = 'USD';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    renderApp();
    lucide.createIcons();
});

// Render Functions
function renderApp() {
    const app = document.getElementById('app');

    // Check if onboarding is needed
    if (!StorageManager.isOnboardingComplete()) {
        app.innerHTML = renderOnboarding();
        lucide.createIcons();
        return;
    }

    const user = StorageManager.getUserProfile();
    const currency = user?.currency || 'USD';
    selectedCurrency = currency;

    app.innerHTML = `
        <div class="flex flex-col min-h-screen">
            ${renderHeader()}
            <main class="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">
                ${currentView === 'dashboard' ? renderDashboard() :
            currentView === 'add' ? renderAddExpense() :
                currentView === 'history' ? renderHistory() :
                    currentView === 'analytics' ? renderAnalytics() :
                        currentView === 'report' ? renderMonthlyReport() : ''}
            </main>
            ${renderBottomNav()}
        </div>
    `;
    lucide.createIcons();

    if (currentView === 'dashboard') {
        setTimeout(initDashboardCharts, 0);
    } else if (currentView === 'analytics') {
        setTimeout(initAnalyticsCharts, 0);
    } else if (currentView === 'report') {
        setTimeout(initReportCharts, 0);
    }
}

function renderOnboarding() {
    const steps = {
        1: renderWelcomeStep,
        2: renderProfileStep,
        3: renderBudgetStep,
        4: renderCurrencyStep,
        5: renderReadyStep
    };

    const stepRenderer = steps[onboardingStep] || steps[1];
    return `
        <div class="min-h-screen gradient-bg flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                <!-- Progress indicator -->
                <div class="flex justify-center gap-2 mb-8">
                    ${[1, 2, 3, 4, 5].map(i => `
                        <div class="w-2 h-2 rounded-full transition-all ${i === onboardingStep ? 'w-8 bg-indigo-600' : i < onboardingStep ? 'bg-indigo-400' : 'bg-gray-300'}"></div>
                    `).join('')}
                </div>
                
                ${stepRenderer()}
            </div>
        </div>
    `;
}

function renderWelcomeStep() {
    return `
        <div class="text-center">
            <div class="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i data-lucide="wallet" class="w-12 h-12 text-indigo-600"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 mb-3">Welcome to Budget Tracker</h1>
            <p class="text-gray-600 mb-8">Track your personal and family expenses with ease. Get insights, visualize your spending, and stay on budget.</p>
            <button onclick="nextOnboardingStep()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
                Get Started
            </button>
        </div>
    `;
}

function renderProfileStep() {
    return `
        <div>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="user" class="w-8 h-8 text-indigo-600"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">What's your name?</h2>
                <p class="text-gray-600 mt-2">Personalize your experience</p>
            </div>
            <form onsubmit="saveProfileAndContinue(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input type="text" name="username" required 
                        class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        placeholder="Enter your name">
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="prevOnboardingStep()" class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition">
                        Back
                    </button>
                    <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
                        Continue
                    </button>
                </div>
            </form>
        </div>
    `;
}

function renderBudgetStep() {
    return `
        <div>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="wallet" class="w-8 h-8 text-indigo-600"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">Set your income</h2>
                <p class="text-gray-600 mt-2">What's your monthly income?</p>
            </div>
            <form onsubmit="saveIncomeAndContinue(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Monthly Income</label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                        <input type="number" name="monthlyIncome" required min="1" 
                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
                            placeholder="5000" value="5000">
                    </div>
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="prevOnboardingStep()" class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition">
                        Back
                    </button>
                    <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
                        Continue
                    </button>
                </div>
            </form>
        </div>
    `;
}

function renderCurrencyStep() {
    return `
        <div>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="coins" class="w-8 h-8 text-indigo-600"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">Select currency</h2>
                <p class="text-gray-600 mt-2">Choose your preferred currency</p>
            </div>
            <form onsubmit="saveCurrencyAndContinue(event)" class="space-y-4">
                <div class="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    ${currencies.map(c => `
                        <label class="cursor-pointer">
                            <input type="radio" name="currency" value="${c.code}" 
                                ${c.code === selectedCurrency ? 'checked' : ''}
                                class="peer sr-only" onchange="selectedCurrency = '${c.code}'">
                            <div class="p-3 rounded-xl border-2 border-gray-200 text-center peer-checked:border-indigo-600 peer-checked:bg-indigo-50 transition hover:border-gray-300">
                                <div class="text-2xl mb-1">${c.symbol}</div>
                                <div class="text-xs font-medium text-gray-700">${c.code}</div>
                            </div>
                        </label>
                    `).join('')}
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="prevOnboardingStep()" class="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition">
                        Back
                    </button>
                    <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
                        Continue
                    </button>
                </div>
            </form>
        </div>
    `;
}

function renderReadyStep() {
    const user = StorageManager.getUserProfile();
    const income = StorageManager.getIncome();
    const currency = currencies.find(c => c.code === user?.currency) || currencies[0];

    return `
        <div class="text-center">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i data-lucide="check" class="w-10 h-10 text-green-600"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">You're all set!</h2>
            <p class="text-gray-600 mb-6">Welcome, ${user?.name || 'there'}! Here's your setup:</p>
            
            <div class="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <div class="flex justify-between py-2 border-b border-gray-200">
                    <span class="text-gray-600">Name</span>
                    <span class="font-medium">${user?.name || '-'}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-gray-200">
                    <span class="text-gray-600">Monthly Income</span>
                    <span class="font-medium">${currency.symbol}${income.toLocaleString()}</span>
                </div>
                <div class="flex justify-between py-2">
                    <span class="text-gray-600">Currency</span>
                    <span class="font-medium">${user?.currency || 'USD'}</span>
                </div>
            </div>
            
            <button onclick="completeOnboarding()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
                Start Tracking
            </button>
        </div>
    `;
}

function renderHeader() {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const user = StorageManager.getUserProfile();
    const greeting = user?.name ? `Hi, ${user.name}!` : 'Budget Tracker';

    return `
        <header class="gradient-bg text-white p-4 md:p-6">
            <div class="max-w-7xl mx-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl md:text-3xl font-bold">${greeting}</h1>
                        <p class="text-sm md:text-base opacity-90 mt-1">${today}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="document.getElementById('importFile').click()" class="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition" title="Import Data">
                            <i data-lucide="upload" class="w-5 h-5"></i>
                        </button>
                        <input type="file" id="importFile" class="hidden" accept=".json" onchange="importData(event)">
                        <button onclick="exportData()" class="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition" title="Export Data">
                            <i data-lucide="download" class="w-5 h-5"></i>
                        </button>
                    </div>
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
        { id: 'report', icon: 'file-text', label: 'Report' }
    ];

    return `
        <nav class="bg-white border-t border-gray-200 sticky bottom-0 z-50">
            <div class="max-w-7xl mx-auto">
                <div class="flex justify-around items-center p-2">
                    ${navItems.map(item => `
                        <button onclick="setView('${item.id}')" 
                            class="flex flex-col items-center p-2 rounded-lg transition ${currentView === item.id ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}">
                            <i data-lucide="${item.icon}" class="w-5 h-5 md:w-6 md:h-6"></i>
                            <span class="text-xs mt-1">${item.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        </nav>
    `;
}

function renderDashboard() {
    const expenses = StorageManager.getExpenses();
    const monthlyIncome = StorageManager.getIncome();
    const currentMonthTransactions = getCurrentMonthTransactions(expenses);

    // Calculate totals by type
    const totalExpenses = currentMonthTransactions
        .filter(t => t.type === TRANSACTION_TYPES.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalInvestments = currentMonthTransactions
        .filter(t => t.type === TRANSACTION_TYPES.INVESTMENT)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalTransfers = currentMonthTransactions
        .filter(t => t.type === TRANSACTION_TYPES.TRANSFER)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalCommitments = currentMonthTransactions
        .filter(t => t.type === TRANSACTION_TYPES.COMMITMENT)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalOutflow = totalExpenses + totalInvestments + totalTransfers + totalCommitments;
    const savings = monthlyIncome - totalOutflow;
    const savingsPercent = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

    const currencySymbol = getCurrencySymbol();

    return `
        <div class="space-y-6">
            <!-- Main Summary: Income & Savings -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 card-shadow text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-white/80 text-sm">Monthly Income</p>
                            <p class="text-3xl font-bold">${currencySymbol}${monthlyIncome.toLocaleString()}</p>
                        </div>
                        <button onclick="editIncome()" class="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition">
                            <i data-lucide="edit-2" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                <div class="${savings >= 0 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-rose-600'} rounded-xl p-6 card-shadow text-white">
                    <div>
                        <p class="text-white/80 text-sm">Monthly Savings</p>
                        <p class="text-3xl font-bold">${currencySymbol}${savings.toLocaleString()}</p>
                        <p class="text-white/80 text-sm mt-1">${savingsPercent.toFixed(1)}% of income</p>
                    </div>
                </div>
            </div>
            
            <!-- Detailed Breakdown -->
            <div class="bg-white rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 mb-4">Monthly Outflow Breakdown</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="p-4 bg-red-50 rounded-xl">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <i data-lucide="shopping-bag" class="w-4 h-4 text-red-600"></i>
                            </div>
                            <span class="text-sm text-gray-600">Expenses</span>
                        </div>
                        <p class="text-xl font-bold text-gray-800">${currencySymbol}${totalExpenses.toLocaleString()}</p>
                    </div>
                    <div class="p-4 bg-blue-50 rounded-xl">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i data-lucide="trending-up" class="w-4 h-4 text-blue-600"></i>
                            </div>
                            <span class="text-sm text-gray-600">Investments</span>
                        </div>
                        <p class="text-xl font-bold text-gray-800">${currencySymbol}${totalInvestments.toLocaleString()}</p>
                    </div>
                    <div class="p-4 bg-cyan-50 rounded-xl">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                                <i data-lucide="send" class="w-4 h-4 text-cyan-600"></i>
                            </div>
                            <span class="text-sm text-gray-600">Transfers</span>
                        </div>
                        <p class="text-xl font-bold text-gray-800">${currencySymbol}${totalTransfers.toLocaleString()}</p>
                    </div>
                    <div class="p-4 bg-orange-50 rounded-xl">
                        <div class="flex items-center gap-2 mb-2">
                            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <i data-lucide="home" class="w-4 h-4 text-orange-600"></i>
                            </div>
                            <span class="text-sm text-gray-600">Commitments</span>
                        </div>
                        <p class="text-xl font-bold text-gray-800">${currencySymbol}${totalCommitments.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            
            <!-- Total Outflow Progress -->
            <div class="bg-white rounded-xl p-5 card-shadow">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600">Total Outflow vs Income</span>
                    <span class="font-medium ${totalOutflow > monthlyIncome ? 'text-red-500' : 'text-gray-700'}">${currencySymbol}${totalOutflow.toLocaleString()} / ${currencySymbol}${monthlyIncome.toLocaleString()}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-4">
                    <div class="${totalOutflow > monthlyIncome ? 'bg-red-500' : 'bg-indigo-500'} h-4 rounded-full transition-all duration-500" 
                         style="width: ${Math.min((totalOutflow / monthlyIncome) * 100, 100)}%"></div>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                    ${totalOutflow > monthlyIncome ? '⚠️ Warning: Outflow exceeds income!' : '✓ Outflow within income limit'}
                </p>
            </div>
            
            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white rounded-xl p-5 card-shadow">
                    <h3 class="font-semibold text-gray-800 mb-4">Daily Spending</h3>
                    <canvas id="dailyChart" height="200"></canvas>
                </div>
                <div class="bg-white rounded-xl p-5 card-shadow">
                    <h3 class="font-semibold text-gray-800 mb-4">By Category</h3>
                    <canvas id="categoryChart" height="200"></canvas>
                </div>
            </div>
            
            <!-- Recent Transactions -->
            <div class="bg-white rounded-xl p-5 card-shadow">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-800">Recent Transactions</h3>
                    <button onclick="setView('history')" class="text-indigo-600 text-sm hover:underline">View All</button>
                </div>
                <div class="space-y-3">
                    ${currentMonthTransactions.slice(-5).reverse().map(transaction => renderExpenseItem(transaction)).join('')}
                </div>
            </div>
        </div>
    `;
}

let selectedTransactionType = TRANSACTION_TYPES.EXPENSE;

function renderAddExpense() {
    const today = new Date().toISOString().split('T')[0];
    const currencySymbol = getCurrencySymbol();

    const typeCategories = getCategoriesByType(selectedTransactionType);
    const typeLabel = getTransactionTypeLabel(selectedTransactionType);
    const typeColor = getTransactionTypeColor(selectedTransactionType);

    return `
        <div class="max-w-md mx-auto">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Add Transaction</h2>
            <form onsubmit="handleTransactionSubmit(event)" class="bg-white rounded-xl p-6 card-shadow space-y-4">
                <!-- Transaction Type Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                    <div class="grid grid-cols-2 gap-2">
                        <label class="cursor-pointer">
                            <input type="radio" name="transactionType" value="${TRANSACTION_TYPES.EXPENSE}" 
                                ${selectedTransactionType === TRANSACTION_TYPES.EXPENSE ? 'checked' : ''}
                                class="peer sr-only" onchange="setTransactionType('${TRANSACTION_TYPES.EXPENSE}')">
                            <div class="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 peer-checked:border-red-500 peer-checked:bg-red-50 transition">
                                <i data-lucide="shopping-bag" class="w-4 h-4 text-red-500"></i>
                                <span class="text-sm font-medium">Expense</span>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="transactionType" value="${TRANSACTION_TYPES.INVESTMENT}" 
                                ${selectedTransactionType === TRANSACTION_TYPES.INVESTMENT ? 'checked' : ''}
                                class="peer sr-only" onchange="setTransactionType('${TRANSACTION_TYPES.INVESTMENT}')">
                            <div class="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition">
                                <i data-lucide="trending-up" class="w-4 h-4 text-blue-500"></i>
                                <span class="text-sm font-medium">Investment</span>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="transactionType" value="${TRANSACTION_TYPES.TRANSFER}" 
                                ${selectedTransactionType === TRANSACTION_TYPES.TRANSFER ? 'checked' : ''}
                                class="peer sr-only" onchange="setTransactionType('${TRANSACTION_TYPES.TRANSFER}')">
                            <div class="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 peer-checked:border-cyan-500 peer-checked:bg-cyan-50 transition">
                                <i data-lucide="send" class="w-4 h-4 text-cyan-500"></i>
                                <span class="text-sm font-medium">Transfer</span>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="transactionType" value="${TRANSACTION_TYPES.COMMITMENT}" 
                                ${selectedTransactionType === TRANSACTION_TYPES.COMMITMENT ? 'checked' : ''}
                                class="peer sr-only" onchange="setTransactionType('${TRANSACTION_TYPES.COMMITMENT}')">
                            <div class="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 peer-checked:border-orange-500 peer-checked:bg-orange-50 transition">
                                <i data-lucide="home" class="w-4 h-4 text-orange-500"></i>
                                <span class="text-sm font-medium">Commitment</span>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">${currencySymbol}</span>
                        <input type="number" name="amount" required min="0.01" step="0.01"
                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${typeColor}-500 focus:border-transparent outline-none"
                            placeholder="0.00">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" name="description" required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${typeColor}-500 focus:border-transparent outline-none"
                        placeholder="${getTransactionPlaceholder(selectedTransactionType)}">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">${typeLabel} Category</label>
                    <div class="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                        ${typeCategories.map((cat, idx) => `
                            <label class="cursor-pointer">
                                <input type="radio" name="category" value="${cat.id}" required class="peer sr-only"
                                    ${idx === 0 ? 'checked' : ''}>
                                <div class="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 peer-checked:border-${typeColor}-500 peer-checked:bg-${typeColor}-50 transition">
                                    <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background-color: ${cat.color}20">
                                        <i data-lucide="${cat.icon}" class="w-4 h-4" style="color: ${cat.color}"></i>
                                    </div>
                                    <span class="text-sm font-medium">${cat.name}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" name="date" required value="${today}"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${typeColor}-500 focus:border-transparent outline-none">
                </div>
                
                <button type="submit" class="w-full bg-${typeColor}-600 hover:bg-${typeColor}-700 text-white font-medium py-3 rounded-lg transition">
                    Add ${typeLabel}
                </button>
            </form>
        </div>
    `;
}

function renderHistory() {
    let expenses = StorageManager.getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const now = new Date();
    if (historyFilter === 'month') {
        expenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
    } else if (historyFilter === 'year') {
        expenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === now.getFullYear();
        });
    }

    const grouped = groupExpensesByMonth(expenses);
    const currencySymbol = getCurrencySymbol();

    return `
        <div>
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Expense History</h2>
                <select onchange="filterHistory(this.value)" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="all" ${historyFilter === 'all' ? 'selected' : ''}>All Time</option>
                    <option value="month" ${historyFilter === 'month' ? 'selected' : ''}>This Month</option>
                    <option value="year" ${historyFilter === 'year' ? 'selected' : ''}>This Year</option>
                </select>
            </div>
            
            ${Object.entries(grouped).map(([month, monthExpenses]) => `
                <div class="mb-6">
                    <h3 class="text-lg font-semibold text-gray-700 mb-3 sticky top-0 bg-gray-50 py-2">${month}</h3>
                    <div class="bg-white rounded-xl card-shadow overflow-hidden">
                        ${monthExpenses.map((expense, idx) => `
                            <div class="flex items-center justify-between p-4 ${idx !== monthExpenses.length - 1 ? 'border-b border-gray-100' : ''}">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${getCategoryColor(expense.category)}20">
                                        <i data-lucide="${getCategoryIcon(expense.category)}" class="w-5 h-5" style="color: ${getCategoryColor(expense.category)}"></i>
                                    </div>
                                    <div>
                                        <p class="font-medium text-gray-800">${expense.description}</p>
                                        <p class="text-sm text-gray-500">${getCategoryName(expense.category)} • ${new Date(expense.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <span class="font-semibold text-gray-800">${currencySymbol}${expense.amount.toFixed(2)}</span>
                                    <button onclick="deleteExpense(${expense.id})" class="text-red-400 hover:text-red-600">
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
                    <i data-lucide="inbox" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
                    <p class="text-gray-500">No expenses yet</p>
                    <button onclick="setView('add')" class="mt-2 text-indigo-600 hover:underline">Add your first expense</button>
                </div>
            ` : ''}
        </div>
    `;
}

function renderAnalytics() {
    const expenses = StorageManager.getExpenses();
    const monthlyData = getMonthlyData(expenses);
    const categoryTotals = getCategoryTotals(expenses);
    const yearlyComparison = getYearlyComparison(expenses);
    const currencySymbol = getCurrencySymbol();

    return `
        <div class="space-y-6">
            <h2 class="text-2xl font-bold text-gray-800">Analytics</h2>
            
            <!-- Period Selector -->
            <div class="flex gap-2 bg-white p-1 rounded-lg card-shadow w-fit">
                <button onclick="setPeriod('month')" class="px-4 py-2 rounded-md text-sm font-medium transition ${selectedPeriod === 'month' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}">
                    Monthly
                </button>
                <button onclick="setPeriod('year')" class="px-4 py-2 rounded-md text-sm font-medium transition ${selectedPeriod === 'year' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}">
                    Yearly
                </button>
            </div>
            
            <!-- Main Charts -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white rounded-xl p-5 card-shadow">
                    <h3 class="font-semibold text-gray-800 mb-4">${selectedPeriod === 'month' ? 'Monthly' : 'Yearly'} Trend</h3>
                    <canvas id="trendChart" height="250"></canvas>
                </div>
                <div class="bg-white rounded-xl p-5 card-shadow">
                    <h3 class="font-semibold text-gray-800 mb-4">Category Distribution</h3>
                    <canvas id="distributionChart" height="250"></canvas>
                </div>
            </div>
            
            <!-- Category Breakdown -->
            <div class="bg-white rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 mb-4">Category Breakdown</h3>
                <div class="space-y-3">
                    ${Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([catId, total]) => {
                const cat = categories.find(c => c.id === catId);
                const percentage = (total / Object.values(categoryTotals).reduce((a, b) => a + b, 0) * 100).toFixed(1);
                return `
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${cat.color}20">
                                        <i data-lucide="${cat.icon}" class="w-5 h-5" style="color: ${cat.color}"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex justify-between mb-1">
                                            <span class="font-medium text-gray-800">${cat.name}</span>
                                            <span class="font-medium text-gray-800">${currencySymbol}${total.toFixed(2)}</span>
                                        </div>
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="h-2 rounded-full" style="width: ${percentage}%; background-color: ${cat.color}"></div>
                                        </div>
                                    </div>
                                    <span class="text-sm text-gray-500 w-12 text-right">${percentage}%</span>
                                </div>
                            `;
            }).join('')}
                </div>
            </div>
            
            <!-- Year over Year -->
            <div class="bg-white rounded-xl p-5 card-shadow">
                <h3 class="font-semibold text-gray-800 mb-4">Year Comparison</h3>
                <canvas id="comparisonChart" height="200"></canvas>
            </div>
            
            <!-- Insights -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-5 text-white">
                <h3 class="font-semibold mb-3">Smart Insights</h3>
                <ul class="space-y-2 text-sm opacity-90">
                    ${generateInsights(expenses, categoryTotals).map(insight => `
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

function renderExpenseItem(expense) {
    const cat = categories.find(c => c.id === expense.category);
    const currencySymbol = getCurrencySymbol();
    const typeBadge = getTypeBadge(expense.type || TRANSACTION_TYPES.EXPENSE);

    return `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${cat.color}20">
                    <i data-lucide="${cat.icon}" class="w-5 h-5" style="color: ${cat.color}"></i>
                </div>
                <div>
                    <p class="font-medium text-gray-800">${expense.description}</p>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-500">${new Date(expense.date).toLocaleDateString()}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full ${typeBadge.class}" style="background-color: ${typeBadge.bg}; color: ${typeBadge.color}">${typeBadge.label}</span>
                    </div>
                </div>
            </div>
            <span class="font-semibold text-gray-800">${currencySymbol}${expense.amount.toFixed(2)}</span>
        </div>
    `;
}

function getTypeBadge(type) {
    switch (type) {
        case TRANSACTION_TYPES.EXPENSE:
            return { label: 'Expense', class: 'bg-red-100 text-red-700', bg: '#FEE2E2', color: '#B91C1C' };
        case TRANSACTION_TYPES.INVESTMENT:
            return { label: 'Investment', class: 'bg-blue-100 text-blue-700', bg: '#DBEAFE', color: '#1D4ED8' };
        case TRANSACTION_TYPES.TRANSFER:
            return { label: 'Transfer', class: 'bg-cyan-100 text-cyan-700', bg: '#CFFAFE', color: '#0E7490' };
        case TRANSACTION_TYPES.COMMITMENT:
            return { label: 'Commitment', class: 'bg-orange-100 text-orange-700', bg: '#FFEDD5', color: '#C2410C' };
        default:
            return { label: 'Expense', class: 'bg-red-100 text-red-700', bg: '#FEE2E2', color: '#B91C1C' };
    }
}

// Helper Functions
function getCurrentMonthExpenses(expenses) {
    const now = new Date();
    return expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
}

function getCategoryColor(catId) {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.color : '#999';
}

function getCategoryIcon(catId) {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.icon : 'circle';
}

function getCategoryName(catId) {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : catId;
}

function groupExpensesByMonth(expenses) {
    return expenses.reduce((acc, expense) => {
        const date = new Date(expense.date);
        const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(expense);
        return acc;
    }, {});
}

function getCategoryTotals(expenses) {
    return expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});
}

function getMonthlyData(expenses) {
    const months = {};
    expenses.forEach(e => {
        const date = new Date(e.date);
        const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        months[key] = (months[key] || 0) + e.amount;
    });
    return months;
}

function getYearlyComparison(expenses) {
    const years = {};
    expenses.forEach(e => {
        const year = new Date(e.date).getFullYear();
        const month = new Date(e.date).getMonth();
        if (!years[year]) years[year] = Array(12).fill(0);
        years[year][month] += e.amount;
    });
    return years;
}

function generateInsights(expenses, categoryTotals) {
    const insights = [];
    const currencySymbol = getCurrencySymbol();

    // Get current month transactions
    const currentMonthTransactions = getCurrentMonthTransactions(expenses);

    if (currentMonthTransactions.length === 0) {
        insights.push("Start adding transactions to see personalized insights.");
        return insights;
    }

    // Calculate by type
    const expenseAmount = currentMonthTransactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const investments = currentMonthTransactions.filter(t => t.type === TRANSACTION_TYPES.INVESTMENT).reduce((sum, t) => sum + t.amount, 0);
    const transfers = currentMonthTransactions.filter(t => t.type === TRANSACTION_TYPES.TRANSFER).reduce((sum, t) => sum + t.amount, 0);
    const commitments = currentMonthTransactions.filter(t => t.type === TRANSACTION_TYPES.COMMITMENT).reduce((sum, t) => sum + t.amount, 0);

    const totalOutflow = expenseAmount + investments + transfers + commitments;
    const income = StorageManager.getIncome();
    const savings = income - totalOutflow;
    const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;

    // Top spending category
    const expenseTransactions = currentMonthTransactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE);
    const expenseByCategory = {};
    expenseTransactions.forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });
    const topCategory = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        const catName = getCategoryName(topCategory[0]);
        insights.push(`Top expense: ${catName} (${currencySymbol}${topCategory[1].toFixed(0)})`);
    }

    // Investment insights
    if (investments > 0) {
        const investPercent = ((investments / income) * 100).toFixed(1);
        insights.push(`Great! You're investing ${investPercent}% of income (${currencySymbol}${investments.toFixed(0)})`);
    }

    // Savings insights
    if (savingsRate > 20) {
        insights.push(`Excellent savings rate: ${savingsRate}% (${currencySymbol}${savings.toFixed(0)}) 🎉`);
    } else if (savingsRate > 0) {
        insights.push(`Savings rate: ${savingsRate}% (${currencySymbol}${savings.toFixed(0)})`);
    } else if (savingsRate < 0) {
        insights.push(`⚠️ Spending exceeds income by ${currencySymbol}${Math.abs(savings).toFixed(0)}`);
    }

    // Commitments check
    if (commitments > 0) {
        const commitPercent = ((commitments / income) * 100).toFixed(1);
        insights.push(`Fixed commitments: ${commitPercent}% of income (${currencySymbol}${commitments.toFixed(0)})`);
    }

    return insights;
}

// Chart Functions
function initDashboardCharts() {
    const expenses = StorageManager.getExpenses();
    const ctx1 = document.getElementById('dailyChart');
    const ctx2 = document.getElementById('categoryChart');

    if (!ctx1 || !ctx2) return;

    // Destroy existing charts
    if (chartInstances.daily) chartInstances.daily.destroy();
    if (chartInstances.category) chartInstances.category.destroy();

    // Daily spending (last 7 days)
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toLocaleDateString('en-US', { weekday: 'short' });
        last7Days[key] = 0;
    }

    expenses.filter(e => {
        const date = new Date(e.date);
        const daysDiff = (new Date() - date) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
    }).forEach(e => {
        const key = new Date(e.date).toLocaleDateString('en-US', { weekday: 'short' });
        if (last7Days[key] !== undefined) {
            last7Days[key] += e.amount;
        }
    });

    chartInstances.daily = new Chart(ctx1, {
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

    // Category distribution
    const categoryTotals = getCategoryTotals(getCurrentMonthExpenses(expenses));
    const catData = categories.map(c => categoryTotals[c.id] || 0);

    chartInstances.category = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => c.name),
            datasets: [{
                data: catData,
                backgroundColor: categories.map(c => c.color),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
        }
    });
}

function initAnalyticsCharts() {
    const expenses = StorageManager.getExpenses();
    const ctx1 = document.getElementById('trendChart');
    const ctx2 = document.getElementById('distributionChart');
    const ctx3 = document.getElementById('comparisonChart');

    if (!ctx1 || !ctx2 || !ctx3) return;

    // Destroy existing charts
    Object.values(chartInstances).forEach(chart => chart?.destroy());

    // Trend chart
    const monthlyData = getMonthlyData(expenses);
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        return new Date(a) - new Date(b);
    }).slice(-12);

    chartInstances.trend = new Chart(ctx1, {
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

    // Distribution chart
    const categoryTotals = getCategoryTotals(expenses);
    chartInstances.distribution = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: categories.map(c => c.name),
            datasets: [{
                data: categories.map(c => categoryTotals[c.id] || 0),
                backgroundColor: categories.map(c => c.color),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });

    // Comparison chart
    const yearlyData = getYearlyComparison(expenses);
    const years = Object.keys(yearlyData).sort();

    if (years.length >= 2) {
        const colors = ['#667eea', '#764ba2', '#4ECDC4'];
        chartInstances.comparison = new Chart(ctx3, {
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
        ctx3.parentElement.innerHTML = '<p class="text-gray-500 text-center py-8">Need data from multiple years for comparison</p>';
    }
}

// Action Functions
function setView(view) {
    currentView = view;
    renderApp();
}

function setPeriod(period) {
    selectedPeriod = period;
    renderApp();
}

function handleTransactionSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const transaction = {
        amount: parseFloat(form.amount.value),
        description: form.description.value,
        category: form.category.value,
        date: form.date.value,
        type: selectedTransactionType  // Store the transaction type
    };

    StorageManager.addExpense(transaction);
    form.reset();
    form.date.value = new Date().toISOString().split('T')[0];

    const typeLabel = getTransactionTypeLabel(selectedTransactionType);
    alert(`${typeLabel} added successfully!`);
    setView('dashboard');
}

function setTransactionType(type) {
    selectedTransactionType = type;
    renderApp();
}

function getCategoriesByType(type) {
    switch (type) {
        case TRANSACTION_TYPES.EXPENSE:
            return expenseCategories;
        case TRANSACTION_TYPES.INVESTMENT:
            return investmentCategories;
        case TRANSACTION_TYPES.TRANSFER:
            return transferCategories;
        case TRANSACTION_TYPES.COMMITMENT:
            return commitmentCategories;
        default:
            return expenseCategories;
    }
}

function getTransactionTypeLabel(type) {
    switch (type) {
        case TRANSACTION_TYPES.EXPENSE:
            return 'Expense';
        case TRANSACTION_TYPES.INVESTMENT:
            return 'Investment';
        case TRANSACTION_TYPES.TRANSFER:
            return 'Transfer';
        case TRANSACTION_TYPES.COMMITMENT:
            return 'Commitment';
        default:
            return 'Transaction';
    }
}

function getTransactionTypeColor(type) {
    switch (type) {
        case TRANSACTION_TYPES.EXPENSE:
            return 'red';
        case TRANSACTION_TYPES.INVESTMENT:
            return 'blue';
        case TRANSACTION_TYPES.TRANSFER:
            return 'cyan';
        case TRANSACTION_TYPES.COMMITMENT:
            return 'orange';
        default:
            return 'indigo';
    }
}

function getTransactionPlaceholder(type) {
    switch (type) {
        case TRANSACTION_TYPES.EXPENSE:
            return 'What did you spend on?';
        case TRANSACTION_TYPES.INVESTMENT:
            return 'e.g., SIP Mutual Fund Investment';
        case TRANSACTION_TYPES.TRANSFER:
            return 'e.g., Money sent to home';
        case TRANSACTION_TYPES.COMMITMENT:
            return 'e.g., House Rent, Loan EMI';
        default:
            return 'Enter description';
    }
}

function getCurrentMonthTransactions(expenses) {
    const now = new Date();
    return expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        StorageManager.deleteExpense(id);
        renderApp();
    }
}

function editIncome() {
    const currentIncome = StorageManager.getIncome();
    const newIncome = prompt('Enter your monthly income:', currentIncome);
    if (newIncome && !isNaN(newIncome) && parseFloat(newIncome) > 0) {
        StorageManager.saveIncome(parseFloat(newIncome));
        renderApp();
    }
}

// Backward compatibility
function editBudget() {
    editIncome();
}

function exportData() {
    const expenses = StorageManager.getExpenses();
    const income = StorageManager.getIncome();
    const user = StorageManager.getUserProfile();
    const data = {
        expenses,
        income,
        user,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.expenses !== undefined && data.income !== undefined) {
                StorageManager.saveExpenses(data.expenses);
                StorageManager.saveIncome(data.income);
                if (data.user) {
                    StorageManager.saveUserProfile(data.user);
                }
                StorageManager.completeOnboarding();
                renderApp();
                alert('Data imported successfully!');
            } else {
                alert('Invalid data format. Ensure the file contains valid budget tracker data.');
            }
        } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Failed to import data. Invalid JSON file.');
        }
    };
    reader.readAsText(file);
    // Reset file input so the same file can be imported again if needed
    event.target.value = '';
}

function filterHistory(value) {
    historyFilter = value;
    renderApp();
}

// Onboarding Functions
function nextOnboardingStep() {
    if (onboardingStep < 5) {
        onboardingStep++;
        renderApp();
    }
}

function prevOnboardingStep() {
    if (onboardingStep > 1) {
        onboardingStep--;
        renderApp();
    }
}

function saveProfileAndContinue(e) {
    e.preventDefault();
    const form = e.target;
    const profile = StorageManager.getUserProfile() || {};
    profile.name = form.username.value;
    StorageManager.saveUserProfile(profile);
    nextOnboardingStep();
}

function saveIncomeAndContinue(e) {
    e.preventDefault();
    const form = e.target;
    StorageManager.saveIncome(parseFloat(form.monthlyIncome.value));
    nextOnboardingStep();
}

// Backward compatibility
function saveBudgetAndContinue(e) {
    saveIncomeAndContinue(e);
}

function saveCurrencyAndContinue(e) {
    e.preventDefault();
    const form = e.target;
    const selectedCurr = form.currency.value;
    const profile = StorageManager.getUserProfile() || {};
    profile.currency = selectedCurr;
    StorageManager.saveUserProfile(profile);
    selectedCurrency = selectedCurr;
    nextOnboardingStep();
}

function completeOnboarding() {
    StorageManager.completeOnboarding();
    renderApp();
}

// Currency helper
function getCurrencySymbol() {
    const user = StorageManager.getUserProfile();
    const currency = currencies.find(c => c.code === user?.currency) || currencies[0];
    return currency.symbol;
}

function renderMonthlyReport() {
    const expenses = StorageManager.getExpenses();
    const currencySymbol = getCurrencySymbol();

    // Filter by selected month
    const [year, month] = selectedReportMonth.split('-');
    const reportMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(month) - 1;
    });

    const totals = {
        [TRANSACTION_TYPES.EXPENSE]: 0,
        [TRANSACTION_TYPES.INVESTMENT]: 0,
        [TRANSACTION_TYPES.TRANSFER]: 0,
        [TRANSACTION_TYPES.COMMITMENT]: 0
    };

    reportMonthExpenses.forEach(e => {
        if (totals[e.type] !== undefined) {
            totals[e.type] += e.amount;
        } else {
            totals[TRANSACTION_TYPES.EXPENSE] += e.amount;
        }
    });

    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

    return `
        <div class="space-y-6 max-w-4xl mx-auto">
        <div class="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-xl card-shadow gap-4">
            <h2 class="text-2xl font-bold text-gray-800">Monthly Report</h2>
            <input type="month" value="${selectedReportMonth}" onchange="setReportMonth(event.target.value)"
                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Chart -->
            <div class="bg-white p-5 rounded-xl card-shadow flex flex-col items-center justify-center">
                <h3 class="font-semibold text-gray-800 mb-4 w-full text-left">Distribution</h3>
                ${grandTotal > 0 ? `<div class="w-full max-w-xs"><canvas id="reportChart" height="250"></canvas></div>` :
                    `<div class="py-12 text-gray-500 flex flex-col items-center">
                            <i data-lucide="pie-chart" class="w-12 h-12 mb-2 opacity-50"></i>
                            <p>No transactions for this month</p>
                        </div>`}
            </div>

            <!-- Table -->
            <div class="bg-white p-5 rounded-xl card-shadow overflow-hidden">
                <h3 class="font-semibold text-gray-800 mb-4">Summary Table</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b-2 border-gray-100 text-gray-500 text-sm">
                                <th class="py-3 font-medium">Category</th>
                                <th class="py-3 font-medium text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            <tr>
                                <td class="py-3 flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full bg-red-500"></div> Expenses
                                </td>
                                <td class="py-3 text-right font-medium text-gray-800">${currencySymbol}${totals[TRANSACTION_TYPES.EXPENSE].toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td class="py-3 flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full bg-blue-500"></div> Investments
                                </td>
                                <td class="py-3 text-right font-medium text-gray-800">${currencySymbol}${totals[TRANSACTION_TYPES.INVESTMENT].toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td class="py-3 flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full bg-cyan-500"></div> Transfers
                                </td>
                                <td class="py-3 text-right font-medium text-gray-800">${currencySymbol}${totals[TRANSACTION_TYPES.TRANSFER].toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td class="py-3 flex items-center gap-2">
                                    <div class="w-3 h-3 rounded-full bg-orange-500"></div> Commitments
                                </td>
                                <td class="py-3 text-right font-medium text-gray-800">${currencySymbol}${totals[TRANSACTION_TYPES.COMMITMENT].toFixed(2)}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="bg-gray-50 font-bold text-gray-800">
                                <td class="py-3 px-2 rounded-l-lg">Total Outflow</td>
                                <td class="py-3 px-2 text-right rounded-r-lg">${currencySymbol}${grandTotal.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function setReportMonth(monthStr) {
    if (!monthStr) return;
    selectedReportMonth = monthStr;
    renderApp();
}

function initReportCharts() {
    const ctx = document.getElementById('reportChart');
    if (!ctx) return;

    if (chartInstances.report) chartInstances.report.destroy();

    const expenses = StorageManager.getExpenses();
    const [year, month] = selectedReportMonth.split('-');
    const reportMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(month) - 1;
    });

    const totals = {
        [TRANSACTION_TYPES.EXPENSE]: 0,
        [TRANSACTION_TYPES.INVESTMENT]: 0,
        [TRANSACTION_TYPES.TRANSFER]: 0,
        [TRANSACTION_TYPES.COMMITMENT]: 0
    };

    reportMonthExpenses.forEach(e => {
        if (totals[e.type] !== undefined) {
            totals[e.type] += e.amount;
        } else {
            totals[TRANSACTION_TYPES.EXPENSE] += e.amount;
        }
    });

    const data = [
        totals[TRANSACTION_TYPES.EXPENSE],
        totals[TRANSACTION_TYPES.INVESTMENT],
        totals[TRANSACTION_TYPES.TRANSFER],
        totals[TRANSACTION_TYPES.COMMITMENT]
    ];

    if (data.every(val => val === 0)) return;

    chartInstances.report = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Expenses', 'Investments', 'Transfers', 'Commitments'],
            datasets: [{
                data: data,
                backgroundColor: ['#EF4444', '#3B82F6', '#06B6D4', '#F97316'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12 } }
            }
        }
    });
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', renderApp);
