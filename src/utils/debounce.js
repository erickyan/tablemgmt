/**
 * Debounce utility for Firestore listener callbacks
 * Prevents excessive updates when multiple changes occur rapidly
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced function
 */
export function debounce(func, wait = 300) {
  let timeoutId = null
  
  return function debounced(...args) {
    const context = this
    
    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    
    // Set new timeout
    timeoutId = setTimeout(() => {
      func.apply(context, args)
      timeoutId = null
    }, wait)
  }
}

/**
 * Creates a throttled function that invokes func at most once per every wait milliseconds.
 * Unlike debounce, throttle ensures the function is called at regular intervals.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @returns {Function} The throttled function
 */
export function throttle(func, wait = 300) {
  let lastCallTime = 0
  let timeoutId = null
  
  return function throttled(...args) {
    const context = this
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime
    
    // If enough time has passed, call immediately
    if (timeSinceLastCall >= wait) {
      lastCallTime = now
      func.apply(context, args)
    } else {
      // Otherwise, schedule a call for the remaining time
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      
      const remainingTime = wait - timeSinceLastCall
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now()
        func.apply(context, args)
        timeoutId = null
      }, remainingTime)
    }
  }
}

