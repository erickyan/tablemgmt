/**
 * Composable for memoized table price calculations
 * Provides efficient caching to avoid recalculating prices unnecessarily
 */

import { computed, ref } from 'vue'
import { DRINK_CODES } from '../constants/drinks.js'
import { shouldUseStoredPrice } from '../services/tableStatusService.js'
import { addMoney, multiplyMoney, applyTax, roundMoney, decimalToNumber } from '../utils/decimalMoney.js'
import Decimal from 'decimal.js'

/**
 * Creates a memoized map of table prices
 * Only recalculates when relevant dependencies change
 * 
 * @param {Object} store - Vuex store instance
 * @returns {Object} Object with getPrice method and clearCache method
 */
export function useMemoizedTablePrices(store) {
  // Cache for table prices - keyed by table index and relevant state
  const priceCache = ref(new Map())
  
  // Track dependencies that affect prices
  const dependencies = computed(() => ({
    isDinner: store.state.settings.isDinner,
    taxRate: store.state.settings.TAX_RATE,
    adultPrice: store.state.settings.ADULTPRICE,
    bigKidPrice: store.state.settings.BIGKIDPRICE,
    smallKidPrice: store.state.settings.SMALLKIDPRICE,
    adultDinnerPrice: store.state.settings.ADULTDINNERPRICE,
    bigKidDinnerPrice: store.state.settings.BIGKIDDINNERPRICE,
    smallKidDinnerPrice: store.state.settings.SMALLKIDDINNERPRICE,
    drinkPrice: store.state.settings.DRINKPRICE,
    waterPrice: store.state.settings.WATERPRICE
  }))
  
  // Track current dependency values for cache invalidation
  let lastDependencies = null
  
  /**
   * Generate cache key for a table
   */
  function getCacheKey(tableIndex, table, deps) {
    if (!table) return null
    
    // For tables that should use stored price, cache key includes table state
    if (shouldUseStoredPrice(table)) {
      return `table-${tableIndex}-stored-${table.totalPrice}-${table.occupied}`
    }
    
    // For dynamic prices, include all relevant data
    const tableData = [
      tableIndex,
      table.adult || 0,
      table.bigKid || 0,
      table.smlKid || 0,
      (table.drinks?.length || 0),
      table.drinkPrice || 0,
      table.pricingModeDinner !== undefined ? table.pricingModeDinner : deps.isDinner
    ].join('-')
    
    const depsKey = [
      deps.isDinner,
      deps.taxRate,
      deps.adultPrice,
      deps.bigKidPrice,
      deps.smallKidPrice,
      deps.adultDinnerPrice,
      deps.bigKidDinnerPrice,
      deps.smallKidDinnerPrice,
      deps.drinkPrice,
      deps.waterPrice
    ].join('-')
    
    return `table-${tableData}-deps-${depsKey}`
  }
  
  /**
   * Calculate price for a table (same logic as useTableCalculations)
   */
  function calculatePrice(tableIndex, table, deps) {
    if (!table) return 0
    
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
      const waterTotal = multiplyMoney(deps.waterPrice || 0, numWater)
      const drinkTotal = multiplyMoney(deps.drinkPrice || 0, numDrink)
      drinkPrice = addMoney(waterTotal, drinkTotal)
    }
    
    // For tables without explicit pricing mode, use current global mode
    const useDinnerMode = table.pricingModeDinner !== undefined 
      ? table.pricingModeDinner 
      : deps.isDinner
    
    // Calculate price based on current mode using decimal arithmetic
    let subtotal = drinkPrice
    if (useDinnerMode) {
      subtotal = addMoney(subtotal, multiplyMoney(deps.adultDinnerPrice || 0, adultCount))
      subtotal = addMoney(subtotal, multiplyMoney(deps.bigKidDinnerPrice || 0, bigKidCount))
      subtotal = addMoney(subtotal, multiplyMoney(deps.smallKidDinnerPrice || 0, smlKidCount))
    } else {
      subtotal = addMoney(subtotal, multiplyMoney(deps.adultPrice || 0, adultCount))
      subtotal = addMoney(subtotal, multiplyMoney(deps.bigKidPrice || 0, bigKidCount))
      subtotal = addMoney(subtotal, multiplyMoney(deps.smallKidPrice || 0, smlKidCount))
    }
    
    const totalWithTax = applyTax(subtotal, deps.taxRate || 1)
    return decimalToNumber(roundMoney(totalWithTax))
  }
  
  /**
   * Get price for a table with caching
   */
  function getPrice(tableIndex) {
    // tableIndex is the actual table number (not array index)
    // Access directly: tables[tableNumber]
    const tables = store.state.tables.tables || {}
    const table = Array.isArray(tables)
      ? tables[tableIndex - 1]  // Legacy array format
      : tables[tableIndex]      // New object format
    if (!table) return 0
    
    const deps = dependencies.value
    const cacheKey = getCacheKey(tableIndex, table, deps)
    
    if (!cacheKey) return 0
    
    // Check if dependencies changed - clear dynamic price caches
    const depsChanged = lastDependencies && JSON.stringify(lastDependencies) !== JSON.stringify(deps)
    if (depsChanged) {
      // Clear all dynamic price caches when dependencies change (e.g., isDinner toggle)
      const keysToDelete = Array.from(priceCache.value.keys())
        .filter(key => !key.includes('-stored-'))
      keysToDelete.forEach(key => priceCache.value.delete(key))
      lastDependencies = { ...deps }
    } else if (!lastDependencies) {
      lastDependencies = { ...deps }
    }
    
    // Check cache - if cache key includes isDinner, it will be different when isDinner changes
    if (priceCache.value.has(cacheKey)) {
      return priceCache.value.get(cacheKey)
    }
    
    // Calculate and cache
    const price = calculatePrice(tableIndex, table, deps)
    priceCache.value.set(cacheKey, price)
    
    // Limit cache size to prevent memory leaks
    if (priceCache.value.size > 200) {
      // Remove oldest entries (first 50)
      const keysToDelete = Array.from(priceCache.value.keys()).slice(0, 50)
      keysToDelete.forEach(key => priceCache.value.delete(key))
    }
    
    return price
  }
  
  /**
   * Clear the price cache
   */
  function clearCache() {
    priceCache.value.clear()
    lastDependencies = null
  }
  
  /**
   * Invalidate cache for a specific table
   */
  function invalidateTable(tableIndex) {
    const keysToDelete = Array.from(priceCache.value.keys())
      .filter(key => key.startsWith(`table-${tableIndex}-`))
    keysToDelete.forEach(key => priceCache.value.delete(key))
  }
  
  return {
    getPrice,
    clearCache,
    invalidateTable
  }
}

