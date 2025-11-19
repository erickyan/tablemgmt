/**
 * Receipt Generator Service
 * Generates HTML receipts for tables, to-go orders, and cashier transactions
 * Uses template-based approach for maintainability
 */

import { toChineseNumeral } from '../utils/chineseNumerals.js'
import { calculateGratuityOptions, calculateTaxAmount } from './pricingService.js'
import { DRINK_CODES } from '../constants/drinks.js'
import { renderReceiptHTML } from '../utils/receiptTemplateRenderer.js'

/**
 * Generate receipt HTML for a table
 * @param {Object} params - Receipt parameters
 * @param {Object} params.table - Table object
 * @param {number} params.tableIndex - Table index (0-based)
 * @param {Object} params.store - Vuex store state
 * @param {boolean} params.isDinner - Whether dinner mode is active
 * @param {number} params.ticketCount - Current ticket count
 * @returns {string} HTML string for receipt
 */
export function generateTableReceipt({ table, tableIndex, store, isDinner, ticketCount }) {
  const tableNumber = table?.number || (tableIndex + 1)
  const receiptSettings = store.receiptSettings || {}
  const headerText = receiptSettings.headerText || 'China Buffet'
  const subHeaderText = receiptSettings.subHeaderText || ''
  const footerText = receiptSettings.footerText || 'Thank you for dining with us!'
  const showPrintTime = receiptSettings.showPrintTime !== false
  const showGratuity = receiptSettings.showGratuity !== false
  const gratuityPercentages = Array.isArray(receiptSettings.gratuityPercentages) && receiptSettings.gratuityPercentages.length > 0
    ? receiptSettings.gratuityPercentages
    : [10, 15, 20]
  const gratuityOnPreTax = receiptSettings.gratuityOnPreTax === true
  const showTicketCount = receiptSettings.showTicketCount !== false

  // Get pricing based on mode
  const pricing = {
    adult: isDinner ? store.ADULTDINNERPRICE : store.ADULTPRICE,
    bigKid: isDinner ? store.BIGKIDDINNERPRICE : store.BIGKIDPRICE,
    smallKid: isDinner ? store.SMALLKIDDINNERPRICE : store.SMALLKIDPRICE,
    drink: store.DRINKPRICE,
    water: store.WATERPRICE
  }

  // Build receipt lines
  const lines = []
  const totals = []
  const addLine = (label, qty, unitPrice) => {
    const quantity = Number(qty || 0)
    if (quantity <= 0) return
    const total = quantity * Number(unitPrice || 0)
    lines.push({ label, qty: quantity, unitPrice: Number(unitPrice || 0), total })
    totals.push(total)
  }

  addLine('Adult Buffet', table.adult, pricing.adult)
  addLine('Kid Buffet (6-9)', table.bigKid, pricing.bigKid)
  addLine('Kid Buffet (2-5)', table.smlKid, pricing.smallKid)

  const drinkCounts = (Array.isArray(table.drinks) ? table.drinks : []).reduce((acc, code) => {
    acc[code] = (acc[code] || 0) + 1
    return acc
  }, {})

  // For receipts, use English-only labels (no translation)
  const drinkLabelMap = {
    WTER: 'Water', DRNK: 'Drink', COKE: 'Coke', STEA: 'Sweet tea', UTEA: 'Unsweet tea',
    HTEA: 'Hot tea', SPRT: 'Sprite', DRPP: 'Dr Pepper', DIET: 'Diet Coke',
    LMND: 'Lemonade', HALF: 'Half & Half', COFE: 'Coffee'
  }

  Object.entries(drinkCounts).forEach(([code, qty]) => {
    const label = drinkLabelMap[code] || code
    const unitPrice = code === DRINK_CODES.WATER ? pricing.water : pricing.drink
    addLine(label, qty, unitPrice)
  })

  const subtotal = totals.reduce((sum, value) => sum + value, 0)
  const totalWithTax = parseFloat(table.totalPrice || 0)
  const taxAmount = calculateTaxAmount(subtotal, totalWithTax, store.TAX_RATE)

  // Prepare items for template
  const receiptItems = lines.map(line => ({
    label: line.label,
    qty: line.qty,
    unitPrice: line.unitPrice,
    total: line.total
  }))

  const ticketCountChinese = toChineseNumeral(ticketCount)
  const gratuityBaseAmount = gratuityOnPreTax ? subtotal : (totalWithTax || (subtotal * store.TAX_RATE))
  const gratuityOptions = showGratuity 
    ? calculateGratuityOptions({ baseAmount: gratuityBaseAmount, percentages: gratuityPercentages })
    : []

  // Use template renderer
  return renderReceiptHTML({
    headerText,
    subHeaderText,
    title: `Table ${tableNumber}`,
    serverMode: isDinner ? 'Dinner' : 'Lunch',
    showPrintTime,
    showTicketCount,
    ticketCountChinese,
    items: receiptItems,
    subtotal,
    taxAmount,
    total: totalWithTax || (subtotal * store.TAX_RATE),
    footerText,
    showGratuity,
    gratuityOptions
  })
}

/**
 * Generate receipt HTML for to-go order
 * @param {Object} params - Receipt parameters
 * @param {Array} params.items - Order items
 * @param {number} params.subtotal - Subtotal amount
 * @param {number} params.total - Total amount
 * @param {Object} params.store - Vuex store state
 * @param {number} params.ticketCount - Current ticket count
 * @returns {string} HTML string for receipt
 */
export function generateTogoReceipt({ items, subtotal, total, store, ticketCount }) {
  const receiptSettings = store.receiptSettings || {}
  const headerText = receiptSettings.headerText || 'China Buffet'
  const subHeaderText = receiptSettings.subHeaderText || ''
  const footerText = receiptSettings.thankYouText || receiptSettings.footerText || 'Thank you for your order!'
  const showPrintTime = receiptSettings.showPrintTime !== false
  const showGratuity = receiptSettings.showGratuity !== false
  const gratuityPercentages = Array.isArray(receiptSettings.gratuityPercentages) && receiptSettings.gratuityPercentages.length > 0
    ? receiptSettings.gratuityPercentages
    : [10, 15, 20]
  const gratuityOnPreTax = receiptSettings.gratuityOnPreTax === true
  const showTicketCount = receiptSettings.showTicketCount !== false

  const taxAmount = calculateTaxAmount(subtotal, total)
  const ticketCountChinese = toChineseNumeral(ticketCount)
  const gratuityBaseAmount = gratuityOnPreTax ? subtotal : total
  const gratuityOptions = showGratuity 
    ? calculateGratuityOptions({ baseAmount: gratuityBaseAmount, percentages: gratuityPercentages })
    : []

  // Prepare items for template (include notes)
  const receiptItems = items.map(item => {
    const unitPrice = (item.price || 0) / (item.quantity || 1)
    return {
      label: item.name,
      qty: item.quantity,
      unitPrice,
      total: item.price || 0,
      note: item.note || ''
    }
  })

  // Use template renderer
  return renderReceiptHTML({
    headerText,
    subHeaderText,
    title: 'To-Go Order',
    showPrintTime,
    showTicketCount,
    ticketCountChinese,
    items: receiptItems,
    subtotal,
    taxAmount,
    total,
    footerText,
    showGratuity,
    gratuityOptions
  })
}

/**
 * Generate receipt HTML for cashier transaction
 * @param {Object} params - Receipt parameters
 * @param {Array} params.lines - Receipt line items
 * @param {number} params.subtotal - Subtotal amount
 * @param {number} params.totalWithTax - Total with tax
 * @param {Object} params.store - Vuex store state
 * @param {boolean} params.isDinner - Whether dinner mode is active
 * @param {number} params.ticketCount - Current ticket count
 * @returns {string} HTML string for receipt
 */
export function generateCashierReceipt({ lines, subtotal, totalWithTax, store, isDinner, ticketCount }) {
  const receiptSettings = store.receiptSettings || {}
  const headerText = receiptSettings.headerText || 'China Buffet'
  const subHeaderText = receiptSettings.subHeaderText || ''
  const footerText = receiptSettings.footerText || 'Thank you for dining with us!'
  const showPrintTime = receiptSettings.showPrintTime !== false
  const showGratuity = receiptSettings.showGratuity !== false
  const gratuityPercentages = Array.isArray(receiptSettings.gratuityPercentages) && receiptSettings.gratuityPercentages.length > 0
    ? receiptSettings.gratuityPercentages
    : [10, 15, 20]
  const gratuityOnPreTax = receiptSettings.gratuityOnPreTax === true
  const showTicketCount = receiptSettings.showTicketCount !== false

  const taxAmount = calculateTaxAmount(subtotal, totalWithTax)
  const ticketCountChinese = toChineseNumeral(ticketCount)
  const gratuityBaseAmount = gratuityOnPreTax ? subtotal : totalWithTax
  const gratuityOptions = showGratuity 
    ? calculateGratuityOptions({ baseAmount: gratuityBaseAmount, percentages: gratuityPercentages })
    : []

  // Prepare items for template
  const receiptItems = lines.map(line => ({
    label: line.label,
    qty: line.qty,
    unitPrice: line.unitPrice,
    total: line.total
  }))

  // Use template renderer
  return renderReceiptHTML({
    headerText,
    subHeaderText,
    title: `${isDinner ? 'Dinner' : 'Lunch'} Receipt`,
    showPrintTime,
    showTicketCount,
    ticketCountChinese,
    items: receiptItems,
    subtotal,
    taxAmount,
    total: totalWithTax,
    footerText,
    showGratuity,
    gratuityOptions
  })
}
