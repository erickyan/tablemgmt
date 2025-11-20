/**
 * Composable for table calculation logic
 * Provides reusable methods for calculating table prices, status, and occupancy
 * 
 * Note: This composable can be used with both Options API (via getCurrentInstance)
 * and Composition API (via useStore)
 */
import { DRINK_CODES } from '../constants/drinks.js'
import { 
  getTableStatusMetadata, 
  shouldUseStoredPrice 
} from '../services/tableStatusService.js'
import { isOlderThan, normalizeTimestamp } from '../utils/timeUtils.js'
import { addMoney, multiplyMoney, applyTax, roundMoney, decimalToNumber } from '../utils/decimalMoney.js'
import Decimal from 'decimal.js'

export function useTableCalculations(store) {
  // If store is not provided, try to get it from current instance (Options API)
  if (!store) {
    const { getCurrentInstance } = require('vue')
    const instance = getCurrentInstance()
    if (instance) {
      store = instance.appContext.config.globalProperties.$store
    }
  }
  
  if (!store) {
    throw new Error('Store is required for useTableCalculations')
  }

  /**
   * Get table total price dynamically based on current price mode
   * @param {number} tableIndex - Table number (not array index)
   * @returns {number} Total price
   */
  const getTableTotalPrice = (tableIndex) => {
    // Handle both array (legacy) and object (new format) for tables
    const tables = store.state.tables.tables || {}
    const table = Array.isArray(tables)
      ? tables[tableIndex - 1] // Legacy array format - convert to 0-based index
      : tables[tableIndex] || {} // New object format - direct access by table number
    
    if (!table || typeof table !== 'object') return 0
    
    const settings = store.state.settings
    const adultCount = Number(table.adult || 0)
    const bigKidCount = Number(table.bigKid || 0)
    const smlKidCount = Number(table.smlKid || 0)
    
    // If table should use stored price (occupied, printed, or has timestamp), use stored price
    if (shouldUseStoredPrice(table)) {
      return Number(table.totalPrice || 0)
    }
    
    // Calculate drink price dynamically from drinks array using decimal arithmetic
    let drinkPrice = new Decimal(table.drinkPrice || 0)
    if (drinkPrice.isZero() && table.drinks && Array.isArray(table.drinks) && table.drinks.length > 0) {
      const drinks = table.drinks
      let numWater = 0
      let numDrink = 0
      drinks.forEach(code => {
        if (code === DRINK_CODES.WATER) {
          numWater++
        } else {
          numDrink++
        }
      })
      const waterTotal = multiplyMoney(settings.WATERPRICE || 0, numWater)
      const drinkTotal = multiplyMoney(settings.DRINKPRICE || 0, numDrink)
      drinkPrice = addMoney(waterTotal, drinkTotal)
    }
    
    // For tables without explicit pricing mode, use current global mode
    const useDinnerMode = table.pricingModeDinner !== undefined 
      ? table.pricingModeDinner 
      : settings.isDinner
    
    // Calculate price based on current mode using decimal arithmetic
    let subtotal = drinkPrice
    if (useDinnerMode) {
      subtotal = addMoney(subtotal, multiplyMoney(settings.ADULTDINNERPRICE || 0, adultCount))
      subtotal = addMoney(subtotal, multiplyMoney(settings.BIGKIDDINNERPRICE || 0, bigKidCount))
      subtotal = addMoney(subtotal, multiplyMoney(settings.SMALLKIDDINNERPRICE || 0, smlKidCount))
    } else {
      subtotal = addMoney(subtotal, multiplyMoney(settings.ADULTPRICE || 0, adultCount))
      subtotal = addMoney(subtotal, multiplyMoney(settings.BIGKIDPRICE || 0, bigKidCount))
      subtotal = addMoney(subtotal, multiplyMoney(settings.SMALLKIDPRICE || 0, smlKidCount))
    }
    
    const totalWithTax = applyTax(subtotal, settings.TAX_RATE || 1)
    return decimalToNumber(roundMoney(totalWithTax))
  }

  /**
   * Check if table has been occupied for more than 1 hour
   * @param {number} tableIndex - Table number (not array index)
   * @param {number} currentTime - Current timestamp (for reactivity)
   * @returns {boolean}
   */
  const isOccupiedOverHour = (tableIndex, currentTime) => {
    // Handle both array (legacy) and object (new format) for tables
    const tables = store.state.tables.tables || {}
    const table = Array.isArray(tables)
      ? tables[tableIndex - 1] // Legacy array format - convert to 0-based index
      : tables[tableIndex] || {} // New object format - direct access by table number
    
    if (!table || typeof table !== 'object' || !table.occupied || !table.sitDownTime) {
      return false
    }
    
    // Normalize timestamp (handles both ISO 8601 and legacy "HH:MM" format)
    const normalizedTimestamp = normalizeTimestamp(table.sitDownTime)
    if (!normalizedTimestamp) {
      return false
    }
    
    // Check if timestamp is more than 60 minutes old
    return isOlderThan(normalizedTimestamp, 60)
  }

  /**
   * Get table status information
   * @param {number} tableIndex - Table number (not array index)
   * @param {Function} getTranslatedLabel - Translation function
   * @returns {Object} Status object with label, appearance, and icon
   */
  const getTableStatus = (tableIndex, getTranslatedLabel) => {
    // Handle both array (legacy) and object (new format) for tables
    const tables = store.state.tables.tables || {}
    const table = Array.isArray(tables)
      ? tables[tableIndex - 1] || {} // Legacy array format - convert to 0-based index
      : tables[tableIndex] || {} // New object format - direct access by table number
    
    // Use table status service for consistent status determination
    return getTableStatusMetadata(table, getTranslatedLabel)
  }

  /**
   * Get drink count for a table
   * @param {number} tableIndex - Table number (not array index)
   * @returns {number} Drink count
   */
  const getDrinkCount = (tableIndex) => {
    // Handle both array (legacy) and object (new format) for tables
    const tables = store.state.tables.tables || {}
    const table = Array.isArray(tables)
      ? tables[tableIndex - 1] // Legacy array format - convert to 0-based index
      : tables[tableIndex] || {} // New object format - direct access by table number
    
    if (!table || !Array.isArray(table.drinks)) {
      return 0
    }
    return table.drinks.length
  }

  return {
    getTableTotalPrice,
    isOccupiedOverHour,
    getTableStatus,
    getDrinkCount
  }
}

