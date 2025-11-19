/**
 * State normalization utilities
 * Provides functions to normalize denormalized state structures
 */

/**
 * Generate a unique ID for a menu item
 * Format: "categoryId:itemIndex" or UUID if category/item have IDs
 */
export function generateMenuItemId(categoryId, itemIndex, item = null) {
  // If item already has an ID, use it
  if (item && item.id) {
    return item.id
  }
  
  // Generate stable ID based on category and index
  // Use category name if no categoryId provided
  const category = typeof categoryId === 'string' ? categoryId : `category-${categoryId}`
  return `${category}:item-${itemIndex}`
}

/**
 * Normalize menu structure to entities pattern
 * Converts nested structure to: { categories: {}, menuItems: {} }
 * 
 * @param {Array} menu - Current menu structure: [{ category: string, items: Array }]
 * @returns {Object} Normalized structure: { categories: { [id]: Category }, menuItems: { [id]: MenuItem } }
 */
export function normalizeMenu(menu = []) {
  const categories = {}
  const menuItems = {}
  
  if (!Array.isArray(menu)) {
    return { categories, menuItems }
  }
  
  menu.forEach((category, categoryIndex) => {
    if (!category || !category.category) return
    
    const categoryId = category.category.toLowerCase().replace(/\s+/g, '-')
    const categoryKey = category.id || categoryId || `category-${categoryIndex}`
    
    // Store category (without items - items are stored separately)
    categories[categoryKey] = {
      id: categoryKey,
      name: category.category,
      itemIds: [], // Will be populated with menu item IDs
      ...(category.updatedAt && { updatedAt: category.updatedAt })
    }
    
    // Store menu items with references to category
    if (Array.isArray(category.items)) {
      category.items.forEach((item, itemIndex) => {
        if (!item || !item.name) return
        
        const itemId = generateMenuItemId(categoryKey, itemIndex, item)
        
        // Store normalized menu item
        menuItems[itemId] = {
          id: itemId,
          categoryId: categoryKey,
          name: item.name,
          listPrice: Number(item.listPrice || 0),
          quantity: Number(item.quantity || 0),
          ...(item.updatedAt && { updatedAt: item.updatedAt })
        }
        
        // Add item ID to category's itemIds array
        categories[categoryKey].itemIds.push(itemId)
      })
    }
  })
  
  return { categories, menuItems }
}

/**
 * Denormalize normalized menu back to original structure
 * Useful for backward compatibility and Firestore saves
 * 
 * @param {Object} normalized - Normalized structure from normalizeMenu
 * @returns {Array} Original menu structure
 */
export function denormalizeMenu(normalized) {
  const { categories = {}, menuItems = {} } = normalized
  
  const menu = []
  
  // Sort categories by original order (if available) or alphabetically
  const sortedCategoryIds = Object.keys(categories).sort((a, b) => {
    // Try to maintain order based on category name
    return categories[a].name.localeCompare(categories[b].name)
  })
  
  sortedCategoryIds.forEach(categoryId => {
    const category = categories[categoryId]
    const items = (category.itemIds || [])
      .map(itemId => menuItems[itemId])
      .filter(Boolean)
      .map(item => ({
        name: item.name,
        listPrice: item.listPrice,
        quantity: item.quantity,
        ...(item.id && { id: item.id })
      }))
    
    menu.push({
      category: category.name,
      items,
      ...(category.id && { id: category.id }),
      ...(category.updatedAt && { updatedAt: category.updatedAt })
    })
  })
  
  return menu
}

/**
 * Get menu item by ID from normalized structure
 */
export function getMenuItemById(normalized, itemId) {
  return normalized?.menuItems?.[itemId] || null
}

/**
 * Get category by ID from normalized structure
 */
export function getCategoryById(normalized, categoryId) {
  return normalized?.categories?.[categoryId] || null
}

/**
 * Get all menu items in a category
 */
export function getMenuItemsByCategory(normalized, categoryId) {
  const category = getCategoryById(normalized, categoryId)
  if (!category || !category.itemIds) return []
  
  return category.itemIds
    .map(itemId => normalized.menuItems[itemId])
    .filter(Boolean)
}

/**
 * Find menu item ID from category index and item index
 * Used for backward compatibility with legacy categoryIndex/itemIndex references
 * 
 * @param {Array} menu - Original menu array structure
 * @param {Number} categoryIndex - Index of category in menu array
 * @param {Number} itemIndex - Index of item in category.items array
 * @returns {String|null} Menu item ID if found, null otherwise
 */
export function findMenuItemIdFromIndices(menu, categoryIndex, itemIndex) {
  if (!Array.isArray(menu) || !Number.isInteger(categoryIndex) || !Number.isInteger(itemIndex)) {
    return null
  }
  
  const category = menu[categoryIndex]
  if (!category || !Array.isArray(category.items)) {
    return null
  }
  
  const item = category.items[itemIndex]
  if (!item) {
    return null
  }
  
  // If item already has an ID, use it
  if (item.id) {
    return item.id
  }
  
  // Generate ID from category name and item index
  const categoryId = category.category?.toLowerCase().replace(/\s+/g, '-') || `category-${categoryIndex}`
  return generateMenuItemId(categoryId, itemIndex, item)
}

/**
 * Get menu item by legacy categoryIndex/itemIndex
 * Helper for backward compatibility
 */
export function getMenuItemByIndices(normalized, menu, categoryIndex, itemIndex) {
  const itemId = findMenuItemIdFromIndices(menu, categoryIndex, itemIndex)
  if (!itemId) return null
  
  return getMenuItemById(normalized, itemId)
}

