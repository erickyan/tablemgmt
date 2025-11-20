/**
 * Sales Module
 * Handles sales tracking and reporting
 */

import Decimal from 'decimal.js'
import { addMoney, roundMoney, decimalToNumber } from '../../utils/decimalMoney.js'
import logger from '../../services/logger.js'

export default {
  namespaced: true,
  
  state: {
    sales: {
      totalCount: 0,
      adultCount: 0,
      bigKidCount: 0,
      smlKidCount: 0,
      revenue: 0,
      totalTogoRevenue: 0,
      togoOrderCount: 0  // Count of to-go orders
    },
    ticketCount: 0,  // Counter for all receipts printed (buffet and cashier)
  },

  getters: {
    getSales: (state) => {
      // Return a new object to ensure reactivity tracking
      // Access each property individually to ensure Vue tracks them
      return {
        totalCount: state.sales?.totalCount || 0,
        adultCount: state.sales?.adultCount || 0,
        bigKidCount: state.sales?.bigKidCount || 0,
        smlKidCount: state.sales?.smlKidCount || 0,
        revenue: state.sales?.revenue || 0,
        totalTogoRevenue: state.sales?.totalTogoRevenue || 0,
        togoOrderCount: state.sales?.togoOrderCount || 0
      }
    },
    getTicketCount: (state) => {
      return state.ticketCount || 0
    },
  },

  mutations: {
    setSales(state, sales) {
      if (sales && typeof sales === 'object') {
        state.sales = {
          totalCount: Number(sales.totalCount || 0),
          adultCount: Number(sales.adultCount || 0),
          bigKidCount: Number(sales.bigKidCount || 0),
          smlKidCount: Number(sales.smlKidCount || 0),
          revenue: Number(sales.revenue || 0),
          totalTogoRevenue: Number(sales.totalTogoRevenue || 0),
          togoOrderCount: Number(sales.togoOrderCount || 0)
        }
      }
    },
    
    addTableSale(state, { revenue, adultCount, bigKidCount, smlKidCount }) {
      const currentRevenue = new Decimal(state.sales.revenue || 0)
      const currentAdultCount = parseInt(state.sales.adultCount) || 0
      const currentBigKidCount = parseInt(state.sales.bigKidCount) || 0
      const currentSmlKidCount = parseInt(state.sales.smlKidCount) || 0
      
      const newRevenue = addMoney(currentRevenue, new Decimal(revenue || 0))
      
      // Calculate new counts first
      const newAdultCount = currentAdultCount + (adultCount || 0)
      const newBigKidCount = currentBigKidCount + (bigKidCount || 0)
      const newSmlKidCount = currentSmlKidCount + (smlKidCount || 0)
      const newTotalCount = newAdultCount + newBigKidCount + newSmlKidCount
      
      // Update all properties at once to ensure Vue tracks the changes
      // Create a new object to ensure reactivity
      state.sales = {
        ...state.sales,
        revenue: decimalToNumber(roundMoney(newRevenue)).toFixed(2),
        adultCount: newAdultCount,
        bigKidCount: newBigKidCount,
        smlKidCount: newSmlKidCount,
        totalCount: newTotalCount
      }
      
      logger.store.debug('addTableSale mutation: Updated sales state', {
        revenue: state.sales.revenue,
        adultCount: state.sales.adultCount,
        bigKidCount: state.sales.bigKidCount,
        smlKidCount: state.sales.smlKidCount,
        totalCount: state.sales.totalCount,
        addedRevenue: revenue,
        stateSalesObject: state.sales
      })
    },
    
    addTogoSale(state, { revenue }) {
      const currentTogoRevenue = new Decimal(state.sales.totalTogoRevenue || 0)
      const newTogoRevenue = addMoney(currentTogoRevenue, new Decimal(revenue || 0))
      
      // Update all properties at once to ensure Vue tracks the changes
      state.sales = {
        ...state.sales,
        totalTogoRevenue: decimalToNumber(roundMoney(newTogoRevenue)).toFixed(2),
        togoOrderCount: (state.sales.togoOrderCount || 0) + 1
      }
      
      logger.store.debug('addTogoSale mutation: Updated sales state', {
        totalTogoRevenue: state.sales.totalTogoRevenue,
        togoOrderCount: state.sales.togoOrderCount,
        addedRevenue: revenue,
        stateSalesObject: state.sales
      })
    },
    
    addCashierSale(state, { revenue, adultCount, bigKidCount, smlKidCount }) {
      const currentRevenue = new Decimal(state.sales.revenue || 0)
      const currentAdultCount = parseInt(state.sales.adultCount) || 0
      const currentBigKidCount = parseInt(state.sales.bigKidCount) || 0
      const currentSmlKidCount = parseInt(state.sales.smlKidCount) || 0
      
      const newRevenue = addMoney(currentRevenue, new Decimal(revenue || 0))
      
      // Calculate new counts first
      const newAdultCount = currentAdultCount + (adultCount || 0)
      const newBigKidCount = currentBigKidCount + (bigKidCount || 0)
      const newSmlKidCount = currentSmlKidCount + (smlKidCount || 0)
      const newTotalCount = newAdultCount + newBigKidCount + newSmlKidCount
      
      // Update all properties at once to ensure Vue tracks the changes
      state.sales = {
        ...state.sales,
        revenue: decimalToNumber(roundMoney(newRevenue)).toFixed(2),
        adultCount: newAdultCount,
        bigKidCount: newBigKidCount,
        smlKidCount: newSmlKidCount,
        totalCount: newTotalCount
      }
      
      logger.store.debug('Cashier sales updated:', {
        revenue: state.sales.revenue,
        adultCount: state.sales.adultCount,
        bigKidCount: state.sales.bigKidCount,
        smlKidCount: state.sales.smlKidCount,
        totalCount: state.sales.totalCount,
        cashierRevenue: revenue
      })
    },
    
    resetSales(state) {
      state.sales = {
        totalCount: 0,
        adultCount: 0,
        bigKidCount: 0,
        smlKidCount: 0,
        revenue: 0,
        totalTogoRevenue: 0,
        togoOrderCount: 0
      }
    },
    
    incrementTicketCount(state) {
      state.ticketCount = (state.ticketCount || 0) + 1
    },
    
    setTicketCount(state, count) {
      if (typeof count === 'number' && count >= 0) {
        state.ticketCount = count
      }
    },
  },

  actions: {
    setSales({ commit }, sales) {
      commit('setSales', sales)
    },
    
    addTableSale({ commit }, payload) {
      commit('addTableSale', payload)
    },
    
    addTogoSale({ commit }, payload) {
      commit('addTogoSale', payload)
    },
    
    addCashierSale({ commit }, payload) {
      commit('addCashierSale', payload)
    },
    
    resetSales({ commit }) {
      commit('resetSales')
    },
    
    incrementTicketCount({ commit }) {
      commit('incrementTicketCount')
    },
    
    setTicketCount({ commit }, count) {
      commit('setTicketCount', count)
    },
  }
}

