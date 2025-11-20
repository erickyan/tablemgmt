/**
 * Shared utility functions for Vuex store modules
 */

import { DRINK_OPTIONS } from '../utils/drinkOptions.js'

/**
 * Reset all menu item quantities to 0
 */
export const resetMenuQuantities = (menu = []) => {
  menu.forEach(category => {
    if (!Array.isArray(category?.items)) return
    category.items.forEach(item => {
      if (item && typeof item === 'object') {
        item.quantity = 0
      }
    })
  })
}


/**
 * Recalculate to-go totals
 */
export const recalcTogoTotals = (state, rootState) => {
  const subtotal = (state.togoLines || []).reduce((sum, line) => {
    const unitPrice = Number(line.basePrice ?? 0) + Number(line.extraPrice ?? 0)
    return sum + unitPrice * Number(line.quantity ?? 0)
  }, 0)
  state.totalTogoPrice = (subtotal * rootState.settings.TAX_RATE).toFixed(2)
}

/**
 * Normalize table order array
 */
export const normalizeTableOrder = (order, tableCount) => {
  if (!Array.isArray(order) || order.length === 0) {
    return Array.from({ length: tableCount }, (_, i) => i + 1)
  }
  const valid = order.filter(num => Number.isInteger(num) && num > 0 && num <= tableCount)
  if (valid.length === 0) {
    return Array.from({ length: tableCount }, (_, i) => i + 1)
  }
  return valid
}

/**
 * Initialize cashier form with drink options
 */
export const createCashierForm = () => {
  const drinkCounts = {}
  DRINK_OPTIONS.forEach(opt => {
    drinkCounts[opt.code] = 0
  })
  return {
    mode: 'lunch',
    buffetCounts: {
      adult: 0,
      bigKid: 0,
      smallKid: 0,
    },
    drinkCounts,
  }
}

