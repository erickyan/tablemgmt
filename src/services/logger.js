/**
 * Centralized logging service
 * Replaces console statements with proper logging levels
 * Can be extended to integrate with error tracking services (Sentry, LogRocket)
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

// Determine log level from environment
const getLogLevel = () => {
  if (import.meta.env.MODE === 'production') {
    // In production, only show warnings and errors
    return LOG_LEVELS.WARN
  }
  // In development, show all logs
  return LOG_LEVELS.DEBUG
}

const currentLogLevel = getLogLevel()

/**
 * Logger service with different log levels
 */
export const logger = {
  /**
   * Debug logs - detailed information for debugging
   * Only shown in development
   */
  debug: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.debug('[DEBUG]', ...args)
    }
  },

  /**
   * Info logs - general information
   * Shown in development, hidden in production
   */
  info: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.info('[INFO]', ...args)
    }
  },

  /**
   * Warning logs - potential issues
   * Shown in all environments
   */
  warn: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args)
    }
  },

  /**
   * Error logs - errors that need attention
   * Shown in all environments
   * Can be extended to send to error tracking service
   */
  error: (...args) => {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args)
      // TODO: Integrate with error tracking service (Sentry, LogRocket)
      // if (window.Sentry) {
      //   window.Sentry.captureException(new Error(args.join(' ')))
      // }
    }
  },

  /**
   * Log Firestore operations
   */
  firestore: {
    debug: (...args) => logger.debug('[Firestore]', ...args),
    info: (...args) => logger.info('[Firestore]', ...args),
    warn: (...args) => logger.warn('[Firestore]', ...args),
    error: (...args) => logger.error('[Firestore]', ...args)
  },

  /**
   * Log authentication operations
   */
  auth: {
    debug: (...args) => logger.debug('[Auth]', ...args),
    info: (...args) => logger.info('[Auth]', ...args),
    warn: (...args) => logger.warn('[Auth]', ...args),
    error: (...args) => logger.error('[Auth]', ...args)
  },

  /**
   * Log component operations
   */
  component: {
    debug: (componentName, ...args) => logger.debug(`[${componentName}]`, ...args),
    info: (componentName, ...args) => logger.info(`[${componentName}]`, ...args),
    warn: (componentName, ...args) => logger.warn(`[${componentName}]`, ...args),
    error: (componentName, ...args) => logger.error(`[${componentName}]`, ...args)
  },

  /**
   * Log store/Vuex operations
   */
  store: {
    debug: (...args) => logger.debug('[Store]', ...args),
    info: (...args) => logger.info('[Store]', ...args),
    warn: (...args) => logger.warn('[Store]', ...args),
    error: (...args) => logger.error('[Store]', ...args)
  }
}

export default logger

