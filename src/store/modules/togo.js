/**
 * Togo Module
 * Handles to-go order management
 */

import { calculateTogoSubtotal, calculateTotalWithTax } from '../../services/pricingService.js'
import { validatePrice, validateCount } from '../../utils/validation.js'
import { findMenuItemIdFromIndices } from '../../utils/normalizeState.js'
import logger from '../../services/logger.js'
import * as firestore from '../../services/firestoreData.js'
import { incrementSalesCounters, optimisticUpdate } from '../../services/firestoreTransactions.js'

const recalcTogoTotals = (state, rootState) => {
  const items = (state.togoLines || []).map(line => ({
    price: Number(line.basePrice ?? 0) + Number(line.extraPrice ?? 0),
    quantity: Number(line.quantity ?? 0)
  }))
  
  const subtotal = calculateTogoSubtotal(items)
  const taxRate = rootState.settings?.TAX_RATE || 1.07
  state.totalTogoPrice = calculateTotalWithTax(subtotal, taxRate).toFixed(2)
}

const resetMenuQuantities = (menu = []) => {
  menu.forEach(category => {
    if (!Array.isArray(category?.items)) return
    category.items.forEach(item => {
      if (item && typeof item === 'object') {
        item.quantity = 0
      }
    })
  })
}

export default {
  namespaced: true,
  
  state: {
    togoLines: [],
    nextTogoLineId: 1,
    totalTogoPrice: 0,
  },

  getters: {
    getTogoLines: (state) => {
      return state.togoLines || []
    },
    getTogoTotal: (state) => {
      return parseFloat(state.totalTogoPrice || 0)
    },
    getNextTogoLineId: (state) => {
      return state.nextTogoLineId
    },
  },

  mutations: {
    appendTogoLines(state, { lines, menu }) {
      if (!Array.isArray(lines) || lines.length === 0) {
        logger.store.warn('appendTogoLines: lines must be an array')
        return
      }
      
      lines.forEach(line => {
        if (!line || typeof line !== 'object') {
          return
        }
        
        // Validate quantity (must be positive integer, max 999)
        const quantityValidation = validateCount(line.quantity, { max: 999, required: true })
        if (!quantityValidation.valid || quantityValidation.value <= 0) {
          logger.store.warn('Invalid quantity in togo line:', quantityValidation.error)
          return
        }
        const quantity = quantityValidation.value
        
        // Validate prices
        const basePriceValidation = validatePrice(line.basePrice ?? line.price ?? 0)
        const basePrice = basePriceValidation.valid ? basePriceValidation.value : 0
        
        const extraPriceValidation = validatePrice(line.extraPrice ?? line.extra ?? 0)
        const extraPrice = extraPriceValidation.valid ? extraPriceValidation.value : 0
        
        // Validate item name (required, max 200 chars)
        const itemName = typeof (line.itemName || line.item) === 'string'
          ? (line.itemName || line.item).trim().slice(0, 200)
          : ''
        
        if (!itemName) {
          logger.store.warn('appendTogoLines: itemName is required')
          return
        }
        
        // Validate note (max 500 chars)
        const note = typeof line.note === 'string'
          ? line.note.trim().slice(0, 500)
          : ''
        
        const categoryIndex = Number.isInteger(line.categoryIndex) ? line.categoryIndex : (Number.isInteger(line.id) ? line.id : null)
        const itemIndex = Number.isInteger(line.itemIndex) ? line.itemIndex : (Number.isInteger(line.nTerm) ? line.nTerm : null)
        
        // Try to find menuItemId from normalized menu structure
        let menuItemId = line.menuItemId || null
        if (!menuItemId && Number.isInteger(categoryIndex) && Number.isInteger(itemIndex) && menu) {
          menuItemId = findMenuItemIdFromIndices(menu, categoryIndex, itemIndex)
        }
        
        // Check for existing line - prefer menuItemId if available, otherwise match by name/price/note
        const existing = menuItemId
          ? state.togoLines.find(entry => entry.menuItemId === menuItemId && entry.note === note)
          : state.togoLines.find(entry =>
            entry.itemName === itemName &&
            entry.note === note &&
            Math.abs(entry.basePrice - basePrice) < 0.0001 &&
            Math.abs(entry.extraPrice - extraPrice) < 0.0001
          )
        
        if (existing) {
          // Update existing line quantity
          existing.quantity = Math.min(existing.quantity + quantity, 999)
        } else {
          // Add new line
          const newLine = {
            id: state.nextTogoLineId++,
            itemName,
            quantity,
            basePrice,
            extraPrice,
            note,
            menuItemId,
            categoryIndex,
            itemIndex
          }
          state.togoLines.push(newLine)
        }
      })
      
      // Recalculate total after updating lines
      // Note: We'll need to recalculate in action since we need rootState
    },
    
    updateTogoLine(state, { lineId, updates }) {
      if (!lineId || typeof lineId !== 'number') {
        logger.store.warn('updateTogoLine: lineId is required')
        return
      }
      
      const line = state.togoLines.find(l => l.id === lineId)
      if (!line) {
        logger.store.warn(`updateTogoLine: line with id ${lineId} not found`)
        return
      }
      
      if (updates.quantity !== undefined) {
        const quantityValidation = validateCount(updates.quantity, { max: 999, required: true })
        if (quantityValidation.valid && quantityValidation.value > 0) {
          line.quantity = quantityValidation.value
        }
      }
      
      if (updates.basePrice !== undefined) {
        const priceValidation = validatePrice(updates.basePrice)
        if (priceValidation.valid) {
          line.basePrice = priceValidation.value
        }
      }
      
      if (updates.extraPrice !== undefined) {
        const priceValidation = validatePrice(updates.extraPrice)
        if (priceValidation.valid) {
          line.extraPrice = priceValidation.value
        }
      }
      
      if (updates.note !== undefined) {
        line.note = typeof updates.note === 'string' ? updates.note.trim().slice(0, 500) : ''
      }
      
      // Recalculate total after updating line
    },
    
    removeTogoLine(state, lineId) {
      const index = state.togoLines.findIndex(l => l.id === lineId)
      if (index !== -1) {
        state.togoLines.splice(index, 1)
      }
      // Recalculate total after removing line
    },
    
    replaceTogoLines(state, { lines }) {
      if (!Array.isArray(lines)) {
        logger.store.warn('replaceTogoLines: lines must be an array')
        return
      }
      
      // Validate and normalize all lines
      const validLines = lines.filter(line => {
        if (!line || typeof line !== 'object') return false
        const quantityValidation = validateCount(line.quantity, { max: 999, required: true })
        return quantityValidation.valid && quantityValidation.value > 0
      }).map((line, index) => ({
        id: line.id || state.nextTogoLineId++,
        itemName: typeof (line.itemName || line.item) === 'string' ? (line.itemName || line.item).trim().slice(0, 200) : '',
        quantity: validateCount(line.quantity, { max: 999, required: true }).value,
        basePrice: validatePrice(line.basePrice ?? line.price ?? 0).value || 0,
        extraPrice: validatePrice(line.extraPrice ?? line.extra ?? 0).value || 0,
        note: typeof line.note === 'string' ? line.note.trim().slice(0, 500) : '',
        menuItemId: line.menuItemId || null,
        categoryIndex: Number.isInteger(line.categoryIndex) ? line.categoryIndex : (Number.isInteger(line.id) ? line.id : null),
        itemIndex: Number.isInteger(line.itemIndex) ? line.itemIndex : (Number.isInteger(line.nTerm) ? line.nTerm : null)
      })).filter(line => line.itemName)
      
      state.togoLines = validLines
      // Update nextTogoLineId to be higher than any existing id
      if (validLines.length > 0) {
        const maxId = Math.max(...validLines.map(l => l.id))
        state.nextTogoLineId = Math.max(state.nextTogoLineId, maxId + 1)
      }
      // Recalculate total after replacing lines
    },
    
    clearTogoLines(state, { menu }) {
      state.togoLines = []
      state.nextTogoLineId = 1
      if (menu) {
        resetMenuQuantities(menu)
      }
      state.totalTogoPrice = 0
    },
    
    togoPaid(state, { menu }) {
      // Clear togo lines and reset menu quantities after payment
      state.togoLines = []
      state.nextTogoLineId = 1
      if (menu) {
        resetMenuQuantities(menu)
      }
      state.totalTogoPrice = 0
    },
    
    setTogoLines(state, lines) {
      if (Array.isArray(lines)) {
        state.togoLines = lines
      }
    },
    
    setNextTogoLineId(state, id) {
      if (typeof id === 'number' && id > 0) {
        state.nextTogoLineId = id
      }
    },
    
    recalcTogoTotal(state, rootState) {
      recalcTogoTotals(state, rootState)
    },
    
    calculateTogoTotal(state, rootState) {
      recalcTogoTotals(state, rootState)
    },
  },

  actions: {
    appendTogoLines({ commit, rootState }, lines) {
      commit('appendTogoLines', { lines, menu: rootState.menu?.menu })
      commit('recalcTogoTotal', rootState)
    },
    
    updateTogoLine({ commit, rootState }, payload) {
      commit('updateTogoLine', payload)
      commit('recalcTogoTotal', rootState)
    },
    
    removeTogoLine({ commit, rootState }, lineId) {
      commit('removeTogoLine', lineId)
      commit('recalcTogoTotal', rootState)
    },
    
    replaceTogoLines({ commit, rootState }, lines) {
      commit('replaceTogoLines', { lines })
      commit('recalcTogoTotal', rootState)
    },
    
    clearTogoLines({ commit, rootState }) {
      commit('clearTogoLines', { menu: rootState.menu?.menu })
    },
    
    payTogo({ commit, dispatch, state, rootState }) {
      const settingsState = rootState.settings || {}
      const salesState = rootState.sales || {}
      const firebaseState = rootState.firebase || {}
      const authState = rootState.auth || {}
      
      // Recalculate total before payment (ensure price is up to date)
      commit('calculateTogoTotal', rootState)
      
      // Access togoLines from local module state, not rootState
      const togoLines = state.togoLines || []
      if (togoLines.length === 0) {
        logger.store.warn('payTogo: No to-go lines to process', { togoLinesLength: togoLines.length, stateKeys: Object.keys(state) })
        return
      }
      
      // Calculate order items and totals
      const orderItems = togoLines.map(line => ({
        name: line.itemName,
        quantity: Number(line.quantity || 0),
        price: Number(line.basePrice || 0) + Number(line.extraPrice || 0),
        note: line.note || '',
        basePrice: line.basePrice,
        extraCharge: line.extraPrice
      }))
      
      // Calculate subtotal using decimal arithmetic
      const subtotal = orderItems.reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0)
        return sum + itemTotal
      }, 0)
      
      // Get total from state (already includes tax)
      const totalWithTax = parseFloat(state.totalTogoPrice || 0)
      const togoRevenue = totalWithTax > 0 ? totalWithTax : parseFloat((subtotal * (settingsState.TAX_RATE || 1.07)).toFixed(2))
      
      // Update sales via sales module action
      if (togoRevenue > 0) {
        logger.store.debug('payTogo: Dispatching addTogoSale', { revenue: togoRevenue })
        dispatch('sales/addTogoSale', {
          revenue: togoRevenue
        }, { root: true }).then(() => {
          logger.store.debug('payTogo: addTogoSale completed successfully')
        }).catch(err => {
          logger.store.error('payTogo: Failed to dispatch addTogoSale', err)
        })
        
        // Add sales record to Firestore if enabled
        if (firebaseState.useFirebase && firebaseState.firebaseInitialized && authState.authUser) {
          optimisticUpdate(
            () => () => logger.store.warn('To-go payment rolled back due to failure'),
            async () => {
              await Promise.all([
                firestore.addTogoSalesRecord({
                  createdAt: Date.now(),
                  items: orderItems,
                  subtotal,
                  total: togoRevenue,
                  taxRate: settingsState.TAX_RATE || 1.07
                }),
                incrementSalesCounters({
                  totalTogoRevenue: togoRevenue,
                  togoOrderCount: 1
                })
              ])
              logger.firestore.info('To-go sales successfully saved (transaction)')
            },
            { retry: true, maxRetries: 3 }
          ).catch(err => {
            logger.firestore.error('[Firestore] Failed to save to-go sales:', err)
          })
        }
      }
      
      // Clear togo lines and reset menu quantities after payment
      commit('togoPaid', { menu: rootState.menu?.menu })
    },
    
    calculateTogoTotal({ commit, rootState }) {
      commit('calculateTogoTotal', rootState)
    },
  }
}

