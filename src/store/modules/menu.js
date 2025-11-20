/**
 * Menu Module
 * Handles menu state and operations
 */

import { normalizeMenu } from '../../utils/normalizeState.js'
import logger from '../../services/logger.js'

const resetMenuQuantities = (menu = []) => {
  menu.forEach(category => {
    if (!Array.isArray(category?.items)) return
    category.items.forEach(item => {
      if (item && typeof item === 'object') {
        item.quantity = 0
      }
    })
  })
}

export default {
  namespaced: true,
  
  state: {
    // Legacy menu structure (array of categories with items)
    menu: [],
    // Normalized menu entities for efficient access
    // Structure: { categories: { [id]: Category }, menuItems: { [id]: MenuItem } }
    normalizedMenu: {
      categories: {},
      menuItems: {}
    },
  },

  getters: {
    getMenu: (state) => {
      return state.menu || []
    },
    getMenuItemById: (state) => (itemId) => {
      return state.normalizedMenu?.menuItems?.[itemId] || null
    },
    getCategoryById: (state) => (categoryId) => {
      return state.normalizedMenu?.categories?.[categoryId] || null
    },
    getMenuItemsByCategory: (state) => (categoryId) => {
      const category = state.normalizedMenu?.categories?.[categoryId]
      if (!category || !category.itemIds) return []
      return category.itemIds
        .map(itemId => state.normalizedMenu.menuItems[itemId])
        .filter(Boolean)
    },
    getNormalizedMenu: (state) => {
      return state.normalizedMenu || { categories: {}, menuItems: {} }
    },
  },

  mutations: {
    setMenu(state, menu) {
      if (!Array.isArray(menu)) {
        logger.store.warn('setMenu: menu must be an array')
        return
      }
      
      state.menu = menu
      resetMenuQuantities(state.menu)
      
      // Normalize menu structure for efficient access
      // Store normalized entities alongside original structure for backward compatibility
      state.normalizedMenu = normalizeMenu(menu)
    },
    
    updateMenuQuantity(state, { categoryIndex, itemIndex, quantity }) {
      const category = state.menu[categoryIndex]
      if (!category || !Array.isArray(category.items)) {
        return
      }
      
      const item = category.items[itemIndex]
      if (!item || typeof item !== 'object') {
        return
      }
      
      const validQuantity = typeof quantity === 'number' && quantity >= 0 ? quantity : 0
      item.quantity = Math.min(validQuantity, 999) // Max 999
    },
    
    resetMenuQuantities(state) {
      resetMenuQuantities(state.menu)
    },
  },

  actions: {
    setMenu({ commit }, menu) {
      commit('setMenu', menu)
      
      // Extract drink price from menu if "Drinks" category exists
      // Update settings module with extracted drink price
      const drinksCategory = menu.find(cat => 
        cat?.category && cat.category.toLowerCase().trim() === 'drinks'
      )
      if (drinksCategory && Array.isArray(drinksCategory.items)) {
        // First, try to find a generic "Drink" item
        let drinkItem = drinksCategory.items.find(item => 
          item?.name && item.name.toLowerCase().trim() === 'drink'
        )
        // If not found, find the first non-water drink item
        if (!drinkItem) {
          drinkItem = drinksCategory.items.find(item => 
            item?.name && 
            item.name.toLowerCase().trim() !== 'water' &&
            item.name.toLowerCase().trim() !== '水'
          )
        }
        // If found, update DRINKPRICE in settings module
        if (drinkItem && drinkItem.listPrice > 0) {
          const drinkPrice = Number(drinkItem.listPrice)
          commit('settings/setDrinkPrice', drinkPrice, { root: true })
          logger.store.debug('[Menu] Updated DRINKPRICE from menu:', drinkPrice)
        }
      }
    },
    
    updateMenuQuantity({ commit }, payload) {
      commit('updateMenuQuantity', payload)
    },
    
    resetMenuQuantities({ commit }) {
      commit('resetMenuQuantities')
    },
  }
}

