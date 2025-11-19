/**
 * Composable for printing functionality
 * Provides reusable print methods using simplified print service
 * Includes high-level print functions that handle the entire receipt printing flow
 */

import { generateTableReceipt, generateTogoReceipt, generateCashierReceipt } from '../services/receiptGenerator.js'
import { printHTML } from '../services/printService.js'
import { DRINK_CODES } from '../constants/drinks.js'
import { getDrinkLabel, isWater } from '../utils/drinkOptions.js'
import { isOccupiedOrPrinted } from '../services/tableStatusService.js'

export function usePrinting() {
  /**
   * Open print document using simplified print service
   * @param {string} html - HTML content to print
   */
  const openPrintDocument = async (html) => {
    try {
      await printHTML(html)
    } catch (error) {
      console.error('Print failed:', error)
      throw error
    }
  }

  /**
   * Save app state to Firestore (if enabled)
   * @param {Object} store - Vuex store instance
   */
  const saveAppStateIfNeeded = async (store) => {
    if (store.state.useFirebase && store.state.firebaseInitialized && store.state.authUser) {
      try {
        const state = store.state
        const snapshot = {
          isDinner: state.isDinner,
          tableNum: state.tableNum,
          catID: state.catID,
          TAX_RATE: state.TAX_RATE,
          ADULTPRICE: state.ADULTPRICE,
          BIGKIDPRICE: state.BIGKIDPRICE,
          SMALLKIDPRICE: state.SMALLKIDPRICE,
          ADULTDINNERPRICE: state.ADULTDINNERPRICE,
          BIGKIDDINNERPRICE: state.BIGKIDDINNERPRICE,
          SMALLKIDDINNERPRICE: state.SMALLKIDDINNERPRICE,
          WATERPRICE: state.WATERPRICE,
          DRINKPRICE: state.DRINKPRICE,
          ticketCount: state.ticketCount,
          receiptSettings: JSON.parse(JSON.stringify(state.receiptSettings || { showTicketCount: true })),
          togoLines: JSON.parse(JSON.stringify(state.togoLines)),
          togoCustomizations: JSON.parse(JSON.stringify(state.togoCustomizations || {})),
          totalTogoPrice: state.totalTogoPrice,
          tableOrder: state.tableOrder,
        }
        snapshot.timestamp = new Date().toISOString()
        await store.dispatch('saveAppStateImmediately', snapshot)
      } catch (error) {
        console.error('[Firestore] Failed to save ticket count:', error)
      }
    }
  }

  /**
   * Determine pricing mode for a table
   * @param {Object} table - Table object
   * @param {Object} store - Vuex store state
   * @returns {boolean} Whether dinner mode should be used
   */
  const determineTablePricingMode = (table, store) => {
    if (table.pricingModeDinner !== undefined) {
      return !!table.pricingModeDinner
    }
    
    // Infer from stored price if available
    if (isOccupiedOrPrinted(table) && table.totalPrice && parseFloat(table.totalPrice) > 0) {
      const adultCount = parseInt(table.adult) || 0
      const bigKidCount = parseInt(table.bigKid) || 0
      const smlKidCount = parseInt(table.smlKid) || 0
      const drinkPrice = parseFloat(table.drinkPrice) || 0
      
      const dinnerSubtotal = drinkPrice + 
        (adultCount * store.ADULTDINNERPRICE) + 
        (bigKidCount * store.BIGKIDDINNERPRICE) + 
        (smlKidCount * store.SMALLKIDDINNERPRICE)
      const dinnerTotal = parseFloat((dinnerSubtotal * store.TAX_RATE).toFixed(2))
      
      const lunchSubtotal = drinkPrice + 
        (adultCount * store.ADULTPRICE) + 
        (bigKidCount * store.BIGKIDPRICE) + 
        (smlKidCount * store.SMALLKIDPRICE)
      const lunchTotal = parseFloat((lunchSubtotal * store.TAX_RATE).toFixed(2))
      
      const storedPrice = parseFloat(table.totalPrice)
      const dinnerDiff = Math.abs(dinnerTotal - storedPrice)
      const lunchDiff = Math.abs(lunchTotal - storedPrice)
      
      return dinnerDiff < lunchDiff
    }
    
    return store.isDinner
  }

  /**
   * Print table receipt (high-level function)
   * Handles the entire flow: calculation, ticket increment, state save, receipt generation, and printing
   * @param {Object} params - Print parameters
   * @param {Object} params.store - Vuex store instance
   * @param {number} params.tableIndex - Table index (0-based)
   * @param {Object} params.table - Table object (optional, will be fetched from store if not provided)
   * @param {Function} params.getDrinkLabelEnglish - Function to get English drink label (optional)
   * @returns {Promise<void>}
   */
  const printTableReceipt = async ({ store, tableIndex, table = null, getDrinkLabelEnglish = null }) => {
    // Ensure total is calculated
    await store.dispatch('calculateTableTotal')
    
    // tableIndex is the actual table number (not array index)
    // Access table by number: tables[tableNumber]
    let tableData = table
    if (!tableData) {
      const tables = store.state.tables || {}
      if (Array.isArray(tables)) {
        // Legacy array format - convert tableIndex (number) to array index
        tableData = tables[tableIndex - 1] || {}
      } else {
        // New object format - direct access by number
        tableData = tables[tableIndex] || {}
      }
    }
    const state = store.state
    
    // Determine pricing mode
    const isDinner = determineTablePricingMode(tableData, state)
    
    // Ensure pricingModeDinner is stored when printing
    if (tableData && isOccupiedOrPrinted(tableData) && tableData.pricingModeDinner === undefined) {
      tableData.pricingModeDinner = isDinner
      await store.dispatch('setTableOccupied', { index: tableIndex, value: tableData.occupied })
    }
    
    // Increment ticket counter
    await store.dispatch('incrementTicketCount')
    const ticketCount = store.state.ticketCount
    
    // Save app state if needed
    await saveAppStateIfNeeded(store)
    
    // Generate receipt
    const receiptHtml = generateTableReceipt({
      table: tableData,
      tableIndex,
      store: state,
      isDinner,
      ticketCount
    })
    
    // Print
    openPrintDocument(receiptHtml)
    
    // Update table state (mark as not occupied after printing)
    await store.dispatch('setTableOccupied', { index: tableIndex, value: false })
  }

  /**
   * Print to-go receipt (high-level function)
   * @param {Object} params - Print parameters
   * @param {Object} params.store - Vuex store instance
   * @param {Array} params.items - Array of items with { name, quantity, price, note }
   * @returns {Promise<void>}
   */
  const printTogoReceipt = async ({ store, items }) => {
    // Calculate total
    await store.dispatch('calculateTogoTotal')
    
    const state = store.state
    
    if (!items || items.length === 0) {
      console.warn('No items selected for to-go receipt')
      return
    }
    
    const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
    const total = parseFloat(state.totalTogoPrice || (subtotal * state.TAX_RATE).toFixed(2))
    
    // Increment ticket counter
    await store.dispatch('incrementTicketCount')
    const ticketCount = store.state.ticketCount
    
    // Save app state if needed
    await saveAppStateIfNeeded(store)
    
    // Generate receipt
    const receiptHtml = generateTogoReceipt({
      items,
      subtotal,
      total,
      store: state,
      ticketCount
    })
    
    // Print
    openPrintDocument(receiptHtml)
  }

  /**
   * Print cashier receipt (high-level function)
   * @param {Object} params - Print parameters
   * @param {Object} params.store - Vuex store instance
   * @param {Object} params.buffetCounts - Buffet counts { adult, bigKid, smallKid }
   * @param {Object} params.drinkCounts - Drink counts by code
   * @param {boolean} params.isDinner - Whether dinner mode is active
   * @param {Function} params.getDrinkLabelFn - Function to get drink label (optional, defaults to imported getDrinkLabel)
   * @param {Function} params.isWaterFn - Function to check if drink is water (optional, defaults to imported isWater)
   * @returns {Promise<void>}
   */
  const printCashierReceipt = async ({ store, buffetCounts = {}, drinkCounts = {}, isDinner = false, getDrinkLabelFn = null, isWaterFn = null }) => {
    const state = store.state
    
    // Get pricing
    const pricing = {
      adult: isDinner ? state.ADULTDINNERPRICE : state.ADULTPRICE,
      bigKid: isDinner ? state.BIGKIDDINNERPRICE : state.BIGKIDPRICE,
      smlKid: isDinner ? state.SMALLKIDDINNERPRICE : state.SMALLKIDPRICE,
      drink: state.DRINKPRICE,
      water: state.WATERPRICE,
      taxRate: state.TAX_RATE
    }
    
    // Build receipt lines
    const lines = []
    const totals = []
    const addLine = (label, qty, unitPrice) => {
      if (!qty) return
      const total = qty * unitPrice
      lines.push({ label, qty, unitPrice, total })
      totals.push(total)
    }
    
    addLine('Adult Buffet', Number(buffetCounts.adult || 0), pricing.adult)
    addLine('Big Kid Buffet', Number(buffetCounts.bigKid || 0), pricing.bigKid)
    addLine('Small Kid Buffet', Number(buffetCounts.smallKid || 0), pricing.smlKid)
    
    // Add drink lines
    const getLabelFn = getDrinkLabelFn || getDrinkLabel
    const checkWaterFn = isWaterFn || isWater
    
    Object.entries(drinkCounts).forEach(([code, qty]) => {
      const qtyNum = Number(qty || 0)
      if (!qtyNum) return
      const label = getLabelFn(code)
      const unitPrice = checkWaterFn(code) ? pricing.water : pricing.drink
      addLine(label, qtyNum, unitPrice)
    })
    
    if (lines.length === 0) {
      console.warn('No items to print for cashier receipt')
      return
    }
    
    const subtotal = totals.reduce((sum, value) => sum + value, 0)
    const totalWithTax = subtotal * pricing.taxRate
    const taxAmount = totalWithTax - subtotal
    
    // Increment ticket counter
    await store.dispatch('incrementTicketCount')
    const ticketCount = store.state.ticketCount
    
    // Save app state if needed
    await saveAppStateIfNeeded(store)
    
    // Generate receipt
    const receiptHtml = generateCashierReceipt({
      lines,
      subtotal,
      totalWithTax,
      store: state,
      isDinner,
      ticketCount
    })
    
    // Print
    openPrintDocument(receiptHtml)
    
    // Process payment
    await store.dispatch('processCashierPayment')
  }

  return {
    openPrintDocument,
    printTableReceipt,
    printTogoReceipt,
    printCashierReceipt
  }
}

