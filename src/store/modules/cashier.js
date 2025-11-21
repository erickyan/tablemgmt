/**
 * Cashier Module
 * Handles cashier form state and payment processing
 */

import { DRINK_OPTIONS, isWater } from '../../utils/drinkOptions.js'
import { addMoney, multiplyMoney, applyTax, roundMoney, decimalToNumber } from '../../utils/decimalMoney.js'
import Decimal from 'decimal.js'
import * as firestore from '../../services/firestoreData'
import { incrementSalesCounters, optimisticUpdate } from '../../services/firestoreTransactions.js'
import logger from '../../services/logger.js'

export default {
  namespaced: true,
  
  state: {
    cashierForm: (() => {
      // Initialize drinkCounts with all drink options from shared list
      const drinkCounts = {}
      DRINK_OPTIONS.forEach(opt => {
        drinkCounts[opt.code] = 0
      })
      return {
        mode: 'lunch',
        buffetCounts: {
          adult: 0,
          bigKid: 0,
          smallKid: 0,
        },
        drinkCounts,
      }
    })(),
  },

  getters: {
    getCashierForm: (state) => {
      return state.cashierForm || {
        mode: 'lunch',
        buffetCounts: { adult: 0, bigKid: 0, smallKid: 0 },
        drinkCounts: {}
      }
    },
  },

  mutations: {
    setCashierMode(state, mode) {
      if (state.cashierForm) {
        state.cashierForm.mode = mode === 'dinner' ? 'dinner' : 'lunch'
      }
    },
    
    setCashierBuffetCount(state, payload) {
      const { key, count } = payload
      if (state.cashierForm && state.cashierForm.buffetCounts) {
        state.cashierForm.buffetCounts[key] = Math.max(0, Number(count || 0))
      }
    },
    
    setCashierDrinkCount(state, payload) {
      const { code, count } = payload
      if (state.cashierForm && state.cashierForm.drinkCounts) {
        state.cashierForm.drinkCounts[code] = Math.max(0, Number(count || 0))
      }
    },
    
    clearCashierForm(state) {
      if (state.cashierForm) {
        state.cashierForm.buffetCounts = {
          adult: 0,
          bigKid: 0,
          smallKid: 0,
        }
        // Initialize drinkCounts with all drink options from shared list
        const drinkCounts = {}
        DRINK_OPTIONS.forEach(opt => {
          drinkCounts[opt.code] = 0
        })
        state.cashierForm.drinkCounts = drinkCounts
      }
    },
    
    setCashierForm(state, form) {
      if (form && typeof form === 'object') {
        state.cashierForm = {
          mode: form.mode || 'lunch',
          buffetCounts: form.buffetCounts || { adult: 0, bigKid: 0, smallKid: 0 },
          drinkCounts: form.drinkCounts || {}
        }
      }
    },
  },

  actions: {
    setCashierMode({ commit }, mode) {
      commit('setCashierMode', mode)
    },
    
    setCashierBuffetCount({ commit }, payload) {
      commit('setCashierBuffetCount', payload)
    },
    
    setCashierDrinkCount({ commit }, payload) {
      commit('setCashierDrinkCount', payload)
    },
    
    clearCashierForm({ commit }) {
      commit('clearCashierForm')
    },
    
    async processCashierPayment({ state, commit, rootState, dispatch }) {
      const form = state.cashierForm || {}
      const buffetCounts = form.buffetCounts || {}
      const drinkCounts = form.drinkCounts || {}
      const isDinner = form.mode === 'dinner'
      
      // Calculate buffet revenue
      const adultCount = Number(buffetCounts.adult || 0)
      const bigKidCount = Number(buffetCounts.bigKid || 0)
      const smallKidCount = Number(buffetCounts.smallKid || 0)
      
      const settings = rootState.settings || {}
      const TAX_RATE = settings.TAX_RATE || 1.07
      const ADULTPRICE = settings.ADULTPRICE || 9.99
      const BIGKIDPRICE = settings.BIGKIDPRICE || 5.99
      const SMALLKIDPRICE = settings.SMALLKIDPRICE || 4.99
      const ADULTDINNERPRICE = settings.ADULTDINNERPRICE || 12.25
      const BIGKIDDINNERPRICE = settings.BIGKIDDINNERPRICE || 6.99
      const SMALLKIDDINNERPRICE = settings.SMALLKIDDINNERPRICE || 5.99
      const WATERPRICE = settings.WATERPRICE || 0.25
      const DRINKPRICE = settings.DRINKPRICE || 1.99
      
      // Calculate buffet revenue using decimal arithmetic
      let buffetSubtotal = new Decimal(0)
      if (isDinner) {
        buffetSubtotal = addMoney(buffetSubtotal, multiplyMoney(ADULTDINNERPRICE, adultCount))
        buffetSubtotal = addMoney(buffetSubtotal, multiplyMoney(BIGKIDDINNERPRICE, bigKidCount))
        buffetSubtotal = addMoney(buffetSubtotal, multiplyMoney(SMALLKIDDINNERPRICE, smallKidCount))
      } else {
        buffetSubtotal = addMoney(buffetSubtotal, multiplyMoney(ADULTPRICE, adultCount))
        buffetSubtotal = addMoney(buffetSubtotal, multiplyMoney(BIGKIDPRICE, bigKidCount))
        buffetSubtotal = addMoney(buffetSubtotal, multiplyMoney(SMALLKIDPRICE, smallKidCount))
      }
      
      // Calculate drink revenue using decimal arithmetic
      let drinkSubtotal = new Decimal(0)
      Object.entries(drinkCounts).forEach(([code, qty]) => {
        const quantity = Number(qty || 0)
        if (quantity <= 0) return
        // Check if it's water using the utility function
        const unitPrice = isWater(code) ? WATERPRICE : DRINKPRICE
        drinkSubtotal = addMoney(drinkSubtotal, multiplyMoney(unitPrice, quantity))
      })
      
      // Calculate total with tax using decimal arithmetic
      const subtotal = addMoney(buffetSubtotal, drinkSubtotal)
      const totalWithTax = applyTax(subtotal, TAX_RATE)
      const revenue = decimalToNumber(roundMoney(totalWithTax))
      
      // Only process if there's actual revenue or customers
      if (revenue > 0 || adultCount > 0 || bigKidCount > 0 || smallKidCount > 0) {
        // Update sales summary via sales module
        await dispatch('sales/addCashierSale', {
          revenue,
          adultCount,
          bigKidCount,
          smlKidCount: smallKidCount
        }, { root: true })
        
        // Add sales record to Firestore if enabled
        const useFirebase = rootState.firebase?.useFirebase
        const firebaseInitialized = rootState.firebase?.firebaseInitialized
        if (useFirebase && firebaseInitialized) {
          try {
            await Promise.all([
              firestore.addSalesRecord({
                tableNumber: null, // Cashier/walk-in orders don't have table numbers
                orderType: 'cashier',
                revenue: revenue,
                adultCount: adultCount,
                bigKidCount: bigKidCount,
                smlKidCount: smallKidCount
              }),
              incrementSalesCounters({
                revenue: revenue,
                adultCount: adultCount,
                bigKidCount: bigKidCount,
                smlKidCount: smallKidCount
              })
            ])
            logger.firestore.info('Cashier sales successfully saved (transaction)')
          } catch (err) {
            logger.firestore.error('[Firestore] Failed to save cashier sales:', err)
          }
        }
      }
      
      // Clear cashier form after payment
      commit('clearCashierForm')
    },
  }
}




