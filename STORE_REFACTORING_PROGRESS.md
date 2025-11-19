# Store Refactoring Progress

## Overview
Splitting the monolithic 2459-line `src/store/index.js` into modular Vuex modules for better maintainability, testability, and organization.

## Completed Modules

### ✅ 1. Auth Module (`src/store/modules/auth.js`)
- **State**: `authUser`, `authLoading`, `authError`, `authUnsubscriber`, `authRole`
- **Getters**: `isAdmin`, `isServer`, `isAuthenticated`
- **Mutations**: `setAuthLoading`, `setAuthUser`, `setAuthError`, `setAuthUnsubscriber`, `setAuthRole`
- **Actions**: `initializeAuth`, `signIn`, `signOut`
- **Status**: ✅ Complete

### ✅ 2. Settings Module (`src/store/modules/settings.js`)
- **State**: Pricing settings (TAX_RATE, ADULTPRICE, etc.), receipt settings, `isDinner`, `language`
- **Getters**: `isLunchMode`, `isDinnerMode`, `currentLanguage`, `taxRate`, `receiptSettings`
- **Mutations**: `updatePricingSettings`, `updateReceiptSettings`, `setDinnerMode`, `toggleDinnerMode`, `setLanguage`, `toggleLanguage`, `setDrinkPrice`
- **Status**: ✅ Complete

### ✅ 3. Utils Module (`src/store/utils.js`)
- Shared utility functions: `resetMenuQuantities`, `syncLegacyTogoState`, `recalcTogoTotals`, `normalizeTableOrder`, `createCashierForm`
- **Status**: ✅ Complete

## Remaining Modules to Create

### 🔄 4. Menu Module (`src/store/modules/menu.js`)
**State:**
- `menu` (array of categories with items)
- `catID` (current category ID)

**Mutations:**
- `setMenu`
- `setCatID`
- Menu item quantity updates
- Menu category/item CRUD operations

**Actions:**
- `loadMenu`
- `saveMenu`
- `updateMenuFromAdmin`
- `populateSampleMenu`

### 🔄 5. Tables Module (`src/store/modules/tables.js`)
**State:**
- `tables` (array of table objects)
- `tableOrder` (array of table numbers)
- `tableNum` (current table index)

**Mutations:**
- `setTables`
- `setTableOrder`
- `setTableNum`
- `setTableOccupied`
- `increaseAdult`, `decreaseAdult`
- `increaseBigKid`, `decreaseBigKid`
- `increaseSmlKid`, `decreaseSmlKid`
- `addDrink`
- `calculateTotal`
- `getTimestamp`
- `setTableSitDownTime`
- `clearEverything`
- `paid`
- `updateTableGoodPpl`
- `addTable`
- `removeTable`
- `updateTableName`

**Actions:**
- `persistTableByIndex`
- `persistCurrentTable`

### 🔄 6. Sales Module (`src/store/modules/sales.js`)
**State:**
- `sales` (object with revenue, counts)
- `ticketCount`

**Mutations:**
- `setSales`
- `incrementTicketCount`
- `setTicketCount`
- Payment processing mutations

**Actions:**
- `resetSalesData`
- `loadSalesSummary`

### 🔄 7. Togo Module (`src/store/modules/togo.js`)
**State:**
- `togoLines` (array of to-go order lines)
- `nextTogoLineId`
- `totalTogoPrice`
- `seletedTogo` (legacy format)
- `togoCustomizations`

**Mutations:**
- `appendTogoLines`
- `updateTogoLine`
- `removeTogoLine`
- `replaceTogoLines`
- `clearTogoLines`
- `togoPaid`
- `calculateTogoTotal`

### 🔄 8. Cashier Module (`src/store/modules/cashier.js`)
**State:**
- `cashierForm` (object with mode, buffetCounts, drinkCounts)

**Mutations:**
- `setCashierMode`
- `setCashierBuffetCount`
- `setCashierDrinkCount`
- `clearCashierForm`
- `processCashierPayment`

### 🔄 9. Firebase Module (`src/store/modules/firebase.js`)
**State:**
- `useFirebase`
- `firebaseInitialized`
- `firebaseUnsubscribers`
- `lastAppStateSyncedAt`

**Mutations:**
- `setFirebaseInitialized`
- `setFirebaseUnsubscribers`
- `setAppStateSyncTimestamp`

**Actions:**
- `initializeFirebase`
- `cleanupFirebase`
- `saveAppStateImmediately`
- `getAppStateSnapshot`
- `setAppState`

### 🔄 10. UI Module (`src/store/modules/ui.js`)
**State:**
- `orderPanel` (object with type and tableIndex)

**Mutations:**
- `setOrderPanel`

## Migration Steps

1. ✅ Create modules directory structure
2. ✅ Extract auth module
3. ✅ Extract settings module
4. ✅ Create shared utils
5. ⏳ Create remaining modules (menu, tables, sales, togo, cashier, firebase, ui)
6. ⏳ Create new root store that combines all modules
7. ⏳ Update all component imports to use namespaced modules
8. ⏳ Test all functionality
9. ⏳ Remove old store file

## Breaking Changes

When migrating components, update:
- `this.$store.state.authUser` → `this.$store.state.auth.authUser`
- `this.$store.state.isDinner` → `this.$store.state.settings.isDinner`
- `this.$store.state.TAX_RATE` → `this.$store.state.settings.TAX_RATE`
- `this.$store.commit('setAuthUser', ...)` → `this.$store.commit('auth/setAuthUser', ...)`
- `this.$store.commit('setDinnerMode', ...)` → `this.$store.commit('settings/setDinnerMode', ...)`
- `this.$store.getters.isAdmin` → `this.$store.getters['auth/isAdmin']`

## Notes

- All modules use `namespaced: true` for clear separation
- Some modules depend on root state (e.g., togo needs settings.TAX_RATE)
- Firebase module handles initialization and cleanup
- Legacy state sync functions maintained for backward compatibility

