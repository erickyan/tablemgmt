/**
 * Drink-related constants
 * Centralizes drink codes, labels, and configurations
 */

/**
 * Drink codes used throughout the application
 */
export const DRINK_CODES = {
  WATER: 'WTER',
  DRINK: 'DRNK'
}

/**
 * Default drink options with codes and labels
 */
export const DRINK_OPTIONS = [
  {
    code: DRINK_CODES.WATER,
    label: 'Water',
    price: 0.00
  },
  {
    code: DRINK_CODES.DRINK,
    label: 'Drink',
    price: 2.50 // Default, can be overridden
  }
]

/**
 * Get drink label by code
 * @param {string} code - Drink code
 * @returns {string} Drink label
 */
export function getDrinkLabel(code) {
  const option = DRINK_OPTIONS.find(opt => opt.code === code)
  return option ? option.label : code
}

/**
 * Check if a code is a valid drink code
 * @param {string} code - Code to check
 * @returns {boolean} True if valid
 */
export function isValidDrinkCode(code) {
  return Object.values(DRINK_CODES).includes(code)
}

