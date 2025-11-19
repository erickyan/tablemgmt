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
    const tables = store.state.tables || {}
    const table = Array.isArray(tables)
      ? tables[tableIndex - 1] // Legacy array format - convert to 0-based index
      : tables[tableIndex] || {} // New object format - direct access by table number
    
    if (!table || typeof table !== 'object') return 0
    
    const state = store.state
    const adultCount = Number(table.adult || 0)
    const bigKidCount = Number(table.bigKid || 0)
    const smlKidCount = Number(table.smlKid || 0)
    
    // If table should use stored price (occupied, printed, or has timestamp), use stored price
    if (shouldUseStoredPrice(table)) {
      return Number(table.totalPrice || 0)
    }
    
    // Calculate drink price dynamically from drinks array
    let drinkPrice = Number(table.drinkPrice || 0)
    if (!drinkPrice && table.drinks && Array.isArray(table.drinks) && table.drinks.length > 0) {
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
      drinkPrice = (state.WATERPRICE * numWater) + (state.DRINKPRICE * numDrink)
    }
    
    // For tables without explicit pricing mode, use current global mode
    const useDinnerMode = table.pricingModeDinner !== undefined 
      ? table.pricingModeDinner 
      : state.isDinner
    
    // Calculate price based on current mode
    let subtotal = drinkPrice
    if (useDinnerMode) {
      subtotal += (adultCount * state.ADULTDINNERPRICE) + 
                 (bigKidCount * state.BIGKIDDINNERPRICE) + 
                 (smlKidCount * state.SMALLKIDDINNERPRICE)
    } else {
      subtotal += (adultCount * state.ADULTPRICE) + 
                 (bigKidCount * state.BIGKIDPRICE) + 
                 (smlKidCount * state.SMALLKIDPRICE)
    }
    
    return Number((subtotal * state.TAX_RATE).toFixed(2))
  }

  /**
   * Check if table has been occupied for more than 1 hour
   * @param {number} tableIndex - Table number (not array index)
   * @param {number} currentTime - Current timestamp (for reactivity)
   * @returns {boolean}
   */
  const isOccupiedOverHour = (tableIndex, currentTime) => {
    // Handle both array (legacy) and object (new format) for tables
    const tables = store.state.tables || {}
    const table = Array.isArray(tables)
      ? tables[tableIndex - 1] // Legacy array format - convert to 0-based index
      : tables[tableIndex] || {} // New object format - direct access by table number
    
    if (!table || typeof table !== 'object' || !table.occupied || !table.sitDownTime) {
      return false
    }
    
    // Parse sitDownTime (format: "HH:MM")
    const sitDownTimeStr = table.sitDownTime
    const [sitDownHours, sitDownMinutes] = sitDownTimeStr.split(':').map(Number)
    
    if (isNaN(sitDownHours) || isNaN(sitDownMinutes)) {
      return false
    }
    
    // Get current time
    const now = new Date()
    const currentHours = now.getHours()
    const currentMinutes = now.getMinutes()
    
    // Calculate difference in minutes
    const sitDownTotalMinutes = sitDownHours * 60 + sitDownMinutes
    const currentTotalMinutes = currentHours * 60 + currentMinutes
    
    // Handle day rollover (if sitDownTime is yesterday)
    let diffMinutes = currentTotalMinutes - sitDownTotalMinutes
    if (diffMinutes < 0) {
      // If negative, assume it's from yesterday (add 24 hours)
      diffMinutes += 24 * 60
    }
    
    // Check if more than 1 hour (60 minutes)
    return diffMinutes > 60
  }

  /**
   * Get table status information
   * @param {number} tableIndex - Table number (not array index)
   * @param {Function} getTranslatedLabel - Translation function
   * @returns {Object} Status object with label, appearance, and icon
   */
  const getTableStatus = (tableIndex, getTranslatedLabel) => {
    // Handle both array (legacy) and object (new format) for tables
    const tables = store.state.tables || {}
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
    const tables = store.state.tables || {}
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

