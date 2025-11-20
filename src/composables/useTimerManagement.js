/**
 * Composable for managing timers (intervals and timeouts)
 * Ensures all timers are properly cleaned up on component unmount
 * Prevents memory leaks from orphaned timers
 */

import { onUnmounted, ref } from 'vue'
import logger from '../services/logger.js'

/**
 * Timer management composable
 * Provides safe timer creation and automatic cleanup
 */
export function useTimerManagement() {
  // Track all active timers
  const intervals = ref(new Set())
  const timeouts = ref(new Set())
  
  /**
   * Create a managed interval that will be automatically cleaned up
   * @param {Function} callback - Function to call on each interval
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Interval ID
   */
  const setManagedInterval = (callback, delay) => {
    const id = setInterval(() => {
      try {
        callback()
      } catch (error) {
        logger.error('Error in interval callback:', error)
      }
    }, delay)
    intervals.value.add(id)
    return id
  }
  
  /**
   * Clear a managed interval
   * @param {number} id - Interval ID
   */
  const clearManagedInterval = (id) => {
    if (intervals.value.has(id)) {
      clearInterval(id)
      intervals.value.delete(id)
    }
  }
  
  /**
   * Create a managed timeout that will be automatically cleaned up
   * @param {Function} callback - Function to call after timeout
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timeout ID
   */
  const setManagedTimeout = (callback, delay) => {
    const id = setTimeout(() => {
      timeouts.value.delete(id)
      try {
        callback()
      } catch (error) {
        logger.error('Error in timeout callback:', error)
      }
    }, delay)
    timeouts.value.add(id)
    return id
  }
  
  /**
   * Clear a managed timeout
   * @param {number} id - Timeout ID
   */
  const clearManagedTimeout = (id) => {
    if (timeouts.value.has(id)) {
      clearTimeout(id)
      timeouts.value.delete(id)
    }
  }
  
  /**
   * Clear all active intervals
   */
  const clearAllIntervals = () => {
    intervals.value.forEach(id => {
      clearInterval(id)
    })
    intervals.value.clear()
  }
  
  /**
   * Clear all active timeouts
   */
  const clearAllTimeouts = () => {
    timeouts.value.forEach(id => {
      clearTimeout(id)
    })
    timeouts.value.clear()
  }
  
  /**
   * Clear all timers (intervals and timeouts)
   */
  const clearAllTimers = () => {
    clearAllIntervals()
    clearAllTimeouts()
  }
  
  /**
   * Check if there are any active timers
   * @returns {boolean}
   */
  const hasActiveTimers = () => {
    return intervals.value.size > 0 || timeouts.value.size > 0
  }
  
  // Automatically clean up all timers when component unmounts
  onUnmounted(() => {
    clearAllTimers()
  })
  
  return {
    setManagedInterval,
    clearManagedInterval,
    setManagedTimeout,
    clearManagedTimeout,
    clearAllIntervals,
    clearAllTimeouts,
    clearAllTimers,
    hasActiveTimers,
    // Expose counts for debugging
    activeIntervalCount: () => intervals.value.size,
    activeTimeoutCount: () => timeouts.value.size
  }
}

