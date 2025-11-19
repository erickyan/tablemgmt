/**
 * Vuex Persistence Plugin
 * 
 * Automatically persists mutations to Firestore based on persistence strategy.
 * This ensures consistent data persistence without requiring manual persistTableByNumber calls.
 */

import { shouldPersistImmediately, getPersistenceType, getPersistenceConfig } from '../../utils/persistenceStrategy.js'
import * as firestore from '../../services/firestoreData.js'
import logger from '../../services/logger.js'

// Track installed plugin instances to avoid duplicate subscriptions
const installedStores = new WeakSet()

/**
 * Extract table number from mutation payload or state
 * @param {Object} state - Vuex state
 * @param {Object} mutation - Mutation object
 * @param {Function} getTableNumber - Helper to get table number from state
 * @returns {number|null} Table number or null
 */
function getTableNumberFromMutation(state, mutation, getTableNumber) {
  // For mutations that operate on current table (state.tableNum)
  const mutationsUsingTableNum = [
    'increaseAdult', 'decreaseAdult',
    'increaseBigKid', 'decreaseBidKid',
    'increaseSmlKid', 'decreaseSmlKid',
    'addDrink', 'calculateTotal', 'updateTableGoodPpl'
  ]

  if (mutationsUsingTableNum.includes(mutation.type)) {
    // Get table number from state.tableNum
    if (typeof getTableNumber === 'function') {
      return getTableNumber(state, state.tableNum)
    }
    // Fallback: if tables is an object, state.tableNum is the table number
    if (!Array.isArray(state.tables) && state.tableNum) {
      return state.tableNum
    }
  }

  // For mutations with explicit table number in payload
  if (mutation.payload) {
    if (typeof mutation.payload === 'object') {
      if (mutation.payload.index !== undefined) {
        // Could be table number or index
        if (typeof getTableNumber === 'function') {
          return getTableNumber(state, mutation.payload.index)
        }
        return mutation.payload.index
      }
      if (mutation.payload.tableNumber !== undefined) {
        return mutation.payload.tableNumber
      }
    }
  }

  // For mutations that accept tableNumber as first parameter
  if (mutation.type === 'updateTableName' && mutation.payload) {
    if (typeof mutation.payload === 'object' && mutation.payload.tableNumber) {
      return mutation.payload.tableNumber
    }
  }

  // For clearEverything, paid - use state.tableNum
  if (mutation.type === 'clearEverything' || mutation.type === 'paid') {
    if (typeof getTableNumber === 'function') {
      return getTableNumber(state, state.tableNum)
    }
    if (!Array.isArray(state.tables) && state.tableNum) {
      return state.tableNum
    }
  }

  return null
}

/**
 * Get table object from state
 * @param {Object} state - Vuex state
 * @param {number} tableNumber - Table number
 * @param {Function} getTableByNumber - Helper to get table by number
 * @returns {Object|null} Table object or null
 */
function getTableFromState(state, tableNumber, getTableByNumber) {
  if (typeof getTableByNumber === 'function') {
    return getTableByNumber(state, tableNumber)
  }
  
  // Fallback: direct access
  if (Array.isArray(state.tables)) {
    const table = state.tables.find(t => t && Number(t.number) === tableNumber)
    return table || null
  } else {
    return state.tables[tableNumber] || null
  }
}

/**
 * Persist table to Firestore
 * @param {Object} store - Vuex store instance
 * @param {Object} state - Vuex state
 * @param {number} tableNumber - Table number
 * @param {Function} getTableByNumber - Helper to get table by number
 */
function persistTable(store, state, tableNumber, getTableByNumber) {
  if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
    return
  }

  if (!tableNumber) {
    return
  }

  const table = getTableFromState(state, tableNumber, getTableByNumber)
  if (!table || !table.number) {
    logger.store.debug('Table not found for persistence:', tableNumber)
    return
  }

  // Update persistence status
  if (store && store.commit) {
    store.commit('setPersistenceStatus', { isSaving: true, error: null })
  }

  firestore.saveTable(table.number, table)
    .then(() => {
      // Update persistence status on success
      if (store && store.commit) {
        store.commit('setPersistenceStatus', { 
          isSaving: false, 
          lastSaved: new Date().toISOString(),
          error: null 
        })
      }
      logger.store.debug(`Table ${tableNumber} persisted successfully`)
    })
    .catch(err => {
      logger.firestore.error('Failed to persist table:', err)
      // Update persistence status on error
      if (store && store.commit) {
        store.commit('setPersistenceStatus', { 
          isSaving: false, 
          error: err.message || 'Failed to save' 
        })
      }
    })
}

/**
 * Create persistence plugin
 * @param {Object} helpers - Helper functions from store
 * @returns {Function} Vuex plugin
 */
export function createPersistencePlugin(helpers = {}) {
  const { getTableNumber, getTableByNumber } = helpers

  return (store) => {
    // Prevent duplicate subscriptions for the same store instance
    if (installedStores.has(store)) {
      logger.store.warn('Persistence plugin already installed for this store, skipping')
      return
    }
    installedStores.add(store)

    logger.store.info('Persistence plugin installed')

    // Listen to mutations
    store.subscribe((mutation, state) => {
      // Only persist if Firebase is enabled and initialized
      if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
        return
      }

      // Check if this mutation should persist immediately
      if (!shouldPersistImmediately(mutation.type)) {
        return
      }

      const persistenceType = getPersistenceType(mutation.type)
      
      // Handle table persistence
      if (persistenceType === 'table') {
        const tableNumber = getTableNumberFromMutation(state, mutation, getTableNumber)
        if (tableNumber) {
          // Debounce table persistence slightly to batch rapid changes
          // (But still persist immediately for critical changes)
          const config = getPersistenceConfig(mutation.type)
          logger.store.debug(`Persisting table ${tableNumber} due to mutation: ${mutation.type}`, config?.description || '')
          
          // For critical mutations (paid, clearEverything), persist immediately
          if (mutation.type === 'paid' || mutation.type === 'clearEverything') {
            persistTable(store, state, tableNumber, getTableByNumber)
          } else {
            // For other mutations, use a microtask to batch rapid changes
            Promise.resolve().then(() => {
              persistTable(store, state, tableNumber, getTableByNumber)
            })
          }
        } else {
          logger.store.debug(`Could not determine table number for mutation: ${mutation.type}`)
        }
      }

      // Handle other persistence types (menu, settings, etc.) are handled by AppState sync
      // which is debounced and handles bulk updates
    })
  }
}

