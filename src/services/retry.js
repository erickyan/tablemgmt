/**
 * Retry utility for Firestore and network operations
 * Implements exponential backoff retry logic
 */

import logger from './logger.js'
import { errorHandler, ErrorTypes } from './errorHandler.js'

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'unavailable',
    'deadline-exceeded',
    'aborted',
    'internal',
    'resource-exhausted'
  ]
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
  if (!error) return false
  
  const errorCode = error.code || error.errorCode || ''
  const errorMessage = (error.message || '').toLowerCase()
  
  // Check if error code is in retryable list
  if (DEFAULT_CONFIG.retryableErrors.some(code => errorCode.includes(code))) {
    return true
  }
  
  // Check error message for network-related keywords
  const networkKeywords = ['network', 'connection', 'timeout', 'unavailable', 'fetch']
  if (networkKeywords.some(keyword => errorMessage.includes(keyword))) {
    return true
  }
  
  // Don't retry permission or validation errors
  if (
    errorCode.includes('permission-denied') ||
    errorCode.includes('invalid-argument') ||
    errorCode.includes('not-found')
  ) {
    return false
  }
  
  return false
}

/**
 * Calculate delay for retry attempt
 */
function calculateDelay(attempt, config) {
  const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt)
  return Math.min(delay, config.maxDelay)
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry (should return a Promise)
 * @param {Object} config - Retry configuration
 * @param {string} context - Context for logging
 * @returns {Promise} Result of the function
 */
export async function retry(fn, config = {}, context = 'Operation') {
  const retryConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError = null
  
  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const result = await fn()
      if (attempt > 0) {
        logger.info(`[Retry] ${context} succeeded after ${attempt} retry(ies)`)
      }
      return result
    } catch (error) {
      lastError = error
      
      // Check if error is retryable
      if (!isRetryableError(error)) {
        logger.warn(`[Retry] ${context} failed with non-retryable error:`, error.code || error.message)
        throw error
      }
      
      // If this was the last attempt, throw the error
      if (attempt >= retryConfig.maxRetries) {
        logger.error(`[Retry] ${context} failed after ${retryConfig.maxRetries} retries`)
        throw error
      }
      
      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt, retryConfig)
      logger.warn(`[Retry] ${context} failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
  
  // Should never reach here, but just in case
  throw lastError
}

/**
 * Retry wrapper specifically for Firestore operations
 */
export async function retryFirestore(fn, context = 'Firestore operation') {
  return retry(fn, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000
  }, context)
}

/**
 * Retry wrapper specifically for network operations
 */
export async function retryNetwork(fn, context = 'Network operation') {
  return retry(fn, {
    maxRetries: 2,
    initialDelay: 500,
    maxDelay: 5000
  }, context)
}

export default {
  retry,
  retryFirestore,
  retryNetwork
}

