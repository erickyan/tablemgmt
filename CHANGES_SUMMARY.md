# Change Summary – Firestore Backend & Authentication

This document highlights the current architecture after migrating the China Buffet POS system to Firebase Firestore with Firebase Authentication.

## Overview
- Firestore stores all operational data: menu categories/items, table state, sales summaries, sales history, and the shared AppState snapshot.
- Firebase Authentication (email/password) controls access; Firestore listeners only start after a staff member signs in.
- Real-time synchronization keeps every connected client in sync via Firestore listeners and a debounced AppState publisher.

## Core Implementation Changes

### `src/firebase/index.js`
- Loads Firebase config from `.env`.
- Exposes Firestore (`db`) and Auth (`auth`) instances.
- Logs a warning and disables integrations if any config value is missing.

### `src/store/index.js`
- Tracks authentication state (`authUser`, `authLoading`, `authError`).
- New actions: `initializeAuth`, `signIn`, `signOut`, `initializeFirebase`, `cleanupFirebase`.
- Firestore listeners (menu, tables, sales summary, AppState) register only after login.
- All mutations that persist data verify `state.authUser` before writing.
- Debounced subscriber writes AppState snapshots to Firestore (`appState/current`).
- Determines role based on `VITE_FIREBASE_ADMIN_EMAILS` and exposes `isAdmin`/`isServer` getters.
- Adds admin utilities: `updateMenuFromAdmin`, `resetSalesData`, `saveMenuToFirestore`, `saveTableToFirestore`.

### `src/services/firestoreData.js`
- Provides helpers for menu, tables, sales, sales summary, and AppState collections/documents.
- Throws descriptive errors if Firestore is not initialized.
- Wraps writes with `serverTimestamp()` metadata.
- Adds `clearSalesData()` to zero-out the sales summary and truncate the `sales` history collection.

### `src/App.vue`
- Shows a Vuetify login card when authentication is required.
- Displays role-aware navigation (admin drawer, server-only top bar) with quick sign-out controls.
- Adds admin-only tools for menu management, viewing to-go sales history, and sales reset.
- Falls back to loading indicator while auth state is establishing.

### `src/components/AdminMenuManager.vue`
- Fullscreen dialog for editing menu categories and items with add/remove capabilities.
- Emits sanitized menu data for persistence through the store.

### `src/main.js`
- Boots authentication (`store.dispatch('initializeAuth')`) on startup instead of directly touching Firestore.

### `README.md`
- Documents Firebase setup steps, required environment variables (`VITE_FIREBASE_ADMIN_EMAILS`), staff login requirement, and optional sample data import.

## Environment Variables
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```
Create `.env`, populate these values from Firebase Console → Project Settings → General → “Your apps”, then restart `npm run dev`.

## Firestore Security (Suggested Baseline)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
Refine with role-based logic (staff allow-list, read-only dashboards, etc.) before production.

## Testing Checklist
1. Create staff accounts in Firebase Authentication (email/password).
2. Start the dev server, sign in via the new login form.
3. Interact with the POS (seat guests, add drinks, pay tables, complete to-go orders).
4. Verify Firestore collections update in real time:
   - `menu` documents (per category)
   - `tables/{1..10}`
   - `salesSummary/stats`
   - `sales/*` (historical log)
   - `appState/current`
5. Sign out and confirm listeners tear down cleanly (no additional writes are attempted).

## Removed Assets
- Google Sheets service, Apps Script, and all related setup/troubleshooting documents were removed to avoid confusion. Firestore is now the sole backend.

## Next Steps
- Harden Firestore security rules (role-based access, field validation).
- Extend the login view (password reset, error messaging, input validation).
- Add automated tests covering auth flows and Firestore writes.

This summary should serve as the canonical reference for the current Firestore-backed architecture.***
