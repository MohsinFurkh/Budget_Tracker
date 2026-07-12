// Pure data helpers: aggregation and analysis over transactions
import { TRANSACTION_TYPES, getCategoryName } from './config.js';
import { StorageManager } from './storage.js';

export function getCurrentMonthTransactions(expenses) {
    const now = new Date();
    return expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
}

export function getMonthTransactions(expenses, year, monthIndex) {
    return expenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === monthIndex;
    });
}

export function sumByType(transactions, type) {
    return transactions.filter(t => t.type === type).reduce((sum, t) => sum + t.amount, 0);
}

export function bucketTotals(transactions) {
    return {
        [TRANSACTION_TYPES.NEEDS]: sumByType(transactions, TRANSACTION_TYPES.NEEDS),
        [TRANSACTION_TYPES.WANTS]: sumByType(transactions, TRANSACTION_TYPES.WANTS),
        [TRANSACTION_TYPES.SAVINGS]: sumByType(transactions, TRANSACTION_TYPES.SAVINGS)
    };
}

export function groupExpensesByMonth(expenses) {
    return expenses.reduce((acc, expense) => {
        const date = new Date(expense.date);
        const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        if (!acc[key]) acc[key] = [];
        acc[key].push(expense);
        return acc;
    }, {});
}

export function getCategoryTotals(expenses) {
    return expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});
}

export function getMonthlyData(expenses) {
    const months = {};
    expenses.forEach(e => {
        const date = new Date(e.date);
        const key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        months[key] = (months[key] || 0) + e.amount;
    });
    return months;
}

export function getYearlyComparison(expenses) {
    const years = {};
    expenses.forEach(e => {
        const year = new Date(e.date).getFullYear();
        const month = new Date(e.date).getMonth();
        if (!years[year]) years[year] = Array(12).fill(0);
        years[year][month] += e.amount;
    });
    return years;
}

// Categories over their monthly budget limit (current month)
export function getBudgetWarnings(expenses) {
    const budgets = StorageManager.getCategoryBudgets();
    const entries = Object.entries(budgets).filter(([, limit]) => limit > 0);
    if (entries.length === 0) return [];

    const monthTotals = getCategoryTotals(getCurrentMonthTransactions(expenses));
    return entries.map(([catId, limit]) => ({
        catId,
        limit,
        spent: monthTotals[catId] || 0
    }));
}

// Month-over-month statistics for analytics
export function getMonthComparison(expenses) {
    const now = new Date();
    const thisMonth = getMonthTransactions(expenses, now.getFullYear(), now.getMonth());
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = getMonthTransactions(expenses, prev.getFullYear(), prev.getMonth());

    const thisTotal = thisMonth.reduce((s, t) => s + t.amount, 0);
    const lastTotal = lastMonth.reduce((s, t) => s + t.amount, 0);
    const change = lastTotal > 0 ? ((thisTotal - lastTotal) / lastTotal) * 100 : null;
    const avgDaily = thisTotal / now.getDate();

    return { thisTotal, lastTotal, change, avgDaily };
}

export function generateInsights(expenses, currencySymbol) {
    const insights = [];
    const currentMonthTransactions = getCurrentMonthTransactions(expenses);

    if (currentMonthTransactions.length === 0) {
        insights.push('Start adding transactions to see personalized insights.');
        return insights;
    }

    const income = StorageManager.getIncome();
    const totals = bucketTotals(currentMonthTransactions);
    const needsAmount = totals[TRANSACTION_TYPES.NEEDS];
    const wantsAmount = totals[TRANSACTION_TYPES.WANTS];
    const savingsAmount = totals[TRANSACTION_TYPES.SAVINGS];
    const totalOutflow = needsAmount + wantsAmount + savingsAmount;
    const remaining = income - totalOutflow;

    const needsPercent = income > 0 ? ((needsAmount / income) * 100).toFixed(1) : 0;
    const wantsPercent = income > 0 ? ((wantsAmount / income) * 100).toFixed(1) : 0;
    const savingsPercent = income > 0 ? ((savingsAmount / income) * 100).toFixed(1) : 0;

    if (needsPercent > 50) {
        insights.push(`⚠️ Needs spending at ${needsPercent}% (target: 50%). Consider reducing essential expenses.`);
    } else {
        insights.push(`✓ Needs at ${needsPercent}% of income — within the 50% target.`);
    }

    if (wantsPercent > 20) {
        insights.push(`⚠️ Wants spending at ${wantsPercent}% (target: 20%). Try to cut discretionary spending.`);
    } else {
        insights.push(`✓ Wants at ${wantsPercent}% of income — within the 20% target.`);
    }

    if (savingsPercent >= 30) {
        insights.push(`🎉 Savings at ${savingsPercent}% — you've hit the 30% savings target!`);
    } else if (savingsPercent > 0) {
        insights.push(`💰 Savings at ${savingsPercent}% (target: 30%). ${currencySymbol}${((income * 0.3) - savingsAmount).toFixed(0)} more to reach goal.`);
    } else {
        insights.push(`💡 No savings recorded yet. Aim to save 30% (${currencySymbol}${(income * 0.3).toFixed(0)}) monthly.`);
    }

    const currentCategoryTotals = getCategoryTotals(currentMonthTransactions);
    const topCategory = Object.entries(currentCategoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
        insights.push(`📊 Top expense: ${getCategoryName(topCategory[0])} (${currencySymbol}${topCategory[1].toFixed(0)})`);
    }

    // Category budget warnings
    getBudgetWarnings(expenses)
        .filter(w => w.spent > w.limit)
        .forEach(w => {
            insights.push(`🚨 ${getCategoryName(w.catId)} is over its monthly budget (${currencySymbol}${w.spent.toFixed(0)} / ${currencySymbol}${w.limit.toFixed(0)}).`);
        });

    if (remaining < 0) {
        insights.push(`🚨 Spending exceeds income by ${currencySymbol}${Math.abs(remaining).toFixed(0)}!`);
    }

    return insights;
}
