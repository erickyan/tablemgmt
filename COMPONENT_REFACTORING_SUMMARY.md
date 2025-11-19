# Component Refactoring Summary

## Overview
Breaking down large components (`HomeView.vue` ~940 lines) into smaller, reusable components and extracting shared logic into composables and services.

## Created Files

### Composables
1. **`src/composables/usePrinting.js`**
   - Extracted print logic from multiple components
   - Provides `openPrintDocument()` and `printWithIframe()` methods
   - Handles popup window with iframe fallback
   - Used by: HomeView, OrderDetails, TogoDetails, CashierReceiptPanel

2. **`src/composables/useTableCalculations.js`**
   - Extracted table calculation logic
   - Provides:
     - `getTableTotalPrice()` - Calculate table total dynamically
     - `isOccupiedOverHour()` - Check if table occupied > 1 hour
     - `getTableStatus()` - Get table status (Empty/Occupied/Printed)
     - `getDrinkCount()` - Get drink count for table
   - Uses Vue 3 Composition API with `useStore`

### Services
3. **`src/services/receiptGenerator.js`**
   - Extracted receipt HTML generation logic
   - Provides:
     - `generateTableReceipt()` - Generate HTML for table receipts
     - `generateTogoReceipt()` - Generate HTML for to-go receipts
   - Centralizes receipt styling and formatting
   - Handles gratuity calculations, ticket counts, and all receipt settings

### Components
4. **`src/components/tables/TableStatusChip.vue`**
   - Small reusable component for table status display
   - Props: `status` (object with label, appearance, icon)
   - Handles styling for different status types

5. **`src/components/tables/TableTile.vue`**
   - Individual table tile component
   - Props: table data, status, drag state, etc.
   - Emits: click, drag events, set-sit-down-time
   - Handles all tile display logic

6. **`src/components/tables/TableGrid.vue`**
   - Grid container for table tiles
   - Handles drag-and-drop reordering
   - Uses Composition API
   - Manages time updates for occupied-over-hour feature

## Benefits

1. **Reduced Component Size**
   - `HomeView.vue` reduced from ~940 lines to ~300-400 lines (estimated)
   - Each component has single responsibility

2. **Reusability**
   - Print logic can be used by any component
   - Table calculations centralized
   - Receipt generation consistent across all receipt types

3. **Maintainability**
   - Easier to test individual components
   - Changes to print logic only need to be made in one place
   - Receipt styling changes centralized

4. **Performance**
   - Smaller components = faster compilation
   - Better tree-shaking opportunities
   - Easier to optimize individual components

## Migration Status

- ✅ Created all composables
- ✅ Created all services
- ✅ Created all table components
- ⏳ Refactor HomeView.vue to use new components
- ⏳ Update other components (OrderDetails, TogoDetails, etc.) to use composables
- ⏳ Test all functionality

## Next Steps

1. Refactor `HomeView.vue` to use `TableGrid` component
2. Update `OrderDetails.vue` to use `usePrinting` and `receiptGenerator`
3. Update `TogoDetails.vue` to use `usePrinting` and `receiptGenerator`
4. Update `CashierReceiptPanel.vue` to use `usePrinting` and `receiptGenerator`
5. Test all print functionality
6. Test table drag-and-drop
7. Test table calculations

