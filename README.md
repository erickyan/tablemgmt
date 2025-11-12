# China Buffet POS System

A Vue.js + Vuetify point-of-sale (POS) system for managing restaurant orders, tables, and sales.

## Features

- 🍽️ Table management (10 tables)
- 📱 To-go order management
- 💰 Sales tracking and reporting
- 📊 Real-time revenue and customer count tracking
- 🔄 Firebase Firestore integration for real-time data persistence
- 🔐 Staff login with Firebase Authentication
- 👥 Role-based UI (admin vs. server) with admin-only tools surfaced in the side navigation
- ☁️ Cloud-synced AppState (multiple clients stay in sync via Firestore)
- 🎨 Modern, responsive UI with Vuetify

## Firebase Firestore Integration

Menu items, table state, sales history, and the global AppState snapshot are now stored in Firebase Firestore. Changes propagate in real time across all connected clients.

### Quick Setup

1. Create a Firebase project and enable Firestore (Native mode).
2. Create `.env` in the project root and add your Firebase web config:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_ADMIN_EMAILS=admin1@example.com,admin2@example.com
   ```
   `VITE_FIREBASE_ADMIN_EMAILS` is a comma-separated list of staff emails that should receive admin privileges (menu editing & sales reset).
3. (Recommended) Update Firestore security rules to allow only authenticated users or the appropriate service accounts.
4. Create staff accounts in Firebase Authentication (Email/Password) for both admins and servers.
5. Restart the dev server: `npm run dev`
6. Optional: Populate sample data via the Vuex action `store.dispatch('populateSampleData')`

The app will automatically:
- Load menu, tables, sales summary, and AppState from Firestore on startup
- Listen for real-time updates to keep UI in sync
- Persist all mutations (tables, sales, AppState) back to Firestore

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).
