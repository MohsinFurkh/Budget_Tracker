// Google sign-in + Firestore cloud sync (via Firebase).
// Loaded lazily — if firebase-config.js exports null, the app stays local-only.
import { firebaseConfig } from './firebase-config.js';
import { StorageManager, setSyncHook } from './storage.js';
import { state, app } from './state.js';
import { showToast, applyTheme } from './ui.js';

let fbAuth = null;
let fbDb = null;
let authMod = null;
let fsMod = null;
let pushTimer = null;
let restoring = false;

export function isCloudConfigured() {
    return !!firebaseConfig;
}

export async function initCloud() {
    if (!firebaseConfig) return;

    try {
        const appMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
        authMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        fsMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

        const fbApp = appMod.initializeApp(firebaseConfig);
        fbAuth = authMod.getAuth(fbApp);
        fbDb = fsMod.getFirestore(fbApp);

        authMod.onAuthStateChanged(fbAuth, async (user) => {
            state.cloudUser = user;
            if (user) {
                state.syncStatus = 'syncing';
                app.rerender();
                await reconcileOnSignIn(user);
                state.syncStatus = 'synced';
            } else {
                state.syncStatus = 'off';
            }
            app.rerender();
        });

        // Push local changes to the cloud (debounced) after any save
        setSyncHook(() => {
            if (!state.cloudUser || restoring) return;
            clearTimeout(pushTimer);
            pushTimer = setTimeout(pushSnapshot, 1500);
        });
    } catch (err) {
        console.error('Cloud init failed:', err);
        showToast('Cloud sync unavailable: ' + err.message, 'error');
    }
}

export async function signInWithGoogle() {
    if (!fbAuth) {
        showToast('Cloud sync is not configured. See js/firebase-config.js', 'warning');
        return;
    }
    try {
        const provider = new authMod.GoogleAuthProvider();
        await authMod.signInWithPopup(fbAuth, provider);
        showToast('Signed in with Google');
    } catch (err) {
        if (err.code !== 'auth/popup-closed-by-user') {
            console.error('Sign-in failed:', err);
            showToast('Sign-in failed: ' + err.message, 'error');
        }
    }
}

export async function signOutUser() {
    if (!fbAuth) return;
    await authMod.signOut(fbAuth);
    showToast('Signed out. Your data stays on this device.', 'info');
}

async function pushSnapshot() {
    if (!state.cloudUser || !fbDb) return;
    try {
        state.syncStatus = 'syncing';
        const ref = fsMod.doc(fbDb, 'users', state.cloudUser.uid);
        await fsMod.setDoc(ref, { ...StorageManager.snapshot(), updatedAt: new Date().toISOString() });
        state.syncStatus = 'synced';
    } catch (err) {
        console.error('Cloud push failed:', err);
        state.syncStatus = 'error';
    }
}

async function reconcileOnSignIn(user) {
    try {
        const ref = fsMod.doc(fbDb, 'users', user.uid);
        const snap = await fsMod.getDoc(ref);
        const cloud = snap.exists() ? snap.data() : null;
        const localCount = StorageManager.getExpenses().length;
        const cloudCount = cloud?.expenses?.length || 0;

        if (cloud && cloudCount > 0 && localCount === 0) {
            // Fresh device: just pull cloud data
            restoreFromCloud(cloud);
            showToast(`Restored ${cloudCount} transactions from your account`);
        } else if (cloud && cloudCount > 0 && localCount > 0) {
            const useCloud = confirm(
                `Cloud backup found for ${user.email}\n\n` +
                `Cloud: ${cloudCount} transactions\nThis device: ${localCount} transactions\n\n` +
                `OK = load the CLOUD data (replaces this device's data)\n` +
                `Cancel = keep THIS DEVICE's data (replaces the cloud backup)`
            );
            if (useCloud) {
                restoreFromCloud(cloud);
                showToast('Loaded data from your cloud backup');
            } else {
                await pushSnapshot();
                showToast('Cloud backup updated with this device’s data');
            }
        } else {
            // No cloud data yet: upload local
            await pushSnapshot();
            if (localCount > 0) showToast('Your data is now backed up to your account');
        }
    } catch (err) {
        console.error('Sync failed:', err);
        state.syncStatus = 'error';
        showToast('Cloud sync failed: ' + err.message, 'error');
    }
}

function restoreFromCloud(cloud) {
    restoring = true;
    try {
        StorageManager.restore(cloud);
        applyTheme();
    } finally {
        restoring = false;
    }
}
