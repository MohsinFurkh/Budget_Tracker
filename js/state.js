// Mutable UI state shared across views
import { TRANSACTION_TYPES } from './config.js';

export const state = {
    view: 'dashboard',
    period: 'month',
    reportMonth: new Date().toISOString().slice(0, 7),
    historyFilter: 'all',
    historySearch: '',
    historyBucket: 'all',
    onboardingStep: 1,
    txType: TRANSACTION_TYPES.NEEDS,
    editingId: null,       // transaction id being edited (null = adding new)
    chartInstances: {},
    cloudUser: null,       // Firebase user (null = signed out)
    syncStatus: 'off'      // 'off' | 'syncing' | 'synced' | 'error'
};

// The root renderer is registered here by app.js so views can trigger
// a re-render without importing app.js (avoids circular imports).
export const app = {
    rerender: () => {}
};
