# Refactoring Notes

## Section 10.3 - Price Calculations
**Status**: ✅ Completed

### Changes Made
- Created `src/utils/decimalMoney.js` utility for precision-safe money calculations
- Uses `Decimal.js` library to avoid floating-point arithmetic issues
- Provides functions for:
  - Converting between dollars and cents
  - Money arithmetic (add, subtract, multiply)
  - Tax calculations
  - Percentage calculations
  - Formatting and rounding

### Next Steps
1. **Install decimal.js**: Run `npm install` to install the decimal.js dependency added to package.json
2. **Migrate existing code**: Gradually replace floating-point arithmetic in `pricingService.js` with `decimalMoney.js` functions
3. **Consider cents-based storage**: For long-term, consider storing all prices as integers (cents) in the database

### Usage Example
```javascript
import { addMoney, multiplyMoney, applyTax, formatMoney } from '../utils/decimalMoney.js'

// Instead of: (subtotal * taxRate).toFixed(2)
const total = applyTax(subtotal, taxRate)
const formatted = formatMoney(total) // "12.34"
```

---

## Section 10.4 - Print Function Complexity
**Status**: ✅ Completed

### Changes Made
- Created `src/services/printService.js` with simplified print logic
- Refactored `usePrinting.js` to use the new print service
- Improved error handling with Promise-based approach
- Removed complex fallback logic from composable

### Improvements
- Cleaner separation of concerns
- Better error handling and logging
- Promise-based API for better async handling
- Simplified interface: single `printHTML()` function

### Usage
```javascript
import { printHTML } from '../services/printService.js'

try {
  await printHTML(htmlContent)
} catch (error) {
  console.error('Print failed:', error)
}
```

---

## Section 10.5 - Table Status Logic
**Status**: ✅ Completed

### Changes Made
- Created `src/services/tableStatusService.js` with state machine pattern
- Extracted table status logic from `useTableCalculations.js`
- Defined clear status states: `EMPTY`, `OCCUPIED`, `PRINTED`
- Simplified status determination with clear priority order

### State Machine Pattern
- **States**: `EMPTY`, `OCCUPIED`, `PRINTED`
- **Priority**: `PRINTED > OCCUPIED > EMPTY`
- **Transitions**: Based on table properties (occupied, totalPrice, activity)

### Benefits
- Centralized status logic (single source of truth)
- Easier to test and maintain
- Clear state definitions
- Reduced complexity in components

### Usage
```javascript
import { 
  determineTableStatus, 
  getTableStatusMetadata,
  isTableOccupied,
  TableStatus 
} from '../services/tableStatusService.js'

const status = determineTableStatus(table)
const metadata = getTableStatusMetadata(table, translateFunction)
```

---

## Installation

After making these changes, run:

```bash
npm install
```

This will install the `decimal.js` dependency added to `package.json`.

---

## Future Refactoring Opportunities

1. **Price Calculations**: Migrate all price calculations in `pricingService.js` to use `decimalMoney.js`
2. **Time Calculations**: Implement proper date/time handling using a library like `date-fns` or `dayjs` (Section 10.2)
3. **Receipt Generation**: Complete the migration to component-based receipt templates (Section 10.1)


