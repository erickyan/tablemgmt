/**
 * Composable for printing functionality
 * Provides reusable print methods using simplified print service
 * Includes high-level print functions that handle the entire receipt printing flow
 */

import { generateTableReceipt, generateTogoReceipt, generateCashierReceipt } from '../services/receiptGenerator.js'
import { printHTML } from '../services/printService.js'
import { DRINK_CODES } from '../constants/drinks.js'
import { getDrinkLabel, isWater } from '../utils/drinkOptions.js'
import { isOccupiedOrPrinted, isTablePrinted } from '../services/tableStatusService.js'
import logger from '../services/logger.js'

export function usePrinting() {
  /**
   * Open print document using simplified print service
   * @param {string} html - HTML content to print
   */
  const openPrintDocument = async (html) => {
    try {
      await printHTML(html)
    } catch (error) {
      logger.error('Print failed:', error)
      throw error
    }
  }

  /**
   * Save app state to Firestore (if enabled)
   * @param {Object} store - Vuex store instance
   */
  const saveAppStateIfNeeded = async (store) => {
    if (store.state.firebase.useFirebase && store.state.firebase.firebaseInitialized && store.state.auth.authUser) {
      try {
        const state = store.state
        const snapshot = {
          isDinner: state.settings.isDinner,
          tableNum: state.ui.tableNum,
          catID: state.ui.catID,
          TAX_RATE: state.settings.TAX_RATE,
          ADULTPRICE: state.settings.ADULTPRICE,
          BIGKIDPRICE: state.settings.BIGKIDPRICE,
          SMALLKIDPRICE: state.settings.SMALLKIDPRICE,
          ADULTDINNERPRICE: state.settings.ADULTDINNERPRICE,
          BIGKIDDINNERPRICE: state.settings.BIGKIDDINNERPRICE,
          SMALLKIDDINNERPRICE: state.settings.SMALLKIDDINNERPRICE,
          WATERPRICE: state.settings.WATERPRICE,
          DRINKPRICE: state.settings.DRINKPRICE,
          ticketCount: state.sales.ticketCount,
          receiptSettings: JSON.parse(JSON.stringify(state.settings.receiptSettings || { showTicketCount: true })),
          togoLines: JSON.parse(JSON.stringify(state.togo.togoLines)),
          totalTogoPrice: state.togo.totalTogoPrice,
          tableOrder: state.ui.tableOrder,
        }
        snapshot.timestamp = new Date().toISOString()
        await store.dispatch('firebase/saveAppStateImmediately', snapshot)
      } catch (error) {
        logger.firestore.error('Failed to save ticket count:', error)
      }
    }
  }

  /**
   * Determine pricing mode for a table
   * @param {Object} table - Table object
   * @param {Object} settings - Settings state object
   * @returns {boolean} Whether dinner mode should be used
   */
  const determineTablePricingMode = (table, settings) => {
    // Only printed tables preserve their pricing mode
    // All other tables (empty or occupied) should follow current nav bar mode
    if (!isTablePrinted(table)) {
      return !!settings.isDinner
    }
    
    // For printed tables, use stored pricing mode if available
    if (table.pricingModeDinner !== undefined) {
      return !!table.pricingModeDinner
    }
    
    // For printed tables without stored mode, infer from stored price
    // This handles tables that were printed before pricingModeDinner was added
    if (table.totalPrice && parseFloat(table.totalPrice) > 0) {
      const adultCount = parseInt(table.adult) || 0
      const bigKidCount = parseInt(table.bigKid) || 0
      const smlKidCount = parseInt(table.smlKid) || 0
      const drinkPrice = parseFloat(table.drinkPrice) || 0
      
      const dinnerSubtotal = drinkPrice + 
        (adultCount * settings.ADULTDINNERPRICE) + 
        (bigKidCount * settings.BIGKIDDINNERPRICE) + 
        (smlKidCount * settings.SMALLKIDDINNERPRICE)
      const dinnerTotal = parseFloat((dinnerSubtotal * settings.TAX_RATE).toFixed(2))
      
      const lunchSubtotal = drinkPrice + 
        (adultCount * settings.ADULTPRICE) + 
        (bigKidCount * settings.BIGKIDPRICE) + 
        (smlKidCount * settings.SMALLKIDPRICE)
      const lunchTotal = parseFloat((lunchSubtotal * settings.TAX_RATE).toFixed(2))
      
      const storedPrice = parseFloat(table.totalPrice)
      const dinnerDiff = Math.abs(dinnerTotal - storedPrice)
      const lunchDiff = Math.abs(lunchTotal - storedPrice)
      
      return dinnerDiff < lunchDiff
    }
    
    // Fallback to current mode for printed tables
    return !!settings.isDinner
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
    await store.dispatch('tables/calculateTableTotal')
    
    // tableIndex is the actual table number (not array index)
    // Access table by number: tables[tableNumber]
    let tableData = table
    if (!tableData) {
      const tables = store.state.tables.tables || {}
      if (Array.isArray(tables)) {
        // Legacy array format - convert tableIndex (number) to array index
        tableData = tables[tableIndex - 1] || {}
      } else {
        // New object format - direct access by number
        tableData = tables[tableIndex] || {}
      }
    }
    const settings = store.state.settings
    
    // Determine pricing mode
    const isDinner = determineTablePricingMode(tableData, settings)
    
    // Store pricingModeDinner when printing (this preserves the mode for printed receipts)
    // Note: Only printed tables preserve pricing mode - occupied tables follow current nav bar mode
    if (tableData && tableData.pricingModeDinner === undefined) {
      tableData.pricingModeDinner = isDinner
      // Don't need to call setTableOccupied here - it's just storing the pricing mode
    }
    
    // Increment ticket counter
    await store.dispatch('sales/incrementTicketCount')
    const ticketCount = store.state.sales.ticketCount
    
    // Save app state if needed
    await saveAppStateIfNeeded(store)
    
    // Generate receipt
    const receiptHtml = generateTableReceipt({
      table: tableData,
      tableIndex,
      store: settings,
      isDinner,
      ticketCount
    })
    
    // Print
    openPrintDocument(receiptHtml)
    
    // Update table state (mark as not occupied after printing)
    await store.dispatch('tables/setTableOccupied', { index: tableIndex, value: false })
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
    await store.dispatch('togo/calculateTogoTotal')
    
    const settings = store.state.settings
    const togo = store.state.togo
    
    if (!items || items.length === 0) {
      logger.warn('No items selected for to-go receipt')
      return
    }
    
    // item.price is unit price (basePrice + extraPrice), need to multiply by quantity
    const subtotalNum = items.reduce((sum, item) => {
      const unitPrice = Number(item.price || 0)
      const quantity = Number(item.quantity || 0)
      return sum + (unitPrice * quantity)
    }, 0)
    
    // totalTogoPrice already includes tax, so use it if available and valid
    const totalFromStore = parseFloat(togo.totalTogoPrice || 0)
    // If totalFromStore is valid (> 0), use it; otherwise calculate from subtotal * tax rate
    const total = totalFromStore > 0 ? totalFromStore : parseFloat((subtotalNum * (settings.TAX_RATE || 1.07)).toFixed(2))
    const subtotal = subtotalNum
    
    // Increment ticket counter
    await store.dispatch('sales/incrementTicketCount')
    const ticketCount = store.state.sales.ticketCount
    
    // Save app state if needed
    await saveAppStateIfNeeded(store)
    
    // Generate receipt
    const receiptHtml = generateTogoReceipt({
      items,
      subtotal,
      total,
      store: settings,
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
    const settings = store.state.settings
    
    // Get pricing
    const pricing = {
      adult: isDinner ? settings.ADULTDINNERPRICE : settings.ADULTPRICE,
      bigKid: isDinner ? settings.BIGKIDDINNERPRICE : settings.BIGKIDPRICE,
      smlKid: isDinner ? settings.SMALLKIDDINNERPRICE : settings.SMALLKIDPRICE,
      drink: settings.DRINKPRICE,
      water: settings.WATERPRICE,
      taxRate: settings.TAX_RATE
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
      logger.warn('No items to print for cashier receipt')
      return
    }
    
    const subtotal = totals.reduce((sum, value) => sum + value, 0)
    const totalWithTax = subtotal * pricing.taxRate
    const taxAmount = totalWithTax - subtotal
    
    // Increment ticket counter
    await store.dispatch('sales/incrementTicketCount')
    const ticketCount = store.state.sales.ticketCount
    
    // Save app state if needed
    await saveAppStateIfNeeded(store)
    
    // Generate receipt
    const receiptHtml = generateCashierReceipt({
      lines,
      subtotal,
      totalWithTax,
      store: settings,
      isDinner,
      ticketCount
    })
    
    // Print
    openPrintDocument(receiptHtml)
    
    // Process payment
    await store.dispatch('cashier/processCashierPayment')
  }

  return {
    openPrintDocument,
    printTableReceipt,
    printTogoReceipt,
    printCashierReceipt
  }
}

