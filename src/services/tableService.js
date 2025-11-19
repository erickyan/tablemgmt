/**
 * Table Service
 * Handles table-related business logic and calculations
 * 
 * This service centralizes table operations to avoid duplication and improve testability
 */

// Re-export table status functions from tableStatusService for convenience
export {
  tableHasActivity,
  isTableEmpty,
  isTablePrinted,
  hasTableTimestamp,
  shouldUseStoredPrice
} from './tableStatusService.js'

/**
 * Get table display name
 * @param {Object} table - Table object
 * @param {number} tableNumber - Table number (fallback if name not set)
 * @returns {string} Table display name
 */
export function getTableDisplayName(table, tableNumber) {
  if (table?.name && table.name.trim()) {
    return table.name.trim()
  }
  return `Table ${tableNumber}`
}

/**
 * Calculate drink count for a table
 * @param {Object} table - Table object
 * @returns {number} Number of drinks
 */
export function getTableDrinkCount(table) {
  if (!table || !Array.isArray(table.drinks)) {
    return 0
  }
  return table.drinks.length
}

/**
 * Get guest count for a table
 * @param {Object} table - Table object
 * @returns {number} Total guest count
 */
export function getTableGuestCount(table) {
  if (!table) {
    return 0
  }
  
  return Number(table.adult || 0) + 
         Number(table.bigKid || 0) + 
         Number(table.smlKid || 0)
}

/**
 * Check if table should preserve pricing mode
 * @param {Object} table - Table object
 * @returns {boolean} True if pricing mode should be preserved
 */
export function shouldPreservePricingMode(table) {
  return shouldUseStoredPrice(table) && table.pricingModeDinner === undefined
}

/**
 * Determine pricing mode for a table
 * @param {Object} params - Parameters
 * @param {Object} params.table - Table object
 * @param {boolean} params.globalIsDinner - Global dinner mode setting
 * @returns {boolean} True if dinner mode should be used
 */
export function determineTablePricingMode({ table, globalIsDinner }) {
  // If table has explicit pricing mode, use it
  if (table?.pricingModeDinner !== undefined) {
    return table.pricingModeDinner
  }
  
  // If table should use stored price, try to infer from stored price
  if (shouldUseStoredPrice(table) && table.totalPrice) {
    // This would require comparing calculated prices, which is complex
    // For now, fall back to global mode
    return globalIsDinner
  }
  
  // Default to global mode
  return globalIsDinner
}

