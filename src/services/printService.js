/**
 * Print Service
 * Simplified print functionality with better error handling
 * Provides a clean interface for printing HTML content
 */

import logger from './logger.js'

/**
 * Test print function for debugging
 * @returns {Promise<void>}
 */
export async function testPrint() {
  const testHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Print Test</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            margin: 0;
            background: white !important;
            color: black !important;
          }
          .test { 
            border: 2px solid black; 
            padding: 20px; 
            text-align: center;
            background: white !important;
            color: black !important;
          }
          @media print {
            * { color: black !important; background: white !important; }
          }
        </style>
      </head>
      <body>
        <div class="test">
          <h1>PRINT TEST</h1>
          <p>This is a test print</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
          <p>If you see this, printing works!</p>
        </div>
      </body>
    </html>
  `
  
  await printHTML(testHtml)
}

/**
 * Print HTML content using the best available method
 * @param {string} html - HTML content to print
 * @returns {Promise<void>}
 */
export async function printHTML(html) {
  // Debug: Log HTML content length and preview
  logger.info('Print HTML length:', html.length, 'characters')
  logger.info('HTML preview:', html.substring(0, 200) + '...')
  
  // Check if HTML is empty or invalid
  if (!html || html.trim().length === 0) {
    logger.error('Empty HTML content provided for printing')
    throw new Error('No content to print')
  }
  
  try {
    await printWithWindow(html)
  } catch (error) {
    logger.warn('Window print failed, using iframe fallback:', error)
    try {
      await printWithIframe(html)
    } catch (iframeError) {
      logger.error('Print failed with both methods:', iframeError)
      throw new Error('Unable to print: ' + iframeError.message)
    }
  }
}

/**
 * Print using a popup window (primary method)
 * @param {string} html - HTML content to print
 * @returns {Promise<void>}
 */
function printWithWindow(html) {
  return new Promise((resolve, reject) => {
    try {
      // Check if we're on mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      // Use different window options for mobile
      const windowOptions = isMobile 
        ? 'width=device-width,height=device-height,scrollbars=yes'
        : 'width=600,height=800,scrollbars=yes'
      
      const popup = window.open('', '_blank', windowOptions)
      
      if (!popup || !popup.document) {
        reject(new Error('Popup blocked or unavailable'))
        return
      }

      // For mobile, use the HTML as-is without extraction
      let cleanHtml = html
      
      // Only do HTML extraction for desktop
      if (!isMobile) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
        
        cleanHtml = bodyMatch && headMatch
          ? `<!DOCTYPE html><html>${headMatch[0]}${bodyMatch[0]}</html>`
          : html
      }

      logger.info('Writing HTML to popup, length:', cleanHtml.length)
      
      popup.document.open()
      popup.document.write(cleanHtml)
      popup.document.close()
      
      // Try to hide browser print headers/footers by setting print settings
      try {
        // This may not work in all browsers due to security restrictions
        if (popup.document.head) {
          const style = popup.document.createElement('style')
          style.textContent = `
            @page { 
              margin: 0; 
              size: auto;
            }
            @media print {
              html, body { 
                margin: 0 !important; 
                padding: 12pt !important;
              }
            }
          `
          popup.document.head.appendChild(style)
        }
      } catch (e) {
        // Ignore errors - browser security may prevent this
        logger.warn('Could not modify print page settings:', e)
      }

      // Wait for content to load
      const handleLoad = () => {
        try {
          popup.focus()
          
          // Check if content actually loaded
          const bodyContent = popup.document.body?.innerHTML || ''
          logger.info('Popup body content length:', bodyContent.length)
          
          if (bodyContent.length === 0) {
            logger.error('Popup body is empty after loading')
            popup.close()
            reject(new Error('Print content failed to load'))
            return
          }
          
          // Setup cleanup handler
          const cleanup = () => {
            try {
              if (popup && !popup.closed) {
                popup.close()
              }
            } catch (e) {
              // Popup may already be closed
            }
            resolve()
          }
          
          popup.addEventListener('afterprint', cleanup, { once: true })
          
          // Trigger print after a longer delay for mobile
          const delay = isMobile ? 500 : 100
          setTimeout(() => {
            try {
              popup.print()
            } catch (printError) {
              logger.error('Print trigger failed:', printError)
              popup.close()
              reject(printError)
            }
          }, delay)
        } catch (error) {
          logger.error('Load handler error:', error)
          popup.close()
          reject(error)
        }
      }
      
      popup.onload = handleLoad

      // Fallback timeout
      setTimeout(() => {
        if (!popup.closed) {
          try {
            popup.print()
          } catch (e) {
            popup.close()
            reject(new Error('Print timeout'))
          }
        }
      }, 1000)

    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Print using iframe (fallback method)
 * @param {string} html - HTML content to print
 * @returns {Promise<void>}
 */
function printWithIframe(html) {
  return new Promise((resolve, reject) => {
    try {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.style.opacity = '0'
      iframe.style.pointerEvents = 'none'

      // Extract and clean HTML
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
      
      const cleanHtml = bodyMatch && headMatch
        ? `<!DOCTYPE html><html>${headMatch[0]}${bodyMatch[0]}</html>`
        : html

      iframe.srcdoc = cleanHtml
      document.body.appendChild(iframe)

      const frameWindow = iframe.contentWindow || iframe.contentDocument
      
      const cleanup = () => {
        try {
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe)
          }
        } catch (e) {
          // Iframe may already be removed
        }
        resolve()
      }

      // Wait for iframe to load
      const handleLoad = () => {
        try {
          frameWindow.focus()
          requestAnimationFrame(() => {
            try {
              frameWindow.print()
              setTimeout(cleanup, 300)
            } catch (printError) {
              cleanup()
              reject(printError)
            }
          })
        } catch (error) {
          cleanup()
          reject(error)
        }
      }

      iframe.onload = handleLoad

      // Fallback timeout
      setTimeout(() => {
        if (iframe && iframe.parentNode) {
          const frameDoc = iframe.contentDocument
          if (frameDoc && (frameDoc.readyState === 'complete' || frameDoc.readyState === 'interactive')) {
            handleLoad()
          } else {
            cleanup()
            reject(new Error('Iframe load timeout'))
          }
        }
      }, 2000)

    } catch (error) {
      reject(error)
    }
  })
}


