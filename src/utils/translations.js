/**
 * Translation utilities for English and Chinese
 * When Chinese is selected, appends Chinese translation next to English text
 */

// Translation mappings
const translations = {
  // Navigation
  'Log out': '登出',
  'Floor plan': '平面圖',
  'Menu': '菜單',
  'Cashier': '收銀',
  'Admin': '管理',
  
  // Common actions
  'Lunch': '午餐',
  'Dinner': '晚餐',
  'Update': '更新',
  'Cancel': '取消',
  'Clear': '清除',
  'Print': '打印',
  'Paid': '已付款',
  'Manage': '管理',
  'Sign Out': '登出',
  'Sign In': '登入',
  
  // Table/Order related
  'Table': '桌子',
  'Guest': '客人',
  'Adult': '成人',
  'Kid': '小孩',
  'Buffet': '自助餐',
  'Drinks': '飲品',
  'Total': '總計',
  'Subtotal': '小計',
  'Tax': '稅',
  'VIP': '貴賓',
  'Mark VIP': '標記貴賓',
  'Remove VIP': '移除貴賓',
  'Print Receipt': '打印收據',
  'Print Preview': '打印預覽',
  'Mark Paid': '標記已付',
  'Manage Table': '管理桌子',
  
  // Cashier
  'Cashier Receipt': '收銀收據',
  'Adult Buffet': '成人自助餐',
  'Kid Buffet (6-9)': '小孩自助餐 (6-9)',
  'Kid Buffet (2-5)': '小孩自助餐 (2-5)',
  'Big Kid Buffet': '大童自助餐',
  'Small Kid Buffet': '小童自助餐',
  
  // Drinks
  'Water': '水',
  'Drink': '飲料',
  'Coke': '可樂',
  'Sweet tea': '甜茶',
  'Unsweet tea': '無糖茶',
  'Hot tea': '熱茶',
  'Sprite': '雪碧',
  'Dr Pepper': '胡椒博士',
  'Diet Coke': '健怡可樂',
  'Lemonade': '檸檬水',
  'Half & Half': '半半',
  'Coffee': '咖啡',
  
  // Status/Info
  'Lunch pricing': '午餐價格',
  'Dinner pricing': '晚餐價格',
  'No items added yet.': '尚未添加項目。',
  'Orders you open will appear here.': '您打開的訂單將顯示在這裡。',
  'Select a table or build a to-go order to review items, actions, and guest details.': '選擇桌子或建立外帶訂單以查看項目、操作和客人詳情。',
  
  // To-go menu
  'To-go menu': '外帶菜單',
  'Tap a category, then add items with the controls below.': '點擊類別，然後使用下方控制項添加項目。',
  'Build to-go order': '建立外帶訂單',
  'Tap an item to adjust quantity or add special requests.': '點擊項目以調整數量或添加特殊要求。',
  'No menu items configured for this category.': '此類別未配置菜單項目。',
  'Special request': '特殊要求',
  
  // Admin
  'China Buffet': '中國自助餐',
  'Home': '首頁',
  'Order': '訂單',
  'Staff POS': '員工POS',
  'Total $': '總計 $',
  'Buffet $': '自助餐 $',
  'Togo $': '外帶 $',
  'Admin Tools': '管理工具',
  'Manage Menu': '管理菜單',
  'View To-Go Sales': '查看外帶銷售',
  'Live Sales': '即時銷售',
  'Reset Sales Data': '重置銷售數據',
  'Reset': '重置',
  'Dismiss': '關閉',
  
  // Pricing labels
  'Qty': '數量',
  'items': '項目',
  'item': '項目',
  
  // Table/Status
  'Table': '桌子',
  'Adult buffet': '成人自助餐',
  'Kid buffet (6-9)': '小孩自助餐 (6-9)',
  'Kid buffet (2-5)': '小孩自助餐 (2-5)',
  'No guests or drinks recorded yet.': '尚未記錄客人或飲品。',
  'drinks': '飲品',
  'drink': '飲品',
  'Adult': '成人',
  'Kid (6-9)': '小孩 (6-9)',
  'Kid (2-5)': '小孩 (2-5)',
  'Empty': '空',
  'Available': '可用',
  'Occupied': '已佔用',
  'Printed': '已打印',
  
  // Cashier
  'Quick receipt builder for walk-in customers': '為上門顧客快速建立收據',
  'Adult Buffet': '成人自助餐',
  'Big Kid Buffet (6-9)': '大童自助餐 (6-9)',
  'Small Kid Buffet (2-5)': '小童自助餐 (2-5)',
  
  // HomeView
  'Sat': '週六',
  
  // To-go
  'Update': '更新',
  'Edit special request': '編輯特殊要求',
  
  // Additional
  'Buffet guests': '自助餐客人',
  'Tap + or − to adjust counts.': '點擊 + 或 − 以調整數量。',
  'added.': '已添加。',
  'No': '無',
  'Print': '打印',
  'drink': '飲品',
  
  // HomeView
  'to-go': '外帶',
  'Empty': '空',
  'Vacant': '空',
  'Seated': '已佔用',
  
  // TableOrderPanel
  'Manage table': '管理桌子',
}

/**
 * Get translated text - appends Chinese next to English when Chinese is selected
 * @param {string} text - English text
 * @param {boolean} isChinese - Whether Chinese language is selected
 * @returns {string} - Translated text with Chinese appended if applicable
 */
export function translate(text, isChinese = false) {
  if (!isChinese || !text) {
    return text || ''
  }
  
  const chinese = translations[text] || translations[text.trim()]
  
  if (chinese) {
    // Append Chinese next to English with a space
    return `${text} ${chinese}`
  }
  
  // If no translation found, return original text
  return text
}

/**
 * Get translation object for a given key
 */
export function getTranslation(key) {
  return translations[key] || key
}

/**
 * Translate object with nested keys
 */
export function translateObject(obj, isChinese = false) {
  if (!isChinese) {
    return obj
  }
  
  const translated = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      translated[key] = translate(value, isChinese)
    } else {
      translated[key] = value
    }
  }
  return translated
}

