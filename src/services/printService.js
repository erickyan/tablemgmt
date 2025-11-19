/**
 * Print Service
 * Simplified print functionality with better error handling
 * Provides a clean interface for printing HTML content
 */

/**
 * Print HTML content using the best available method
 * @param {string} html - HTML content to print
 * @returns {Promise<void>}
 */
export async function printHTML(html) {
  try {
    await printWithWindow(html)
  } catch (error) {
    console.warn('Window print failed, using iframe fallback:', error)
    try {
      await printWithIframe(html)
    } catch (iframeError) {
      console.error('Print failed with both methods:', iframeError)
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
      const popup = window.open('', '_blank', 'width=600,height=800')
      
      if (!popup || !popup.document) {
        reject(new Error('Popup blocked or unavailable'))
        return
      }

      // Extract and clean HTML
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
      
      const cleanHtml = bodyMatch && headMatch
        ? `<!DOCTYPE html><html>${headMatch[0]}${bodyMatch[0]}</html>`
        : html

      popup.document.open()
      popup.document.write(cleanHtml)
      popup.document.close()

      // Wait for content to load
      popup.onload = () => {
        try {
          popup.focus()
          
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
          
          // Trigger print after a short delay
          setTimeout(() => {
            try {
              popup.print()
            } catch (printError) {
              popup.close()
              reject(printError)
            }
          }, 100)
        } catch (error) {
          popup.close()
          reject(error)
        }
      }

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


