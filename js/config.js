// Budget Tracker — 50/20/30 Framework
// Shared constants: transaction types, categories, currencies

export const TRANSACTION_TYPES = {
    NEEDS: 'needs',
    WANTS: 'wants',
    SAVINGS: 'savings'
};

export const BUDGET_TARGETS = {
    [TRANSACTION_TYPES.NEEDS]: 50,
    [TRANSACTION_TYPES.WANTS]: 20,
    [TRANSACTION_TYPES.SAVINGS]: 30
};

// ─── Needs Categories (50%) ────────────────────────────────────────────────────
export const needsCategories = [
    { id: 'housing', name: 'Housing', icon: 'home', color: '#EF4444' },
    { id: 'utilities', name: 'Utilities', icon: 'zap', color: '#F59E0B' },
    { id: 'food_groceries', name: 'Food & Groceries', icon: 'shopping-cart', color: '#10B981' },
    { id: 'transportation', name: 'Transportation', icon: 'car', color: '#4ECDC4' },
    { id: 'insurance', name: 'Insurance', icon: 'shield', color: '#6366F1' },
    { id: 'healthcare', name: 'Healthcare', icon: 'heart-pulse', color: '#EC4899' },
    { id: 'education', name: 'Education', icon: 'book-open', color: '#8B5CF6' },
    { id: 'childcare_kids', name: 'Childcare & Kids', icon: 'baby', color: '#F97316' },
    { id: 'personal_care', name: 'Personal Care', icon: 'sparkles', color: '#14B8A6' },
    { id: 'misc_essential', name: 'Miscellaneous (Essential)', icon: 'more-horizontal', color: '#78716C' }
];

// ─── Wants Categories (20%) ────────────────────────────────────────────────────
export const wantsCategories = [
    { id: 'dining_out', name: 'Dining Out', icon: 'utensils', color: '#FF6B6B' },
    { id: 'shopping', name: 'Shopping', icon: 'shopping-bag', color: '#45B7D1' },
    { id: 'entertainment', name: 'Entertainment', icon: 'film', color: '#96CEB4' },
    { id: 'travel_vacation', name: 'Travel & Vacation', icon: 'plane', color: '#3B82F6' },
    { id: 'gifts_donations', name: 'Gifts & Donations', icon: 'gift', color: '#A855F7' },
    { id: 'subscriptions', name: 'Subscriptions', icon: 'tv', color: '#F43F5E' },
    { id: 'childcare_optional', name: 'Childcare & Kids (Optional)', icon: 'gamepad-2', color: '#FB923C' }
];

// ─── Savings & Financial Goals Categories (30%) ────────────────────────────────
export const savingsCategories = [
    { id: 'savings_investments', name: 'Savings & Investments', icon: 'trending-up', color: '#10B981' },
    { id: 'loan_repayments', name: 'Loan Repayments', icon: 'credit-card', color: '#DC2626' },
    { id: 'emergency_fund', name: 'Emergency Fund', icon: 'life-buoy', color: '#F59E0B' },
    { id: 'child_education_fund', name: 'Child Education Fund', icon: 'graduation-cap', color: '#EC4899' },
    { id: 'retirement_planning', name: 'Retirement Planning', icon: 'landmark', color: '#6366F1' },
    { id: 'goal_based_savings', name: 'Goal-Based Savings', icon: 'target', color: '#0EA5E9' }
];

export const categories = [...needsCategories, ...wantsCategories, ...savingsCategories];

// Maps old category IDs to new ones (data migration)
export const CATEGORY_MIGRATION = {
    'food': 'food_groceries',
    'transport': 'transportation',
    'shopping': 'shopping',
    'entertainment': 'entertainment',
    'bills': 'utilities',
    'health': 'healthcare',
    'education': 'education',
    'other_expense': 'misc_essential',
    'sip_mutual_fund': 'savings_investments',
    'stocks': 'savings_investments',
    'daughter_1': 'child_education_fund',
    'daughter_2': 'child_education_fund',
    'other_investment': 'savings_investments',
    'home_transfer': 'misc_essential',
    'house_rent': 'housing',
    'loan_emi': 'loan_repayments'
};

export const currencies = [
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

// ─── Lookup helpers ────────────────────────────────────────────────────────────
export function getBucketForCategory(catId) {
    if (needsCategories.some(c => c.id === catId)) return TRANSACTION_TYPES.NEEDS;
    if (wantsCategories.some(c => c.id === catId)) return TRANSACTION_TYPES.WANTS;
    if (savingsCategories.some(c => c.id === catId)) return TRANSACTION_TYPES.SAVINGS;
    return TRANSACTION_TYPES.NEEDS;
}

export function getCategoriesByType(type) {
    switch (type) {
        case TRANSACTION_TYPES.WANTS: return wantsCategories;
        case TRANSACTION_TYPES.SAVINGS: return savingsCategories;
        default: return needsCategories;
    }
}

export function getCategory(catId) {
    return categories.find(c => c.id === catId) || null;
}

export function getCategoryColor(catId) { return getCategory(catId)?.color || '#999'; }
export function getCategoryIcon(catId) { return getCategory(catId)?.icon || 'circle'; }
export function getCategoryName(catId) { return getCategory(catId)?.name || catId; }

export function getTransactionTypeLabel(type) {
    switch (type) {
        case TRANSACTION_TYPES.NEEDS: return 'Needs';
        case TRANSACTION_TYPES.WANTS: return 'Wants';
        case TRANSACTION_TYPES.SAVINGS: return 'Savings';
        default: return 'Transaction';
    }
}

export function getTransactionTypeColor(type) {
    switch (type) {
        case TRANSACTION_TYPES.NEEDS: return 'amber';
        case TRANSACTION_TYPES.WANTS: return 'purple';
        case TRANSACTION_TYPES.SAVINGS: return 'emerald';
        default: return 'indigo';
    }
}

export function getTransactionPlaceholder(type) {
    switch (type) {
        case TRANSACTION_TYPES.NEEDS: return 'e.g., Grocery shopping, Electricity bill';
        case TRANSACTION_TYPES.WANTS: return 'e.g., Restaurant dinner, Netflix';
        case TRANSACTION_TYPES.SAVINGS: return 'e.g., SIP Mutual Fund, PPF deposit';
        default: return 'Enter description';
    }
}

export function getTypeBadge(type) {
    switch (type) {
        case TRANSACTION_TYPES.WANTS: return { label: 'Wants', bg: '#F3E8FF', color: '#7E22CE' };
        case TRANSACTION_TYPES.SAVINGS: return { label: 'Savings', bg: '#D1FAE5', color: '#065F46' };
        default: return { label: 'Needs', bg: '#FEF3C7', color: '#B45309' };
    }
}
