// UI utilities: currency formatting, toasts, dark mode, icon refresh, escaping
import { currencies } from './config.js';
import { StorageManager } from './storage.js';

export function getCurrencySymbol() {
    const user = StorageManager.getUserProfile();
    const currency = currencies.find(c => c.code === user?.currency) || currencies[0];
    return currency.symbol;
}

export function formatMoney(amount, decimals = null) {
    const opts = decimals === null
        ? { maximumFractionDigits: 2 }
        : { minimumFractionDigits: decimals, maximumFractionDigits: decimals };
    return getCurrencySymbol() + Number(amount || 0).toLocaleString(undefined, opts);
}

export function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

export function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
}

// ─── Toast notifications ───────────────────────────────────────────────────────
export function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-[100] space-y-2 no-print';
        document.body.appendChild(container);
    }

    const styles = {
        success: 'bg-emerald-600',
        error: 'bg-red-600',
        info: 'bg-indigo-600',
        warning: 'bg-amber-500'
    };
    const icons = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert-triangle' };

    const toast = document.createElement('div');
    toast.className = `${styles[type] || styles.info} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium transition-all duration-300 opacity-0 translate-x-4 max-w-xs`;
    toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 flex-shrink-0"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    refreshIcons();

    requestAnimationFrame(() => toast.classList.remove('opacity-0', 'translate-x-4'));
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

// ─── Dark mode ─────────────────────────────────────────────────────────────────
export function applyTheme() {
    const settings = StorageManager.getSettings();
    document.documentElement.classList.toggle('dark', !!settings.darkMode);
}

export function toggleDarkMode() {
    const settings = StorageManager.getSettings();
    settings.darkMode = !settings.darkMode;
    StorageManager.saveSettings(settings);
    applyTheme();
}

export function isDarkMode() {
    return document.documentElement.classList.contains('dark');
}
