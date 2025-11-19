/**
 * Pricing Service
 * Handles all pricing calculations including totals, taxes, and gratuity
 * 
 * This service centralizes pricing logic to avoid duplication and improve testability
 */
import { DRINK_CODES } from '../constants/drinks.js'

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
  const adult = Number(adultCount || 0)
  const bigKid = Number(bigKidCount || 0)
  const smlKid = Number(smlKidCount || 0)
  const drinks = Number(drinkPrice || 0)
  
  const subtotal = drinks +
    (adult * Number(pricing.adult || 0)) +
    (bigKid * Number(pricing.bigKid || 0)) +
    (smlKid * Number(pricing.smallKid || 0))
  
  return Number(subtotal.toFixed(2))
}

/**
 * Calculate total with tax
 * @param {number} subtotal - Subtotal amount
 * @param {number} taxRate - Tax rate as multiplier (e.g., 1.07 for 7% tax)
 * @returns {number} Total with tax
 */
export function calculateTotalWithTax(subtotal, taxRate) {
  const subtotalNum = Number(subtotal || 0)
  const rate = Number(taxRate || 1)
  return Number((subtotalNum * rate).toFixed(2))
}

/**
 * Calculate tax amount
 * @param {number} subtotal - Subtotal amount
 * @param {number} totalWithTax - Total with tax
 * @param {number} taxRate - Tax rate as multiplier (optional, used if totalWithTax not provided)
 * @returns {number} Tax amount
 */
export function calculateTaxAmount(subtotal, totalWithTax = null, taxRate = null) {
  const subtotalNum = Number(subtotal || 0)
  
  if (totalWithTax !== null) {
    const total = Number(totalWithTax || 0)
    return Number((total - subtotalNum).toFixed(2))
  }
  
  if (taxRate !== null) {
    const rate = Number(taxRate || 1)
    return Number((subtotalNum * (rate - 1)).toFixed(2))
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
  const base = Number(baseAmount || 0)
  const validPercentages = Array.isArray(percentages) 
    ? percentages.filter(p => typeof p === 'number' && p >= 0 && p <= 100)
    : [10, 15, 20]
  
  return validPercentages.map(percent => ({
    percent,
    amount: Number((base * percent / 100).toFixed(2))
  }))
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
    const unitPrice = Number(item.price || 0)
    const quantity = Number(item.quantity || 0)
    return sum + (unitPrice * quantity)
  }, 0)
  
  return Number(subtotal.toFixed(2))
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
  
  const total = (Number(waterPrice || 0) * numWater) + (Number(drinkPrice || 0) * numDrink)
  return Number(total.toFixed(2))
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

