/**
 * Global Error Handler Service
 * Provides centralized error handling with user-friendly messages
 */

import logger from './logger.js'

/**
 * Error types for categorization
 */
export const ErrorTypes = {
  NETWORK: 'network',
  FIRESTORE: 'firestore',
  AUTH: 'auth',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
}

/**
 * User-friendly error messages with actionable steps
 */
const ERROR_MESSAGES = {
  [ErrorTypes.NETWORK]: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    action: 'Retry',
    recovery: [
      'Check your internet connection',
      'Try refreshing the page',
      'Wait a moment and try again'
    ]
  },
  [ErrorTypes.FIRESTORE]: {
    title: 'Data Error',
    message: 'Unable to save or load data. Please try again in a moment.',
    action: 'Retry',
    recovery: [
      'Wait a few seconds and try again',
      'Refresh the page if the problem persists',
      'Contact support if issues continue'
    ]
  },
  [ErrorTypes.AUTH]: {
    title: 'Authentication Error',
    message: 'Unable to sign in. Please check your credentials and try again.',
    action: 'OK',
    recovery: [
      'Verify your email and password are correct',
      'Check if Caps Lock is enabled',
      'Contact an administrator if you need password reset'
    ]
  },
  [ErrorTypes.VALIDATION]: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    action: 'OK',
    recovery: [
      'Review the fields highlighted in red',
      'Check that all required fields are filled',
      'Verify numbers and dates are in the correct format'
    ]
  },
  [ErrorTypes.PERMISSION]: {
    title: 'Permission Denied',
    message: 'You do not have permission to perform this action.',
    action: 'OK',
    recovery: [
      'Contact an administrator for access',
      'Verify you are signed in with the correct account',
      'Some actions require admin privileges'
    ]
  },
  [ErrorTypes.UNKNOWN]: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    action: 'OK',
    recovery: [
      'Try the action again',
      'Refresh the page',
      'Contact support if the problem continues'
    ]
  }
}

/**
 * Context-specific error messages with actionable steps
 */
const CONTEXT_ERROR_MESSAGES = {
  'saveMenu': {
    title: 'Unable to Save Menu',
    message: 'Failed to save menu changes. Your changes may not have been saved.',
    action: 'Retry',
    recovery: [
      'Click "Save" again to retry',
      'Check your internet connection',
      'Make sure you are signed in'
    ]
  },
  'loadMenu': {
    title: 'Unable to Load Menu',
    message: 'Failed to load menu data. Please refresh the page.',
    action: 'Refresh',
    recovery: [
      'Refresh the page',
      'Check your internet connection',
      'Contact support if the problem continues'
    ]
  },
  'resetSales': {
    title: 'Unable to Reset Sales',
    message: 'Failed to reset sales data. Please try again.',
    action: 'Retry',
    recovery: [
      'Wait a moment and try again',
      'Ensure you have admin permissions',
      'Contact support if issues persist'
    ]
  },
  'resetTicketCount': {
    title: 'Unable to Reset Ticket Count',
    message: 'Failed to reset ticket count. Please try again.',
    action: 'Retry',
    recovery: [
      'Wait a moment and try again',
      'Check your internet connection',
      'Ensure you are signed in'
    ]
  },
  'loadTogoSales': {
    title: 'Unable to Load Sales History',
    message: 'Failed to load to-go sales history. Please try again.',
    action: 'Retry',
    recovery: [
      'Wait a moment and try again',
      'Refresh the page',
      'Check your internet connection'
    ]
  },
  'saveReceiptSettings': {
    title: 'Unable to Save Receipt Settings',
    message: 'Failed to save receipt settings. Please try again.',
    action: 'Retry',
    recovery: [
      'Click "Save" again',
      'Check your internet connection',
      'Ensure you are signed in'
    ]
  },
  'savePricingSettings': {
    title: 'Unable to Save Pricing Settings',
    message: 'Failed to save pricing settings. Please try again.',
    action: 'Retry',
    recovery: [
      'Click "Save" again',
      'Check your internet connection',
      'Ensure you have admin permissions'
    ]
  },
  'payTable': {
    title: 'Unable to Process Payment',
    message: 'Failed to save payment. Please try again.',
    action: 'Retry',
    recovery: [
      'Try processing payment again',
      'Check your internet connection',
      'Verify the table data is correct'
    ]
  },
  'clearTable': {
    title: 'Unable to Clear Table',
    message: 'Failed to clear table. Please try again.',
    action: 'Retry',
    recovery: [
      'Try clearing the table again',
      'Check your internet connection',
      'Refresh the page if needed'
    ]
  },
  'printReceipt': {
    title: 'Unable to Print Receipt',
    message: 'Failed to print receipt. Please try again.',
    action: 'Retry',
    recovery: [
      'Check your printer connection',
      'Ensure pop-ups are allowed',
      'Try printing again'
    ]
  },
  'payTogo': {
    title: 'Unable to Process To-Go Payment',
    message: 'Failed to save to-go payment. Please try again.',
    action: 'Retry',
    recovery: [
      'Try processing payment again',
      'Check your internet connection',
      'Verify the order details are correct'
    ]
  }
}

/**
 * Determine error type from error object
 */
function getErrorType(error) {
  if (!error) return ErrorTypes.UNKNOWN
  
  const errorCode = error.code || error.errorCode || ''
  const errorMessage = (error.message || '').toLowerCase()
  
  // Firestore error codes
  if (errorCode.startsWith('firestore/') || errorCode.startsWith('permission-denied')) {
    if (errorCode.includes('permission-denied')) {
      return ErrorTypes.PERMISSION
    }
    return ErrorTypes.FIRESTORE
  }
  
  // Auth error codes
  if (errorCode.startsWith('auth/')) {
    return ErrorTypes.AUTH
  }
  
  // Network errors
  if (
    errorCode === 'unavailable' ||
    errorCode === 'deadline-exceeded' ||
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('fetch')
  ) {
    return ErrorTypes.NETWORK
  }
  
  // Validation errors
  if (
    errorCode === 'invalid-argument' ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('validation')
  ) {
    return ErrorTypes.VALIDATION
  }
  
  return ErrorTypes.UNKNOWN
}

/**
 * Extract user-friendly message from error
 * @param {Error} error - The error object
 * @param {string} errorType - The error type
 * @param {string} context - Optional context where error occurred
 */
function getUserMessage(error, errorType, context = null) {
  // Check if error has a custom user message
  if (error.userMessage) {
    return {
      ...ERROR_MESSAGES[errorType],
      ...error.userMessage
    }
  }
  
  // Check for context-specific messages first
  if (context && CONTEXT_ERROR_MESSAGES[context]) {
    return CONTEXT_ERROR_MESSAGES[context]
  }
  
  // Use predefined messages based on error type
  const defaultMessage = { ...ERROR_MESSAGES[errorType] }
  
  // For specific Firestore errors, provide more context
  if (errorType === ErrorTypes.FIRESTORE) {
    const code = error.code || ''
    if (code.includes('permission-denied')) {
      return {
        title: 'Permission Denied',
        message: 'You do not have permission to perform this action. Please contact an administrator.',
        action: 'OK',
        recovery: [
          'Contact an administrator for access',
          'Verify you are signed in with the correct account',
          'Some actions require admin privileges'
        ]
      }
    }
    if (code.includes('unavailable')) {
      return {
        title: 'Service Unavailable',
        message: 'The database service is temporarily unavailable. Please try again in a moment.',
        action: 'Retry',
        recovery: [
          'Wait a few seconds and try again',
          'Check your internet connection',
          'Refresh the page if the problem persists'
        ]
      }
    }
    if (code.includes('deadline-exceeded') || code.includes('timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        action: 'Retry',
        recovery: [
          'Wait a moment and try again',
          'Check your internet connection',
          'The service may be experiencing high load'
        ]
      }
    }
  }
  
  // For auth errors, provide specific messages
  if (errorType === ErrorTypes.AUTH) {
    const code = error.code || ''
    if (code.includes('wrong-password') || code.includes('user-not-found')) {
      return {
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect. Please try again.',
        action: 'OK',
        recovery: [
          'Verify your email and password are correct',
          'Check if Caps Lock is enabled',
          'Contact an administrator if you need password reset'
        ]
      }
    }
    if (code.includes('too-many-requests')) {
      return {
        title: 'Too Many Attempts',
        message: 'Too many failed login attempts. Please wait a few minutes before trying again.',
        action: 'OK',
        recovery: [
          'Wait 5-10 minutes before trying again',
          'Contact an administrator if you need immediate access',
          'Ensure you are using the correct credentials'
        ]
      }
    }
    if (code.includes('network-request-failed')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to authentication server. Please check your internet connection.',
        action: 'Retry',
        recovery: [
          'Check your internet connection',
          'Try refreshing the page',
          'Wait a moment and try again'
        ]
      }
    }
  }
  
  return defaultMessage
}

/**
 * Global error handler
 * Logs errors and can trigger user notifications
 */
export class ErrorHandler {
  constructor() {
    this.notificationCallback = null
  }

  /**
   * Set callback for showing user notifications
   * @param {Function} callback - Function to show notifications (e.g., Vuetify snackbar)
   */
  setNotificationCallback(callback) {
    this.notificationCallback = callback
  }

  /**
   * Handle an error
   * @param {Error} error - The error object
   * @param {Object} options - Additional options
   * @param {string} options.context - Context where error occurred (e.g., 'saveMenu', 'loadTogoSales')
   * @param {boolean} options.showToUser - Whether to show error to user (default: true)
   * @param {Function} options.onRetry - Retry callback function
   */
  handle(error, options = {}) {
    const {
      context = 'Unknown',
      showToUser = true,
      onRetry = null
    } = options

    // Determine error type
    const errorType = getErrorType(error)
    
    // Log error (with technical details)
    logger.error(`[${context}]`, error)
    
    // Get user-friendly message with context
    const userMessage = getUserMessage(error, errorType, context)
    
    // Show to user if requested
    if (showToUser && this.notificationCallback) {
      this.notificationCallback({
        ...userMessage,
        error,
        errorType,
        context,
        onRetry
      })
    }
    
    // Return error info for programmatic handling
    return {
      error,
      errorType,
      userMessage,
      isRetryable: errorType === ErrorTypes.NETWORK || errorType === ErrorTypes.FIRESTORE
    }
  }

  /**
   * Handle Firestore errors specifically
   */
  handleFirestore(error, context = 'Firestore', options = {}) {
    return this.handle(error, {
      ...options,
      context: `Firestore: ${context}`
    })
  }

  /**
   * Handle Auth errors specifically
   */
  handleAuth(error, context = 'Auth', options = {}) {
    return this.handle(error, {
      ...options,
      context: `Auth: ${context}`
    })
  }

  /**
   * Handle network errors specifically
   */
  handleNetwork(error, context = 'Network', options = {}) {
    return this.handle(error, {
      ...options,
      context: `Network: ${context}`
    })
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler()

export default errorHandler

