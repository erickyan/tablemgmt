/**
 * Firebase Module
 * Handles Firebase initialization, persistence, and sync state
 */

import * as firestore from '../../services/firestoreData.js'
import logger from '../../services/logger.js'

function formatSalesSummaryDoc(data) {
  const revenue = Number(data.revenue ?? 0)
  const totalTogo = Number(data.totalTogoRevenue ?? data.togoRevenue ?? 0)
  return {
    revenue: revenue.toFixed(2),
    totalCount: data.totalCount ?? 0,
    adultCount: data.adultCount ?? 0,
    bigKidCount: data.bigKidCount ?? 0,
    smlKidCount: data.smlKidCount ?? 0,
    totalTogoRevenue: totalTogo.toFixed(2),
    togoOrderCount: Number(data.togoOrderCount ?? 0)
  }
}

function getAppStateSnapshot(rootState) {
  const settingsState = rootState.settings || {}
  const uiState = rootState.ui || {}
  const salesState = rootState.sales || {}
  const menuState = rootState.menu || {}
  const togoState = rootState.togo || {}
  
  const snapshot = {
    isDinner: settingsState.isDinner || false,
    tableNum: uiState.tableNum || 0,
    catID: uiState.catID || 0,
    // Persist pricing + tax so admin changes survive reloads
    TAX_RATE: settingsState.TAX_RATE || 1.07,
    ADULTPRICE: settingsState.ADULTPRICE || 9.99,
    BIGKIDPRICE: settingsState.BIGKIDPRICE || 5.99,
    SMALLKIDPRICE: settingsState.SMALLKIDPRICE || 4.99,
    ADULTDINNERPRICE: settingsState.ADULTDINNERPRICE || 12.25,
    BIGKIDDINNERPRICE: settingsState.BIGKIDDINNERPRICE || 6.99,
    SMALLKIDDINNERPRICE: settingsState.SMALLKIDDINNERPRICE || 5.99,
    WATERPRICE: settingsState.WATERPRICE || 0.25,
    DRINKPRICE: settingsState.DRINKPRICE || 1.99,
    ticketCount: salesState.ticketCount || 0,
    receiptSettings: JSON.parse(JSON.stringify(settingsState.receiptSettings || { 
      showTicketCount: true,
      showPrintTime: true,
      headerText: 'China Buffet',
      subHeaderText: '',
      footerText: 'Thank you for dining with us!',
      thankYouText: 'Thank you for your order!',
      showGratuity: true,
      gratuityPercentages: [10, 15, 20],
      gratuityOnPreTax: false
    })),
    togoLines: JSON.parse(JSON.stringify(togoState.togoLines || [])),
    totalTogoPrice: togoState.totalTogoPrice || 0,
  }

  const firebaseState = rootState.firebase || {}
  if (!firebaseState.useFirebase) {
    snapshot.sales = JSON.parse(JSON.stringify(salesState.sales || {}))
    snapshot.tables = JSON.parse(JSON.stringify(rootState.tables?.tables || {}))
    snapshot.menu = JSON.parse(JSON.stringify(menuState.menu || []))
  }

  return snapshot
}

export default {
  namespaced: true,
  
  state: {
    useFirebase: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    firebaseInitialized: false,
    firebaseUnsubscribers: [],
    lastAppStateSyncedAt: null,
    persistenceStatus: {
      isSaving: false,
      lastSaved: null,
      error: null
    },
  },

  getters: {
    isFirebaseEnabled: (state) => {
      return state.useFirebase
    },
    isFirebaseInitialized: (state) => {
      return state.firebaseInitialized
    },
    getPersistenceStatus: (state) => {
      return state.persistenceStatus || {
        isSaving: false,
        lastSaved: null,
        error: null
      }
    },
  },

  mutations: {
    setFirebaseInitialized(state, value) {
      state.firebaseInitialized = value
    },
    
    setFirebaseUnsubscribers(state, unsubscribers = []) {
      // Unsubscribe from all existing listeners
      state.firebaseUnsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') {
          try {
            unsub()
          } catch (err) {
            logger.firestore.error('Failed to unsubscribe listener:', err)
          }
        }
      })
      state.firebaseUnsubscribers = Array.isArray(unsubscribers) ? unsubscribers : []
    },
    
    setAppStateSyncTimestamp(state, timestamp) {
      state.lastAppStateSyncedAt = timestamp
    },
    
    setPersistenceStatus(state, status) {
      if (status && typeof status === 'object') {
        if (typeof status.isSaving === 'boolean') {
          state.persistenceStatus.isSaving = status.isSaving
        }
        if (status.lastSaved !== undefined) {
          state.persistenceStatus.lastSaved = status.lastSaved
        }
        if (status.error !== undefined) {
          state.persistenceStatus.error = status.error
        }
      }
    },
  },

  actions: {
    /**
     * Initialize Firestore and register real-time listeners
     */
    async initializeFirebase({ commit, state, rootState }) {
      if (!state.useFirebase || state.firebaseInitialized) {
        return
      }
      
      const authState = rootState.auth || {}
      if (!authState.authUser) {
        logger.firestore.debug('Skipping initialization until user is authenticated')
        return
      }

      commit('ui/setLoadingState', { key: 'initializing', value: true }, { root: true })
      try {
        const unsubscribers = []

        const [menuDocs, tablesDocs, salesSummaryDoc, appStateDoc] = await Promise.all([
          firestore.loadMenu(),
          firestore.loadTables(),
          firestore.loadSalesSummary(),
          firestore.loadAppState()
        ])

        if (Array.isArray(menuDocs) && menuDocs.length > 0) {
          commit('menu/setMenu', menuDocs, { root: true })
          logger.firestore.info('Menu loaded:', menuDocs.length, 'categories')
        }

        // Handle both array (legacy) and object (new format) from Firestore
        if (tablesDocs && (Array.isArray(tablesDocs) ? tablesDocs.length > 0 : Object.keys(tablesDocs).length > 0)) {
          commit('tables/setTables', tablesDocs, { root: true })
          const tableCount = Array.isArray(tablesDocs) 
            ? tablesDocs.length 
            : Object.keys(tablesDocs).length
          logger.firestore.info('Tables loaded:', tableCount, 'tables')
        }

        if (salesSummaryDoc) {
          commit('sales/setSales', formatSalesSummaryDoc(salesSummaryDoc), { root: true })
          logger.firestore.info('Sales summary loaded')
        }

        if (appStateDoc) {
          // Restore app state to appropriate modules
          commit('settings/setDinnerMode', appStateDoc.isDinner, { root: true })
          commit('ui/setTableNum', appStateDoc.tableNum || 0, { root: true })
          commit('ui/setCategoryId', appStateDoc.catID || 0, { root: true })
          
          // Restore pricing settings
          if (appStateDoc.TAX_RATE || appStateDoc.ADULTPRICE) {
            commit('settings/updatePricingSettings', {
              taxRatePercent: appStateDoc.TAX_RATE ? (appStateDoc.TAX_RATE - 1) * 100 : undefined,
              adultLunch: appStateDoc.ADULTPRICE,
              bigKidLunch: appStateDoc.BIGKIDPRICE,
              smallKidLunch: appStateDoc.SMALLKIDPRICE,
              adultDinner: appStateDoc.ADULTDINNERPRICE,
              bigKidDinner: appStateDoc.BIGKIDDINNERPRICE,
              smallKidDinner: appStateDoc.SMALLKIDDINNERPRICE,
              waterPrice: appStateDoc.WATERPRICE,
              drinkPrice: appStateDoc.DRINKPRICE,
            }, { root: true })
          }
          
          if (appStateDoc.receiptSettings) {
            commit('settings/updateReceiptSettings', appStateDoc.receiptSettings, { root: true })
          }
          
          if (appStateDoc.ticketCount !== undefined) {
            commit('sales/setTicketCount', appStateDoc.ticketCount, { root: true })
          }
          
          if (appStateDoc.togoLines) {
            commit('togo/replaceTogoLines', { lines: appStateDoc.togoLines }, { root: true })
          }
          
          logger.firestore.info('App state snapshot loaded')
        }

        const menuUnsub = firestore.watchMenu(menu => {
          if (Array.isArray(menu) && menu.length > 0) {
            commit('menu/setMenu', menu, { root: true })
          }
        })
        unsubscribers.push(menuUnsub)

        const tablesUnsub = firestore.watchTables(tables => {
          commit('tables/setTables', tables, { root: true })
        })
        unsubscribers.push(tablesUnsub)

        const salesUnsub = firestore.watchSalesSummary(summary => {
          if (summary) {
            commit('sales/setSales', formatSalesSummaryDoc(summary), { root: true })
          }
        })
        unsubscribers.push(salesUnsub)

        const appStateUnsub = firestore.watchAppState(snapshot => {
          if (!snapshot) return
          const updatedAt = snapshot.updatedAt || null
          if (updatedAt && state.lastAppStateSyncedAt === updatedAt) {
            return
          }
          // Restore app state similar to above
          commit('settings/setDinnerMode', snapshot.isDinner, { root: true })
          if (snapshot.tableNum !== undefined) {
            commit('ui/setTableNum', snapshot.tableNum, { root: true })
          }
          // ... handle other app state restoration
        })
        unsubscribers.push(appStateUnsub)

        commit('setFirebaseUnsubscribers', unsubscribers)
        commit('setFirebaseInitialized', true)
        logger.firestore.info('Real-time listeners attached')

        // Save initial AppState snapshot
        const snapshot = getAppStateSnapshot(rootState)
        snapshot.timestamp = new Date().toISOString()
        const response = await firestore.saveAppState(snapshot)
        if (response && response.success) {
          commit('setAppStateSyncTimestamp', snapshot.timestamp)
          logger.firestore.debug('Initial AppState snapshot saved')
        }
      } catch (error) {
        logger.firestore.error('Failed to initialize Firestore:', error)
        commit('setFirebaseUnsubscribers', [])
        commit('setFirebaseInitialized', false)
      } finally {
        commit('ui/setLoadingState', { key: 'initializing', value: false }, { root: true })
      }
    },

    cleanupFirebase({ commit }) {
      commit('setFirebaseUnsubscribers', [])
      commit('setFirebaseInitialized', false)
    },

    /**
     * Save app state snapshot to Firestore
     */
    async saveAppState({ state, rootState, commit }) {
      if (!state.useFirebase || !state.firebaseInitialized) {
        return { error: 'Firebase not initialized' }
      }
      
      const authState = rootState.auth || {}
      if (!authState.authUser) {
        return { error: 'User not authenticated' }
      }
      
      try {
        const snapshot = getAppStateSnapshot(rootState)
        snapshot.timestamp = new Date().toISOString()
        const response = await firestore.saveAppState(snapshot)
        if (response && response.success) {
          const timestamp = response.updatedAt || snapshot.timestamp
          commit('setAppStateSyncTimestamp', timestamp)
          return { success: true, timestamp }
        }
        return { error: 'Save failed', response }
      } catch (error) {
        logger.firestore.error('Failed to save app state immediately:', error)
        return { error: error.toString() }
      }
    },

    /**
     * Save app state snapshot to Firestore immediately
     * Alias for saveAppState for backward compatibility
     */
    async saveAppStateImmediately(context, snapshot) {
      const { state, rootState, commit } = context
      
      if (!state.useFirebase || !state.firebaseInitialized) {
        return { error: 'Firebase not initialized' }
      }
      
      const authState = rootState.auth || {}
      if (!authState.authUser) {
        return { error: 'User not authenticated' }
      }
      
      try {
        // If snapshot is provided, use it; otherwise generate from current state
        const appStateSnapshot = snapshot || getAppStateSnapshot(rootState)
        if (!appStateSnapshot.timestamp) {
          appStateSnapshot.timestamp = new Date().toISOString()
        }
        
        const response = await firestore.saveAppState(appStateSnapshot)
        if (response && response.success) {
          const timestamp = response.updatedAt || appStateSnapshot.timestamp
          commit('setAppStateSyncTimestamp', timestamp)
          return { success: true, timestamp }
        }
        return { error: 'Save failed', response }
      } catch (error) {
        logger.firestore.error('Failed to save app state immediately:', error)
        return { error: error.toString() }
      }
    },
  }
}

