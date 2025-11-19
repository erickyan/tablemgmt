/**
 * Firestore transaction utilities for handling race conditions
 * Provides transactions, optimistic updates, and conflict resolution
 */

import {
  runTransaction,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '@/firebase'
import { retryFirestore } from './retry.js'
import logger from './logger.js'

function assertDb() {
  if (!db) {
    throw new Error('[Firestore] Database is not initialized. Ensure Firebase environment variables are set.')
  }
  return db
}

/**
 * Result of an optimistic update operation
 */
export class OptimisticUpdateResult {
  constructor(success, data = null, error = null, rollbackFn = null) {
    this.success = success
    this.data = data
    this.error = error
    this.rollbackFn = rollbackFn
  }

  static success(data, rollbackFn = null) {
    return new OptimisticUpdateResult(true, data, null, rollbackFn)
  }

  static failure(error, rollbackFn = null) {
    return new OptimisticUpdateResult(false, null, error, rollbackFn)
  }
}

/**
 * Update table with transaction to prevent race conditions
 * Uses optimistic updates with automatic rollback on conflict
 * 
 * @param {number} tableNumber - Table number
 * @param {Function} updateFn - Function that receives current table data and returns new data
 * @param {Object} options - Options
 * @param {boolean} options.optimistic - Whether to apply optimistic update (default: true)
 * @param {Function} options.onConflict - Conflict resolution function
 * @returns {Promise<Object>} Updated table data
 */
export async function updateTableTransaction(tableNumber, updateFn, options = {}) {
  const { optimistic = true, onConflict = null } = options

  // Validate table number
  if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
    throw new Error(`Invalid table number: ${tableNumber}`)
  }

  const tableRef = doc(assertDb(), 'tables', String(tableNumber))
  
  // Retry the transaction up to 3 times
  return retryFirestore(async () => {
    try {
      const result = await runTransaction(assertDb(), async (transaction) => {
        // Read current table data
        const tableSnap = await transaction.get(tableRef)
        
        if (!tableSnap.exists()) {
          throw new Error(`Table ${tableNumber} does not exist`)
        }

        const currentData = tableSnap.data()
        const currentVersion = currentData.updatedAt || null
        
        // Apply update function to get new data
        const newData = updateFn(currentData)
        
        // Add version timestamp for conflict detection
        newData.updatedAt = serverTimestamp()
        
        // Write new data in transaction
        transaction.set(tableRef, newData, { merge: true })
        
        return {
          ...newData,
          _version: currentVersion, // Store previous version for rollback
        }
      })

      logger.firestore.info(`Table ${tableNumber} updated successfully (transaction)`)
      return result
    } catch (error) {
      logger.firestore.error(`Transaction failed for table ${tableNumber}:`, error)
      
      // Handle conflict resolution if provided
      if (onConflict && error.code === 'failed-precondition') {
        logger.firestore.warn(`Conflict detected for table ${tableNumber}, attempting resolution`)
        
        try {
          // Read current state and retry with conflict resolution
          const currentSnap = await getDoc(tableRef)
          if (currentSnap.exists()) {
            const currentData = currentSnap.data()
            const resolvedData = await onConflict(currentData)
            
            // Retry update with resolved data
            await setDoc(tableRef, {
              ...resolvedData,
              updatedAt: serverTimestamp(),
            }, { merge: true })
            
            logger.firestore.info(`Table ${tableNumber} conflict resolved`)
            return resolvedData
          }
        } catch (resolveError) {
          logger.firestore.error(`Conflict resolution failed for table ${tableNumber}:`, resolveError)
          throw resolveError
        }
      }
      
      throw error
    }
  }, `updateTableTransaction(${tableNumber})`)
}

/**
 * Update sales summary with transaction to prevent race conditions
 * 
 * @param {Function} updateFn - Function that receives current sales data and returns new data
 * @returns {Promise<Object>} Updated sales data
 */
export async function updateSalesSummaryTransaction(updateFn) {
  const salesRef = doc(assertDb(), 'salesSummary', 'stats')
  
  return retryFirestore(async () => {
    try {
      const result = await runTransaction(assertDb(), async (transaction) => {
        // Read current sales data
        const salesSnap = await transaction.get(salesRef)
        
        const currentData = salesSnap.exists() ? salesSnap.data() : {
          revenue: 0,
          ticketCount: 0,
          adultCount: 0,
          bigKidCount: 0,
          smlKidCount: 0,
          updatedAt: null,
        }
        
        // Apply update function
        const newData = updateFn(currentData)
        
        // Ensure numeric fields are valid
        newData.revenue = Number(newData.revenue || 0)
        newData.ticketCount = Number(newData.ticketCount || 0)
        newData.adultCount = Number(newData.adultCount || 0)
        newData.bigKidCount = Number(newData.bigKidCount || 0)
        newData.smlKidCount = Number(newData.smlKidCount || 0)
        newData.updatedAt = serverTimestamp()
        
        // Write in transaction
        transaction.set(salesRef, newData, { merge: true })
        
        return newData
      })

      logger.firestore.info('Sales summary updated successfully (transaction)')
      return result
    } catch (error) {
      logger.firestore.error('Sales summary transaction failed:', error)
      throw error
    }
  }, 'updateSalesSummaryTransaction')
}

/**
 * Increment sales counters atomically
 * Prevents race conditions when multiple payments occur simultaneously
 * 
 * @param {Object} increments - Object with fields to increment
 * @param {number} increments.revenue - Revenue to add
 * @param {number} increments.ticketCount - Tickets to add
 * @param {number} increments.adultCount - Adults to add
 * @param {number} increments.bigKidCount - Big kids to add
 * @param {number} increments.smlKidCount - Small kids to add
 * @returns {Promise<Object>} Updated sales data
 */
export async function incrementSalesCounters(increments) {
  const salesRef = doc(assertDb(), 'salesSummary', 'stats')
  
  return retryFirestore(async () => {
    try {
      const result = await runTransaction(assertDb(), async (transaction) => {
        const salesSnap = await transaction.get(salesRef)
        
        const currentData = salesSnap.exists() ? salesSnap.data() : {
          revenue: 0,
          ticketCount: 0,
          adultCount: 0,
          bigKidCount: 0,
          smlKidCount: 0,
        }
        
        // Increment each field atomically
        const newData = {
          revenue: (Number(currentData.revenue || 0) + Number(increments.revenue || 0)),
          ticketCount: (Number(currentData.ticketCount || 0) + Number(increments.ticketCount || 0)),
          adultCount: (Number(currentData.adultCount || 0) + Number(increments.adultCount || 0)),
          bigKidCount: (Number(currentData.bigKidCount || 0) + Number(increments.bigKidCount || 0)),
          smlKidCount: (Number(currentData.smlKidCount || 0) + Number(increments.smlKidCount || 0)),
          updatedAt: serverTimestamp(),
        }
        
        transaction.set(salesRef, newData, { merge: true })
        return newData
      })

      logger.firestore.info('Sales counters incremented successfully (transaction)')
      return result
    } catch (error) {
      logger.firestore.error('Sales counter increment failed:', error)
      throw error
    }
  }, 'incrementSalesCounters')
}

/**
 * Perform optimistic update with automatic rollback on failure
 * 
 * @param {Function} optimisticUpdate - Function that applies optimistic state change (returns rollback function)
 * @param {Function} persistentUpdate - Async function that persists the change to Firestore
 * @param {Object} options - Options
 * @param {boolean} options.retry - Whether to retry on failure (default: true)
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<OptimisticUpdateResult>}
 */
export async function optimisticUpdate(
  optimisticUpdate,
  persistentUpdate,
  options = {}
) {
  const { retry = true, maxRetries = 3 } = options

  // Apply optimistic update and get rollback function
  let rollbackFn = null
  try {
    rollbackFn = optimisticUpdate()
    if (typeof rollbackFn !== 'function') {
      rollbackFn = null
    }
  } catch (error) {
    logger.firestore.error('Optimistic update failed:', error)
    return OptimisticUpdateResult.failure(error)
  }

  // Attempt persistent update
  let attempts = 0
  while (attempts < maxRetries) {
    try {
      const result = await persistentUpdate()
      return OptimisticUpdateResult.success(result, rollbackFn)
    } catch (error) {
      attempts++
      
      // Check if we should retry
      if (!retry || attempts >= maxRetries) {
        // Rollback optimistic update
        if (rollbackFn) {
          try {
            rollbackFn()
            logger.firestore.info('Optimistic update rolled back')
          } catch (rollbackError) {
            logger.firestore.error('Rollback failed:', rollbackError)
          }
        }
        
        return OptimisticUpdateResult.failure(error, rollbackFn)
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempts - 1), 5000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Should never reach here, but handle it
  if (rollbackFn) {
    try {
      rollbackFn()
    } catch (rollbackError) {
      logger.firestore.error('Rollback failed:', rollbackError)
    }
  }
  
  return OptimisticUpdateResult.failure(new Error('Max retries exceeded'))
}

/**
 * Conflict resolution strategies
 */
export const ConflictResolution = {
  /**
   * Merge strategy: combine both updates (additive for numbers, latest for strings)
   */
  MERGE: (current, incoming) => {
    const merged = { ...current }
    
    // Additive merge for numeric fields
    const numericFields = ['revenue', 'ticketCount', 'adultCount', 'bigKidCount', 'smlKidCount']
    numericFields.forEach(field => {
      if (typeof incoming[field] === 'number' && typeof current[field] === 'number') {
        merged[field] = current[field] + incoming[field]
      } else if (typeof incoming[field] === 'number') {
        merged[field] = incoming[field]
      }
    })
    
    // Latest for non-numeric fields
    Object.keys(incoming).forEach(key => {
      if (!numericFields.includes(key)) {
        merged[key] = incoming[key]
      }
    })
    
    return merged
  },

  /**
   * Latest wins strategy: use the most recent update based on timestamp
   */
  LATEST_WINS: (current, incoming) => {
    const currentTime = current.updatedAt?.toMillis?.() || 0
    const incomingTime = incoming.updatedAt?.toMillis?.() || Date.now()
    
    return incomingTime > currentTime ? incoming : current
  },

  /**
   * Current wins strategy: keep current state
   */
  CURRENT_WINS: (current, incoming) => current,

  /**
   * Incoming wins strategy: use incoming state
   */
  INCOMING_WINS: (current, incoming) => incoming,
}



