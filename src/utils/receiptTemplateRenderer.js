/**
 * Receipt Template Renderer
 * Generates HTML receipts using a template-based approach
 * Follows the structure of ReceiptTemplate.vue component
 */

/**
 * Render receipt HTML using template structure
 * @param {Object} params - Receipt data
 * @returns {string} Complete HTML document string
 */
export function renderReceiptHTML({
  // Header
  headerText = 'China Buffet',
  subHeaderText = '',
  title,
  serverMode = '',
  showPrintTime = true,
  printTime,
  // Ticket Count
  showTicketCount = false,
  ticketCountChinese = '',
  // Items
  items = [],
  // Totals
  subtotal = 0,
  taxAmount = 0,
  total = 0,
  // Footer
  footerText = '',
  // Gratuity
  showGratuity = false,
  gratuityOptions = []
}) {
  const printTimeStr = printTime || new Date().toLocaleString()
  
  // Build items table rows
  const itemsRows = items.length === 0
    ? '<tr><td colspan="4" class="receipt__table-cell--empty">No items</td></tr>'
    : items.map(item => {
        const itemRow = `
          <tr>
            <td class="receipt__table-cell receipt__table-cell--item">${escapeHtml(item.label)}</td>
            <td class="receipt__table-cell receipt__table-cell--qty">${item.qty}</td>
            <td class="receipt__table-cell receipt__table-cell--price">$${item.unitPrice.toFixed(2)}</td>
            <td class="receipt__table-cell receipt__table-cell--price">$${item.total.toFixed(2)}</td>
          </tr>
        `
        // Add note row if present
        const noteRow = item.note
          ? `<tr class="receipt__table-row--note"><td colspan="4" class="receipt__table-cell receipt__table-cell--note"><strong>Note:</strong> ${escapeHtml(item.note)}</td></tr>`
          : ''
        return itemRow + noteRow
      }).join('')
  
  // Build gratuity options HTML
  const gratuityHTML = showGratuity && gratuityOptions.length > 0
    ? `
      <div class="receipt__gratuity">
        <div class="receipt__gratuity-title">Gratuity Suggestions</div>
        <div class="receipt__gratuity-options">
          ${gratuityOptions.map(option => `
            <div class="receipt__gratuity-option">
              <div class="receipt__gratuity-percent">${option.percent}%</div>
              <div class="receipt__gratuity-amount">$${option.amount.toFixed(2)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : ''
  
  // Build the receipt HTML following component structure
  const receiptHTML = `
    <div class="receipt">
      ${showTicketCount ? `<div class="receipt__ticket-count">${escapeHtml(ticketCountChinese)}</div>` : ''}
      <h1 class="receipt__header">${escapeHtml(headerText)}</h1>
      ${subHeaderText ? `<div class="receipt__sub-header">${escapeHtml(subHeaderText)}</div>` : ''}
      <h2 class="receipt__title">${escapeHtml(title)}</h2>
      ${serverMode ? `<div class="receipt__meta">Server Mode: ${escapeHtml(serverMode)}</div>` : ''}
      ${showPrintTime ? `<div class="receipt__print-time">${escapeHtml(printTimeStr)}</div>` : ''}
      <table class="receipt__table">
        <thead>
          <tr>
            <th class="receipt__table-header receipt__table-header--item">Item</th>
            <th class="receipt__table-header receipt__table-header--qty">Qty</th>
            <th class="receipt__table-header receipt__table-header--price">Price</th>
            <th class="receipt__table-header receipt__table-header--price">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <div class="receipt__totals">
        <div class="receipt__total-row">
          <span>Subtotal</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="receipt__total-row">
          <span>Tax</span>
          <span>$${taxAmount.toFixed(2)}</span>
        </div>
        <div class="receipt__total-row receipt__total-row--final">
          <strong>Total</strong>
          <strong>$${total.toFixed(2)}</strong>
        </div>
      </div>
      ${footerText ? `<div class="receipt__footer">${escapeHtml(footerText)}</div>` : ''}
      ${gratuityHTML}
    </div>
  `
  
  // Build complete HTML document with styles
  return buildReceiptDocument(receiptHTML, title || 'Receipt', showTicketCount)
}

/**
 * Build complete HTML document with styles
 * @param {string} bodyHTML - Receipt body HTML
 * @param {string} title - Document title
 * @param {boolean} showTicketCount - Whether ticket count is shown
 * @returns {string} Complete HTML document
 */
function buildReceiptDocument(bodyHTML, title, showTicketCount) {
  const styles = `
    <style>
      body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #333; position: relative; }
      ${showTicketCount ? '.receipt__ticket-count { position: absolute; top: 24px; right: 24px; font-size: 18px; font-weight: bold; color: #333; }' : ''}
      .receipt { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #333; position: relative; }
      .receipt__header { text-align: center; margin-bottom: 4px; letter-spacing: 1px; }
      .receipt__sub-header { text-align: center; margin-top: 4px; margin-bottom: 8px; font-size: 14px; color: #666; font-style: italic; white-space: pre-line; }
      .receipt__title { text-align: center; margin-top: 0; font-weight: normal; font-size: 16px; }
      .receipt__meta { text-align: center; margin-top: 8px; font-size: 12px; color: #666; }
      .receipt__print-time { text-align: center; margin-top: 8px; font-size: 11px; color: #999; }
      .receipt__table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px; table-layout: fixed; }
      .receipt__table-header { padding: 8px 6px; border-bottom: 1px solid #ddd; background: #f5f5f5; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
      .receipt__table-header--item { text-align: left; width: 50%; }
      .receipt__table-header--qty { text-align: center; width: 10%; }
      .receipt__table-header--price { text-align: right; width: 20%; }
      .receipt__table-cell { padding: 8px 6px; border-bottom: 1px solid #ddd; }
      .receipt__table-cell--item { text-align: left; }
      .receipt__table-cell--qty { text-align: center; }
      .receipt__table-cell--price { text-align: right; }
      .receipt__table-cell--empty { text-align: center; color: #999; font-style: italic; }
      .receipt__table-row--note .receipt__table-cell { padding: 6px 6px 10px; font-style: italic; color: #4a4a4a; background: #f9fbff; border-bottom: 1px solid #ddd; }
      .receipt__totals { margin-top: 16px; font-size: 14px; }
      .receipt__total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
      .receipt__total-row--final { font-size: 16px; }
      .receipt__total-row--final strong { font-weight: bold; }
      .receipt__footer { margin-top: 24px; text-align: center; font-size: 12px; color: #777; }
      .receipt__gratuity { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #ccc; }
      .receipt__gratuity-title { text-align: center; font-size: 12px; color: #666; margin-bottom: 8px; }
      .receipt__gratuity-options { display: flex; justify-content: space-around; font-size: 11px; }
      .receipt__gratuity-option { text-align: center; }
      .receipt__gratuity-percent { font-weight: bold; }
      .receipt__gratuity-amount { color: #666; }
    </style>
  `
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <meta charset="UTF-8">
        ${styles}
      </head>
      <body>
        ${bodyHTML}
      </body>
    </html>
  `
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

