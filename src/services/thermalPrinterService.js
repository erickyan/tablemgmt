/**
 * Thermal Printer Service
 * Handles printing to Star Micronics thermal printers via PassPRNT on iOS
 * Falls back to standard browser printing for other platforms
 */

import logger from './logger.js'

/**
 * Check if running on iOS device
 * @returns {boolean}
 */
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

/**
 * Check if PassPRNT app is installed (by attempting to open URL scheme)
 * @returns {Promise<boolean>}
 */
export async function isPassPRNTAvailable() {
  return new Promise((resolve) => {
    if (!isIOS()) {
      resolve(false)
      return
    }

    // Try to open PassPRNT URL scheme
    const testUrl = 'passprnt://'
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = testUrl
    document.body.appendChild(iframe)

    // If PassPRNT is installed, it will handle the URL
    // If not, nothing happens (no error)
    setTimeout(() => {
      document.body.removeChild(iframe)
      // We can't definitively detect if it's installed without user interaction
      // So we'll assume it might be available and let the user try
      resolve(true)
    }, 100)
  })
}

/**
 * Convert HTML receipt to plain text for thermal printing
 * Formats the receipt appropriately for thermal printers (typically 80mm width)
 * @param {string} html - HTML receipt content
 * @returns {string} Plain text receipt formatted for thermal printer
 */
export function htmlToPlainText(html) {
  // Create a temporary DOM element to parse HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  const lines = []
  const receiptDiv = tempDiv.querySelector('.receipt')
  
  if (!receiptDiv) {
    // Fallback: extract all text
    let text = tempDiv.textContent || tempDiv.innerText || ''
    return text.replace(/\n\s*\n/g, '\n').trim()
  }

  // Extract ticket count if present
  const ticketCount = receiptDiv.querySelector('.receipt__ticket-count')
  if (ticketCount) {
    lines.push(centerText(ticketCount.textContent.trim(), 48))
    lines.push('')
  }

  // Extract header
  const header = receiptDiv.querySelector('.receipt__header')
  if (header) {
    lines.push(centerText(header.textContent.trim().toUpperCase(), 48))
  }

  // Extract sub-header
  const subHeader = receiptDiv.querySelector('.receipt__sub-header')
  if (subHeader) {
    const subHeaderText = subHeader.textContent.trim()
    if (subHeaderText) {
      lines.push(centerText(subHeaderText, 48))
    }
  }

  // Extract title
  const title = receiptDiv.querySelector('.receipt__title')
  if (title) {
    lines.push(centerText(title.textContent.trim(), 48))
  }

  // Extract server mode
  const meta = receiptDiv.querySelector('.receipt__meta')
  if (meta) {
    lines.push(centerText(meta.textContent.trim(), 48))
  }

  // Extract print time
  const printTime = receiptDiv.querySelector('.receipt__print-time')
  if (printTime) {
    lines.push(centerText(printTime.textContent.trim(), 48))
  }

  lines.push('')
  lines.push('─'.repeat(48))

  // Extract items table
  const table = receiptDiv.querySelector('.receipt__table')
  if (table) {
    const rows = table.querySelectorAll('tbody tr')
    rows.forEach(row => {
      const cells = row.querySelectorAll('td')
      if (cells.length >= 4) {
        const item = cells[0].textContent.trim()
        const qty = cells[1].textContent.trim()
        const unitPrice = cells[2].textContent.trim()
        const total = cells[3].textContent.trim()

        // Format: Item Name (left) | Qty | Price | Total (right)
        const itemLine = formatItemLine(item, qty, unitPrice, total, 48)
        lines.push(itemLine)

        // Check for note
        const noteCell = row.querySelector('.receipt__table-cell--note')
        if (noteCell) {
          const note = noteCell.textContent.replace(/^Note:\s*/i, '').trim()
          if (note) {
            lines.push(`  Note: ${note}`)
          }
        }
      }
    })
  }

  lines.push('─'.repeat(48))

  // Extract totals
  const totalsDiv = receiptDiv.querySelector('.receipt__totals')
  if (totalsDiv) {
    const totalRows = totalsDiv.querySelectorAll('.receipt__total-row')
    totalRows.forEach(row => {
      const spans = row.querySelectorAll('span, strong')
      if (spans.length >= 2) {
        const label = spans[0].textContent.trim()
        const value = spans[1].textContent.trim()
        const isFinal = row.classList.contains('receipt__total-row--final')
        const line = formatTotalLine(label, value, 48, isFinal)
        lines.push(line)
      }
    })
  }

  // Extract footer
  const footer = receiptDiv.querySelector('.receipt__footer')
  if (footer) {
    lines.push('')
    lines.push(centerText(footer.textContent.trim(), 48))
  }

  // Extract gratuity options
  const gratuity = receiptDiv.querySelector('.receipt__gratuity')
  if (gratuity) {
    lines.push('')
    lines.push('─'.repeat(48))
    const gratuityTitle = gratuity.querySelector('.receipt__gratuity-title')
    if (gratuityTitle) {
      lines.push(centerText(gratuityTitle.textContent.trim(), 48))
    }
    const options = gratuity.querySelectorAll('.receipt__gratuity-option')
    if (options.length > 0) {
      const optionLines = []
      options.forEach(option => {
        const percent = option.querySelector('.receipt__gratuity-percent')?.textContent.trim() || ''
        const amount = option.querySelector('.receipt__gratuity-amount')?.textContent.trim() || ''
        if (percent && amount) {
          optionLines.push(`${percent}: ${amount}`)
        }
      })
      if (optionLines.length > 0) {
        lines.push(centerText(optionLines.join('  |  '), 48))
      }
    }
  }

  lines.push('')
  lines.push('─'.repeat(48))
  lines.push('')

  return lines.join('\n')
}

/**
 * Center text within a given width
 * @param {string} text - Text to center
 * @param {number} width - Total width
 * @returns {string} Centered text
 */
function centerText(text, width) {
  const padding = Math.max(0, Math.floor((width - text.length) / 2))
  return ' '.repeat(padding) + text
}

/**
 * Format an item line for thermal printer
 * @param {string} item - Item name
 * @param {string} qty - Quantity
 * @param {string} unitPrice - Unit price
 * @param {string} total - Total price
 * @param {number} width - Line width
 * @returns {string} Formatted line
 */
function formatItemLine(item, qty, unitPrice, total, width) {
  // Truncate item name if too long
  const maxItemWidth = width - 25 // Reserve space for qty, prices
  const truncatedItem = item.length > maxItemWidth 
    ? item.substring(0, maxItemWidth - 3) + '...' 
    : item

  // Format: Item (left) | Qty (center) | Total (right)
  const qtyStr = qty.padStart(3)
  const totalStr = total.padStart(10)
  const itemStr = truncatedItem.padEnd(maxItemWidth)
  
  return `${itemStr} ${qtyStr} ${totalStr}`
}

/**
 * Format a total line for thermal printer
 * @param {string} label - Label (e.g., "Subtotal", "Total")
 * @param {string} value - Value (e.g., "$10.00")
 * @param {number} width - Line width
 * @param {boolean} isFinal - Whether this is the final total
 * @returns {string} Formatted line
 */
function formatTotalLine(label, value, width, isFinal = false) {
  const valueStr = value.padStart(10)
  const labelStr = (isFinal ? label.toUpperCase() : label).padEnd(width - 10)
  return `${labelStr}${valueStr}`
}

/**
 * Print using PassPRNT app
 * @param {string} text - Plain text content to print
 * @param {Object} options - Print options
 * @returns {Promise<void>}
 */
export async function printWithPassPRNT(text, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // PassPRNT URL scheme format:
      // passprnt://print?text=<encoded_text>&portName=<printer_name>&portSettings=<settings>
      
      // Encode text for URL
      const encodedText = encodeURIComponent(text)
      
      // Build URL - PassPRNT will show printer selection if not specified
      const url = `passprnt://print?text=${encodedText}`
      
      // Try to open PassPRNT
      const link = document.createElement('a')
      link.href = url
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Give PassPRNT time to open
      setTimeout(() => {
        resolve()
      }, 500)

    } catch (error) {
      logger.error('PassPRNT print failed:', error)
      reject(error)
    }
  })
}

/**
 * Print HTML receipt to thermal printer (iOS) or standard printer
 * @param {string} html - HTML receipt content
 * @param {Object} options - Print options
 * @returns {Promise<void>}
 */
export async function printToThermalPrinter(html, options = {}) {
  // Check if we should use thermal printer
  const useThermal = options.useThermal !== false && isIOS()

  if (useThermal) {
    try {
      // Convert HTML to plain text
      const plainText = htmlToPlainText(html)
      
      // Try PassPRNT first
      await printWithPassPRNT(plainText, options)
      logger.info('Print sent to PassPRNT')
      return
    } catch (error) {
      logger.warn('Thermal printer print failed, falling back to standard print:', error)
      // Fall through to standard printing
    }
  }

  // Fallback to standard printing (will be handled by printService)
  throw new Error('Use standard printing')
}

