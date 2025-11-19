/**
 * Persistence Strategy
 * 
 * Defines which mutations should persist to Firestore and when.
 * This ensures consistent data persistence across the application.
 */

/**
 * Mutations that should persist to Firestore
 * Key: mutation name
 * Value: persistence configuration
 */
export const PERSISTENCE_STRATEGY = {
  // Table mutations - persist immediately
  'increaseAdult': { 
    type: 'table', 
    immediate: true,
    description: 'Table guest count changed' 
  },
  'decreaseAdult': { 
    type: 'table', 
    immediate: true,
    description: 'Table guest count changed' 
  },
  'increaseBigKid': { 
    type: 'table', 
    immediate: true,
    description: 'Table guest count changed' 
  },
  'decreaseBidKid': { 
    type: 'table', 
    immediate: true,
    description: 'Table guest count changed' 
  },
  'increaseSmlKid': { 
    type: 'table', 
    immediate: true,
    description: 'Table guest count changed' 
  },
  'decreaseSmlKid': { 
    type: 'table', 
    immediate: true,
    description: 'Table guest count changed' 
  },
  'addDrink': { 
    type: 'table', 
    immediate: true,
    description: 'Drink added to table' 
  },
  'setTableOccupied': { 
    type: 'table', 
    immediate: true,
    description: 'Table occupied status changed' 
  },
  'updateTableGoodPpl': { 
    type: 'table', 
    immediate: true,
    description: 'Table VIP status changed' 
  },
  'setTableSitDownTime': { 
    type: 'table', 
    immediate: true,
    description: 'Table sit-down time updated' 
  },
  'calculateTotal': { 
    type: 'table', 
    immediate: true,
    description: 'Table total calculated' 
  },
  'paid': { 
    type: 'table', 
    immediate: true,
    description: 'Table payment processed' 
  },
  'clearEverything': { 
    type: 'table', 
    immediate: true,
    description: 'Table cleared' 
  },
  'updateTableName': { 
    type: 'table', 
    immediate: true,
    description: 'Table name updated' 
  },

  // Menu mutations - persist immediately
  'setMenu': { 
    type: 'menu', 
    immediate: false, // Handled by AppState sync
    description: 'Menu updated' 
  },

  // Settings mutations - persist via AppState sync (debounced)
  'setDinnerMode': { 
    type: 'settings', 
    immediate: false,
    description: 'Pricing mode changed' 
  },
  'setLanguage': { 
    type: 'settings', 
    immediate: false,
    description: 'Language changed' 
  },
  'updatePricingSettings': { 
    type: 'settings', 
    immediate: false,
    description: 'Pricing settings updated' 
  },
  'updateReceiptSettings': { 
    type: 'settings', 
    immediate: false,
    description: 'Receipt settings updated' 
  },

  // Togo mutations - persist immediately (or via AppState for lines)
  'appendTogoLines': { 
    type: 'togo', 
    immediate: false, // Handled by AppState sync
    description: 'Togo lines added' 
  },
  'updateTogoLine': { 
    type: 'togo', 
    immediate: false, // Handled by AppState sync
    description: 'Togo line updated' 
  },
  'removeTogoLine': { 
    type: 'togo', 
    immediate: false, // Handled by AppState sync
    description: 'Togo line removed' 
  },
  'replaceTogoLines': { 
    type: 'togo', 
    immediate: false, // Handled by AppState sync
    description: 'Togo lines replaced' 
  },
  'clearTogoLines': { 
    type: 'togo', 
    immediate: false, // Handled by AppState sync
    description: 'Togo lines cleared' 
  },
  'togoPaid': { 
    type: 'togo', 
    immediate: true, // Sales records need immediate persistence
    description: 'Togo payment processed' 
  },

  // Cashier mutations - persist via AppState sync
  'processCashierPayment': { 
    type: 'cashier', 
    immediate: true, // Sales records need immediate persistence
    description: 'Cashier payment processed' 
  },
}

/**
 * Check if a mutation should persist
 * @param {string} mutationName - Name of the mutation
 * @returns {boolean} True if mutation should persist
 */
export function shouldPersist(mutationName) {
  return mutationName in PERSISTENCE_STRATEGY
}

/**
 * Get persistence configuration for a mutation
 * @param {string} mutationName - Name of the mutation
 * @returns {Object|null} Persistence configuration or null
 */
export function getPersistenceConfig(mutationName) {
  return PERSISTENCE_STRATEGY[mutationName] || null
}

/**
 * Check if a mutation should persist immediately (not via AppState sync)
 * @param {string} mutationName - Name of the mutation
 * @returns {boolean} True if mutation should persist immediately
 */
export function shouldPersistImmediately(mutationName) {
  const config = getPersistenceConfig(mutationName)
  return config ? config.immediate === true : false
}

/**
 * Get the persistence type for a mutation
 * @param {string} mutationName - Name of the mutation
 * @returns {string|null} Persistence type ('table', 'menu', 'settings', 'togo', 'cashier') or null
 */
export function getPersistenceType(mutationName) {
  const config = getPersistenceConfig(mutationName)
  return config ? config.type : null
}



