/**
 * Time-related constants
 * Centralizes time-related magic numbers
 */

/**
 * Time intervals in milliseconds
 */
export const TIME_INTERVALS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
}

/**
 * Time thresholds for table occupation
 */
export const TABLE_OCCUPATION_THRESHOLDS = {
  // Table is considered "occupied over an hour" after this many milliseconds
  OVER_HOUR: TIME_INTERVALS.HOUR,
  
  // Update interval for time-based calculations (in milliseconds)
  UPDATE_INTERVAL: TIME_INTERVALS.MINUTE
}

/**
 * Convert minutes to milliseconds
 * @param {number} minutes - Number of minutes
 * @returns {number} Milliseconds
 */
export function minutesToMs(minutes) {
  return minutes * TIME_INTERVALS.MINUTE
}

/**
 * Convert hours to milliseconds
 * @param {number} hours - Number of hours
 * @returns {number} Milliseconds
 */
export function hoursToMs(hours) {
  return hours * TIME_INTERVALS.HOUR
}

/**
 * Check if a timestamp is older than a threshold
 * @param {number} timestamp - Timestamp in milliseconds
 * @param {number} thresholdMs - Threshold in milliseconds
 * @returns {boolean} True if timestamp is older than threshold
 */
export function isOlderThan(timestamp, thresholdMs) {
  if (!timestamp) return false
  const now = Date.now()
  return (now - timestamp) >= thresholdMs
}

