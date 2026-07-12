// Onboarding flow: welcome → name → income → currency → ready
import { currencies } from '../config.js';
import { StorageManager } from '../storage.js';
import { state, app } from '../state.js';
import { escapeHtml } from '../ui.js';

let selectedCurrency = 'USD';

export function renderOnboarding() {
    const steps = {
        1: renderWelcomeStep,
        2: renderProfileStep,
        3: renderBudgetStep,
        4: renderCurrencyStep,
        5: renderReadyStep
    };
    const stepRenderer = steps[state.onboardingStep] || steps[1];

    return `
        <div class="min-h-screen gradient-bg flex items-center justify-center p-4">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8">
                <div class="flex justify-center gap-2 mb-8">
                    ${[1, 2, 3, 4, 5].map(i => `
                        <div class="w-2 h-2 rounded-full transition-all ${i === state.onboardingStep ? 'w-8 bg-indigo-600' : i < state.onboardingStep ? 'bg-indigo-400' : 'bg-gray-300 dark:bg-gray-600'}"></div>
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
            <div class="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <i data-lucide="wallet" class="w-12 h-12 text-indigo-600 dark:text-indigo-400"></i>
            </div>
            <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">Welcome to Budget Tracker</h1>
            <p class="text-gray-600 dark:text-gray-300 mb-4">Track your personal and family expenses using the proven <strong>50/20/30</strong> budgeting framework.</p>
            <div class="flex justify-center gap-3 mb-6 text-sm">
                <span class="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-medium">50% Needs</span>
                <span class="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-medium">20% Wants</span>
                <span class="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">30% Savings</span>
            </div>
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
                <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="user" class="w-8 h-8 text-indigo-600 dark:text-indigo-400"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">What's your name?</h2>
                <p class="text-gray-600 dark:text-gray-300 mt-2">Personalize your experience</p>
            </div>
            <form onsubmit="saveProfileAndContinue(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Name</label>
                    <input type="text" name="username" required
                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        placeholder="Enter your name">
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="prevOnboardingStep()" class="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">Back</button>
                    <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">Continue</button>
                </div>
            </form>
        </div>
    `;
}

function renderBudgetStep() {
    return `
        <div>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="wallet" class="w-8 h-8 text-indigo-600 dark:text-indigo-400"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Set your income</h2>
                <p class="text-gray-600 dark:text-gray-300 mt-2">What's your monthly income?</p>
            </div>
            <form onsubmit="saveIncomeAndContinue(event)" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Monthly Income</label>
                    <input type="number" name="monthlyIncome" required min="1"
                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg"
                        placeholder="5000" value="5000">
                </div>
                <div class="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 text-sm text-indigo-800 dark:text-indigo-200">
                    <p class="font-medium mb-2">Your budget will be split as:</p>
                    <div class="space-y-1">
                        <div class="flex justify-between"><span>🏠 Needs</span><span class="font-semibold">50%</span></div>
                        <div class="flex justify-between"><span>🎯 Wants</span><span class="font-semibold">20%</span></div>
                        <div class="flex justify-between"><span>💰 Savings</span><span class="font-semibold">30%</span></div>
                    </div>
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="prevOnboardingStep()" class="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">Back</button>
                    <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">Continue</button>
                </div>
            </form>
        </div>
    `;
}

function renderCurrencyStep() {
    return `
        <div>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="coins" class="w-8 h-8 text-indigo-600 dark:text-indigo-400"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Select currency</h2>
                <p class="text-gray-600 dark:text-gray-300 mt-2">Choose your preferred currency</p>
            </div>
            <form onsubmit="saveCurrencyAndContinue(event)" class="space-y-4">
                <div class="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    ${currencies.map(c => `
                        <label class="cursor-pointer">
                            <input type="radio" name="currency" value="${c.code}"
                                ${c.code === selectedCurrency ? 'checked' : ''} class="peer sr-only">
                            <div class="p-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-center peer-checked:border-indigo-600 peer-checked:bg-indigo-50 dark:peer-checked:bg-indigo-900/30 transition hover:border-gray-300">
                                <div class="text-2xl mb-1 dark:text-gray-100">${c.symbol}</div>
                                <div class="text-xs font-medium text-gray-700 dark:text-gray-300">${c.code}</div>
                            </div>
                        </label>
                    `).join('')}
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="prevOnboardingStep()" class="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition">Back</button>
                    <button type="submit" class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">Continue</button>
                </div>
            </form>
        </div>
    `;
}

function renderReadyStep() {
    const user = StorageManager.getUserProfile();
    const income = StorageManager.getIncome();
    const currency = currencies.find(c => c.code === user?.currency) || currencies[0];

    const row = (label, value, cls = '') => `
        <div class="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-0">
            <span class="text-gray-600 dark:text-gray-300">${label}</span>
            <span class="font-medium dark:text-gray-100 ${cls}">${value}</span>
        </div>`;

    return `
        <div class="text-center">
            <div class="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <i data-lucide="check" class="w-10 h-10 text-green-600 dark:text-green-400"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">You're all set!</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-6">Welcome, ${escapeHtml(user?.name || 'there')}! Here's your setup:</p>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-left">
                ${row('Name', escapeHtml(user?.name || '-'))}
                ${row('Monthly Income', currency.symbol + income.toLocaleString())}
                ${row('Currency', user?.currency || 'USD')}
                ${row('Needs (50%)', currency.symbol + (income * 0.5).toLocaleString(), 'text-amber-600')}
                ${row('Wants (20%)', currency.symbol + (income * 0.2).toLocaleString(), 'text-purple-600')}
                ${row('Savings (30%)', currency.symbol + (income * 0.3).toLocaleString(), 'text-emerald-600')}
            </div>
            <button onclick="completeOnboarding()" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition">
                Start Tracking
            </button>
        </div>
    `;
}

// ─── Handlers (bridged to window in app.js) ────────────────────────────────────
export function nextOnboardingStep() {
    if (state.onboardingStep < 5) { state.onboardingStep++; app.rerender(); }
}

export function prevOnboardingStep() {
    if (state.onboardingStep > 1) { state.onboardingStep--; app.rerender(); }
}

export function saveProfileAndContinue(e) {
    e.preventDefault();
    const profile = StorageManager.getUserProfile() || {};
    profile.name = e.target.username.value.trim();
    StorageManager.saveUserProfile(profile);
    nextOnboardingStep();
}

export function saveIncomeAndContinue(e) {
    e.preventDefault();
    StorageManager.saveIncome(parseFloat(e.target.monthlyIncome.value));
    nextOnboardingStep();
}

export function saveCurrencyAndContinue(e) {
    e.preventDefault();
    const profile = StorageManager.getUserProfile() || {};
    profile.currency = e.target.currency.value;
    StorageManager.saveUserProfile(profile);
    selectedCurrency = profile.currency;
    nextOnboardingStep();
}

export function completeOnboarding() {
    StorageManager.completeOnboarding();
    app.rerender();
}
