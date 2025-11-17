/**
 * Convert a number to simplified Chinese numerals
 * Supports numbers 1-99 (一 to 九十九)
 */
export function toChineseNumeral(num) {
  const n = Number(num) || 0
  if (n <= 0) return '零'
  if (n > 99) return String(n) // Fallback to Arabic for numbers > 99
  
  const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']
  const tens = ['', '十', '二十', '三十', '四十', '五十', '六十', '七十', '八十', '九十']
  
  if (n < 10) {
    return digits[n]
  }
  
  if (n === 10) {
    return '十'
  }
  
  if (n < 20) {
    return '十' + digits[n % 10]
  }
  
  if (n % 10 === 0) {
    return tens[Math.floor(n / 10)]
  }
  
  return tens[Math.floor(n / 10)] + digits[n % 10]
}

