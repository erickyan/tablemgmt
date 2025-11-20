/**
 * UI Module
 * Handles UI state like order panel, loading states, and navigation state
 */

export default {
  namespaced: true,
  
  state: {
    // Loading states for async operations
    loadingStates: {
      initializing: false, // Initial Firebase data load
      savingMenu: false, // Menu save operation
      payingTable: false, // Table payment
      clearingTable: false, // Clearing table
      printingReceipt: false, // Printing receipt
      resettingSales: false, // Resetting sales data
      resettingTicketCount: false, // Resetting ticket count
      loadingTogoSales: false, // Loading togo sales history
      savingPricing: false, // Saving pricing settings
      savingReceiptSettings: false // Saving receipt settings
    },
    tableNum: 0,
    orderPanel: {
      type: null,
      tableIndex: null
    },
    catID: 0,
    tableOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  },

  getters: {
    getActiveOrderPanel: (state) => {
      return state.orderPanel
    },
    isOrderPanelOpen: (state) => {
      return state.orderPanel.type !== null
    },
    getCurrentTableNum: (state) => {
      return state.tableNum
    },
    getCurrentCategoryId: (state) => {
      return state.catID
    },
    getTableOrder: (state) => {
      return state.tableOrder
    },
    isLoading: (state) => (key) => {
      return state.loadingStates[key] || false
    },
  },

  mutations: {
    setOrderPanel(state, payload = null) {
      if (!payload || !payload.type) {
        state.orderPanel = {
          type: null,
          tableIndex: null
        }
        return
      }
      const nextPanel = {
        type: payload.type,
        tableIndex: typeof payload.tableIndex === 'number' ? payload.tableIndex : state.orderPanel.tableIndex ?? null
      }
      state.orderPanel = nextPanel
      if (typeof nextPanel.tableIndex === 'number') {
        state.tableNum = nextPanel.tableIndex
      }
    },
    
    setTableNum(state, tableNum) {
      state.tableNum = typeof tableNum === 'number' && tableNum >= 0 ? tableNum : 0
    },
    
    setCategoryId(state, catID) {
      // Allow -1 for drinks category, otherwise must be >= 0
      if (typeof catID === 'number' && (catID === -1 || catID >= 0)) {
        state.catID = catID
      } else {
        state.catID = 0
      }
    },
    
    setTableOrder(state, order = []) {
      if (Array.isArray(order) && order.length > 0) {
        state.tableOrder = [...order]
      }
    },
    
    setLoadingState(state, { key, value }) {
      if (key && typeof key === 'string' && typeof value === 'boolean') {
        state.loadingStates[key] = value
      }
    },
  },

  actions: {
    setOrderPanel({ commit }, payload) {
      commit('setOrderPanel', payload)
    },
    
    setTableNum({ commit }, tableNum) {
      commit('setTableNum', tableNum)
    },
    
    setCategoryId({ commit }, catID) {
      commit('setCategoryId', catID)
    },
    
    setTableOrder({ commit }, order) {
      commit('setTableOrder', order)
    },
    
    setLoadingState({ commit }, payload) {
      commit('setLoadingState', payload)
    },
  }
}

