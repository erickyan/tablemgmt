import { createStore } from 'vuex'
import * as firestore from '../services/firestoreData'
import { auth } from '../firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { DRINK_OPTIONS, isWater } from '../utils/drinkOptions.js'

const ADMIN_EMAILS = (import.meta.env.VITE_FIREBASE_ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

import { 
  calculateDrinkPrice, 
  calculateTableTotal, 
  getPricingForMode,
  calculateTogoSubtotal,
  calculateTotalWithTax
} from '../services/pricingService.js'
import { shouldUseStoredPrice, tableHasActivity } from '../services/tableService.js'
import { DEFAULT_TAX_RATE } from '../constants/pricing.js'
import { DRINK_CODES } from '../constants/drinks.js'
import logger from '../services/logger.js'
import { errorHandler } from '../services/errorHandler.js'
import { normalizeMenu, denormalizeMenu, findMenuItemIdFromIndices } from '../utils/normalizeState.js'
import { validatePrice, validateTaxRatePercent, validateCount, validateTableNumber, assertNonNegativeInteger } from '../utils/validation.js'
import { incrementSalesCounters, optimisticUpdate } from '../services/firestoreTransactions.js'
import { createPersistencePlugin } from './plugins/persistencePlugin.js'

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

/**
 * Sync legacy togo state - DEPRECATED: This creates duplicate state
 * TODO: Remove seletedTogo and togoCustomizations, derive from togoLines when needed
 * 
 * @deprecated Use togoLines directly instead of seletedTogo
 */
const syncLegacyTogoState = (state) => {
  const selections = (state.togoLines || []).map(line => ({
    item: line.itemName,
    quantity: Number(line.quantity ?? 0),
    price: (Number(line.basePrice ?? 0) + Number(line.extraPrice ?? 0)).toFixed(2),
    id: Number.isInteger(line.categoryIndex) ? line.categoryIndex : null,
    nTerm: Number.isInteger(line.itemIndex) ? line.itemIndex : null,
    // Store menu item reference if available
    menuItemId: line.menuItemId || null
  }))
  state.seletedTogo = JSON.parse(JSON.stringify(selections))
  
  // Normalize customizations by item ID instead of name
  const customizations = {}
  state.togoLines.forEach(line => {
    const note = line.note || ''
    const extra = Number(line.extraPrice ?? 0)
    // Use menuItemId as key if available, otherwise fall back to itemName
    const key = line.menuItemId || line.itemName
    if (!customizations[key]) {
      customizations[key] = { 
        label: note, 
        price: extra,
        menuItemId: line.menuItemId || null
      }
    }
  })
  state.togoCustomizations = customizations
}

const recalcTogoTotals = (state) => {
  const items = (state.togoLines || []).map(line => ({
    price: Number(line.basePrice ?? 0) + Number(line.extraPrice ?? 0),
    quantity: Number(line.quantity ?? 0)
  }))
  
  const subtotal = calculateTogoSubtotal(items)
  state.totalTogoPrice = calculateTotalWithTax(subtotal, state.TAX_RATE).toFixed(2)
  syncLegacyTogoState(state)
}

/**
 * Vuex Store with Firebase Firestore & Authentication Integration
 *
 * Summary:
 * 1. Boots Firebase Auth, then attaches Firestore listeners once a user is signed in.
 * 2. Persists tables, sales, and AppState snapshots to Firestore (guarded by auth).
 * 3. Provides helpers for bulk menu/table population and clean teardown of listeners.
 *
 * If Firebase config or auth is unavailable, the store falls back to in-memory defaults.
 */

const store = createStore({
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
        authUser: null,
        authLoading: false,
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
        authError: null,
        authUnsubscriber: null,
        authRole: 'server',
        isDinner: false,
        language: 'en', // 'en' for English, 'zh' for Chinese
        sales:{
            totalCount: 0,
            adultCount: 0,
            bigKidCount: 0,
            smlKidCount: 0,
            revenue:0,
            totalTogoRevenue: 0
        },
        ticketCount: 0,  // Counter for all receipts printed (buffet and cashier)
        // Receipt display settings (editable from admin panel)
        receiptSettings: {
            showTicketCount: true,  // Show ticket counter on receipts
            showPrintTime: true,  // Show print time/date on receipts
            headerText: 'China Buffet',  // Header text on receipts
            subHeaderText: '',  // Sub-header text on receipts (optional)
            footerText: 'Thank you for dining with us!',  // Footer text on receipts
            thankYouText: 'Thank you for your order!',  // Thank you text for to-go orders
            showGratuity: true,  // Show gratuity section on receipts
            gratuityPercentages: [10, 15, 20],  // Gratuity percentage options
            gratuityOnPreTax: false,  // Calculate gratuity on pre-tax amount (true) or after-tax (false)
        },
        // Pricing + tax settings (editable from admin panel)
        TAX_RATE: DEFAULT_TAX_RATE, // stored as multiplier, e.g. 1.07 = 7% tax
        ADULTPRICE: 9.99,          // lunch prices
        BIGKIDPRICE: 5.99,
        SMALLKIDPRICE: 4.99,
        ADULTDINNERPRICE: 12.25,   // dinner prices
        BIGKIDDINNERPRICE: 6.99,
        SMALLKIDDINNERPRICE: 5.99,
        WATERPRICE: 0.25,
        DRINKPRICE:1.99,
        tableNum:0,
        orderPanel: {
            type: null,
            tableIndex: null
        },
        catID: 0,
        togoLines: [],
        nextTogoLineId: 1,
        seletedTogo: [],
        togoCustomizations: {},
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
        // Tables stored as object keyed by table number for O(1) lookups
        // Structure: { [tableNumber]: Table }
        tables: (() => {
            const tablesObj = {}
            for (let i = 1; i <= 10; i++) {
                tablesObj[i] = {
                    number: i,
                    name: null,
                    sitDownTime: "",
                    adult: 0,
                    bigKid: 0,
                    smlKid: 0,
                    drinks: [],
                    time: 0,
                    occupied: false,
                    drinkPrice: 0,
                    totalPrice: 0,
                    goodPpl: false,
                    togo: 0
                }
            }
            return tablesObj
        })(),

        totalTogoPrice: 0,
        tableOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        lastAppStateSyncedAt: null,
        // Normalized menu entities for efficient access
        // Structure: { categories: { [id]: Category }, menuItems: { [id]: MenuItem } }
        normalizedMenu: {
            categories: {},
            menuItems: {}
        },
        menu : [
        {
            category: 'Appetizers',
            items: [
            {
                name: 'Pork Egg Roll',
                quantity: 0,
                listPrice: 1.20
            },
            {
                name: 'Spring Roll(2)',
                quantity: 0,
                listPrice: 1.50
            },
            {
                name: 'Cream Cheese Wonton(8)',
                quantity: 0,
                listPrice: 4.99
            },
            {
                name: 'Teriyaki Chicken(4)',
                quantity: 0,
                listPrice: 5.25
            },
            {
                name: 'Fried Shrimp(20)',
                quantity: 0,
                listPrice: 4.99
            },
            {
                name: 'Fried Chicken Wing(4)',
                quantity: 0,
                listPrice: 6.99
            },
            {
                name: 'Fried Dumpling(8)',
                quantity: 0,
                listPrice: 6.99
            },
            {
                name: 'Steamed Dumpling(8)',
                quantity: 0,
                listPrice: 6.99
            }
            ]
        },
        {
            category: 'Soup',
            items: [
            {
                name: 'Pt. Wanton Soup',
                quantity: 0,
                listPrice: 2.75
            },
            {
                name: 'Qt. Wanton Soup',
                quantity: 0,
                listPrice: 4.25
            },
            {
                name: 'Pt. Egg Drop Soup',
                quantity: 0,
                listPrice: 2.75
            },
            {
                name: 'Qt. Egg Drop Soup',
                quantity: 0,
                listPrice: 4.25
            },
            {
                name: 'Pt. Wonton Egg Drop Soup',
                quantity: 0,
                listPrice: 3.00
            },
            {
                name: 'Qt. Wonton Egg Drop Soup',
                quantity: 0,
                listPrice: 4.50
            },
            {
                name: 'Pt. Chicken Noodle Soup',
                quantity: 0,
                listPrice: 3.00
            },
            {
                name: 'Qt. Chicken Noodle Soup',
                quantity: 0,
                listPrice: 4.50
            },
            {
                name: 'Pt. Chicken Rice Soup',
                quantity: 0,
                listPrice: 3.00
            },
            {
                name: 'Qt. Chicken Rice Soup',
                quantity: 0,
                listPrice: 4.50
            },
            {
                name: 'Pt. Hot & Sour Soup',
                quantity: 0,
                listPrice: 2.75
            },
            {
                name: 'Qt. Hot & Sour Soup',
                quantity: 0,
                listPrice: 4.25
            }
            ]
        },
        {
            category: 'Lo Mein',
            items: [
            {
                name: 'Pt. Vegetable Lo Mein',
                quantity: 0,
                listPrice: 4.00
            },
            {
                name: 'Qt. Vegetable Lo Mein',
                quantity: 0,
                listPrice: 7.00
            },
            {
                name: 'Pt. Roast Pork Lo Mein',
                quantity: 0,
                listPrice: 5.00
            },
            {
                name: 'Qt. Roast Pork Lo Mein',
                quantity: 0,
                listPrice: 8.50
            },
            {
                name: 'Pt. Chicken Lo Mein',
                quantity: 0,
                listPrice: 5.00
            },
            {
                name: 'Qt. Chicken Lo Mein',
                quantity: 0,
                listPrice: 8.50
            },
            {
                name: 'Pt. Beef Lo Mein',
                quantity: 0,
                listPrice: 5.00
            },
            {
                name: 'Qt. Beef Lo Mein',
                quantity: 0,
                listPrice: 8.50
            },
            {
                name: 'Pt. Shrimp Lo Mein',
                quantity: 0,
                listPrice: 5.00
            },
            {
                name: 'Qt. Shrimp Lo Mein',
                quantity: 0,
                listPrice: 8.50
            },
            {
                name: 'House Special Lo Mein',
                quantity: 0,
                listPrice: 9.00
            }
            ]
        },
        {
            category: 'Chow Fun',
            items: [
            {
                name: 'Vegetable Chow Fun',
                quantity: 0,
                listPrice: 7.00
            },
            {
                name: 'Roast Pork Chow Fun',
                quantity: 0,
                listPrice: 7.75
            },
            {
                name: 'Chicken Chow Fun',
                quantity: 0,
                listPrice: 7.75
            },
            {
                name: 'Beef Chow Fun',
                quantity: 0,
                listPrice: 7.75
            },
            {
                name: 'Shrimp Chow Fun',
                quantity: 0,
                listPrice: 7.75
            },
            {
                name: 'House Special Chow Fun',
                quantity: 0,
                listPrice: 8.75
            },
            {
                name: 'Singapore Chow Fun',
                quantity: 0,
                listPrice: 8.75
            },
            ]
        },
        {
            category: 'Vegetable',
            items: [
            {
                name: 'Broccoli w. Brown Sauce',
                quantity: 0,
                listPrice: 7.00
            },
            {
                name: 'Mixed Vegetable',
                quantity: 0,
                listPrice: 7.00
            },
            {
                name: 'Broccoli w. Garlic Sauce',
                quantity: 0,
                listPrice: 7.00
            },
            {
                name: 'Bean Curd Szechuan Style',
                quantity: 0,
                listPrice: 7.00
            },
            ]
        },
        {
            category: 'Side Order',
            items: [
            {
                name: 'Pt. White Rice',
                quantity: 0,
                listPrice: 2.00
            },
            {
                name: 'Qt. White RIce',
                quantity: 0,
                listPrice: 3.00
            },
            {
                name: 'Fried Noodle',
                quantity: 0,
                listPrice: 0.75
            },
            ]
        },
        {
            category: 'Chef\'s Special',
            items: [
            {
                name: 'Peanut Chicken',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Sesame Chicken',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Black Pepper Chicken',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Mongolian Beef',
                quantity: 0,
                listPrice: 9.75
            },
            {
                name: 'Happy Family',
                quantity: 0,
                listPrice: 11.50
            },
            {
                name: 'Orange Chicken',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'General Tso\'s Chicken',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Hunan Double Style',
                quantity: 0,
                listPrice: 10.50
            },
            ]
        },
        {
            category: 'Chicken',
            items: [
            {
                name: 'Pt. Sweet & Sour Chicken',
                quantity: 0,
                listPrice: 5.50
            },
            {
                name: 'Qt. Sweet & Sour Chicken',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Chicken w. Fresh Mushroom',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Chicken w. Chinese Vegetable',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Chicken w. Broccoli',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Chicken with Cashew Nut',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Chicken w. Mixed Vegetable',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Moo Goo Gai Pan',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Curry Chicken w. Onion',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Chicken w. Garlic Sauce',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Kung Po Chicken',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Hunan Chicken',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Szechuan Chicken',
                quantity: 0,
                listPrice: 9.00
            },
            {
                name: 'Hot & Spicy Chicken',
                quantity: 0,
                listPrice: 9.00
            },
            ]
        },
        {
            category: 'Seafood',
            items: [
            {
                name: 'Jumbo Shrimp w. Lobster Sauce',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Jumbo Shrimp w. Chinese Vegetable',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Jumbo Shrimp w. Pepper & Onion',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Jumbo Shrimp w. Broccoli',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Jumbo Shrimp w. Fresh Mushroom',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Jumbo Shrimp w. Cashew Nut',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Jumbo Shrimp w. Mixed Vegetable',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Jumbo Shrimp w. Garlic Sauce',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Jumbo Shrimp Hunan Style ',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Kung Po Shrimp',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Szechuan Shrimp',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Hot & Spicy Shrimp',
                quantity: 0,
                listPrice: 9.50
            },
            ]
        },
        {
            category: 'Beef',
            items: [
            {
                name: 'Beef w. Chinese Vegetable',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Pepper Steak w. Onion',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Beef w. Fresh Mushroom',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Beef w. Broccoli',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Beef w. Mixed Vegetable',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Curry Beef w. Onion',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Beef w. Garlic Sauce',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Szechuan Beef',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Hunan Beef',
                quantity: 0,
                listPrice: 9.50
            },
            {
                name: 'Hot & Spicy Beef',
                quantity: 0,
                listPrice: 9.50
            },
            ]
        }
        ]
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
        // set ppl number - with bounds validation
        increaseAdult(state){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            // Validate bounds (max 999 guests per table)
            try {
                assertNonNegativeInteger(table.adult, 'table.adult')
                const currentCount = table.adult
                if (currentCount < 999) {
                    table.adult = currentCount + 1
                    // Mark table as occupied if it has activity
                    if (tableHasActivity(table) && !table.occupied) {
                        table.occupied = true
                    }
                    persistTableByNumber(state, tableNumber)
                } else {
                    logger.store.warn('Maximum adult count reached (999)')
                }
            } catch (err) {
                logger.store.error('Invalid adult count:', err)
                table.adult = 0
            }
        },
        decreaseAdult(state){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            try {
                assertNonNegativeInteger(table.adult, 'table.adult')
                const currentCount = table.adult
                if (currentCount > 0) {
                    table.adult = currentCount - 1
                    // Update occupied status based on activity
                    if (!tableHasActivity(table)) {
                        table.occupied = false
                    }
                    persistTableByNumber(state, tableNumber)
                }
            } catch (err) {
                logger.store.error('Invalid adult count:', err)
                table.adult = 0
            }
        },
        increaseBigKid(state){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            // Validate bounds (max 999 guests per table)
            try {
                assertNonNegativeInteger(table.bigKid, 'table.bigKid')
                const currentCount = table.bigKid
                if (currentCount < 999) {
                    table.bigKid = currentCount + 1
                    // Mark table as occupied if it has activity
                    if (tableHasActivity(table) && !table.occupied) {
                        table.occupied = true
                    }
                    persistTableByNumber(state, tableNumber)
                } else {
                    logger.store.warn('Maximum big kid count reached (999)')
                }
            } catch (err) {
                logger.store.error('Invalid big kid count:', err)
                table.bigKid = 0
            }
        },
        decreaseBidKid(state){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            try {
                assertNonNegativeInteger(table.bigKid, 'table.bigKid')
                const currentCount = table.bigKid
                if (currentCount > 0) {
                    table.bigKid = currentCount - 1
                    // Update occupied status based on activity
                    if (!tableHasActivity(table)) {
                        table.occupied = false
                    }
                    persistTableByNumber(state, tableNumber)
                }
            } catch (err) {
                logger.store.error('Invalid big kid count:', err)
                table.bigKid = 0
            }
        },
        increaseSmlKid(state){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            // Validate bounds (max 999 guests per table)
            try {
                assertNonNegativeInteger(table.smlKid, 'table.smlKid')
                const currentCount = table.smlKid
                if (currentCount < 999) {
                    table.smlKid = currentCount + 1
                    // Mark table as occupied if it has activity
                    if (tableHasActivity(table) && !table.occupied) {
                        table.occupied = true
                    }
                    persistTableByNumber(state, tableNumber)
                } else {
                    logger.store.warn('Maximum small kid count reached (999)')
                }
            } catch (err) {
                logger.store.error('Invalid small kid count:', err)
                table.smlKid = 0
            }
        },
        decreaseSmlKid(state){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            try {
                assertNonNegativeInteger(table.smlKid, 'table.smlKid')
                const currentCount = table.smlKid
                if (currentCount > 0) {
                    table.smlKid = currentCount - 1
                    // Update occupied status based on activity
                    if (!tableHasActivity(table)) {
                        table.occupied = false
                    }
                    persistTableByNumber(state, tableNumber)
                }
            } catch (err) {
                logger.store.error('Invalid small kid count:', err)
                table.smlKid = 0
            }
        },
        addDrink(state, drink){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (table) {
                table.drinks.push(drink)
                table.drinks.sort()
                // Mark table as occupied if it has activity
                if (tableHasActivity(table) && !table.occupied) {
                    table.occupied = true
                }
                persistTableByNumber(state, tableNumber)
            }
        },
        setTableOccupied(state, payload = {}) {
            // payload.index can be either a table number or legacy index
            const tableNumber = getTableNumber(state, payload.index ?? state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            table.occupied = !!payload.value
            persistTableByNumber(state, tableNumber)
        },
        updateTableGoodPpl(state, value){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (table) {
                table.goodPpl = value
                persistTableByNumber(state, tableNumber)
            }
        },
        calculateTotal(state){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            
            // If table is already occupied OR has a totalPrice set, don't recalculate price
            // Prices should remain fixed once a table is seated, has been printed, or has a price set
            if (shouldUseStoredPrice(table)) {
                return
            }
            
            // change table to occupied
            table.occupied = true
            
            // Calculate drink price using service
            table.drinkPrice = calculateDrinkPrice(
                table.drinks || [],
                state.WATERPRICE,
                state.DRINKPRICE
            )
            
            // Store the pricing mode used when calculating this table's price
            // This ensures line items always show the correct prices even after mode changes
            table.pricingModeDinner = state.isDinner
            
            // Get pricing for current mode
            const pricing = getPricingForMode({
                isDinner: state.isDinner,
                prices: {
                    ADULTPRICE: state.ADULTPRICE,
                    BIGKIDPRICE: state.BIGKIDPRICE,
                    SMALLKIDPRICE: state.SMALLKIDPRICE,
                    ADULTDINNERPRICE: state.ADULTDINNERPRICE,
                    BIGKIDDINNERPRICE: state.BIGKIDDINNERPRICE,
                    SMALLKIDDINNERPRICE: state.SMALLKIDDINNERPRICE,
                    DRINKPRICE: state.DRINKPRICE,
                    WATERPRICE: state.WATERPRICE
                }
            })
            
            // Calculate total using service
            table.totalPrice = calculateTableTotal({
                adultCount: table.adult,
                bigKidCount: table.bigKid,
                smlKidCount: table.smlKid,
                drinkPrice: table.drinkPrice,
                pricing,
                taxRate: state.TAX_RATE
            }).toFixed(2)
            persistCurrentTable(state)
        },
        getTimestamp(state, tableIndex){
            // tableIndex can be either a table number or legacy index
            const tableNumber = getTableNumber(state, tableIndex ?? state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            const today = new Date();
            const hours = String(today.getHours()).padStart(2, '0')
            const minutes = String(today.getMinutes()).padStart(2, '0')
            const now = `${hours}:${minutes}`
            table.sitDownTime = now
            persistTableByNumber(state, tableNumber)
        },
        setTableSitDownTime(state, payload = {}) {
            // payload.index can be either a table number or legacy index
            const tableNumber = getTableNumber(state, payload.index ?? state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            const value = typeof payload.value === 'string' ? payload.value : ''
            table.sitDownTime = value
            persistTableByNumber(state, tableNumber)
        },
        clearEverything(state){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            table.sitDownTime = ""
            table.adult = 0
            table.bigKid = 0
            table.smlKid = 0
            table.drinks = []
            table.drinkPrice = 0
            table.totalPrice = 0
            table.goodPpl = false
            table.occupied = false
            delete table.pricingModeDinner
            persistTableByNumber(state, tableNumber)
        },
        // saveFile(state) {
        //     const data = JSON.stringify(state.tables)
        //     const fs = require('fs')
        //     try { fs.writeFileSync('myfile.txt', data, 'utf-8'); }
        //     catch(e) { alert('Failed to save the file !'); }
        // }
        // rev = price+price 
        // count = 
        /**
         * Process payment for a table
         * 
         * CHANGES MADE:
         * 1. Always recalculates total before payment (no need to click "Update" first)
         * 2. Updates sales in state immediately (UI updates right away)
         * 3. Syncs to Firestore asynchronously (doesn't block UI)
         * 4. Comprehensive logging for debugging
         * 5. Validates revenue and customer counts before processing
         * 
         * This mutation:
         * - Calculates total price based on customers and drinks
         * - Updates sales summary in state (revenue, customer counts)
         * - Adds sales record to Firestore
         * - Updates sales summary in Firestore
         * - Clears the table after payment
         */
        paid(state){
            const tableNumber = getTableNumber(state, state.tableNum)
            const table = getTableByNumber(state, tableNumber)
            const adultCount = parseInt(table.adult) || 0
            const bigKidCount = parseInt(table.bigKid) || 0
            const smlKidCount = parseInt(table.smlKid) || 0
            const drinks = table.drinks || []
            
            // If table is already occupied OR has a totalPrice set, preserve existing totalPrice
            // Don't recalculate based on current mode - use the price that was set when seated
            // This ensures prices remain fixed for occupied/seated tables when mode changes
            const hasPriceSet = table.totalPrice && parseFloat(table.totalPrice) > 0
            const shouldPreservePrice = table.occupied || hasPriceSet || (table.time && table.time > 0)
            
            // Always recalculate total before payment to ensure accuracy
            // This ensures the total is always correct, even if "Update" wasn't clicked
            // Calculate drink prices
            let numWater = 0
            let numDrink = 0
            if (drinks.length > 0) {
                let result = {}
                drinks.forEach((x) => {
                    result[x] = result[x] || 0
                    result[x]++
                })
                if (result.WTER != null) {
                    numWater = result.WTER
                }
                numDrink = drinks.length - numWater
            }
            
            table.drinkPrice = state.WATERPRICE * numWater + state.DRINKPRICE * numDrink
            
            let revenue = 0
            // Only recalculate total price if table is not already occupied with a price set
            // This preserves prices for seated/printed tables when mode changes
            if (!shouldPreservePrice) {
                // Store the pricing mode used when calculating this table's price
                table.pricingModeDinner = state.isDinner
                // Calculate total price based on lunch/dinner
                let subtotal = table.drinkPrice
                if (state.isDinner) {
                    subtotal += (adultCount * state.ADULTDINNERPRICE) + (bigKidCount * state.BIGKIDDINNERPRICE) + (smlKidCount * state.SMALLKIDDINNERPRICE)
                } else {
                    subtotal += (adultCount * state.ADULTPRICE) + (bigKidCount * state.BIGKIDPRICE) + (smlKidCount * state.SMALLKIDPRICE)
                }
                
                revenue = parseFloat((subtotal * state.TAX_RATE).toFixed(2))
                table.totalPrice = revenue.toFixed(2)
            } else {
                // Use existing totalPrice if preserving price
                // Don't update pricingModeDinner - keep the original mode that was used
                revenue = parseFloat(table.totalPrice) || 0
            }
            
            table.occupied = true
            
            // Only process payment if there's actual revenue or customers
            if (revenue > 0 || adultCount > 0 || bigKidCount > 0 || smlKidCount > 0) {
                // Update sales summary in state (this updates the UI immediately)
                const currentRevenue = parseFloat(state.sales.revenue) || 0
                const currentAdultCount = parseInt(state.sales.adultCount) || 0
                const currentBigKidCount = parseInt(state.sales.bigKidCount) || 0
                const currentSmlKidCount = parseInt(state.sales.smlKidCount) || 0
                
                state.sales.revenue = (currentRevenue + revenue).toFixed(2)
                state.sales.adultCount = currentAdultCount + adultCount
                state.sales.bigKidCount = currentBigKidCount + bigKidCount
                state.sales.smlKidCount = currentSmlKidCount + smlKidCount
                state.sales.totalCount = state.sales.adultCount + state.sales.bigKidCount + state.sales.smlKidCount
                
                console.log('Sales updated:', {
                    revenue: state.sales.revenue,
                    adultCount: state.sales.adultCount,
                    bigKidCount: state.sales.bigKidCount,
                    smlKidCount: state.sales.smlKidCount,
                    totalCount: state.sales.totalCount,
                    tableRevenue: revenue,
                    tableNumber: table.number
                })
                
            // Add sales record to Firestore if enabled - with transaction for race condition prevention
                if (state.useFirebase && state.firebaseInitialized) {
                    // Use optimistic update for immediate UI feedback, then persist with transaction
                    const optimisticRollback = () => {
                        // Rollback state changes
                        state.sales.revenue = (currentRevenue).toFixed(2)
                        state.sales.adultCount = currentAdultCount
                        state.sales.bigKidCount = currentBigKidCount
                        state.sales.smlKidCount = currentSmlKidCount
                        state.sales.totalCount = state.sales.adultCount + state.sales.bigKidCount + state.sales.smlKidCount
                        logger.store.warn('Sales update rolled back due to failure')
                    }
                    
                    optimisticUpdate(
                        () => optimisticRollback, // Return rollback function
                        async () => {
                            // Persist with atomic transaction to prevent race conditions
                            await Promise.all([
                                firestore.addSalesRecord({
                                    tableNumber: table.number,
                                    orderType: 'dine-in',
                                    revenue: revenue,
                                    adultCount: adultCount,
                                    bigKidCount: bigKidCount,
                                    smlKidCount: smlKidCount
                                }),
                                incrementSalesCounters({
                                    revenue: revenue,
                                    adultCount: adultCount,
                                    bigKidCount: bigKidCount,
                                    smlKidCount: smlKidCount
                                })
                            ])
                            logger.firestore.info('Sales successfully saved (transaction)')
                        },
                        { retry: true, maxRetries: 3 }
                    ).then(result => {
                        if (!result.success) {
                            logger.firestore.error('Failed to save sales after retries:', result.error)
                        }
                    }).catch(err => {
                        logger.firestore.error('[Firestore] Failed to save sales:', err)
                    })
                }
            } else {
                console.warn('Payment attempted but no revenue or customers to process')
            }
            
            // resetting table (always clear table after payment attempt)
            table.sitDownTime=""
            table.adult=0
            table.bigKid=0
            table.smlKid=0
            table.drinks=[]
            table.drinkPrice=0
            table.totalPrice=0
            table.goodPpl=false
            table.occupied = false
            delete table.pricingModeDinner
            persistCurrentTable(state)
        },



        // to-go order lines - with validation
        appendTogoLines(state, lines = []) {
            if (!Array.isArray(lines)) {
                logger.store.warn('appendTogoLines: lines must be an array')
                return
            }
            
            lines.forEach(line => {
                if (!line || typeof line !== 'object') {
                    return
                }
                
                // Validate quantity (must be positive integer, max 999)
                const quantityValidation = validateCount(line.quantity, { max: 999, required: true })
                if (!quantityValidation.valid || quantityValidation.value <= 0) {
                    logger.store.warn('Invalid quantity in togo line:', quantityValidation.error)
                    return
                }
                const quantity = quantityValidation.value
                
                // Validate prices
                const basePriceValidation = validatePrice(line.basePrice ?? line.price ?? 0)
                const basePrice = basePriceValidation.valid ? basePriceValidation.value : 0
                
                const extraPriceValidation = validatePrice(line.extraPrice ?? line.extra ?? 0)
                const extraPrice = extraPriceValidation.valid ? extraPriceValidation.value : 0
                
                // Validate item name (required, max 200 chars)
                const itemName = typeof (line.itemName || line.item) === 'string'
                    ? (line.itemName || line.item).trim().slice(0, 200)
                    : ''
                
                if (!itemName) {
                    logger.store.warn('appendTogoLines: itemName is required')
                    return
                }
                
                // Validate note (max 500 chars)
                const note = typeof line.note === 'string'
                    ? line.note.trim().slice(0, 500)
                    : ''
                
                const categoryIndex = Number.isInteger(line.categoryIndex) ? line.categoryIndex : (Number.isInteger(line.id) ? line.id : null)
                const itemIndex = Number.isInteger(line.itemIndex) ? line.itemIndex : (Number.isInteger(line.nTerm) ? line.nTerm : null)
                
                // Try to find menuItemId from normalized menu structure
                let menuItemId = line.menuItemId || null
                if (!menuItemId && Number.isInteger(categoryIndex) && Number.isInteger(itemIndex)) {
                    menuItemId = findMenuItemIdFromIndices(state.menu, categoryIndex, itemIndex)
                }
                
                // Check for existing line - prefer menuItemId if available, otherwise match by name/price/note
                const existing = menuItemId
                    ? state.togoLines.find(entry => entry.menuItemId === menuItemId && entry.note === note)
                    : state.togoLines.find(entry =>
                        entry.itemName === itemName &&
                        entry.note === note &&
                        Math.abs(entry.basePrice - basePrice) < 0.0001 &&
                        Math.abs(entry.extraPrice - extraPrice) < 0.0001
                    )
                
                if (existing) {
                    existing.quantity += quantity
                    // Update menuItemId if it wasn't set before
                    if (!existing.menuItemId && menuItemId) {
                        existing.menuItemId = menuItemId
                    }
                } else {
                    state.togoLines.push({
                        lineId: state.nextTogoLineId++,
                        itemName,
                        categoryIndex,
                        itemIndex,
                        menuItemId, // Store reference to normalized menu item
                        quantity,
                        basePrice,
                        extraPrice,
                        note
                    })
                }
            })
            recalcTogoTotals(state)
        },
        updateTogoLine(state, payload = {}) {
            if (!payload || typeof payload !== 'object') {
                logger.store.warn('updateTogoLine: payload must be an object')
                return
            }
            
            const lineId = payload.lineId
            if (typeof lineId !== 'number' || !Number.isInteger(lineId) || lineId <= 0) {
                logger.store.warn('updateTogoLine: lineId must be a positive integer')
                return
            }
            
            const line = state.togoLines.find(entry => entry.lineId === lineId)
            if (!line) {
                logger.store.warn('updateTogoLine: line not found:', lineId)
                return
            }
            
            // Validate and update quantity (max 999)
            if (payload.quantity !== undefined) {
                const quantityValidation = validateCount(payload.quantity, { max: 999 })
                if (quantityValidation.valid) {
                    line.quantity = quantityValidation.value
                } else {
                    logger.store.warn('Invalid quantity in updateTogoLine:', quantityValidation.error)
                }
            }
            
            // Validate and update note (max 500 chars)
            if (payload.note !== undefined) {
                const note = typeof payload.note === 'string' ? payload.note.trim().slice(0, 500) : ''
                line.note = note
            }
            
            // Validate and update basePrice
            if (payload.basePrice !== undefined) {
                const basePriceValidation = validatePrice(payload.basePrice)
                if (basePriceValidation.valid) {
                    line.basePrice = basePriceValidation.value
                } else {
                    logger.store.warn('Invalid basePrice in updateTogoLine:', basePriceValidation.error)
                }
            }
            
            // Validate and update extraPrice
            if (payload.extraPrice !== undefined) {
                const extraPriceValidation = validatePrice(payload.extraPrice)
                if (extraPriceValidation.valid) {
                    line.extraPrice = extraPriceValidation.value
                } else {
                    logger.store.warn('Invalid extraPrice in updateTogoLine:', extraPriceValidation.error)
                }
            }
            
            // Update menuItemId if provided (validate it's a string or null)
            if (payload.menuItemId !== undefined) {
                line.menuItemId = (typeof payload.menuItemId === 'string' && payload.menuItemId.trim())
                    ? payload.menuItemId.trim()
                    : null
            }
            
            // Remove line if quantity is 0 or less
            if (line.quantity <= 0) {
                state.togoLines = state.togoLines.filter(entry => entry.lineId !== line.lineId)
            }
            
            recalcTogoTotals(state)
        },
        removeTogoLine(state, lineId) {
            state.togoLines = state.togoLines.filter(entry => entry.lineId !== lineId)
            recalcTogoTotals(state)
        },
        replaceTogoLines(state, lines = []) {
            state.togoLines = []
            state.nextTogoLineId = 1
            lines.forEach(line => {
                if (!line || Number(line.quantity) <= 0) {
                    return
                }
                state.togoLines.push({
                    lineId: state.nextTogoLineId++,
                    itemName: line.itemName || line.item,
                    categoryIndex: Number.isInteger(line.categoryIndex) ? line.categoryIndex : (Number.isInteger(line.id) ? line.id : null),
                    itemIndex: Number.isInteger(line.itemIndex) ? line.itemIndex : (Number.isInteger(line.nTerm) ? line.nTerm : null),
                    quantity: Number(line.quantity ?? 0),
                    basePrice: Number(line.basePrice ?? line.price ?? 0),
                    extraPrice: Number(line.extraPrice ?? line.extra ?? 0),
                    note: (line.note || '').trim()
                })
            })
            recalcTogoTotals(state)
        },
        clearTogoLines(state) {
            state.togoLines = []
            state.nextTogoLineId = 1
            resetMenuQuantities(state.menu)
            recalcTogoTotals(state)
        },
        togoPaid(state){
            // Recalculate togo total before payment (ensure price is up to date)
            const orderItems = state.togoLines.map(line => ({
                name: line.itemName,
                quantity: line.quantity,
                price: (line.basePrice + line.extraPrice),
                note: line.note,
                basePrice: line.basePrice,
                extraCharge: line.extraPrice
            }))
            const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
            const togoRevenue = (subtotal * state.TAX_RATE).toFixed(2)
            state.totalTogoPrice = (subtotal * state.TAX_RATE).toFixed(2)
            state.sales.totalTogoRevenue = Number(state.sales.totalTogoRevenue || 0) + Number(state.totalTogoPrice || 0)
            
            if (state.useFirebase && state.firebaseInitialized) {
                Promise.all([
                    firestore.addTogoSalesRecord({
                        createdAt: Date.now(),
                        items: orderItems,
                        subtotal,
                        total: parseFloat(togoRevenue),
                        taxRate: state.TAX_RATE
                    }),
                    firestore.saveSalesSummary(buildSalesSummaryForFirestore(state.sales))
                ]).then(() => {
                    logger.firestore.info('To-go sales successfully saved')
                }).catch(err => {
                    // Errors in mutations should not throw - they are fire-and-forget
                    // But we should log them and let errorHandler handle if needed
                    logger.firestore.error('Failed to save to-go sales:', err)
                    // Note: Error handling for mutations is tricky - we can't easily show
                    // user notifications from mutations. Errors should be handled at the action level.
                })
            }
            
            state.togoLines = []
            state.nextTogoLineId = 1
            state.catID = 0
            resetMenuQuantities(state.menu)
            recalcTogoTotals(state)
        },
        
        // Mutations for Firestore integration
        setFirebaseInitialized(state, value) {
            state.firebaseInitialized = value
        },
        setLoadingState(state, { key, value }) {
            if (state.loadingStates && key in state.loadingStates) {
                state.loadingStates[key] = value
            }
        },
        setFirebaseUnsubscribers(state, unsubscribers = []) {
            state.firebaseUnsubscribers.forEach(unsub => {
                if (typeof unsub === 'function') {
                    try {
                        unsub()
                    } catch (err) {
                        console.error('[Firestore] Failed to unsubscribe listener:', err)
                    }
                }
            })
            state.firebaseUnsubscribers = Array.isArray(unsubscribers) ? unsubscribers : []
        },
        setAuthLoading(state, value) {
            state.authLoading = value
        },
        setAuthUser(state, user) {
            state.authUser = user ? {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName
            } : null
        },
        setAuthError(state, error) {
            state.authError = error || null
        },
        setAuthUnsubscriber(state, unsub) {
            if (state.authUnsubscriber && typeof state.authUnsubscriber === 'function') {
                try {
                    state.authUnsubscriber()
                } catch (err) {
                    console.error('[Firebase] Failed to remove auth listener:', err)
                }
            }
            state.authUnsubscriber = typeof unsub === 'function' ? unsub : null
        },
        setAuthRole(state, role) {
            state.authRole = role === 'admin' ? 'admin' : 'server'
        },
        setMenu(state, menu) {
            state.menu = menu
            resetMenuQuantities(state.menu)
            
            // Normalize menu structure for efficient access
            // Store normalized entities alongside original structure for backward compatibility
            state.normalizedMenu = normalizeMenu(menu)
            
            // Extract drink price from menu if "Drinks" category exists
            const drinksCategory = state.menu.find(cat => 
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
                // If found, update DRINKPRICE
                if (drinkItem && drinkItem.listPrice > 0) {
                    state.DRINKPRICE = Number(drinkItem.listPrice)
                    console.log('[Menu] Updated DRINKPRICE from menu:', state.DRINKPRICE)
                }
            }
        },
        setTables(state, tables) {
            // Convert array to object keyed by table number
            // This eliminates alignment issues - tables are accessed by number, not index
            const tablesObj = {}
            
            // Handle both array and object input (for migration compatibility)
            const tablesArray = Array.isArray(tables) ? tables : Object.values(tables || {})
            
            tablesArray.forEach(table => {
                if (table && table.number) {
                    const number = Number(table.number)
                    if (number > 0) {
                        tablesObj[number] = {
                            ...table,
                            number // Ensure number is set
                        }
                    }
                }
            })
            
            // Ensure all tables in tableOrder exist (create empty entries if missing)
            const tableOrderNumbers = (state.tableOrder || []).filter(num => num > 0)
            tableOrderNumbers.forEach(number => {
                if (!tablesObj[number]) {
                    tablesObj[number] = {
                        number,
                        name: null,
                        sitDownTime: '',
                        adult: 0,
                        bigKid: 0,
                        smlKid: 0,
                        drinks: [],
                        time: 0,
                        occupied: false,
                        drinkPrice: 0,
                        totalPrice: 0,
                        goodPpl: false,
                        togo: 0
                    }
                }
            })
            
            state.tables = tablesObj
        },
        setSales(state, sales) {
            state.sales = sales
        },
        setDinnerMode(state, value) {
            const isDinner = !!value
            if (state.isDinner === isDinner) {
                return
            }
            state.isDinner = isDinner
            // Do not recalculate prices for occupied/seated or printed tables
            // Prices should remain fixed once a table is seated or has been printed
        },
        setLanguage(state, lang) {
            state.language = lang === 'zh' ? 'zh' : 'en'
        },
        toggleLanguage(state) {
            state.language = state.language === 'zh' ? 'en' : 'zh'
        },
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
        /**
         * Process cashier receipt payment
         * Adds sales to total revenue and resets the cashier form
         */
        processCashierPayment(state) {
            const form = state.cashierForm || {}
            const buffetCounts = form.buffetCounts || {}
            const drinkCounts = form.drinkCounts || {}
            const isDinner = form.mode === 'dinner'
            
            // Calculate buffet revenue
            const adultCount = Number(buffetCounts.adult || 0)
            const bigKidCount = Number(buffetCounts.bigKid || 0)
            const smallKidCount = Number(buffetCounts.smallKid || 0)
            
            let buffetSubtotal = 0
            if (isDinner) {
                buffetSubtotal = (adultCount * state.ADULTDINNERPRICE) + 
                                (bigKidCount * state.BIGKIDDINNERPRICE) + 
                                (smallKidCount * state.SMALLKIDDINNERPRICE)
            } else {
                buffetSubtotal = (adultCount * state.ADULTPRICE) + 
                                (bigKidCount * state.BIGKIDPRICE) + 
                                (smallKidCount * state.SMALLKIDPRICE)
            }
            
            // Calculate drink revenue
            let drinkSubtotal = 0
            Object.entries(drinkCounts).forEach(([code, qty]) => {
                const quantity = Number(qty || 0)
                if (quantity <= 0) return
                // Check if it's water using the utility function
                const unitPrice = isWater(code) ? state.WATERPRICE : state.DRINKPRICE
                drinkSubtotal += quantity * unitPrice
            })
            
            // Calculate total with tax
            const subtotal = buffetSubtotal + drinkSubtotal
            const revenue = parseFloat((subtotal * state.TAX_RATE).toFixed(2))
            
            // Only process if there's actual revenue or customers
            if (revenue > 0 || adultCount > 0 || bigKidCount > 0 || smallKidCount > 0) {
                // Update sales summary in state
                const currentRevenue = parseFloat(state.sales.revenue) || 0
                const currentAdultCount = parseInt(state.sales.adultCount) || 0
                const currentBigKidCount = parseInt(state.sales.bigKidCount) || 0
                const currentSmlKidCount = parseInt(state.sales.smlKidCount) || 0
                
                state.sales.revenue = (currentRevenue + revenue).toFixed(2)
                state.sales.adultCount = currentAdultCount + adultCount
                state.sales.bigKidCount = currentBigKidCount + bigKidCount
                state.sales.smlKidCount = currentSmlKidCount + smallKidCount
                state.sales.totalCount = state.sales.adultCount + state.sales.bigKidCount + state.sales.smlKidCount
                
                console.log('Cashier sales updated:', {
                    revenue: state.sales.revenue,
                    adultCount: state.sales.adultCount,
                    bigKidCount: state.sales.bigKidCount,
                    smlKidCount: state.sales.smlKidCount,
                    totalCount: state.sales.totalCount,
                    cashierRevenue: revenue
                })
                
                // Add sales record to Firestore if enabled - with transaction for race condition prevention
                if (state.useFirebase && state.firebaseInitialized) {
                    // Use optimistic update for immediate UI feedback, then persist with transaction
                    const optimisticRollback = () => {
                        // Rollback state changes
                        state.sales.revenue = (currentRevenue).toFixed(2)
                        state.sales.adultCount = currentAdultCount
                        state.sales.bigKidCount = currentBigKidCount
                        state.sales.smlKidCount = currentSmlKidCount
                        state.sales.totalCount = state.sales.adultCount + state.sales.bigKidCount + state.sales.smlKidCount
                        logger.store.warn('Cashier sales update rolled back due to failure')
                    }
                    
                    optimisticUpdate(
                        () => optimisticRollback, // Return rollback function
                        async () => {
                            // Persist with atomic transaction to prevent race conditions
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
                        },
                        { retry: true, maxRetries: 3 }
                    ).then(result => {
                        if (!result.success) {
                            logger.firestore.error('Failed to save cashier sales after retries:', result.error)
                        }
                    }).catch(err => {
                        logger.firestore.error('[Firestore] Failed to save cashier sales:', err)
                    })
                }
            }
            
            // Clear cashier form after payment
            if (state.cashierForm) {
                state.cashierForm.buffetCounts = {
                    adult: 0,
                    bigKid: 0,
                    smallKid: 0,
                }
                const drinkCounts = {}
                DRINK_OPTIONS.forEach(opt => {
                    drinkCounts[opt.code] = 0
                })
                state.cashierForm.drinkCounts = drinkCounts
            }
        },
        setTableOrder(state, order = []) {
            const tableCount = Array.isArray(state.tables)
                ? state.tables.length
                : Object.keys(state.tables).length
            state.tableOrder = normalizeTableOrder(order, tableCount)
        },
        /**
         * Add a new table to the tables object
         */
        addTable(state) {
            // Get existing table numbers
            const existingNumbers = Array.isArray(state.tables)
                ? state.tables.map(t => t.number).filter(Boolean)
                : Object.keys(state.tables).map(Number).filter(Boolean)
            
            const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
            const newTableNumber = maxNumber + 1
            
            const newTable = {
                number: newTableNumber,
                name: null,
                sitDownTime: "",
                adult: 0,
                bigKid: 0,
                smlKid: 0,
                drinks: [],
                time: 0,
                occupied: false,
                drinkPrice: 0,
                totalPrice: 0,
                goodPpl: false,
                togo: 0
            }
            
            // Add to tables object
            if (!Array.isArray(state.tables)) {
                state.tables[newTableNumber] = newTable
            } else {
                // Legacy array format
                state.tables.push(newTable)
            }
            
            // Update tableOrder to include the new table
            const tableCount = Array.isArray(state.tables)
                ? state.tables.length
                : Object.keys(state.tables).length
            state.tableOrder = normalizeTableOrder(state.tableOrder, tableCount)
            
            // Persist to Firestore if enabled
            if (state.useFirebase && state.firebaseInitialized) {
                firestore.saveTable(newTableNumber, newTable).catch(err => {
                    logger.firestore.error('Failed to save new table:', err)
                })
            }
        },
        /**
         * Remove a table from the tables object
         * Only allows removal if table is not occupied
         */
        removeTable(state, tableNumber) {
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            
            // Prevent removal of occupied tables
            if (table.occupied) {
                logger.store.warn('Cannot remove occupied table:', tableNumber)
                return
            }
            
            // Remove from tables object
            if (!Array.isArray(state.tables)) {
                delete state.tables[tableNumber]
            } else {
                // Legacy array format - find and remove
                const tableIndex = state.tables.findIndex(t => t.number === tableNumber)
                if (tableIndex >= 0) {
                    state.tables.splice(tableIndex, 1)
                }
            }
            
            // Update tableOrder to remove the table number
            state.tableOrder = state.tableOrder.filter(num => num !== tableNumber)
            
            // Normalize table order based on remaining table count
            const tableCount = Array.isArray(state.tables) 
                ? state.tables.length 
                : Object.keys(state.tables).length
            state.tableOrder = normalizeTableOrder(state.tableOrder, tableCount)
            
            // Delete from Firestore if enabled
            if (state.useFirebase && state.firebaseInitialized) {
                firestore.deleteTable(tableNumber).catch(err => {
                    logger.firestore.error('Failed to delete table:', err)
                })
            }
        },
        /**
         * Update a table's name
         */
        updateTableName(state, payload) {
            const { tableNumber, name } = payload
            const table = getTableByNumber(state, tableNumber)
            if (!table) {
                return
            }
            
            // Set name to null if empty string, otherwise set to trimmed value
            table.name = name && name.trim() ? name.trim() : null
            
            // Persist to Firestore if enabled
            if (state.useFirebase && state.firebaseInitialized) {
                firestore.saveTable(tableNumber, table).catch(err => {
                    logger.firestore.error('Failed to update table name:', err)
                })
            }
        },

        /**
         * Update buffet pricing and tax rate (admin panel).
         * Expects prices in dollars and taxRatePercent as a percentage (e.g. 7 = 7% tax).
         * Includes validation for all pricing inputs.
         */
        updatePricingSettings(state, payload = {}) {
            // Validate and update lunch prices
            if (payload.adultLunch !== undefined) {
                const validation = validatePrice(payload.adultLunch, { required: false })
                if (validation.valid) {
                    state.ADULTPRICE = validation.value
                } else {
                    logger.store.warn('Invalid adult lunch price:', validation.error)
                }
            }
            
            if (payload.bigKidLunch !== undefined) {
                const validation = validatePrice(payload.bigKidLunch, { required: false })
                if (validation.valid) {
                    state.BIGKIDPRICE = validation.value
                } else {
                    logger.store.warn('Invalid big kid lunch price:', validation.error)
                }
            }
            
            if (payload.smallKidLunch !== undefined) {
                const validation = validatePrice(payload.smallKidLunch, { required: false })
                if (validation.valid) {
                    state.SMALLKIDPRICE = validation.value
                } else {
                    logger.store.warn('Invalid small kid lunch price:', validation.error)
                }
            }

            // Validate and update dinner prices
            if (payload.adultDinner !== undefined) {
                const validation = validatePrice(payload.adultDinner, { required: false })
                if (validation.valid) {
                    state.ADULTDINNERPRICE = validation.value
                } else {
                    logger.store.warn('Invalid adult dinner price:', validation.error)
                }
            }
            
            if (payload.bigKidDinner !== undefined) {
                const validation = validatePrice(payload.bigKidDinner, { required: false })
                if (validation.valid) {
                    state.BIGKIDDINNERPRICE = validation.value
                } else {
                    logger.store.warn('Invalid big kid dinner price:', validation.error)
                }
            }
            
            if (payload.smallKidDinner !== undefined) {
                const validation = validatePrice(payload.smallKidDinner, { required: false })
                if (validation.valid) {
                    state.SMALLKIDDINNERPRICE = validation.value
                } else {
                    logger.store.warn('Invalid small kid dinner price:', validation.error)
                }
            }

            // Validate and update tax rate
            if (payload.taxRatePercent !== undefined) {
                const validation = validateTaxRatePercent(payload.taxRatePercent, { required: false })
                if (validation.valid) {
                    const multiplier = 1 + validation.value / 100
                    state.TAX_RATE = Number(multiplier.toFixed(4))
                } else {
                    logger.store.warn('Invalid tax rate percentage:', validation.error)
                }
            }
            
            // Validate and update water price
            if (payload.waterPrice !== undefined) {
                const validation = validatePrice(payload.waterPrice, { required: false })
                if (validation.valid) {
                    state.WATERPRICE = validation.value
                } else {
                    logger.store.warn('Invalid water price:', validation.error)
                }
            }
            
            // Validate and update drink price
            if (payload.drinkPrice !== undefined) {
                const validation = validatePrice(payload.drinkPrice, { required: false })
                if (validation.valid) {
                    state.DRINKPRICE = validation.value
                } else {
                    logger.store.warn('Invalid drink price:', validation.error)
                }
            }
        },
        setDrinkPrice(state, price) {
            const validation = validatePrice(price, { required: true })
            if (validation.valid) {
                state.DRINKPRICE = validation.value
            } else {
                logger.store.warn('Invalid drink price:', validation.error)
            }
        },
        incrementTicketCount(state) {
            try {
                assertNonNegativeInteger(state.ticketCount || 0, 'ticketCount')
                const currentCount = state.ticketCount || 0
                // Cap at 999999 to prevent overflow
                if (currentCount < 999999) {
                    state.ticketCount = currentCount + 1
                } else {
                    logger.store.warn('Maximum ticket count reached (999999)')
                }
            } catch (err) {
                logger.store.error('Invalid ticket count:', err)
                state.ticketCount = 0
            }
        },
        setTicketCount(state, count) {
            const validation = validateCount(count, { max: 999999 })
            if (validation.valid) {
                state.ticketCount = validation.value
            } else {
                logger.store.warn('Invalid ticket count:', validation.error)
            }
        },
        updateReceiptSettings(state, payload = {}) {
            if (!payload || typeof payload !== 'object') {
                logger.store.warn('updateReceiptSettings: payload must be an object')
                return
            }
            
            // Validate boolean settings
            if (typeof payload.showTicketCount === 'boolean') {
                state.receiptSettings.showTicketCount = payload.showTicketCount
            }
            if (typeof payload.showPrintTime === 'boolean') {
                state.receiptSettings.showPrintTime = payload.showPrintTime
            }
            if (typeof payload.showGratuity === 'boolean') {
                state.receiptSettings.showGratuity = payload.showGratuity
            }
            
            // Validate string settings (max 500 chars each)
            if (typeof payload.headerText === 'string') {
                state.receiptSettings.headerText = payload.headerText.slice(0, 500)
            }
            if (typeof payload.subHeaderText === 'string') {
                state.receiptSettings.subHeaderText = payload.subHeaderText.slice(0, 500)
            }
            if (typeof payload.footerText === 'string') {
                state.receiptSettings.footerText = payload.footerText.slice(0, 500)
            }
            if (typeof payload.thankYouText === 'string') {
                state.receiptSettings.thankYouText = payload.thankYouText.slice(0, 500)
            }
            
            // Validate gratuity percentages array
            if (Array.isArray(payload.gratuityPercentages) && payload.gratuityPercentages.length > 0) {
                // Validate percentages are numbers between 0 and 100
                const validPercentages = payload.gratuityPercentages
                    .map(p => validateTaxRatePercent(p, { required: false }))
                    .filter(v => v.valid)
                    .map(v => v.value)
                    .slice(0, 5) // Limit to 5 percentages max
                
                if (validPercentages.length > 0) {
                    state.receiptSettings.gratuityPercentages = validPercentages
                }
            }
            if (typeof payload.gratuityOnPreTax === 'boolean') {
                state.receiptSettings.gratuityOnPreTax = payload.gratuityOnPreTax
            }
        },
        setAppState(state, payload = {}) {
            const usingFirebase = !!state.useFirebase
            if (payload.isDinner !== undefined) {
                state.isDinner = payload.isDinner
            }
            // Restore pricing & tax settings from app state snapshot if provided
            if (typeof payload.TAX_RATE === 'number' && payload.TAX_RATE > 0) {
                state.TAX_RATE = payload.TAX_RATE
            }
            if (typeof payload.ADULTPRICE === 'number') {
                state.ADULTPRICE = payload.ADULTPRICE
            }
            if (typeof payload.BIGKIDPRICE === 'number') {
                state.BIGKIDPRICE = payload.BIGKIDPRICE
            }
            if (typeof payload.SMALLKIDPRICE === 'number') {
                state.SMALLKIDPRICE = payload.SMALLKIDPRICE
            }
            if (typeof payload.ADULTDINNERPRICE === 'number') {
                state.ADULTDINNERPRICE = payload.ADULTDINNERPRICE
            }
            if (typeof payload.BIGKIDDINNERPRICE === 'number') {
                state.BIGKIDDINNERPRICE = payload.BIGKIDDINNERPRICE
            }
            if (typeof payload.SMALLKIDDINNERPRICE === 'number') {
                state.SMALLKIDDINNERPRICE = payload.SMALLKIDDINNERPRICE
            }
            if (typeof payload.WATERPRICE === 'number' && payload.WATERPRICE >= 0) {
                state.WATERPRICE = payload.WATERPRICE
            }
            if (typeof payload.DRINKPRICE === 'number' && payload.DRINKPRICE >= 0) {
                state.DRINKPRICE = payload.DRINKPRICE
            }
            if (typeof payload.ticketCount === 'number' && payload.ticketCount >= 0) {
                state.ticketCount = payload.ticketCount
            }
            if (payload.receiptSettings && typeof payload.receiptSettings === 'object') {
                if (typeof payload.receiptSettings.showTicketCount === 'boolean') {
                    state.receiptSettings.showTicketCount = payload.receiptSettings.showTicketCount
                }
                if (typeof payload.receiptSettings.showPrintTime === 'boolean') {
                    state.receiptSettings.showPrintTime = payload.receiptSettings.showPrintTime
                }
                if (typeof payload.receiptSettings.headerText === 'string') {
                    state.receiptSettings.headerText = payload.receiptSettings.headerText
                }
                if (typeof payload.receiptSettings.subHeaderText === 'string') {
                    state.receiptSettings.subHeaderText = payload.receiptSettings.subHeaderText
                }
                if (typeof payload.receiptSettings.footerText === 'string') {
                    state.receiptSettings.footerText = payload.receiptSettings.footerText
                }
                if (typeof payload.receiptSettings.thankYouText === 'string') {
                    state.receiptSettings.thankYouText = payload.receiptSettings.thankYouText
                }
                if (typeof payload.receiptSettings.showGratuity === 'boolean') {
                    state.receiptSettings.showGratuity = payload.receiptSettings.showGratuity
                }
                if (Array.isArray(payload.receiptSettings.gratuityPercentages) && payload.receiptSettings.gratuityPercentages.length > 0) {
                    const validPercentages = payload.receiptSettings.gratuityPercentages
                        .filter(p => typeof p === 'number' && p >= 0 && p <= 100)
                        .slice(0, 5)
                    if (validPercentages.length > 0) {
                        state.receiptSettings.gratuityPercentages = validPercentages
                    }
                }
                if (typeof payload.receiptSettings.gratuityOnPreTax === 'boolean') {
                    state.receiptSettings.gratuityOnPreTax = payload.receiptSettings.gratuityOnPreTax
                }
            }
            if (typeof payload.tableNum === 'number') {
                state.tableNum = payload.tableNum
            }
            if (typeof payload.catID === 'number') {
                state.catID = payload.catID
            }
            if (Array.isArray(payload.togoLines)) {
                state.togoLines = []
                state.nextTogoLineId = 1
                payload.togoLines.forEach(line => {
                    if (!line || Number(line.quantity) <= 0) return
                    const categoryIndex = Number.isInteger(line.categoryIndex) ? line.categoryIndex : (Number.isInteger(line.id) ? line.id : null)
                    const itemIndex = Number.isInteger(line.itemIndex) ? line.itemIndex : (Number.isInteger(line.nTerm) ? line.nTerm : null)
                    
                    // Try to find menuItemId from normalized menu
                    let menuItemId = line.menuItemId || null
                    if (!menuItemId && Number.isInteger(categoryIndex) && Number.isInteger(itemIndex)) {
                        menuItemId = findMenuItemIdFromIndices(state.menu, categoryIndex, itemIndex)
                    }
                    
                    state.togoLines.push({
                        lineId: Number(line.lineId) || state.nextTogoLineId++,
                        itemName: line.itemName || line.item,
                        categoryIndex,
                        itemIndex,
                        menuItemId, // Store reference to normalized menu item
                        quantity: Number(line.quantity ?? 0),
                        basePrice: Number(line.basePrice ?? line.price ?? 0),
                        extraPrice: Number(line.extraPrice ?? line.extra ?? 0),
                        note: (line.note || '').trim()
                    })
                })
                const maxId = state.togoLines.reduce((max, line) => Math.max(max, Number(line.lineId) || 0), 0)
                state.nextTogoLineId = maxId + 1
                recalcTogoTotals(state)
            } else if (Array.isArray(payload.seletedTogo)) {
                state.togoLines = []
                state.nextTogoLineId = 1
                payload.seletedTogo.forEach(entry => {
                    if (!entry || Number(entry.quantity) <= 0) return
                    const categoryIndex = Number.isInteger(entry.id) ? entry.id : null
                    const itemIndex = Number.isInteger(entry.nTerm) ? entry.nTerm : null
                    
                    // Try to find menuItemId from normalized menu
                    let menuItemId = entry.menuItemId || null
                    if (!menuItemId && Number.isInteger(categoryIndex) && Number.isInteger(itemIndex)) {
                        menuItemId = findMenuItemIdFromIndices(state.menu, categoryIndex, itemIndex)
                    }
                    
                    state.togoLines.push({
                        lineId: state.nextTogoLineId++,
                        itemName: entry.item,
                        categoryIndex,
                        itemIndex,
                        menuItemId, // Store reference to normalized menu item
                        quantity: Number(entry.quantity ?? 0),
                        basePrice: Number(entry.price ?? 0),
                        extraPrice: 0,
                        note: ''
                    })
                })
                recalcTogoTotals(state)
            }
            if (payload.togoCustomizations && typeof payload.togoCustomizations === 'object') {
                state.togoCustomizations = JSON.parse(JSON.stringify(payload.togoCustomizations))
            }
            if (payload.totalTogoPrice !== undefined && payload.totalTogoPrice !== null) {
                state.totalTogoPrice = payload.totalTogoPrice
            }
            if (!usingFirebase && payload.sales) {
                const salesKeys = ['revenue', 'totalCount', 'adultCount', 'bigKidCount', 'smlKidCount', 'totalTogoRevenue']
                const mergedSales = { ...state.sales }
                salesKeys.forEach(key => {
                    if (payload.sales[key] !== undefined) {
                        mergedSales[key] = payload.sales[key]
                    }
                })
                state.sales = JSON.parse(JSON.stringify(mergedSales))
            }
            // Handle tables - can be either array (legacy) or object (new format)
            if (!usingFirebase && payload.tables) {
                if (Array.isArray(payload.tables)) {
                    // Legacy array format - convert to object
                    const tablesObj = {}
                    payload.tables.forEach(table => {
                        if (table && table.number) {
                            tablesObj[table.number] = table
                        }
                    })
                    state.tables = tablesObj
                } else if (typeof payload.tables === 'object') {
                    // New object format
                    state.tables = JSON.parse(JSON.stringify(payload.tables))
                }
            }
            if (Array.isArray(payload.tableOrder) && payload.tableOrder.length > 0) {
                const tableCount = Array.isArray(state.tables) 
                    ? state.tables.length 
                    : Object.keys(state.tables).length
                state.tableOrder = normalizeTableOrder(payload.tableOrder, tableCount)
            }
            if (!usingFirebase && Array.isArray(payload.menu)) {
                state.menu = JSON.parse(JSON.stringify(payload.menu))
                // Normalize menu when loading from app state
                state.normalizedMenu = normalizeMenu(state.menu)
            }
            if (payload.timestamp || payload.updatedAt) {
                state.lastAppStateSyncedAt = payload.timestamp || payload.updatedAt
            }
        },
        setAppStateSyncTimestamp(state, timestamp) {
            state.lastAppStateSyncedAt = timestamp || null
            if (!state.persistenceStatus) {
                state.persistenceStatus = { isSaving: false, lastSaved: null, error: null }
            }
            state.persistenceStatus.lastSaved = timestamp || null
            state.persistenceStatus.isSaving = false
            state.persistenceStatus.error = null
        },
        setPersistenceStatus(state, status) {
            if (!state.persistenceStatus) {
                state.persistenceStatus = { isSaving: false, lastSaved: null, error: null }
            }
            if (status.isSaving !== undefined) {
                state.persistenceStatus.isSaving = status.isSaving
            }
            if (status.lastSaved !== undefined) {
                state.persistenceStatus.lastSaved = status.lastSaved
            }
            if (status.error !== undefined) {
                state.persistenceStatus.error = status.error
            }
        },
        calculateTogoTotal(state) {
            recalcTogoTotals(state)
        },
        
    },
    getters: {
        // Auth getters
        isAdmin(state) {
            return state.authRole === 'admin'
        },
        isServer(state) {
            return state.authRole === 'server'
        },
        // Table getters - now work with table numbers (not indices)
        getTable: (state) => (indexOrNumber) => {
            // Handle both legacy index and new number-based access
            if (Array.isArray(state.tables)) {
                // Legacy array format
                return state.tables[indexOrNumber] || null
            }
            // New object format - access by number
            return state.tables[indexOrNumber] || null
        },
        getCurrentTable: (state) => {
            const tableNumber = getTableNumber(state, state.tableNum)
            return getTableByNumber(state, tableNumber)
        },
        isTableOccupied: (state) => (indexOrNumber) => {
            // Handle both array (legacy) and object (new format) for tables
            const tables = state.tables || {}
            const table = Array.isArray(tables)
                ? tables[indexOrNumber] // Array format - indexOrNumber is array index
                : tables[indexOrNumber] || null // Object format - indexOrNumber is table number
            return table ? !!table.occupied : false
        },
        getTableTotal: (state) => (indexOrNumber) => {
            const table = Array.isArray(state.tables)
                ? state.tables[indexOrNumber]
                : state.tables[indexOrNumber]
            return table ? parseFloat(table.totalPrice || 0) : 0
        },
        // Normalized menu getters
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
        // Legacy menu access (for backward compatibility)
        getMenu: (state) => {
            return state.menu || []
        },
        // Togo getters
        getTogoLines: (state) => {
            return state.togoLines || []
        },
        getTogoTotal: (state) => {
            return parseFloat(state.totalTogoPrice || 0)
        },
        // Cashier getters
        getCashierForm: (state) => {
            return state.cashierForm || {
                mode: 'lunch',
                buffetCounts: { adult: 0, bigKid: 0, smallKid: 0 },
                drinkCounts: {}
            }
        },
        // Settings getters
        getReceiptSettings: (state) => {
            return state.receiptSettings || {}
        },
        getTicketCount: (state) => {
            return state.ticketCount || 0
        },
        isDinnerMode: (state) => {
            return state.isDinner
        },
        getCurrentLanguage: (state) => {
            return state.language
        },
        // Order panel getters
        getActiveOrderPanel: (state) => {
            return state.orderPanel
        },
        isOrderPanelOpen: (state) => {
            return state.orderPanel !== null
        },
    },
    actions: {
        // ========== Table Actions ==========
        setOrderPanel({ commit }, payload) {
            commit('setOrderPanel', payload)
        },
        calculateTableTotal({ commit }) {
            commit('calculateTotal')
        },
        setTableOccupied({ commit }, payload) {
            commit('setTableOccupied', payload)
        },
        setTableSitDownTime({ commit }, payload) {
            commit('setTableSitDownTime', payload)
        },
        getTableTimestamp({ commit }, tableIndex) {
            commit('getTimestamp', tableIndex)
        },
        addDrink({ commit }, code) {
            commit('addDrink', code)
        },
        updateTableGoodPpl({ commit }, value) {
            commit('updateTableGoodPpl', value)
        },
        clearTable({ commit }) {
            commit('setLoadingState', { key: 'clearingTable', value: true })
            try {
                commit('clearEverything')
                // Loading state cleared after a short delay to show feedback
                setTimeout(() => {
                    commit('setLoadingState', { key: 'clearingTable', value: false })
                }, 300)
            } catch (error) {
                commit('setLoadingState', { key: 'clearingTable', value: false })
                throw error
            }
        },
        payTable({ commit }) {
            commit('setLoadingState', { key: 'payingTable', value: true })
            try {
                commit('paid')
                // Loading state cleared after a short delay to show feedback
                // Note: Firestore save happens asynchronously, but UI updates immediately
                setTimeout(() => {
                    commit('setLoadingState', { key: 'payingTable', value: false })
                }, 500)
            } catch (error) {
                commit('setLoadingState', { key: 'payingTable', value: false })
                throw error
            }
        },
        // Guest count adjustments
        adjustGuestCount({ commit }, { type, delta }) {
            if (type === 'adult') {
                if (delta > 0) commit('increaseAdult')
                else commit('decreaseAdult')
            } else if (type === 'bigKid') {
                if (delta > 0) commit('increaseBigKid')
                else commit('decreaseBidKid')
            } else if (type === 'smlKid') {
                if (delta > 0) commit('increaseSmlKid')
                else commit('decreaseSmlKid')
            }
        },
        // Table management
        addTable({ commit }) {
            commit('addTable')
        },
        removeTable({ commit }, tableNumber) {
            commit('removeTable', tableNumber)
        },
        updateTableName({ commit }, payload) {
            commit('updateTableName', payload)
        },
        
        // ========== Togo Actions ==========
        calculateTogoTotal({ commit }) {
            commit('calculateTogoTotal')
        },
        appendTogoLines({ commit }, lines) {
            commit('appendTogoLines', lines)
        },
        updateTogoLine({ commit }, payload) {
            commit('updateTogoLine', payload)
        },
        removeTogoLine({ commit }, lineId) {
            commit('removeTogoLine', lineId)
        },
        clearTogoLines({ commit }) {
            commit('clearTogoLines')
        },
        payTogo({ commit }) {
            commit('togoPaid')
        },
        
        // ========== Cashier Actions ==========
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
        processCashierPayment({ commit }) {
            commit('processCashierPayment')
        },
        
        // ========== Settings Actions ==========
        setDinnerMode({ commit }, value) {
            commit('setDinnerMode', value)
        },
        setLanguage({ commit }, lang) {
            commit('setLanguage', lang)
        },
        toggleLanguage({ commit }) {
            commit('toggleLanguage')
        },
        incrementTicketCount({ commit }) {
            commit('incrementTicketCount')
        },
        setTicketCount({ commit }, count) {
            commit('setTicketCount', count)
        },
        updateReceiptSettings({ commit }, payload) {
            commit('updateReceiptSettings', payload)
        },
        updatePricingSettings({ commit }, payload) {
            commit('updatePricingSettings', payload)
        },
        
        /**
         * Initialize Firestore and register real-time listeners
         */
        async initializeFirebase({ commit, state }) {
            if (!state.useFirebase || state.firebaseInitialized) {
                return
            }
            if (!state.authUser) {
                console.log('[Firestore] Skipping initialization until user is authenticated')
                return
            }

            commit('setLoadingState', { key: 'initializing', value: true })
            try {
                const unsubscribers = []

                const [menuDocs, tablesDocs, salesSummaryDoc, appStateDoc] = await Promise.all([
                    firestore.loadMenu(),
                    firestore.loadTables(),
                    firestore.loadSalesSummary(),
                    firestore.loadAppState()
                ])

                if (Array.isArray(menuDocs) && menuDocs.length > 0) {
                    commit('setMenu', menuDocs)
                    console.log('[Firestore] Menu loaded:', menuDocs.length, 'categories')
                }

                // Handle both array (legacy) and object (new format) from Firestore
                if (tablesDocs && (Array.isArray(tablesDocs) ? tablesDocs.length > 0 : Object.keys(tablesDocs).length > 0)) {
                    commit('setTables', tablesDocs)
                    const tableCount = Array.isArray(tablesDocs) 
                        ? tablesDocs.length 
                        : Object.keys(tablesDocs).length
                    logger.firestore.info('Tables loaded:', tableCount, 'tables')
                }

                if (salesSummaryDoc) {
                    commit('setSales', formatSalesSummaryDoc(salesSummaryDoc))
                    console.log('[Firestore] Sales summary loaded')
                }

                if (appStateDoc) {
                    commit('setAppState', { ...appStateDoc, timestamp: appStateDoc.updatedAt })
                    console.log('[Firestore] App state snapshot loaded')
                }

                const menuUnsub = firestore.watchMenu(menu => {
                    if (Array.isArray(menu) && menu.length > 0) {
                        commit('setMenu', menu)
                    }
                })
                unsubscribers.push(menuUnsub)

                const tablesUnsub = firestore.watchTables(tables => {
                    commit('setTables', tables)
                })
                unsubscribers.push(tablesUnsub)

                const salesUnsub = firestore.watchSalesSummary(summary => {
                    if (summary) {
                        commit('setSales', formatSalesSummaryDoc(summary))
                    }
                })
                unsubscribers.push(salesUnsub)

                const appStateUnsub = firestore.watchAppState(snapshot => {
                    if (!snapshot) return
                    const updatedAt = snapshot.updatedAt || null
                    if (updatedAt && store.state.lastAppStateSyncedAt === updatedAt) {
                        return
                    }
                    commit('setAppState', { ...snapshot, timestamp: updatedAt })
                })
                unsubscribers.push(appStateUnsub)

                commit('setFirebaseUnsubscribers', unsubscribers)
                commit('setFirebaseInitialized', true)
                console.log('[Firestore] Real-time listeners attached')

                if (stateSupportsSync(state)) {
                    const snapshot = getAppStateSnapshot(state)
                    snapshot.timestamp = new Date().toISOString()
                    const response = await firestore.saveAppState(snapshot)
                    if (response && response.success) {
                        commit('setAppStateSyncTimestamp', snapshot.timestamp)
                        console.log('[Firestore] Initial AppState snapshot saved')
                    }
                }
            } catch (error) {
                console.error('Failed to initialize Firestore:', error)
                commit('setFirebaseUnsubscribers', [])
                commit('setFirebaseInitialized', false)
            } finally {
                commit('setLoadingState', { key: 'initializing', value: false })
            }
        },

        cleanupFirebase({ commit }) {
            commit('setFirebaseUnsubscribers', [])
            commit('setFirebaseInitialized', false)
        },

        /**
         * Persist entire menu collection to Firestore
         * Also removes orphaned categories (e.g., when category names are changed)
         */
        async saveMenuToFirestore({ state }) {
            if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
                return
            }
            const categories = state.menu || []
            try {
                // Get all current category IDs that should exist after save
                const newCategoryIds = categories.map(category => {
                    const categoryId = category.category || category.id || 'category'
                    return categoryId
                })
                
                // Save all categories
                await Promise.all(categories.map(category => {
                    const categoryId = category.category || category.id || 'category'
                    return firestore.saveMenuCategory(categoryId, {
                        category: categoryId,
                        items: Array.isArray(category.items) ? category.items : []
                    })
                }))
                
                // Get all existing menu document IDs from Firestore
                const existingCategoryIds = await firestore.getAllMenuCategoryIds()
                
                // Delete any categories that no longer exist (orphaned due to name changes)
                const orphanedIds = existingCategoryIds.filter(id => !newCategoryIds.includes(id))
                if (orphanedIds.length > 0) {
                    await Promise.all(orphanedIds.map(id => firestore.deleteMenuCategory(id)))
                    console.log('[Firestore] Deleted', orphanedIds.length, 'orphaned menu category(ies):', orphanedIds)
                }
                
                console.log('[Firestore] Menu saved')
            } catch (error) {
                console.error('[Firestore] Failed to save menu:', error)
            }
        },

        /**
         * Persist a table to Firestore (keeps existing action name for compatibility)
         */
        async saveTableToFirestore({ state }, tableIndex) {
            if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
                return
            }
            const index = typeof tableIndex === 'number' ? tableIndex : state.tableNum
            const tableNumber = getTableNumber(state, index)
            const table = getTableByNumber(state, tableNumber)
            if (!table || !table.number) {
                return
            }
            try {
                await firestore.saveTable(table.number, table)
                console.log('[Firestore] Table', table.number, 'saved')
            } catch (error) {
                console.error('[Firestore] Failed to save table:', error)
            }
        },

        /**
         * Populate Firestore with default in-memory data
         */
        async populateSampleData({ state }) {
            if (!state.useFirebase) {
                console.log('Firestore integration is disabled')
                return { error: 'Firestore integration is disabled' }
            }
            if (!state.authUser) {
                console.log('User must be authenticated to populate data')
                return { error: 'Authentication required' }
            }

            try {
                const categories = state.menu || []
                await Promise.all(categories.map(category => {
                    const categoryId = category.category || category.id || 'category'
                    return firestore.saveMenuCategory(categoryId, {
                        category: categoryId,
                        items: Array.isArray(category.items) ? category.items : []
                    })
                }))

                const tables = state.tables || []
                // Convert tables object to array for iteration
                const tablesArray = Array.isArray(tables) 
                    ? tables 
                    : Object.values(tables)
                await Promise.all(tablesArray.map(table => {
                    if (!table || !table.number) return Promise.resolve()
                    return firestore.saveTable(table.number, table)
                }))

                await firestore.saveSalesSummary(buildSalesSummaryForFirestore(state.sales))

                console.log('[Firestore] Sample data populated')
                const tableCount = Array.isArray(tables) 
                    ? tables.length 
                    : Object.keys(tables).length
                return { success: true, menuItems: categories.length, tables: tableCount }
            } catch (error) {
                console.error('Failed to populate sample data:', error)
                return { error: error.toString() }
            }
        },

        async saveMenuToSheets(ctx) {
            return ctx.dispatch('saveMenuToFirestore')
        },

        async saveTableToSheets(ctx, tableIndex) {
            return ctx.dispatch('saveTableToFirestore', tableIndex)
        },

        async updateMenuFromAdmin({ commit, dispatch }, menuPayload = []) {
            const sanitized = Array.isArray(menuPayload) ? menuPayload.map(category => ({
                category: category?.category || '',
                items: Array.isArray(category?.items) ? category.items.map(item => ({
                    name: item?.name || '',
                    listPrice: Number(item?.listPrice ?? 0),
                    quantity: Number(item?.quantity ?? 0)
                })) : []
            })) : []
            commit('setMenu', sanitized)
            
            // Extract drink price from menu if "Drinks" category exists
            const drinksCategory = sanitized.find(cat => 
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
                // If found, update DRINKPRICE
                if (drinkItem && drinkItem.listPrice > 0) {
                    commit('setDrinkPrice', drinkItem.listPrice)
                    console.log('[Menu] Updated DRINKPRICE from menu:', drinkItem.listPrice)
                }
            }
            
            commit('setLoadingState', { key: 'savingMenu', value: true })
            try {
                await dispatch('saveMenuToFirestore')
            } finally {
                commit('setLoadingState', { key: 'savingMenu', value: false })
            }
        },

        async resetSalesData({ commit, state }) {
            if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
                console.log('[Firestore] resetSalesData skipped - not authenticated or initialized')
                return { error: 'Not authorized' }
            }
            commit('setLoadingState', { key: 'resettingSales', value: true })
            try {
                await firestore.clearSalesData()
                const zeroSummary = {
                    revenue: '0.00',
                    totalCount: 0,
                    adultCount: 0,
                    bigKidCount: 0,
                    smlKidCount: 0,
                    totalTogoRevenue: '0.00'
                }
                commit('setSales', zeroSummary)
                const snapshot = getAppStateSnapshot(state)
                snapshot.timestamp = new Date().toISOString()
                await firestore.saveAppState(snapshot)
                commit('setAppStateSyncTimestamp', snapshot.timestamp)
                console.log('[Firestore] Sales data reset')
                return { success: true }
            } catch (error) {
                console.error('[Firestore] Failed to reset sales data:', error)
                return { error: error.toString() }
            } finally {
                commit('setLoadingState', { key: 'resettingSales', value: false })
            }
        },

        async loadTogoSalesHistory({ commit, state }, options = {}) {
            commit('setLoadingState', { key: 'loadingTogoSales', value: true })
            try {
                if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
                    logger.firestore.warn('loadTogoSalesHistory skipped - not authenticated or initialized')
                    // Return backward-compatible format if no options provided
                    return Object.keys(options).length === 0 ? [] : { records: [], lastDoc: null, hasMore: false }
                }
                const result = await firestore.loadTogoSalesHistory(options)
                // For backward compatibility, if options are not provided, return just records array (sorted)
                if (Object.keys(options).length === 0) {
                    return result.records.sort((a, b) => {
                        const tsA = a.timestamp ? new Date(a.timestamp).getTime() : (a.createdAt || 0)
                        const tsB = b.timestamp ? new Date(b.timestamp).getTime() : (b.createdAt || 0)
                        return tsB - tsA
                    })
                }
                return result
            } catch (error) {
                logger.firestore.error('Failed to load togo sales history:', error)
                return Object.keys(options).length === 0 ? [] : { records: [], lastDoc: null, hasMore: false }
            } finally {
                commit('setLoadingState', { key: 'loadingTogoSales', value: false })
            }
        },

        async initializeAuth({ state, commit, dispatch }) {
            if (!state.useFirebase) {
                return Promise.resolve()
            }
            if (!auth) {
                console.warn('[Firebase] Auth is not configured. Check environment variables.')
                commit('setAuthLoading', false)
                return Promise.resolve()
            }
            if (state.authUnsubscriber) {
                return Promise.resolve()
            }
            commit('setAuthLoading', true)
            commit('setAuthError', null)

            const unsubscribePromise = new Promise(resolve => {
                const unsubscribe = onAuthStateChanged(auth, async user => {
                    try {
                        if (user) {
                            commit('setAuthUser', user)
                            commit('setAuthRole', determineRoleForUser(user))
                            commit('setAuthError', null)
                            await dispatch('initializeFirebase')
                        } else {
                            commit('setAuthUser', null)
                            commit('setAuthRole', 'server')
                            await dispatch('cleanupFirebase')
                        }
                    } finally {
                        commit('setAuthLoading', false)
                        resolve()
                    }
                }, error => {
                    console.error('[Firebase] Auth state change error:', error)
                    commit('setAuthError', error.message)
                    commit('setAuthLoading', false)
                    resolve()
                })
                commit('setAuthUnsubscriber', unsubscribe)
            })

            return unsubscribePromise
        },

        async signIn({ commit }, { email, password }) {
            if (!auth) {
                throw new Error('Firebase Auth is not configured. Check environment variables.')
            }
            commit('setAuthLoading', true)
            commit('setAuthError', null)
            try {
                await signInWithEmailAndPassword(auth, email, password)
            } catch (error) {
                logger.auth.error('Sign-in failed:', error)
                // Use errorHandler to get user-friendly message
                const errorInfo = errorHandler.handleAuth(error, 'signIn', {
                    showToUser: false // We'll handle display in component
                })
                // Store user-friendly message instead of technical error
                commit('setAuthError', errorInfo.userMessage?.message || error.message)
                commit('setAuthLoading', false)
                throw error
            }
        },

        async signOut({ commit, dispatch }) {
            if (!auth) {
                return
            }
            try {
                await firebaseSignOut(auth)
            } catch (error) {
                console.error('[Firebase] Sign-out failed:', error)
            } finally {
                commit('setAuthUser', null)
                commit('setAuthRole', 'server')
                commit('setAuthLoading', false)
                await dispatch('cleanupFirebase')
            }
        },
        
        /**
         * Immediately save app state to Firestore (bypasses debounce)
         * Used when critical settings like pricing need to be persisted immediately
         */
        async saveAppStateImmediately({ state, commit }, snapshot) {
            if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
                return { error: 'Firestore not available' }
            }
            try {
                const response = await firestore.saveAppState(snapshot)
                if (response && response.success) {
                    const timestamp = response.updatedAt || snapshot.timestamp
                    commit('setAppStateSyncTimestamp', timestamp)
                    console.log('[Firestore] App state saved immediately', timestamp ? `(@ ${timestamp})` : '')
                    return { success: true, timestamp }
                }
                return { error: 'Save failed', response }
            } catch (error) {
                console.error('[Firestore] Failed to save app state immediately:', error)
                return { error: error.toString() }
            }
        }
    },
    modules: {}
})

function formatSalesSummaryDoc(data) {
    const revenue = Number(data.revenue ?? 0)
    const totalTogo = Number(data.totalTogoRevenue ?? data.togoRevenue ?? 0)
    return {
        revenue: revenue.toFixed(2),
        totalCount: data.totalCount ?? 0,
        adultCount: data.adultCount ?? 0,
        bigKidCount: data.bigKidCount ?? 0,
        smlKidCount: data.smlKidCount ?? 0,
        totalTogoRevenue: totalTogo.toFixed(2)
    }
}

function buildSalesSummaryForFirestore(data) {
    return {
        revenue: Number(data.revenue ?? 0),
        totalCount: Number(data.totalCount ?? 0),
        adultCount: Number(data.adultCount ?? 0),
        bigKidCount: Number(data.bigKidCount ?? 0),
        smlKidCount: Number(data.smlKidCount ?? 0),
        totalTogoRevenue: Number(data.totalTogoRevenue ?? 0)
    }
}

function getAppStateSnapshot(state) {
    const snapshot = {
        isDinner: state.isDinner,
        tableNum: state.tableNum,
        catID: state.catID,
        // Persist pricing + tax so admin changes survive reloads
        TAX_RATE: state.TAX_RATE,
        ADULTPRICE: state.ADULTPRICE,
        BIGKIDPRICE: state.BIGKIDPRICE,
        SMALLKIDPRICE: state.SMALLKIDPRICE,
        ADULTDINNERPRICE: state.ADULTDINNERPRICE,
        BIGKIDDINNERPRICE: state.BIGKIDDINNERPRICE,
        SMALLKIDDINNERPRICE: state.SMALLKIDDINNERPRICE,
        WATERPRICE: state.WATERPRICE,
        DRINKPRICE: state.DRINKPRICE,
        ticketCount: state.ticketCount || 0,
        receiptSettings: JSON.parse(JSON.stringify(state.receiptSettings || { 
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
        togoLines: JSON.parse(JSON.stringify(state.togoLines)),
        togoCustomizations: JSON.parse(JSON.stringify(state.togoCustomizations || {})),
        totalTogoPrice: state.totalTogoPrice,
            tableOrder: normalizeTableOrder(state.tableOrder, Array.isArray(state.tables) ? state.tables.length : Object.keys(state.tables).length)
    }

    if (!state.useFirebase) {
        snapshot.sales = JSON.parse(JSON.stringify(state.sales))
        snapshot.tables = JSON.parse(JSON.stringify(state.tables))
        snapshot.menu = JSON.parse(JSON.stringify(state.menu))
        snapshot.togoCustomizations = JSON.parse(JSON.stringify(state.togoCustomizations || {}))
    }

    return snapshot
}

// Helper function to get table by number (handles both object and legacy array format)
function getTableByNumber(state, number) {
    if (number == null || number <= 0) return null
    // If tables is an object (new format), access directly
    if (!Array.isArray(state.tables)) {
        return state.tables[number] || null
    }
    // Legacy array format - find by number
    return state.tables.find(t => t && t.number === number) || null
}

// Helper function to get table number from index or number
// In new format, tableNum stores the actual table number (not index)
function getTableNumber(state, indexOrNumber) {
    if (indexOrNumber == null) return state.tableNum || null
    
    // If tables is an object, the value is already a table number
    if (!Array.isArray(state.tables)) {
        return Number(indexOrNumber) || null
    }
    
    // Legacy array format - convert index to table number
    const table = state.tables[indexOrNumber]
    return table && table.number ? table.number : null
}

function persistTableByNumber(state, number) {
    if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
        return
    }
    const table = getTableByNumber(state, number)
    if (!table || !table.number) {
        return
    }
    firestore.saveTable(table.number, table).catch(err => {
        logger.firestore.error('Failed to save table:', err)
    })
}

function persistCurrentTable(state) {
    // In new format, tableNum is the table number (not index)
    const tableNumber = getTableNumber(state, state.tableNum)
    if (tableNumber) {
        persistTableByNumber(state, tableNumber)
    }
}

function attachFirestoreStateSync(store) {
    if (typeof window === 'undefined') {
        return
    }
    if (!stateSupportsSync(store.state)) {
        return
    }
    let syncTimeout = null
    let lastSnapshotHash = null
    let pendingHash = null
    const ignoredMutations = new Set([
        'setAppState',
        'setMenu',
        'setTables',
        'setSales',
        'setFirebaseInitialized',
        'setFirebaseUnsubscribers',
        'setAppStateSyncTimestamp'
    ])

    const unsubscribe = store.subscribe((mutation, state) => {
        if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
            // Clear timeout if Firebase is disabled
            if (syncTimeout) {
                clearTimeout(syncTimeout)
                syncTimeout = null
            }
            return
        }
        if (ignoredMutations.has(mutation.type)) {
            return
        }
        // Clear existing timeout before setting new one (debounce)
        if (syncTimeout) {
            clearTimeout(syncTimeout)
            syncTimeout = null
        }
        syncTimeout = setTimeout(async () => {
            syncTimeout = null // Clear reference after timeout executes
            try {
                const snapshot = getAppStateSnapshot(state)
                const snapshotHash = JSON.stringify(snapshot)
                if (snapshotHash === lastSnapshotHash || snapshotHash === pendingHash) {
                    return
                }
                pendingHash = snapshotHash
                snapshot.timestamp = new Date().toISOString()
                const response = await firestore.saveAppState(snapshot)
                if (response && response.success) {
                    const timestamp = response.updatedAt || snapshot.timestamp
                    store.commit('setAppStateSyncTimestamp', timestamp)
                    logger.firestore.info('App state synced', timestamp ? `(@ ${timestamp})` : '')
                    lastSnapshotHash = snapshotHash
                } else if (response && response.error) {
                    logger.firestore.error('Failed to sync app state:', response.error)
                }
            } catch (error) {
                logger.firestore.error('Failed to sync app state:', error)
            } finally {
                pendingHash = null
            }
        }, 600)
    })
    
    // Store unsubscribe function for cleanup (if needed in future)
    // Note: Vuex subscriptions persist for the lifetime of the store
    // The timeout is cleared when Firebase is disabled, preventing leaks
}

function stateSupportsSync(state) {
    if (!state || !state.useFirebase || !state.authUser) {
        return false
    }
    return typeof firestore.saveAppState === 'function'
}

attachFirestoreStateSync(store)

// Register persistence plugin for automatic table persistence
// This ensures table mutations are automatically persisted to Firestore
const persistencePlugin = createPersistencePlugin({
  getTableNumber: (state, indexOrNumber) => {
    if (indexOrNumber == null) return state.tableNum || null
    if (!Array.isArray(state.tables)) {
      return Number(indexOrNumber) || null
    }
    const table = state.tables[indexOrNumber]
    return table && table.number ? table.number : null
  },
  getTableByNumber: (state, number) => {
    if (number == null || number <= 0) return null
    if (!Array.isArray(state.tables)) {
      return state.tables[number] || null
    }
    return state.tables.find(t => t && t.number === number) || null
  }
})
persistencePlugin(store)

export default store

function determineRoleForUser(user) {
    const email = (user?.email || '').toLowerCase()
    if (email && ADMIN_EMAILS.includes(email)) {
        return 'admin'
    }
    return 'server'
}

function normalizeTableOrder(order, tableCount = 10) {
    const defaultOrder = Array.from({ length: tableCount }, (_, index) => index + 1)
    if (!Array.isArray(order) || order.length === 0) {
        return defaultOrder
    }
    const seen = new Set()
    const normalized = []
    order.forEach(value => {
        const num = Number(value)
        if (!Number.isInteger(num)) {
            return
        }
        if (num < 1 || num > tableCount) {
            return
        }
        if (seen.has(num)) {
            return
        }
        seen.add(num)
        normalized.push(num)
    })
    defaultOrder.forEach(num => {
        if (!seen.has(num)) {
            normalized.push(num)
        }
    })
    return normalized
}