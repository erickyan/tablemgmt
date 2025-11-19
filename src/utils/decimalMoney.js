/**
 * Decimal Money Utility
 * Provides precision-safe money calculations using Decimal.js
 * Avoids floating-point arithmetic issues in currency calculations
 */

import Decimal from 'decimal.js'

// Configure Decimal.js for money calculations
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP })

/**
 * Convert dollars to cents (integer storage)
 * @param {number|string|Decimal} dollars - Dollar amount
 * @returns {number} Cents (integer)
 */
export function dollarsToCents(dollars) {
  if (dollars == null || dollars === '') return 0
  const decimal = new Decimal(dollars || 0)
  return decimal.times(100).toNumber()
}

/**
 * Convert cents to dollars
 * @param {number} cents - Cents (integer)
 * @returns {Decimal} Dollar amount as Decimal
 */
export function centsToDollars(cents) {
  if (cents == null || cents === '') return new Decimal(0)
  return new Decimal(cents || 0).dividedBy(100)
}

/**
 * Format Decimal as currency string
 * @param {Decimal} amount - Decimal amount
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string (e.g., "12.34")
 */
export function formatMoney(amount, decimals = 2) {
  if (!amount || !(amount instanceof Decimal)) {
    return '0.00'
  }
  return amount.toFixed(decimals)
}

/**
 * Add two money amounts
 * @param {number|string|Decimal} a - First amount
 * @param {number|string|Decimal} b - Second amount
 * @returns {Decimal} Sum as Decimal
 */
export function addMoney(a, b) {
  return new Decimal(a || 0).plus(b || 0)
}

/**
 * Subtract two money amounts
 * @param {number|string|Decimal} a - First amount
 * @param {number|string|Decimal} b - Second amount
 * @returns {Decimal} Difference as Decimal
 */
export function subtractMoney(a, b) {
  return new Decimal(a || 0).minus(b || 0)
}

/**
 * Multiply money amount by a number
 * @param {number|string|Decimal} amount - Money amount
 * @param {number|string|Decimal} multiplier - Multiplier
 * @returns {Decimal} Product as Decimal
 */
export function multiplyMoney(amount, multiplier) {
  return new Decimal(amount || 0).times(multiplier || 0)
}

/**
 * Calculate percentage of a money amount
 * @param {number|string|Decimal} amount - Base amount
 * @param {number} percent - Percentage (e.g., 15 for 15%)
 * @returns {Decimal} Percentage amount as Decimal
 */
export function calculatePercent(amount, percent) {
  return new Decimal(amount || 0).times(percent || 0).dividedBy(100)
}

/**
 * Apply tax rate to subtotal
 * @param {number|string|Decimal} subtotal - Subtotal amount
 * @param {number|string|Decimal} taxRate - Tax rate as multiplier (e.g., 1.07 for 7% tax)
 * @returns {Decimal} Total with tax as Decimal
 */
export function applyTax(subtotal, taxRate) {
  return new Decimal(subtotal || 0).times(taxRate || 1)
}

/**
 * Calculate tax amount from subtotal and rate
 * @param {number|string|Decimal} subtotal - Subtotal amount
 * @param {number|string|Decimal} taxRate - Tax rate as multiplier (e.g., 1.07 for 7% tax)
 * @returns {Decimal} Tax amount as Decimal
 */
export function calculateTax(subtotal, taxRate) {
  const total = applyTax(subtotal, taxRate)
  return subtractMoney(total, subtotal)
}

/**
 * Calculate tax from total and subtotal
 * @param {number|string|Decimal} subtotal - Subtotal amount
 * @param {number|string|Decimal} total - Total with tax
 * @returns {Decimal} Tax amount as Decimal
 */
export function calculateTaxFromTotal(subtotal, total) {
  return subtractMoney(total, subtotal)
}

/**
 * Round money to specified decimal places
 * @param {number|string|Decimal} amount - Amount to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {Decimal} Rounded amount
 */
export function roundMoney(amount, decimals = 2) {
  return new Decimal(amount || 0).toDecimalPlaces(decimals)
}

/**
 * Convert Decimal to number (for display or storage)
 * @param {Decimal} decimal - Decimal instance
 * @returns {number} Number representation
 */
export function decimalToNumber(decimal) {
  if (!(decimal instanceof Decimal)) {
    return Number(decimal || 0)
  }
  return decimal.toNumber()
}

/**
 * Safe comparison of two money amounts
 * @param {number|string|Decimal} a - First amount
 * @param {number|string|Decimal} b - Second amount
 * @returns {boolean} True if amounts are equal
 */
export function moneyEquals(a, b) {
  const decA = new Decimal(a || 0)
  const decB = new Decimal(b || 0)
  return decA.equals(decB)
}

/**
 * Check if amount is greater than another
 * @param {number|string|Decimal} a - First amount
 * @param {number|string|Decimal} b - Second amount
 * @returns {boolean} True if a > b
 */
export function moneyGreaterThan(a, b) {
  const decA = new Decimal(a || 0)
  const decB = new Decimal(b || 0)
  return decA.greaterThan(decB)
}

/**
 * Check if amount is less than another
 * @param {number|string|Decimal} a - First amount
 * @param {number|string|Decimal} b - Second amount
 * @returns {boolean} True if a < b
 */
export function moneyLessThan(a, b) {
  const decA = new Decimal(a || 0)
  const decB = new Decimal(b || 0)
  return decA.lessThan(decB)
}

