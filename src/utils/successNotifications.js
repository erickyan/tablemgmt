/**
 * Success Notification Service
 * Provides a centralized way to show success messages throughout the application
 */

const NOTIFICATION_EVENT = 'pos-success-notification'

/**
 * Show a success notification
 * @param {string} message - The message to display
 * @param {number} timeout - Optional timeout in milliseconds (default: 3000)
 */
export function showSuccess(message, timeout = 3000) {
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, {
    detail: {
      message,
      timeout,
      type: 'success'
    }
  }))
}

/**
 * Show a success notification with a custom color
 * @param {string} message - The message to display
 * @param {string} color - The color variant (default: 'success')
 * @param {number} timeout - Optional timeout in milliseconds (default: 3000)
 */
export function showNotification(message, color = 'success', timeout = 3000) {
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, {
    detail: {
      message,
      timeout,
      type: color
    }
  }))
}

/**
 * Subscribe to success notifications
 * @param {Function} callback - Callback function that receives { message, timeout, type }
 * @returns {Function} Unsubscribe function
 */
export function onSuccessNotification(callback) {
  const handler = (event) => {
    callback(event.detail)
  }
  window.addEventListener(NOTIFICATION_EVENT, handler)
  return () => {
    window.removeEventListener(NOTIFICATION_EVENT, handler)
  }
}


