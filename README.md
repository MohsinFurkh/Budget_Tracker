# Budget Tracker

A progressive web app (PWA) for tracking personal and family finances using the
**50/20/30 budgeting framework** — 50% Needs, 20% Wants, 30% Savings & Goals.

Built with vanilla JavaScript (ES modules), Tailwind CSS, Chart.js, and Lucide icons.
No build step required.

## Features

- **50/20/30 dashboard** — income vs. outflow, per-bucket targets and progress
- **Transactions** — add, **edit**, delete, search, and filter by bucket/period
- **Recurring transactions** — rent, subscriptions, EMIs added automatically each month
- **Savings goals** — set targets, add contributions (auto-recorded as Savings transactions)
- **Category budget limits** — optional monthly caps per category with over-budget warnings
- **Analytics** — monthly trend, month-over-month comparison, average daily spend, year-over-year charts, smart insights
- **Monthly report** — printable/PDF-exportable 50/20/30 summary for any month
- **Data portability** — JSON backup export/import and CSV export/import
- **Dark mode** — toggle in Settings
- **Offline-first** — service worker caches the app and CDN assets after first load
- **Google sign-in + cloud sync** *(optional)* — back up data to your Google account and sync across devices via Firebase

## Running locally

ES modules require an HTTP server (opening `index.html` directly from disk won't work):

```bash
# any static server works, e.g.:
npx serve .
# or
python -m http.server 8000
```

Then open `http://localhost:8000` (or the port shown).

## Enabling Google sign-in & cloud sync

The app works fully offline/local without any setup. To enable Google login and
cross-device sync:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Add a **Web App** to the project and copy its config object.
3. Enable **Authentication → Sign-in method → Google**.
4. Create a **Firestore Database** and set these security rules:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. Add your deployed domain (and `localhost`) under
   **Authentication → Settings → Authorized domains**.
6. Paste your config into [`js/firebase-config.js`](js/firebase-config.js), replacing `null`.

Once configured, a **Sign in with Google** button appears in **Settings → Account & Sync**.
On sign-in, the app reconciles local and cloud data (you choose which wins), then
keeps the cloud backup updated automatically after every change.

## CSV import format

CSV files must have a header row with at least `date` and `amount` columns.
Recognized columns: `date, type, category, description, amount` — where `type`
is one of `needs`, `wants`, `savings`.

## Project structure

```
index.html              app shell, CDN scripts, print/dark-mode styles
sw.js                   service worker (offline caching, v2)
manifest.json           PWA manifest
js/
  app.js                entry point: routing, header/nav, bootstrapping
  config.js             categories, currencies, transaction types
  state.js              shared UI state
  storage.js            localStorage layer, migrations, recurring engine
  data.js               aggregation/analysis helpers
  ui.js                 toasts, dark mode, formatting
  charts.js             Chart.js chart builders
  cloud.js              Firebase auth + Firestore sync (lazy-loaded)
  firebase-config.js    your Firebase config (null = cloud disabled)
  views/                one module per screen
```
