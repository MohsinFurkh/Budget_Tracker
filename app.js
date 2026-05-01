// Budget Tracker App
const categories = [
    { id: 'food', name: 'Food & Dining', icon: 'utensils', color: '#FF6B6B' },
    { id: 'transport', name: 'Transportation', icon: 'car', color: '#4ECDC4' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#45B7D1' },
    { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#96CEB4' },
    { id: 'bills', name: 'Bills & Utilities', icon: 'receipt', color: '#FFEAA7' },
    { id: 'health', name: 'Health & Medical', icon: 'heart-pulse', color: '#DDA0DD' },
    { id: 'education', name: 'Education', icon: 'book-open', color: '#98D8C8' },
    { id: 'other', name: 'Other', icon: 'more-horizontal', color: '#F7DC6F' }
];

// Storage Manager
const StorageManager = {
    EXPENSES_KEY: 'budget_expenses',
    BUDGET_KEY: 'monthly_budget',
    USER_KEY: 'user_profile',
    ONBOARDING_KEY: 'onboarding_complete',
    
    getExpenses() {
        const data = localStorage.getItem(this.EXPENSES_KEY);
        return data ? JSON.parse(data) : [];
    },
    
    saveExpenses(expenses) {
        localStorage.setItem(this.EXPENSES_KEY, JSON.stringify(expenses));
    },
    
    getBudget() {
        const data = localStorage.getItem(this.BUDGET_KEY);
        return data ? JSON.parse(data) : 5000;
    },
    
    saveBudget(budget) {
        localStorage.setItem(this.BUDGET_KEY, JSON.stringify(budget));
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
                  currentView === 'analytics' ? renderAnalytics() : ''}
            </main>
            ${renderBottomNav()}
        </div>
    `;
    lucide.createIcons();
    
    if (currentView === 'dashboard') {
        setTimeout(initDashboardCharts, 0);
    } else if (currentView === 'analytics') {
        setTimeout(initAnalyticsCharts, 0);
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
                    <i data-lucide="target" class="w-8 h-8 text-indigo-600"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800">Set your budget</h2>
                <p class="text-gray-600 mt-2">What's your monthly budget?</p>
            </div>
            <form onsubmit="saveBudgetAndContinue(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Monthly Budget</label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">$</span>
                        <input type="number" name="monthlyBudget" required min="1" 
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
    const budget = StorageManager.getBudget();
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
                    <span class="text-gray-600">Monthly Budget</span>
                    <span class="font-medium">${currency.symbol}${budget.toLocaleString()}</span>
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
                    <button onclick="exportData()" class="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition">
                        <i data-lucide="download" class="w-5 h-5"></i>
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
        { id: 'analytics', icon: 'bar-chart-3', label: 'Analytics' }
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
    const monthlyBudget = StorageManager.getBudget();
    const currentMonthExpenses = getCurrentMonthExpenses(expenses);
    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = monthlyBudget - totalSpent;
    const percentUsed = (totalSpent / monthlyBudget) * 100;
    const currencySymbol = getCurrencySymbol();
    
    return `
        <div class="space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-white rounded-xl p-5 card-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-gray-500 text-sm">Monthly Budget</p>
                            <p class="text-2xl font-bold text-gray-800">${currencySymbol}${monthlyBudget.toLocaleString()}</p>
                        </div>
                        <button onclick="editBudget()" class="text-gray-400 hover:text-gray-600">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
                <div class="bg-white rounded-xl p-5 card-shadow">
                    <p class="text-gray-500 text-sm">Total Spent</p>
                    <p class="text-2xl font-bold text-red-500">${currencySymbol}${totalSpent.toLocaleString()}</p>
                    <p class="text-xs text-gray-400 mt-1">${currentMonthExpenses.length} transactions</p>
                </div>
                <div class="bg-white rounded-xl p-5 card-shadow">
                    <p class="text-gray-500 text-sm">Remaining</p>
                    <p class="text-2xl font-bold ${remaining >= 0 ? 'text-green-500' : 'text-red-500'}">${currencySymbol}${remaining.toLocaleString()}</p>
                    <p class="text-xs text-gray-400 mt-1">${percentUsed.toFixed(1)}% used</p>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="bg-white rounded-xl p-5 card-shadow">
                <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600">Budget Usage</span>
                    <span class="font-medium ${percentUsed > 80 ? 'text-red-500' : 'text-gray-700'}">${percentUsed.toFixed(1)}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="${percentUsed > 80 ? 'bg-red-500' : percentUsed > 60 ? 'bg-yellow-500' : 'bg-green-500'} h-3 rounded-full transition-all duration-500" 
                         style="width: ${Math.min(percentUsed, 100)}%"></div>
                </div>
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
                    ${currentMonthExpenses.slice(-5).reverse().map(expense => renderExpenseItem(expense)).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderAddExpense() {
    const today = new Date().toISOString().split('T')[0];
    const currencySymbol = getCurrencySymbol();
    
    return `
        <div class="max-w-md mx-auto">
            <h2 class="text-2xl font-bold text-gray-800 mb-6">Add Expense</h2>
            <form onsubmit="handleExpenseSubmit(event)" class="bg-white rounded-xl p-6 card-shadow space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div class="relative">
                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">${currencySymbol}</span>
                        <input type="number" name="amount" required min="0.01" step="0.01"
                            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            placeholder="0.00">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input type="text" name="description" required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        placeholder="What did you spend on?">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <div class="grid grid-cols-2 gap-2">
                        ${categories.map(cat => `
                            <label class="cursor-pointer">
                                <input type="radio" name="category" value="${cat.id}" required class="peer sr-only"
                                    ${cat.id === 'food' ? 'checked' : ''}>
                                <div class="flex items-center gap-2 p-3 rounded-lg border-2 border-gray-200 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 transition">
                                    <div class="w-3 h-3 rounded-full" style="background-color: ${cat.color}"></div>
                                    <span class="text-sm">${cat.name}</span>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input type="date" name="date" required value="${today}"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none">
                </div>
                
                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition">
                    Add Expense
                </button>
            </form>
        </div>
    `;
}

function renderHistory() {
    const expenses = StorageManager.getExpenses().sort((a, b) => new Date(b.date) - new Date(a.date));
    const grouped = groupExpensesByMonth(expenses);
    const currencySymbol = getCurrencySymbol();
    
    return `
        <div>
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-800">Expense History</h2>
                <select onchange="filterHistory(this.value)" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
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
    return `
        <div class="flex items-center justify-between py-2">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" style="background-color: ${cat.color}20">
                    <i data-lucide="${cat.icon}" class="w-5 h-5" style="color: ${cat.color}"></i>
                </div>
                <div>
                    <p class="font-medium text-gray-800">${expense.description}</p>
                    <p class="text-xs text-gray-500">${new Date(expense.date).toLocaleDateString()}</p>
                </div>
            </div>
            <span class="font-semibold text-gray-800">${currencySymbol}${expense.amount.toFixed(2)}</span>
        </div>
    `;
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
    const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const currencySymbol = getCurrencySymbol();
    
    if (total === 0) {
        insights.push("Start adding expenses to see personalized insights.");
        return insights;
    }
    
    // Top category
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        const catName = getCategoryName(topCategory[0]);
        const percentage = ((topCategory[1] / total) * 100).toFixed(1);
        insights.push(`You spend most on ${catName} (${percentage}% of total).`);
    }
    
    // Monthly average
    const monthlyData = getMonthlyData(expenses);
    const months = Object.keys(monthlyData).length;
    const avgMonthly = total / (months || 1);
    insights.push(`Your average monthly spending is ${currencySymbol}${avgMonthly.toFixed(2)}.`);
    
    // Budget status
    const budget = StorageManager.getBudget();
    const currentMonth = getCurrentMonthExpenses(expenses).reduce((sum, e) => sum + e.amount, 0);
    const percentUsed = (currentMonth / budget) * 100;
    
    if (percentUsed > 90) {
        insights.push(`You've used ${percentUsed.toFixed(0)}% of your monthly budget!`);
    } else if (percentUsed < 50) {
        insights.push(`You're doing great! Only ${percentUsed.toFixed(0)}% of budget used.`);
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

function handleExpenseSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const expense = {
        amount: parseFloat(form.amount.value),
        description: form.description.value,
        category: form.category.value,
        date: form.date.value
    };
    
    StorageManager.addExpense(expense);
    form.reset();
    form.date.value = new Date().toISOString().split('T')[0];
    
    // Show success message
    alert('Expense added successfully!');
    setView('dashboard');
}

function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        StorageManager.deleteExpense(id);
        renderApp();
    }
}

function editBudget() {
    const currentBudget = StorageManager.getBudget();
    const newBudget = prompt('Enter your monthly budget:', currentBudget);
    if (newBudget && !isNaN(newBudget) && parseFloat(newBudget) > 0) {
        StorageManager.saveBudget(parseFloat(newBudget));
        renderApp();
    }
}

function exportData() {
    const expenses = StorageManager.getExpenses();
    const budget = StorageManager.getBudget();
    const data = { expenses, budget, exportDate: new Date().toISOString() };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function filterHistory(value) {
    // Re-render with filter (simplified)
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

function saveBudgetAndContinue(e) {
    e.preventDefault();
    const form = e.target;
    StorageManager.saveBudget(parseFloat(form.monthlyBudget.value));
    nextOnboardingStep();
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
