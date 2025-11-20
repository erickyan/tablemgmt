/**
 * Pricing Service
 * Handles all pricing calculations including totals, taxes, and gratuity
 * 
 * This service centralizes pricing logic to avoid duplication and improve testability
 * Uses decimalMoney.js for precision-safe money calculations
 */
import { DRINK_CODES } from '../constants/drinks.js'
import Decimal from 'decimal.js'
import {
  addMoney,
  multiplyMoney,
  applyTax,
  calculateTax,
  calculateTaxFromTotal,
  calculatePercent,
  roundMoney,
  decimalToNumber
} from '../utils/decimalMoney.js'

/**
 * Calculate subtotal for a table order
 * @param {Object} params - Calculation parameters
 * @param {number} params.adultCount - Number of adults
 * @param {number} params.bigKidCount - Number of big kids (6-9)
 * @param {number} params.smlKidCount - Number of small kids (2-5)
 * @param {number} params.drinkPrice - Total drink price
 * @param {Object} params.pricing - Pricing object with adult, bigKid, smallKid prices
 * @returns {number} Subtotal amount
 */
export function calculateTableSubtotal({ adultCount, bigKidCount, smlKidCount, drinkPrice, pricing }) {
  const adult = adultCount || 0
  const bigKid = bigKidCount || 0
  const smlKid = smlKidCount || 0
  const drinks = drinkPrice || 0
  
  // Calculate using decimal arithmetic
  let subtotal = new Decimal(drinks)
  subtotal = addMoney(subtotal, multiplyMoney(pricing.adult || 0, adult))
  subtotal = addMoney(subtotal, multiplyMoney(pricing.bigKid || 0, bigKid))
  subtotal = addMoney(subtotal, multiplyMoney(pricing.smallKid || 0, smlKid))
  
  return decimalToNumber(roundMoney(subtotal))
}

/**
 * Calculate total with tax
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate as multiplier (e.g., 1.07 for 7% tax)
 * @returns {number} Total with tax
 */
export function calculateTotalWithTax(subtotal, taxRate) {
  const total = applyTax(subtotal || 0, taxRate || 1)
  return decimalToNumber(roundMoney(total))
}

/**
 * Calculate tax amount
 * @param {number} subtotal - Subtotal amount
 * @param {number} totalWithTax - Total with tax
 * @param {number} taxRate - Tax rate as multiplier (optional, used if totalWithTax not provided)
 * @returns {number} Tax amount
 */
export function calculateTaxAmount(subtotal, totalWithTax = null, taxRate = null) {
  // Only use totalWithTax if it's valid and greater than subtotal
  if (totalWithTax !== null && totalWithTax > 0 && totalWithTax >= subtotal) {
    const tax = calculateTaxFromTotal(subtotal || 0, totalWithTax || 0)
    return decimalToNumber(roundMoney(tax))
  }
  
  // Fall back to tax rate calculation if totalWithTax is invalid
  if (taxRate !== null) {
    const tax = calculateTax(subtotal || 0, taxRate || 1)
    return decimalToNumber(roundMoney(tax))
  }
  
  return 0
}

/**
 * Calculate gratuity amounts for given percentages
 * @param {Object} params - Gratuity calculation parameters
 * @param {number} params.baseAmount - Base amount to calculate gratuity on
 * @param {Array<number>} params.percentages - Array of gratuity percentages (e.g., [10, 15, 20])
 * @returns {Array<Object>} Array of gratuity options with percent and amount
 */
export function calculateGratuityOptions({ baseAmount, percentages = [10, 15, 20] }) {
  const base = baseAmount || 0
  const validPercentages = Array.isArray(percentages) 
    ? percentages.filter(p => typeof p === 'number' && p >= 0 && p <= 100)
    : [10, 15, 20]
  
  return validPercentages.map(percent => {
    const amount = calculatePercent(base, percent)
    return {
      percent,
      amount: decimalToNumber(roundMoney(amount))
    }
  })
}

/**
 * Calculate to-go order subtotal
 * @param {Array} items - Array of order items with price and quantity
 * @returns {number} Subtotal amount
 */
export function calculateTogoSubtotal(items) {
  if (!Array.isArray(items)) {
    return 0
  }
  
  const subtotal = items.reduce((sum, item) => {
    const unitPrice = item.price || 0
    const quantity = item.quantity || 0
    const itemTotal = multiplyMoney(unitPrice, quantity)
    return addMoney(sum, itemTotal)
  }, new Decimal(0))
  
  return decimalToNumber(roundMoney(subtotal))
}

/**
 * Calculate drink price from drink codes
 * @param {Array<string>} drinks - Array of drink codes
 * @param {number} waterPrice - Price per water
 * @param {number} drinkPrice - Price per drink
 * @returns {number} Total drink price
 */
export function calculateDrinkPrice(drinks, waterPrice, drinkPrice) {
  if (!Array.isArray(drinks)) {
    return 0
  }
  
  let numWater = 0
  let numDrink = 0
  
  drinks.forEach(code => {
    if (code === DRINK_CODES.WATER) {
      numWater++
    } else {
      numDrink++
    }
  })
  
  const waterTotal = multiplyMoney(waterPrice || 0, numWater)
  const drinkTotal = multiplyMoney(drinkPrice || 0, numDrink)
  const total = addMoney(waterTotal, drinkTotal)
  
  return decimalToNumber(roundMoney(total))
}

/**
 * Get pricing object based on mode (lunch/dinner)
 * @param {Object} params - Pricing parameters
 * @param {boolean} params.isDinner - Whether dinner mode is active
 * @param {Object} params.prices - Price configuration object
 * @returns {Object} Pricing object with adult, bigKid, smallKid, drink, water prices
 */
export function getPricingForMode({ isDinner, prices }) {
  return {
    adult: isDinner ? prices.ADULTDINNERPRICE : prices.ADULTPRICE,
    bigKid: isDinner ? prices.BIGKIDDINNERPRICE : prices.BIGKIDPRICE,
    smallKid: isDinner ? prices.SMALLKIDDINNERPRICE : prices.SMALLKIDPRICE,
    drink: prices.DRINKPRICE,
    water: prices.WATERPRICE
  }
}

/**
 * Calculate complete table total (subtotal + tax)
 * @param {Object} params - Calculation parameters
 * @param {number} params.adultCount - Number of adults
 * @param {number} params.bigKidCount - Number of big kids
 * @param {number} params.smlKidCount - Number of small kids
 * @param {number} params.drinkPrice - Total drink price
 * @param {Object} params.pricing - Pricing object
 * @param {number} params.taxRate - Tax rate as multiplier
 * @returns {number} Total with tax
 */
export function calculateTableTotal({ adultCount, bigKidCount, smlKidCount, drinkPrice, pricing, taxRate }) {
  const subtotal = calculateTableSubtotal({
    adultCount,
    bigKidCount,
    smlKidCount,
    drinkPrice,
    pricing
  })
  
  return calculateTotalWithTax(subtotal, taxRate)
}

