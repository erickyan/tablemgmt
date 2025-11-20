/**
 * Tables Module
 * Handles table state, mutations, and actions for table operations
 */

import * as firestore from '../../services/firestoreData'
import { calculateDrinkPrice, calculateTableTotal, getPricingForMode } from '../../services/pricingService.js'
import { shouldUseStoredPrice, tableHasActivity } from '../../services/tableService.js'
import { assertNonNegativeInteger } from '../../utils/validation.js'
import { getCurrentTimestamp } from '../../utils/timeUtils.js'
import { addMoney, multiplyMoney, applyTax, roundMoney, decimalToNumber } from '../../utils/decimalMoney.js'
import { incrementSalesCounters, optimisticUpdate } from '../../services/firestoreTransactions.js'
import Decimal from 'decimal.js'
import logger from '../../services/logger.js'

// Helper function to normalize table order
function normalizeTableOrder(order, tableCount = 10) {
  const defaultOrder = Array.from({ length: tableCount }, (_, index) => index + 1)
  if (!Array.isArray(order) || order.length === 0) {
    return defaultOrder
  }
  const seen = new Set()
  const normalized = []
  order.forEach(value => {
    const num = Number(value)
    if (!Number.isInteger(num)) {
      return
    }
    if (num < 1 || num > tableCount) {
      return
    }
    if (seen.has(num)) {
      return
    }
    seen.add(num)
    normalized.push(num)
  })
  defaultOrder.forEach(num => {
    if (!seen.has(num)) {
      normalized.push(num)
    }
  })
  return normalized
}

// Helper function to get table by number (handles both object and legacy array format)
function getTableByNumber(state, number) {
  if (number == null || number <= 0) return null
  // If tables is an object (new format), access directly
  if (!Array.isArray(state.tables)) {
    return state.tables[number] || null
  }
  // Legacy array format - find by number
  return state.tables.find(t => t && t.number === number) || null
}

// Helper function to get table number from index or number (for use in actions/getters)
function getTableNumberFromPayload(state, indexOrNumber, currentTableNum = 0) {
  if (indexOrNumber == null) return currentTableNum || null
  
  // If tables is an object, the value is already a table number
  if (!Array.isArray(state.tables)) {
    return Number(indexOrNumber) || null
  }
  
  // Legacy array format - convert index to table number
  const table = state.tables[indexOrNumber]
  return table && table.number ? table.number : null
}

export default {
  namespaced: true,
  
  state: {
    // Tables stored as object keyed by table number for O(1) lookups
    // Structure: { [tableNumber]: Table }
    tables: (() => {
      const tablesObj = {}
      for (let i = 1; i <= 10; i++) {
        tablesObj[i] = {
          number: i,
          name: null,
          sitDownTime: "",
          adult: 0,
          bigKid: 0,
          smlKid: 0,
          drinks: [],
          time: 0,
          occupied: false,
          drinkPrice: 0,
          totalPrice: 0,
          goodPpl: false,
          togo: 0
        }
      }
      return tablesObj
    })(),
  },

  getters: {
    // Table getters - now work with table numbers (not indices)
    getTable: (state) => (indexOrNumber) => {
      // Handle both legacy index and new number-based access
      if (Array.isArray(state.tables)) {
        // Legacy array format
        return state.tables[indexOrNumber] || null
      }
      // New object format - access by number
      return state.tables[indexOrNumber] || null
    },
    getCurrentTable: (state, getters, rootState) => {
      const uiState = rootState.ui || {}
      const tableNumber = getTableNumberFromPayload(state, null, uiState.tableNum)
      return getTableByNumber({ tables: state.tables }, tableNumber)
    },
    isTableOccupied: (state) => (indexOrNumber) => {
      // Handle both array (legacy) and object (new format) for tables
      const tables = state.tables || {}
      const table = Array.isArray(tables)
        ? tables[indexOrNumber] // Array format - indexOrNumber is array index
        : tables[indexOrNumber] || null // Object format - indexOrNumber is table number
      return table ? !!table.occupied : false
    },
    getTableTotal: (state) => (indexOrNumber) => {
      const table = Array.isArray(state.tables)
        ? state.tables[indexOrNumber]
        : state.tables[indexOrNumber]
      return table ? parseFloat(table.totalPrice || 0) : 0
    },
  },

  mutations: {
    setTables(state, tables) {
      // Convert array to object keyed by table number
      // This eliminates alignment issues - tables are accessed by number, not index
      if (Array.isArray(tables)) {
        const tablesObj = {}
        tables.forEach(table => {
          if (table && table.number) {
            tablesObj[table.number] = { ...table }
          }
        })
        state.tables = tablesObj
      } else if (tables && typeof tables === 'object') {
        // Already in object format
        state.tables = { ...tables }
      }
    },
    
    // set ppl number - with bounds validation
    increaseAdult(state, payload) {
      const { tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      // Validate bounds (max 999 guests per table)
      try {
        assertNonNegativeInteger(table.adult, 'table.adult')
        const currentCount = table.adult
        if (currentCount < 999) {
          table.adult = currentCount + 1
          // Mark table as occupied if it has activity
          if (tableHasActivity(table) && !table.occupied) {
            table.occupied = true
          }
        } else {
          logger.store.warn('Maximum adult count reached (999)')
        }
      } catch (err) {
        logger.store.error('Invalid adult count:', err)
        table.adult = 0
      }
    },
    
    decreaseAdult(state, payload) {
      const { tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      try {
        assertNonNegativeInteger(table.adult, 'table.adult')
        const currentCount = table.adult
        if (currentCount > 0) {
          table.adult = currentCount - 1
          // Update occupied status based on activity
          if (!tableHasActivity(table)) {
            table.occupied = false
          }
        }
      } catch (err) {
        logger.store.error('Invalid adult count:', err)
        table.adult = 0
      }
    },
    
    increaseBigKid(state, payload) {
      const { tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      // Validate bounds (max 999 guests per table)
      try {
        assertNonNegativeInteger(table.bigKid, 'table.bigKid')
        const currentCount = table.bigKid
        if (currentCount < 999) {
          table.bigKid = currentCount + 1
          // Mark table as occupied if it has activity
          if (tableHasActivity(table) && !table.occupied) {
            table.occupied = true
          }
        } else {
          logger.store.warn('Maximum big kid count reached (999)')
        }
      } catch (err) {
        logger.store.error('Invalid big kid count:', err)
        table.bigKid = 0
      }
    },
    
    decreaseBidKid(state, payload) {
      const { tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      try {
        assertNonNegativeInteger(table.bigKid, 'table.bigKid')
        const currentCount = table.bigKid
        if (currentCount > 0) {
          table.bigKid = currentCount - 1
          // Update occupied status based on activity
          if (!tableHasActivity(table)) {
            table.occupied = false
          }
        }
      } catch (err) {
        logger.store.error('Invalid big kid count:', err)
        table.bigKid = 0
      }
    },
    
    increaseSmlKid(state, payload) {
      const { tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      // Validate bounds (max 999 guests per table)
      try {
        assertNonNegativeInteger(table.smlKid, 'table.smlKid')
        const currentCount = table.smlKid
        if (currentCount < 999) {
          table.smlKid = currentCount + 1
          // Mark table as occupied if it has activity
          if (tableHasActivity(table) && !table.occupied) {
            table.occupied = true
          }
        } else {
          logger.store.warn('Maximum small kid count reached (999)')
        }
      } catch (err) {
        logger.store.error('Invalid small kid count:', err)
        table.smlKid = 0
      }
    },
    
    decreaseSmlKid(state, payload) {
      const { tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      try {
        assertNonNegativeInteger(table.smlKid, 'table.smlKid')
        const currentCount = table.smlKid
        if (currentCount > 0) {
          table.smlKid = currentCount - 1
          // Update occupied status based on activity
          if (!tableHasActivity(table)) {
            table.occupied = false
          }
        }
      } catch (err) {
        logger.store.error('Invalid small kid count:', err)
        table.smlKid = 0
      }
    },
    
    addDrink(state, payload) {
      const { drink, tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (table) {
        table.drinks.push(drink)
        table.drinks.sort()
        // Mark table as occupied if it has activity
        if (tableHasActivity(table) && !table.occupied) {
          table.occupied = true
        }
      }
    },
    
    setTableOccupied(state, payload) {
      const { tableNumber, value } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      table.occupied = !!value
    },
    
    updateTableGoodPpl(state, payload) {
      const { tableNumber, value } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (table) {
        table.goodPpl = value
      }
    },
    
    calculateTotal(state, payload) {
      const { tableNumber, settings } = payload || {}
      if (!tableNumber || !settings) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      
      // If table is already occupied OR has a totalPrice set, don't recalculate price
      if (shouldUseStoredPrice(table)) {
        return
      }
      
      // change table to occupied
      table.occupied = true
      
      // Calculate drink price using service
      table.drinkPrice = calculateDrinkPrice(
        table.drinks || [],
        settings.WATERPRICE || 0.25,
        settings.DRINKPRICE || 1.99
      )
      
      // Get pricing for current mode
      const isDinner = settings.isDinner || false
      const pricing = getPricingForMode({
        isDinner,
        prices: {
          ADULTPRICE: settings.ADULTPRICE || 9.99,
          BIGKIDPRICE: settings.BIGKIDPRICE || 5.99,
          SMALLKIDPRICE: settings.SMALLKIDPRICE || 4.99,
          ADULTDINNERPRICE: settings.ADULTDINNERPRICE || 12.25,
          BIGKIDDINNERPRICE: settings.BIGKIDDINNERPRICE || 6.99,
          SMALLKIDDINNERPRICE: settings.SMALLKIDDINNERPRICE || 5.99,
          DRINKPRICE: settings.DRINKPRICE || 1.99,
          WATERPRICE: settings.WATERPRICE || 0.25
        }
      })
      
      // Calculate total using service
      table.totalPrice = calculateTableTotal({
        adultCount: table.adult,
        bigKidCount: table.bigKid,
        smlKidCount: table.smlKid,
        drinkPrice: table.drinkPrice,
        pricing,
        taxRate: settings.TAX_RATE || 1.07
      }).toFixed(2)
    },
    
    getTimestamp(state, payload) {
      const { tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      // Store timestamp in ISO 8601 format
      table.sitDownTime = getCurrentTimestamp()
    },
    
    setTableSitDownTime(state, payload) {
      const { tableNumber, value } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      table.sitDownTime = typeof value === 'string' ? value : ''
    },
    
    clearEverything(state, payload) {
      const { tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      table.sitDownTime = ""
      table.adult = 0
      table.bigKid = 0
      table.smlKid = 0
      table.drinks = []
      table.drinkPrice = 0
      table.totalPrice = 0
      table.goodPpl = false
      table.occupied = false
      delete table.pricingModeDinner
    },
    
    /**
     * Process payment for a table
     * Note: Sales update and Firestore persistence handled in action
     */
    paid(state, payload) {
      const { tableNumber, settings } = payload || {}
      if (!tableNumber || !settings) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      
      const adultCount = parseInt(table.adult) || 0
      const bigKidCount = parseInt(table.bigKid) || 0
      const smlKidCount = parseInt(table.smlKid) || 0
      const drinks = table.drinks || []
      
      // If table has a totalPrice set (greater than 0), preserve existing totalPrice
      // Don't preserve if occupied but totalPrice is 0 - that means price was never calculated
      const hasPriceSet = table.totalPrice && parseFloat(table.totalPrice) > 0
      const shouldPreservePrice = hasPriceSet || (table.time && table.time > 0)
      
      // Always recalculate total before payment to ensure accuracy
      // Calculate drink prices
      let numWater = 0
      let numDrink = 0
      if (drinks.length > 0) {
        let result = {}
        drinks.forEach((x) => {
          result[x] = result[x] || 0
          result[x]++
        })
        if (result.WTER != null) {
          numWater = result.WTER
        }
        numDrink = drinks.length - numWater
      }
      
      const WATERPRICE = settings.WATERPRICE || 0.25
      const DRINKPRICE = settings.DRINKPRICE || 1.99
      const TAX_RATE = settings.TAX_RATE || 1.07
      const isDinner = settings.isDinner || false
      
      // Calculate drink price using decimal arithmetic
      const waterTotal = multiplyMoney(WATERPRICE, numWater)
      const drinkTotal = multiplyMoney(DRINKPRICE, numDrink)
      table.drinkPrice = decimalToNumber(roundMoney(addMoney(waterTotal, drinkTotal)))
      
      let revenue = 0
      // Only recalculate total price if table is not already occupied with a price set
      if (!shouldPreservePrice) {
        // Calculate total price based on lunch/dinner using decimal arithmetic
        let subtotal = new Decimal(table.drinkPrice || 0)
        if (isDinner) {
          subtotal = addMoney(subtotal, multiplyMoney(settings.ADULTDINNERPRICE || 0, adultCount))
          subtotal = addMoney(subtotal, multiplyMoney(settings.BIGKIDDINNERPRICE || 0, bigKidCount))
          subtotal = addMoney(subtotal, multiplyMoney(settings.SMALLKIDDINNERPRICE || 0, smlKidCount))
        } else {
          subtotal = addMoney(subtotal, multiplyMoney(settings.ADULTPRICE || 0, adultCount))
          subtotal = addMoney(subtotal, multiplyMoney(settings.BIGKIDPRICE || 0, bigKidCount))
          subtotal = addMoney(subtotal, multiplyMoney(settings.SMALLKIDPRICE || 0, smlKidCount))
        }
        
        const totalWithTax = applyTax(subtotal, TAX_RATE)
        revenue = decimalToNumber(roundMoney(totalWithTax))
        table.totalPrice = revenue.toFixed(2)
        table.occupied = true
      } else {
        // Use existing totalPrice if preserving price
        revenue = parseFloat(table.totalPrice) || 0
        table.occupied = true
      }
      
      // Store revenue in payload for action to use
      payload._computedRevenue = revenue
      payload._adultCount = adultCount
      payload._bigKidCount = bigKidCount
      payload._smlKidCount = smlKidCount
      
      // resetting table (always clear table after payment attempt)
      table.sitDownTime = ""
      table.adult = 0
      table.bigKid = 0
      table.smlKid = 0
      table.drinks = []
      table.drinkPrice = 0
      table.totalPrice = 0
      table.goodPpl = false
      table.occupied = false
      delete table.pricingModeDinner
    },
    
    /**
     * Add a new table to the tables object
     */
    addTable(state, payload) {
      const { useFirebase, firebaseInitialized } = payload || {}
      
      // Get existing table numbers
      const existingNumbers = Array.isArray(state.tables)
        ? state.tables.map(t => t.number).filter(Boolean)
        : Object.keys(state.tables).map(Number).filter(Boolean)
      
      const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
      const newTableNumber = maxNumber + 1
      
      const newTable = {
        number: newTableNumber,
        name: null,
        sitDownTime: "",
        adult: 0,
        bigKid: 0,
        smlKid: 0,
        drinks: [],
        time: 0,
        occupied: false,
        drinkPrice: 0,
        totalPrice: 0,
        goodPpl: false,
        togo: 0
      }
      
      // Add to tables object
      if (!Array.isArray(state.tables)) {
        state.tables[newTableNumber] = newTable
      } else {
        // Legacy array format
        state.tables.push(newTable)
      }
      
      // Store new table info in payload for action to handle Firestore and tableOrder update
      payload._newTableNumber = newTableNumber
      payload._newTable = newTable
      payload._tableCount = Array.isArray(state.tables)
        ? state.tables.length
        : Object.keys(state.tables).length
    },
    
    /**
     * Remove a table from the tables object
     * Only allows removal if table is not occupied
     */
    removeTable(state, payload) {
      const { tableNumber } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      
      // Prevent removal of occupied tables
      if (table.occupied) {
        logger.store.warn('Cannot remove occupied table:', tableNumber)
        return
      }
      
      // Remove from tables object
      if (!Array.isArray(state.tables)) {
        delete state.tables[tableNumber]
      } else {
        // Legacy array format - find and remove
        const tableIndex = state.tables.findIndex(t => t.number === tableNumber)
        if (tableIndex >= 0) {
          state.tables.splice(tableIndex, 1)
        }
      }
      
      // Store info for action to handle Firestore and tableOrder update
      payload._tableCount = Array.isArray(state.tables) 
        ? state.tables.length 
        : Object.keys(state.tables).length
    },
    
    updateTableName(state, payload) {
      const { tableNumber, name } = payload || {}
      if (!tableNumber) return
      
      const table = getTableByNumber({ tables: state.tables }, tableNumber)
      if (!table) {
        return
      }
      
      // Validate name (max 200 chars, allow empty/null for default name)
      const validatedName = name && typeof name === 'string' 
        ? name.trim().slice(0, 200) 
        : null
      
      table.name = validatedName || null
    },
  },

  actions: {
    calculateTableTotal({ commit, rootState }) {
      const uiState = rootState.ui || {}
      const settingsState = rootState.settings || {}
      const tableNumber = getTableNumberFromPayload(rootState.tables?.tables || {}, null, uiState.tableNum)
      
      commit('calculateTotal', {
        tableNumber,
        settings: {
          WATERPRICE: settingsState.WATERPRICE,
          DRINKPRICE: settingsState.DRINKPRICE,
          TAX_RATE: settingsState.TAX_RATE,
          isDinner: settingsState.isDinner,
          ADULTPRICE: settingsState.ADULTPRICE,
          BIGKIDPRICE: settingsState.BIGKIDPRICE,
          SMALLKIDPRICE: settingsState.SMALLKIDPRICE,
          ADULTDINNERPRICE: settingsState.ADULTDINNERPRICE,
          BIGKIDDINNERPRICE: settingsState.BIGKIDDINNERPRICE,
          SMALLKIDDINNERPRICE: settingsState.SMALLKIDDINNERPRICE,
        }
      })
    },
    
    setTableOccupied({ commit, rootState }, payload) {
      const uiState = rootState.ui || {}
      const tableNumber = getTableNumberFromPayload(
        rootState.tables?.tables || {}, 
        payload.index, 
        uiState.tableNum
      )
      
      commit('setTableOccupied', {
        tableNumber,
        value: payload.value
      })
    },
    
    setTableSitDownTime({ commit, rootState }, payload) {
      const uiState = rootState.ui || {}
      const tableNumber = getTableNumberFromPayload(
        rootState.tables?.tables || {}, 
        payload.index, 
        uiState.tableNum
      )
      
      commit('setTableSitDownTime', {
        tableNumber,
        value: payload.value
      })
    },
    
    getTableTimestamp({ commit, rootState }, tableIndex) {
      const uiState = rootState.ui || {}
      const tableNumber = getTableNumberFromPayload(
        rootState.tables?.tables || {}, 
        tableIndex, 
        uiState.tableNum
      )
      
      commit('getTimestamp', { tableNumber })
    },
    
    addDrink({ commit, rootState }, code) {
      const uiState = rootState.ui || {}
      const tableNumber = getTableNumberFromPayload(
        rootState.tables?.tables || {}, 
        null, 
        uiState.tableNum
      )
      
      commit('addDrink', { drink: code, tableNumber })
    },
    
    updateTableGoodPpl({ commit, rootState }, value) {
      const uiState = rootState.ui || {}
      const tableNumber = getTableNumberFromPayload(
        rootState.tables?.tables || {}, 
        null, 
        uiState.tableNum
      )
      
      commit('updateTableGoodPpl', { tableNumber, value })
    },
    
    clearTable({ commit, rootState }) {
      const uiState = rootState.ui || {}
      const tableNumber = getTableNumberFromPayload(
        rootState.tables?.tables || {}, 
        null, 
        uiState.tableNum
      )
      
      commit('ui/setLoadingState', { key: 'clearingTable', value: true }, { root: true })
      try {
        commit('clearEverything', { tableNumber })
        // Loading state cleared after a short delay to show feedback
        setTimeout(() => {
          commit('ui/setLoadingState', { key: 'clearingTable', value: false }, { root: true })
        }, 300)
      } catch (error) {
        commit('ui/setLoadingState', { key: 'clearingTable', value: false }, { root: true })
        throw error
      }
    },
    
    payTable({ commit, dispatch, rootState }) {
      const uiState = rootState.ui || {}
      const settingsState = rootState.settings || {}
      const firebaseState = rootState.firebase || {}
      const authState = rootState.auth || {}
      const tableNumber = getTableNumberFromPayload(
        rootState.tables?.tables || {}, 
        null, 
        uiState.tableNum
      )
      
      commit('ui/setLoadingState', { key: 'payingTable', value: true }, { root: true })
      try {
        // Process the payment mutation
        const payload = {
          tableNumber,
          settings: {
            WATERPRICE: settingsState.WATERPRICE,
            DRINKPRICE: settingsState.DRINKPRICE,
            TAX_RATE: settingsState.TAX_RATE,
            isDinner: settingsState.isDinner,
            ADULTPRICE: settingsState.ADULTPRICE,
            BIGKIDPRICE: settingsState.BIGKIDPRICE,
            SMALLKIDPRICE: settingsState.SMALLKIDPRICE,
            ADULTDINNERPRICE: settingsState.ADULTDINNERPRICE,
            BIGKIDDINNERPRICE: settingsState.BIGKIDDINNERPRICE,
            SMALLKIDDINNERPRICE: settingsState.SMALLKIDDINNERPRICE,
          }
        }
        // First commit to tables module's paid mutation to update the table
        commit('paid', payload)
        
        // Then commit to root store's paid mutation for sales updates
        commit('paid', payload, { root: true })
        
        // Extract computed values from payload (mutations can't return, so we use payload)
        const revenue = payload._computedRevenue || 0
        const adultCount = payload._adultCount || 0
        const bigKidCount = payload._bigKidCount || 0
        const smlKidCount = payload._smlKidCount || 0
        
        // Update sales via sales module action
        if (revenue > 0 || adultCount > 0 || bigKidCount > 0 || smlKidCount > 0) {
          dispatch('sales/addTableSale', {
            revenue,
            adultCount,
            bigKidCount,
            smlKidCount
          }, { root: true })
          
          // Add sales record to Firestore if enabled
          if (firebaseState.useFirebase && firebaseState.firebaseInitialized && authState.authUser) {
            optimisticUpdate(
              () => () => logger.store.warn('Table payment rolled back due to failure'),
              async () => {
                await Promise.all([
                  firestore.addSalesRecord({
                    tableNumber,
                    orderType: 'dine-in',
                    revenue,
                    adultCount,
                    bigKidCount,
                    smlKidCount
                  }),
                  incrementSalesCounters({
                    revenue,
                    adultCount,
                    bigKidCount,
                    smlKidCount
                  })
                ])
                logger.firestore.info('Sales successfully saved (transaction)')
              },
              { retry: true, maxRetries: 3 }
            ).catch(err => {
              logger.firestore.error('[Firestore] Failed to save sales:', err)
            })
          }
        }
        
        // Loading state cleared after a short delay to show feedback
        setTimeout(() => {
          commit('ui/setLoadingState', { key: 'payingTable', value: false }, { root: true })
        }, 500)
      } catch (error) {
        commit('ui/setLoadingState', { key: 'payingTable', value: false }, { root: true })
        throw error
      }
    },
    
    // Guest count adjustments
    adjustGuestCount({ commit, rootState }, { type, delta }) {
      const uiState = rootState.ui || {}
      const tableNumber = getTableNumberFromPayload(
        rootState.tables?.tables || {}, 
        null, 
        uiState.tableNum
      )
      
      if (!tableNumber) return
      
      if (type === 'adult') {
        if (delta > 0) commit('increaseAdult', { tableNumber })
        else commit('decreaseAdult', { tableNumber })
      } else if (type === 'bigKid') {
        if (delta > 0) commit('increaseBigKid', { tableNumber })
        else commit('decreaseBidKid', { tableNumber })
      } else if (type === 'smlKid') {
        if (delta > 0) commit('increaseSmlKid', { tableNumber })
        else commit('decreaseSmlKid', { tableNumber })
      }
    },
    
    // Table management
    addTable({ commit, rootState }) {
      const firebaseState = rootState.firebase || {}
      
      const payload = {
        useFirebase: firebaseState.useFirebase,
        firebaseInitialized: firebaseState.firebaseInitialized
      }
      
      commit('addTable', payload)
      
      // Handle Firestore persistence and tableOrder update in action
      if (payload._newTableNumber && firebaseState.useFirebase && firebaseState.firebaseInitialized) {
        firestore.saveTable(payload._newTableNumber, payload._newTable).catch(err => {
          logger.firestore.error('Failed to save new table:', err)
        })
      }
      
      // Update tableOrder in ui module
      if (payload._tableCount) {
        const uiState = rootState.ui || {}
        const currentOrder = uiState.tableOrder || []
        const newOrder = normalizeTableOrder([...currentOrder, payload._newTableNumber], payload._tableCount)
        commit('ui/setTableOrder', newOrder, { root: true })
      }
    },
    
    removeTable({ commit, rootState }, tableNumber) {
      const firebaseState = rootState.firebase || {}
      const uiState = rootState.ui || {}
      
      const payload = {
        tableNumber,
        useFirebase: firebaseState.useFirebase,
        firebaseInitialized: firebaseState.firebaseInitialized
      }
      
      commit('removeTable', payload)
      
      // Handle Firestore deletion and tableOrder update in action
      if (payload._tableCount !== undefined) {
        // Delete from Firestore if enabled
        if (firebaseState.useFirebase && firebaseState.firebaseInitialized) {
          firestore.deleteTable(tableNumber).catch(err => {
            logger.firestore.error('Failed to delete table:', err)
          })
        }
        
        // Update tableOrder in ui module
        const currentOrder = uiState.tableOrder || []
        const newOrder = currentOrder.filter(num => num !== tableNumber)
        const normalizedOrder = normalizeTableOrder(newOrder, payload._tableCount)
        commit('ui/setTableOrder', normalizedOrder, { root: true })
      }
    },
    
    updateTableName({ commit, rootState }, payload) {
      const firebaseState = rootState.firebase || {}
      const authState = rootState.auth || {}
      
      commit('updateTableName', payload)
      
      // Persist to Firestore if enabled
      if (firebaseState.useFirebase && firebaseState.firebaseInitialized && authState.authUser) {
        const tables = rootState.tables?.tables || {}
        const table = getTableByNumber({ tables }, payload.tableNumber)
        if (table) {
          firestore.saveTable(payload.tableNumber, table).catch(err => {
            logger.firestore.error('Failed to save table:', err)
          })
        }
      }
    },
  }
}

