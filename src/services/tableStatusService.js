/**
 * Table Status Service
 * Centralized table status logic using state machine pattern
 * Simplifies status determination and reduces complexity
 */

/**
 * Table status states
 * @enum {string}
 */
export const TableStatus = {
  EMPTY: 'empty',
  OCCUPIED: 'occupied',
  PRINTED: 'printed'
}

/**
 * Table status metadata
 * Maps status states to display properties
 */
const STATUS_METADATA = {
  [TableStatus.EMPTY]: {
    labelKey: 'Empty',
    appearance: 'status-vacant',
    icon: 'mdi-checkbox-blank-circle-outline'
  },
  [TableStatus.OCCUPIED]: {
    labelKey: 'Occupied',
    appearance: 'status-seated',
    icon: 'mdi-account-clock-outline'
  },
  [TableStatus.PRINTED]: {
    labelKey: 'Printed',
    appearance: 'status-ready',
    icon: 'mdi-check-circle'
  }
}

/**
 * Determine table status using state machine logic
 * Priority order: PRINTED > OCCUPIED > EMPTY
 * 
 * @param {Object} table - Table object
 * @returns {TableStatus} Current status state
 */
export function determineTableStatus(table) {
  if (!table || typeof table !== 'object') {
    return TableStatus.EMPTY
  }

  // Check if table has been printed (has total but not occupied)
  const hasTotal = table.totalPrice && parseFloat(table.totalPrice) > 0
  const isOccupied = !!table.occupied
  
  if (hasTotal && !isOccupied) {
    return TableStatus.PRINTED
  }

  // Check if table is occupied
  if (isOccupied) {
    return TableStatus.OCCUPIED
  }

  // Check if table has activity (guests, drinks, to-go items)
  const guestCount = Number(table.adult || 0) + 
                     Number(table.bigKid || 0) + 
                     Number(table.smlKid || 0)
  const drinks = Array.isArray(table.drinks) ? table.drinks.length : 0
  const togo = Number(table.togo || 0)
  const hasActivity = guestCount > 0 || drinks > 0 || togo > 0

  if (hasActivity) {
    return TableStatus.OCCUPIED
  }

  return TableStatus.EMPTY
}

/**
 * Get table status metadata for display
 * @param {Object} table - Table object
 * @param {Function} getTranslatedLabel - Translation function
 * @returns {Object} Status metadata with label, appearance, and icon
 */
export function getTableStatusMetadata(table, getTranslatedLabel) {
  const status = determineTableStatus(table)
  const metadata = STATUS_METADATA[status] || STATUS_METADATA[TableStatus.EMPTY]
  
  return {
    status,
    label: getTranslatedLabel ? getTranslatedLabel(metadata.labelKey) : metadata.labelKey,
    appearance: metadata.appearance,
    icon: metadata.icon
  }
}

/**
 * Check if table is in a specific status
 * @param {Object} table - Table object
 * @param {TableStatus} status - Status to check
 * @returns {boolean} True if table is in the specified status
 */
export function isTableInStatus(table, status) {
  return determineTableStatus(table) === status
}

/**
 * Check if table is empty
 * @param {Object} table - Table object
 * @returns {boolean} True if table is empty
 */
export function isTableEmpty(table) {
  return isTableInStatus(table, TableStatus.EMPTY)
}

/**
 * Check if table is occupied
 * @param {Object} table - Table object
 * @returns {boolean} True if table is occupied
 */
export function isTableOccupied(table) {
  return isTableInStatus(table, TableStatus.OCCUPIED)
}

/**
 * Check if table has been printed
 * @param {Object} table - Table object
 * @returns {boolean} True if table has been printed
 */
export function isTablePrinted(table) {
  return isTableInStatus(table, TableStatus.PRINTED)
}

/**
 * Check if table has activity (guests, drinks, or to-go items)
 * This is used by the state machine to determine if a table should be occupied
 * @param {Object} table - Table object
 * @returns {boolean} True if table has activity
 */
export function tableHasActivity(table) {
  if (!table || typeof table !== 'object') {
    return false
  }
  
  const guestCount = Number(table.adult || 0) + 
                     Number(table.bigKid || 0) + 
                     Number(table.smlKid || 0)
  const drinks = Array.isArray(table.drinks) ? table.drinks.length : 0
  const togo = Number(table.togo || 0)
  
  return guestCount > 0 || drinks > 0 || togo > 0
}

/**
 * Check if table has a timestamp (has been processed)
 * @param {Object} table - Table object
 * @returns {boolean} True if table has timestamp
 */
export function hasTableTimestamp(table) {
  return table?.time && table.time > 0
}

/**
 * Check if table has a stored total price
 * @param {Object} table - Table object
 * @returns {boolean} True if table has stored total price
 */
export function hasStoredPrice(table) {
  return table?.totalPrice && parseFloat(table.totalPrice) > 0
}

/**
 * Check if table should use stored price (occupied, printed, or has timestamp)
 * This determines whether to use stored price or calculate dynamically
 * @param {Object} table - Table object
 * @returns {boolean} True if stored price should be used
 */
export function shouldUseStoredPrice(table) {
  if (!table || typeof table !== 'object') {
    return false
  }
  
  const isOccupied = !!table.occupied
  const hasPriceSet = hasStoredPrice(table)
  const isPrinted = !isOccupied && hasPriceSet
  const hasTimeStamp = hasTableTimestamp(table)
  
  return isOccupied || isPrinted || hasTimeStamp
}

/**
 * Check if table is occupied or printed (has activity but can be in printed state)
 * @param {Object} table - Table object
 * @returns {boolean} True if table is occupied or printed
 */
export function isOccupiedOrPrinted(table) {
  if (!table || typeof table !== 'object') {
    return false
  }
  
  const isOccupied = !!table.occupied
  const hasPriceSet = hasStoredPrice(table)
  const isPrinted = !isOccupied && hasPriceSet
  const hasTimeStamp = hasTableTimestamp(table)
  
  return isOccupied || isPrinted || hasTimeStamp
}


