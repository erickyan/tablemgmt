/**
 * Receipt Template Renderer
 * Generates HTML receipts using a template-based approach
 * Follows the structure of ReceiptTemplate.vue component
 */

/**
 * Create a simple test receipt for debugging
 * @returns {string} Simple HTML receipt
 */
export function createTestReceipt() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Receipt</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            margin: 0;
            background: white;
            color: black;
          }
          .test-receipt {
            text-align: center;
            border: 2px solid black;
            padding: 20px;
            background: white;
          }
          h1 { color: black; font-size: 24px; }
          p { color: black; font-size: 16px; margin: 10px 0; }
          @media print {
            body, .test-receipt, h1, p { 
              color: black !important; 
              background: white !important; 
            }
          }
        </style>
      </head>
      <body>
        <div class="test-receipt">
          <h1>TEST RECEIPT</h1>
          <p>This is a test receipt</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
          <p>Time: ${new Date().toLocaleTimeString()}</p>
          <p>If you can see this, the print system is working!</p>
        </div>
      </body>
    </html>
  `
}

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
  const printTimeStr = printTime || (() => {
    const now = new Date()
    if (isFinite(now.getTime())) {
      return now.toLocaleString('en-US', { timeZone: 'America/New_York' })
    }
    return new Date().toISOString()
  })()
  
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
      /* Base styles */
      * { box-sizing: border-box; }
      html, body { 
        margin: 0; 
        padding: 0; 
        width: 100%; 
        height: auto; 
        font-family: 'Helvetica Neue', Arial, sans-serif; 
        color: #333; 
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      body { 
        padding: 24px; 
        position: relative; 
        min-height: 100vh;
      }
      
      ${showTicketCount ? '.receipt__ticket-count { position: absolute; top: 24px; right: 24px; font-size: 18px; font-weight: bold; color: #333; }' : ''}
      
      .receipt { 
        font-family: 'Helvetica Neue', Arial, sans-serif; 
        padding: 24px; 
        color: #333; 
        position: relative; 
        background: white;
        width: 100%;
        max-width: 100%;
      }
      
      .receipt__header { text-align: center; margin-bottom: 4px; letter-spacing: 1px; font-size: 24px; font-weight: bold; }
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
      .receipt__gratuity { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #ccc; }
      .receipt__gratuity-title { text-align: center; font-size: 12px; color: #666; margin-bottom: 8px; }
      .receipt__gratuity-options { display: flex; justify-content: space-around; font-size: 11px; }
      .receipt__gratuity-option { text-align: center; }
      .receipt__gratuity-percent { font-weight: bold; }
      .receipt__gratuity-amount { color: #666; }
      
      /* Print-specific styles */
      @media print {
        /* Hide browser print headers and footers */
        @page {
          margin: 0;
          size: auto;
        }
        
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
          background: white !important;
          color: black !important;
          font-size: 12pt !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        body {
          padding: 12pt !important;
        }
        
        .receipt {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 12pt !important;
          background: white !important;
          color: black !important;
          page-break-inside: avoid;
        }
        
        .receipt__header {
          font-size: 18pt !important;
          color: black !important;
        }
        
        .receipt__table {
          width: 100% !important;
          font-size: 10pt !important;
        }
        
        .receipt__table-header,
        .receipt__table-cell {
          color: black !important;
          border-color: #333 !important;
        }
        
        .receipt__totals {
          font-size: 11pt !important;
        }
        
        .receipt__total-row--final {
          font-size: 12pt !important;
        }
        
        /* Ensure all text is visible */
        * {
          color: black !important;
          background: white !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        /* Override any potential hiding */
        .receipt__table-header,
        .receipt__table-cell,
        .receipt__totals,
        .receipt__gratuity {
          display: block !important;
          visibility: visible !important;
        }
        
        .receipt__table {
          display: table !important;
        }
        
        .receipt__table-header,
        .receipt__table-cell {
          display: table-cell !important;
        }
        
        .receipt__total-row {
          display: flex !important;
        }
        
        /* Additional attempts to hide browser print headers/footers */
        html {
          -webkit-print-color-adjust: exact;
        }
        
        /* Hide any potential browser-generated content */
        body::before,
        body::after,
        html::before,
        html::after {
          display: none !important;
        }
      }
      
      /* Mobile-specific adjustments */
      @media screen and (max-width: 600px) {
        body {
          padding: 12px;
        }
        
        .receipt {
          padding: 12px;
        }
        
        .receipt__header {
          font-size: 20px;
        }
        
        .receipt__table {
          font-size: 12px;
        }
      }
    </style>
  `
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="format-detection" content="telephone=no">
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

