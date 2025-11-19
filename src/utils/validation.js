/**
 * Validation utilities for user inputs and Firestore data
 * Provides runtime type checking and bounds validation
 */

/**
 * Validate that a value is a number within a range
 * @param {*} value - Value to validate
 * @param {Object} options - Validation options
 * @param {Number} options.min - Minimum value (inclusive)
 * @param {Number} options.max - Maximum value (inclusive)
 * @param {Boolean} options.required - Whether value is required
 * @param {Number} options.default - Default value if invalid/undefined
 * @returns {Object} { valid: boolean, value: number, error: string|null }
 */
export function validateNumber(value, options = {}) {
  const { min = 0, max = Infinity, required = false, default: defaultValue = 0 } = options
  
  // Handle undefined/null
  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, value: defaultValue, error: 'Value is required' }
    }
    return { valid: true, value: defaultValue, error: null }
  }
  
  // Convert to number
  const num = Number(value)
  
  // Check if valid number
  if (!Number.isFinite(num)) {
    return { valid: false, value: defaultValue, error: 'Must be a valid number' }
  }
  
  // Check bounds
  if (num < min) {
    return { valid: false, value: min, error: `Must be at least ${min}` }
  }
  
  if (num > max) {
    return { valid: false, value: max, error: `Must be at most ${max}` }
  }
  
  return { valid: true, value: num, error: null }
}

/**
 * Validate price (non-negative number, typically 0-1000)
 */
export function validatePrice(value, options = {}) {
  return validateNumber(value, {
    min: 0,
    max: 1000,
    required: options.required || false,
    default: 0,
    ...options
  })
}

/**
 * Validate tax rate percentage (0-100)
 */
export function validateTaxRatePercent(value, options = {}) {
  return validateNumber(value, {
    min: 0,
    max: 100,
    required: options.required || false,
    default: 7,
    ...options
  })
}

/**
 * Validate count (non-negative integer, with optional max)
 */
export function validateCount(value, options = {}) {
  const { max = 1000, required = false, default: defaultValue = 0 } = options
  const result = validateNumber(value, { min: 0, max, required, default: defaultValue })
  
  if (!result.valid) return result
  
  // Ensure integer
  const intValue = Math.floor(result.value)
  if (intValue !== result.value) {
    return { valid: false, value: intValue, error: 'Must be a whole number' }
  }
  
  return { valid: true, value: intValue, error: null }
}

/**
 * Validate table number (positive integer, 1-999)
 */
export function validateTableNumber(value) {
  return validateNumber(value, {
    min: 1,
    max: 999,
    required: true,
    default: 1
  })
}

/**
 * Validate string with length constraints
 */
export function validateString(value, options = {}) {
  const { minLength = 0, maxLength = Infinity, required = false, trim = true, default: defaultValue = '' } = options
  
  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, value: defaultValue, error: 'Value is required' }
    }
    return { valid: true, value: defaultValue, error: null }
  }
  
  const str = trim ? String(value).trim() : String(value)
  
  if (str.length < minLength) {
    return { valid: false, value: str, error: `Must be at least ${minLength} characters` }
  }
  
  if (str.length > maxLength) {
    return { valid: false, value: str.slice(0, maxLength), error: `Must be at most ${maxLength} characters` }
  }
  
  return { valid: true, value: str, error: null }
}

/**
 * Validate menu item name
 */
export function validateMenuItemName(value) {
  return validateString(value, {
    minLength: 1,
    maxLength: 200,
    required: true,
    trim: true
  })
}

/**
 * Validate category name
 */
export function validateCategoryName(value) {
  return validateString(value, {
    minLength: 1,
    maxLength: 100,
    required: true,
    trim: true
  })
}

/**
 * Validate that value is in allowed values
 */
export function validateEnum(value, allowedValues, options = {}) {
  const { required = false, default: defaultValue = null } = options
  
  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, value: defaultValue, error: 'Value is required' }
    }
    return { valid: true, value: defaultValue, error: null }
  }
  
  if (!allowedValues.includes(value)) {
    return { valid: false, value: defaultValue, error: `Must be one of: ${allowedValues.join(', ')}` }
  }
  
  return { valid: true, value, error: null }
}

/**
 * Validate array with constraints
 */
export function validateArray(value, options = {}) {
  const { minLength = 0, maxLength = Infinity, required = false, default: defaultValue = [] } = options
  
  if (value === undefined || value === null) {
    if (required) {
      return { valid: false, value: defaultValue, error: 'Array is required' }
    }
    return { valid: true, value: defaultValue, error: null }
  }
  
  if (!Array.isArray(value)) {
    return { valid: false, value: defaultValue, error: 'Must be an array' }
  }
  
  if (value.length < minLength) {
    return { valid: false, value: defaultValue, error: `Must have at least ${minLength} items` }
  }
  
  if (value.length > maxLength) {
    return { valid: false, value: value.slice(0, maxLength), error: `Must have at most ${maxLength} items` }
  }
  
  return { valid: true, value, error: null }
}

/**
 * Runtime type checking utilities
 */

/**
 * Assert that value is a number, throw if not
 */
export function assertNumber(value, name = 'value') {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number, got ${typeof value}: ${value}`)
  }
  return true
}

/**
 * Assert that value is a string, throw if not
 */
export function assertString(value, name = 'value') {
  if (typeof value !== 'string') {
    throw new TypeError(`${name} must be a string, got ${typeof value}: ${value}`)
  }
  return true
}

/**
 * Assert that value is an array, throw if not
 */
export function assertArray(value, name = 'value') {
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array, got ${typeof value}: ${value}`)
  }
  return true
}

/**
 * Assert that value is an object, throw if not
 */
export function assertObject(value, name = 'value') {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object, got ${typeof value}: ${value}`)
  }
  return true
}

/**
 * Assert that value is a positive integer
 */
export function assertPositiveInteger(value, name = 'value') {
  assertNumber(value, name)
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer, got ${value}`)
  }
  return true
}

/**
 * Assert that value is a non-negative integer
 */
export function assertNonNegativeInteger(value, name = 'value') {
  assertNumber(value, name)
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative integer, got ${value}`)
  }
  return true
}



