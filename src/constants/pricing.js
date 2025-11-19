/**
 * Pricing constants
 * Centralizes all pricing-related magic numbers and calculations
 */

/**
 * Default tax rate multiplier
 * 1.07 = 7% tax (multiplier format)
 */
export const DEFAULT_TAX_RATE = 1.07

/**
 * Default pricing values (in dollars)
 */
export const DEFAULT_PRICES = {
  // Lunch prices
  ADULT_LUNCH: 12.99,
  BIG_KID_LUNCH: 8.99,
  SMALL_KID_LUNCH: 5.99,
  
  // Dinner prices
  ADULT_DINNER: 16.99,
  BIG_KID_DINNER: 10.99,
  SMALL_KID_DINNER: 6.99,
  
  // Drink prices
  DRINK: 2.50,
  WATER: 0.00
}

/**
 * Convert tax rate from percentage to multiplier
 * @param {number} percent - Tax percentage (e.g., 7 for 7%)
 * @returns {number} Multiplier (e.g., 1.07)
 */
export function taxPercentToMultiplier(percent) {
  return 1 + (percent / 100)
}

/**
 * Convert tax rate from multiplier to percentage
 * @param {number} multiplier - Tax multiplier (e.g., 1.07)
 * @returns {number} Percentage (e.g., 7)
 */
export function taxMultiplierToPercent(multiplier) {
  return (multiplier - 1) * 100
}

/**
 * Validate tax rate
 * @param {number} rate - Tax rate (multiplier format)
 * @returns {boolean} True if valid
 */
export function isValidTaxRate(rate) {
  return typeof rate === 'number' && rate > 0 && rate <= 2 // Max 100% tax
}

