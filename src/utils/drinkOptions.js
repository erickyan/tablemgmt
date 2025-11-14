/**
 * Shared drink options used across the application
 * This ensures consistency between table orders and cashier view
 */
export const DRINK_OPTIONS = [
  { code: 'WTER', label: 'Water', icon: 'mdi-cup-water', type: 'water' },
  { code: 'DRNK', label: 'Drink', icon: 'mdi-cup', type: 'drink' },
  { code: 'COKE', label: 'Coke', icon: 'mdi-bottle-soda', type: 'drink' },
  { code: 'STEA', label: 'Sweet tea', icon: 'mdi-cup-tea', type: 'drink' },
  { code: 'UTEA', label: 'Unsweet tea', icon: 'mdi-tea', type: 'drink' },
  { code: 'HTEA', label: 'Hot tea', icon: 'mdi-kettle', type: 'drink' },
  { code: 'SPRT', label: 'Sprite', icon: 'mdi-bottle-soda-classic', type: 'drink' },
  { code: 'DRPP', label: 'Dr Pepper', icon: 'mdi-bottle-soda', type: 'drink' },
  { code: 'DIET', label: 'Diet Coke', icon: 'mdi-bottle-soda-outline', type: 'drink' },
  { code: 'LMND', label: 'Lemonade', icon: 'mdi-fruit-citrus', type: 'drink' },
  { code: 'HALF', label: 'Half & Half', icon: 'mdi-cup', type: 'drink' },
  { code: 'COFE', label: 'Coffee', icon: 'mdi-coffee', type: 'drink' }
]

/**
 * Get drink label by code
 */
export function getDrinkLabel(code) {
  const option = DRINK_OPTIONS.find(opt => opt.code === code)
  return option ? option.label : code
}

/**
 * Check if a drink code is water
 */
export function isWater(code) {
  return code === 'WTER'
}

