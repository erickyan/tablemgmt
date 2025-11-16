import { createStore } from 'vuex'
import * as firestore from '../services/firestoreData'
import { auth } from '../firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'
import { DRINK_OPTIONS, isWater } from '../utils/drinkOptions.js'

const ADMIN_EMAILS = (import.meta.env.VITE_FIREBASE_ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

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

const syncLegacyTogoState = (state) => {
  const selections = (state.togoLines || []).map(line => ({
    item: line.itemName,
    quantity: Number(line.quantity ?? 0),
    price: (Number(line.basePrice ?? 0) + Number(line.extraPrice ?? 0)).toFixed(2),
    id: Number.isInteger(line.categoryIndex) ? line.categoryIndex : null,
    nTerm: Number.isInteger(line.itemIndex) ? line.itemIndex : null
  }))
  state.seletedTogo = JSON.parse(JSON.stringify(selections))
  const customizations = {}
  state.togoLines.forEach(line => {
    const note = line.note || ''
    const extra = Number(line.extraPrice ?? 0)
    if (!customizations[line.itemName]) {
      customizations[line.itemName] = { label: note, price: extra }
    }
  })
  state.togoCustomizations = customizations
}

const recalcTogoTotals = (state) => {
  const subtotal = (state.togoLines || []).reduce((sum, line) => {
    const unitPrice = Number(line.basePrice ?? 0) + Number(line.extraPrice ?? 0)
    return sum + unitPrice * Number(line.quantity ?? 0)
  }, 0)
  state.totalTogoPrice = (subtotal * state.TAX_RATE).toFixed(2)
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
        authUser: null,
        authLoading: false,
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
        // Pricing + tax settings (editable from admin panel)
        TAX_RATE: 1.07,            // stored as multiplier, e.g. 1.07 = 7% tax
        ADULTPRICE: 9.99,          // lunch prices
        BIGKIDPRICE: 5.99,
        SMALLKIDPRICE: 4.99,
        ADULTDINNERPRICE: 12.25,   // dinner prices
        BIGKIDDINNERPRICE: 6.99,
        SMALLKIDDINNERPRICE: 5.99,
        WATERPRICE: 0.27,
        DRINKPRICE:1.75,
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
        tables: [
            {
                number: 1,
                name: null,
                sitDownTime:"",
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
            },
            {
                number: 2,
                name: null,
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
            },
            {
                number: 3,
                name: null,
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
            },
            {
                number: 4,
                name: null,
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
            },
            {
                number: 5,
                name: null,
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
            },
            {
                number: 6,
                name: null,
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
            },
            {
                number: 7,
                name: null,
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
            },
            {
                number: 8,
                name: null,
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
            },
            {
                number: 9,
                name: null,
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
            },
            {
                number: 10,
                name: null,
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
        ],

        totalTogoPrice: 0,
        tableOrder: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        lastAppStateSyncedAt: null,
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
        // set ppl number
        increaseAdult(state){
            // console.log(state.tableNum )
            state.tables[state.tableNum].adult++
            persistCurrentTable(state)
        },
        decreaseAdult(state){
            const table = state.tables[state.tableNum]
            if (!table) {
                return
            }
            if (table.adult > 0) {
                table.adult -= 1
                persistCurrentTable(state)
            }
        },
        increaseBigKid(state){
            state.tables[state.tableNum].bigKid++
            persistCurrentTable(state)
        },
        decreaseBidKid(state){
            const table = state.tables[state.tableNum]
            if (!table) {
                return
            }
            if (table.bigKid > 0) {
                table.bigKid -= 1
                persistCurrentTable(state)
            }
        },
        increaseSmlKid(state){
            state.tables[state.tableNum].smlKid++
            persistCurrentTable(state)
        },
        decreaseSmlKid(state){
            const table = state.tables[state.tableNum]
            if (!table) {
                return
            }
            if (table.smlKid > 0) {
                table.smlKid -= 1
                persistCurrentTable(state)
            }
        },
        addDrink(state, drink){
            state.tables[state.tableNum].drinks.push(drink)
            state.tables[state.tableNum].drinks.sort()
            persistCurrentTable(state)
        },
        setTableOccupied(state, payload = {}) {
            const index = typeof payload.index === 'number' ? payload.index : state.tableNum
            if (index < 0 || index >= state.tables.length) {
                return
            }
            state.tables[index].occupied = !!payload.value
            persistTableByIndex(state, index)
        },
        updateTableGoodPpl(state, value){
            state.tables[state.tableNum].goodPpl = value
            persistCurrentTable(state)
        },
        //calcualte drink price
        // calculateDrinkPrice(state){
        //     let num = state.tables[0].drinks
        //     let result = {}
        //     num.forEach((x) => {
        //         result[x] = result[x] || 0
        //         result[x]++
        //     })
        //     let numWater = result.Water
        //     let numDrink = num.length - numWater
        //     // Object.keys(myObj).length
        //     console.log('water: ' + result.Water)
        //     console.log('others: '+ (num.length - result.Water))
        //     state.tables[0].drinkPrice = WATERPRICE*numWater + DRINKPRICE*numDrink
        // },
        // calculate total price
        calculateTotal(state){
            const table = state.tables[state.tableNum]
            if (!table) {
                return
            }
            
            // If table is already occupied OR has a totalPrice set, don't recalculate price
            // Prices should remain fixed once a table is seated, has been printed, or has a price set
            // Note: Don't store pricingModeDinner here for already-occupied/printed tables
            // because we can't know the original mode. The inference logic in components will handle it.
            const hasPriceSet = table.totalPrice && parseFloat(table.totalPrice) > 0
            const isOccupied = table.occupied
            const isPrinted = !isOccupied && hasPriceSet
            const hasTimeStamp = table.time && table.time > 0
            
            if (isOccupied || hasPriceSet || hasTimeStamp) {
                return
            }
            
            // change table to occupied
            table.occupied = true
            let num = table.drinks
            let numWater = 0
            let numDrink = 0
            if (num.length!=0){
                let result = {}
                
                num.forEach((x) => {
                    result[x] = result[x] || 0
                    result[x]++
                })
                // console.log(result.WTER)
                if (result.WTER!=null){
                    numWater = result.WTER
                }else{
                    numWater = 0
                }
                // numWater = result.Water
                numDrink = num.length - numWater
            }

            // Object.keys(myObj).length
            // console.log('water: ' + result.Water)
            // console.log('others: '+ (num.length - result.Water))
            table.drinkPrice = state.WATERPRICE*numWater + state.DRINKPRICE*numDrink
            // Store the pricing mode used when calculating this table's price
            // This ensures line items always show the correct prices even after mode changes
            table.pricingModeDinner = state.isDinner
            if(state.isDinner){
                // console.log('diner')
                table.totalPrice = ((table.drinkPrice + table.adult * state.ADULTDINNERPRICE + table.bigKid * state.BIGKIDDINNERPRICE + table.smlKid * state.SMALLKIDDINNERPRICE)*state.TAX_RATE).toFixed(2)
            }else{
                // console.log('lunch')
                table.totalPrice = ((table.drinkPrice + table.adult * state.ADULTPRICE + table.bigKid * state.BIGKIDPRICE + table.smlKid * state.SMALLKIDPRICE)*state.TAX_RATE).toFixed(2)
            }
            persistCurrentTable(state)
        },
        getTimestamp(state, tableIndex){
            const index = typeof tableIndex === 'number' ? tableIndex : state.tableNum
            if (index < 0 || index >= state.tables.length) {
                return
            }
            const today = new Date();
            const hours = String(today.getHours()).padStart(2, '0')
            const minutes = String(today.getMinutes()).padStart(2, '0')
            const now = `${hours}:${minutes}`
            state.tables[index].sitDownTime = now
            persistTableByIndex(state, index)
        },
        setTableSitDownTime(state, payload = {}) {
            const index = typeof payload.index === 'number' ? payload.index : state.tableNum
            if (index < 0 || index >= state.tables.length) {
                return
            }
            const value = typeof payload.value === 'string' ? payload.value : ''
            state.tables[index].sitDownTime = value
            persistTableByIndex(state, index)
        },
        clearEverything(state){
            state.tables[state.tableNum].sitDownTime=""
            state.tables[state.tableNum].adult=0
            state.tables[state.tableNum].bigKid=0
            state.tables[state.tableNum].smlKid=0
            state.tables[state.tableNum].drinks=[]
            state.tables[state.tableNum].drinkPrice=0
            state.tables[state.tableNum].totalPrice=0
            state.tables[state.tableNum].goodPpl=false
            state.tables[state.tableNum].occupied = false
            delete state.tables[state.tableNum].pricingModeDinner
            persistCurrentTable(state)
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
            const table = state.tables[state.tableNum]
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
                
            // Add sales record to Firestore if enabled
                if (state.useFirebase && state.firebaseInitialized) {
                    Promise.all([
                        firestore.addSalesRecord({
                            tableNumber: table.number,
                            orderType: 'dine-in',
                            revenue: revenue,
                            adultCount: adultCount,
                            bigKidCount: bigKidCount,
                            smlKidCount: smlKidCount
                        }),
                        firestore.saveSalesSummary(buildSalesSummaryForFirestore(state.sales))
                    ]).then(() => {
                        console.log('[Firestore] Sales successfully saved')
                    }).catch(err => {
                        console.error('[Firestore] Failed to save sales:', err)
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



        // to-go order lines
        appendTogoLines(state, lines = []) {
            lines.forEach(line => {
                if (!line || Number(line.quantity) <= 0) {
                    return
                }
                const itemName = line.itemName || line.item
                const note = (line.note || '').trim()
                const basePrice = Number(line.basePrice ?? line.price ?? 0)
                const extraPrice = Number(line.extraPrice ?? line.extra ?? 0)
                const quantity = Number(line.quantity ?? 0)
                const categoryIndex = Number.isInteger(line.categoryIndex) ? line.categoryIndex : (Number.isInteger(line.id) ? line.id : null)
                const itemIndex = Number.isInteger(line.itemIndex) ? line.itemIndex : (Number.isInteger(line.nTerm) ? line.nTerm : null)
                const existing = state.togoLines.find(entry =>
                    entry.itemName === itemName &&
                    entry.note === note &&
                    Math.abs(entry.basePrice - basePrice) < 0.0001 &&
                    Math.abs(entry.extraPrice - extraPrice) < 0.0001
                )
                if (existing) {
                    existing.quantity += quantity
                } else {
                    state.togoLines.push({
                        lineId: state.nextTogoLineId++,
                        itemName,
                        categoryIndex,
                        itemIndex,
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
            const lineId = payload.lineId
            const line = typeof lineId === 'number'
                ? state.togoLines.find(entry => entry.lineId === lineId)
                : null
            if (!line) {
                return
            }
            if (payload.quantity !== undefined) {
                const quantity = Number(payload.quantity)
                if (Number.isFinite(quantity) && quantity >= 0) {
                    line.quantity = quantity
                }
            }
            if (payload.note !== undefined) {
                line.note = (payload.note || '').trim()
            }
            if (payload.basePrice !== undefined) {
                line.basePrice = Number(payload.basePrice || 0)
            }
            if (payload.extraPrice !== undefined) {
                line.extraPrice = Number(payload.extraPrice || 0)
            }
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
            if (state.useFirebase && state.firebaseInitialized) {
                firestore.addTogoSalesRecord({
                    createdAt: Date.now(),
                    items: orderItems,
                    subtotal,
                    total: parseFloat(togoRevenue),
                    taxRate: state.TAX_RATE
                }).catch(err => console.error('Failed to persist to-go sales:', err))
            }
            state.totalTogoPrice = (subtotal * state.TAX_RATE).toFixed(2)
            state.sales.totalTogoRevenue = Number(state.sales.totalTogoRevenue || 0) + Number(state.totalTogoPrice || 0)
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
        },
        setTables(state, tables) {
            state.tables = tables
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
                
                // Add sales record to Firestore if enabled
                if (state.useFirebase && state.firebaseInitialized) {
                    Promise.all([
                        firestore.addSalesRecord({
                            tableNumber: null, // Cashier/walk-in orders don't have table numbers
                            orderType: 'cashier',
                            revenue: revenue,
                            adultCount: adultCount,
                            bigKidCount: bigKidCount,
                            smlKidCount: smallKidCount
                        }),
                        firestore.saveSalesSummary(buildSalesSummaryForFirestore(state.sales))
                    ]).then(() => {
                        console.log('[Firestore] Cashier sales successfully saved')
                    }).catch(err => {
                        console.error('[Firestore] Failed to save cashier sales:', err)
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
            const tableCount = Array.isArray(state.tables) ? state.tables.length : 10
            state.tableOrder = normalizeTableOrder(order, tableCount)
        },
        /**
         * Add a new table to the tables array
         */
        addTable(state) {
            const existingNumbers = state.tables.map(t => t.number).filter(Boolean)
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
            
            state.tables.push(newTable)
            
            // Update tableOrder to include the new table
            const tableCount = state.tables.length
            state.tableOrder = normalizeTableOrder(state.tableOrder, tableCount)
            
            // Persist to Firestore if enabled
            if (state.useFirebase && state.firebaseInitialized) {
                firestore.saveTable(newTableNumber, newTable).catch(err => {
                    console.error('[Firestore] Failed to save new table:', err)
                })
            }
        },
        /**
         * Remove a table from the tables array
         * Only allows removal if table is not occupied
         */
        removeTable(state, tableNumber) {
            const tableIndex = state.tables.findIndex(t => t.number === tableNumber)
            if (tableIndex === -1) {
                return
            }
            
            const table = state.tables[tableIndex]
            // Prevent removal of occupied tables
            if (table.occupied) {
                console.warn('Cannot remove occupied table:', tableNumber)
                return
            }
            
            // Remove from tables array
            state.tables.splice(tableIndex, 1)
            
            // Update tableOrder to remove the table number
            state.tableOrder = state.tableOrder.filter(num => num !== tableNumber)
            const tableCount = state.tables.length
            state.tableOrder = normalizeTableOrder(state.tableOrder, tableCount)
            
            // Delete from Firestore if enabled
            if (state.useFirebase && state.firebaseInitialized) {
                firestore.deleteTable(tableNumber).catch(err => {
                    console.error('[Firestore] Failed to delete table:', err)
                })
            }
        },
        /**
         * Update a table's name
         */
        updateTableName(state, payload) {
            const { tableNumber, name } = payload
            const tableIndex = state.tables.findIndex(t => t.number === tableNumber)
            if (tableIndex === -1) {
                return
            }
            
            const table = state.tables[tableIndex]
            // Set name to null if empty string, otherwise set to trimmed value
            table.name = name && name.trim() ? name.trim() : null
            
            // Persist to Firestore if enabled
            if (state.useFirebase && state.firebaseInitialized) {
                firestore.saveTable(tableNumber, table).catch(err => {
                    console.error('[Firestore] Failed to update table name:', err)
                })
            }
        },

        /**
         * Update buffet pricing and tax rate (admin panel).
         * Expects prices in dollars and taxRatePercent as a percentage (e.g. 7 = 7% tax).
         */
        updatePricingSettings(state, payload = {}) {
            const toNumberOr = (value, fallback) => {
                const num = Number(value)
                return Number.isFinite(num) ? num : fallback
            }

            const nextAdultLunch = toNumberOr(payload.adultLunch, state.ADULTPRICE)
            const nextBigKidLunch = toNumberOr(payload.bigKidLunch, state.BIGKIDPRICE)
            const nextSmallKidLunch = toNumberOr(payload.smallKidLunch, state.SMALLKIDPRICE)
            const nextAdultDinner = toNumberOr(payload.adultDinner, state.ADULTDINNERPRICE)
            const nextBigKidDinner = toNumberOr(payload.bigKidDinner, state.BIGKIDDINNERPRICE)
            const nextSmallKidDinner = toNumberOr(payload.smallKidDinner, state.SMALLKIDDINNERPRICE)

            state.ADULTPRICE = nextAdultLunch
            state.BIGKIDPRICE = nextBigKidLunch
            state.SMALLKIDPRICE = nextSmallKidLunch
            state.ADULTDINNERPRICE = nextAdultDinner
            state.BIGKIDDINNERPRICE = nextBigKidDinner
            state.SMALLKIDDINNERPRICE = nextSmallKidDinner

            if (payload.taxRatePercent !== undefined) {
                const currentPercent = (state.TAX_RATE - 1) * 100
                const percent = toNumberOr(payload.taxRatePercent, currentPercent)
                const multiplier = 1 + Math.max(0, percent) / 100
                state.TAX_RATE = Number(multiplier.toFixed(4))
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
                    state.togoLines.push({
                        lineId: Number(line.lineId) || state.nextTogoLineId++,
                        itemName: line.itemName || line.item,
                        categoryIndex: Number.isInteger(line.categoryIndex) ? line.categoryIndex : (Number.isInteger(line.id) ? line.id : null),
                        itemIndex: Number.isInteger(line.itemIndex) ? line.itemIndex : (Number.isInteger(line.nTerm) ? line.nTerm : null),
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
                    state.togoLines.push({
                        lineId: state.nextTogoLineId++,
                        itemName: entry.item,
                        categoryIndex: Number.isInteger(entry.id) ? entry.id : null,
                        itemIndex: Number.isInteger(entry.nTerm) ? entry.nTerm : null,
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
            if (!usingFirebase && Array.isArray(payload.tables)) {
                state.tables = JSON.parse(JSON.stringify(payload.tables))
            }
            if (Array.isArray(payload.tableOrder) && payload.tableOrder.length > 0) {
                const tableCount = Array.isArray(state.tables) ? state.tables.length : 10
                state.tableOrder = normalizeTableOrder(payload.tableOrder, tableCount)
            }
            if (!usingFirebase && Array.isArray(payload.menu)) {
                state.menu = JSON.parse(JSON.stringify(payload.menu))
            }
            if (payload.timestamp || payload.updatedAt) {
                state.lastAppStateSyncedAt = payload.timestamp || payload.updatedAt
            }
        },
        setAppStateSyncTimestamp(state, timestamp) {
            state.lastAppStateSyncedAt = timestamp || null
        },
        calculateTogoTotal(state) {
            recalcTogoTotals(state)
        },
        
    },
    getters: {
        isAdmin(state) {
            return state.authRole === 'admin'
        },
        isServer(state) {
            return state.authRole === 'server'
        }
    },
    setters: {

    },
    actions: {
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

                if (Array.isArray(tablesDocs) && tablesDocs.length > 0) {
                    commit('setTables', tablesDocs)
                    console.log('[Firestore] Tables loaded:', tablesDocs.length, 'tables')
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
            }
        },

        cleanupFirebase({ commit }) {
            commit('setFirebaseUnsubscribers', [])
            commit('setFirebaseInitialized', false)
        },

        /**
         * Persist entire menu collection to Firestore
         */
        async saveMenuToFirestore({ state }) {
            if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
                return
            }
            const categories = state.menu || []
            try {
                await Promise.all(categories.map(category => {
                    const categoryId = category.category || category.id || 'category'
                    return firestore.saveMenuCategory(categoryId, {
                        category: categoryId,
                        items: Array.isArray(category.items) ? category.items : []
                    })
                }))
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
            const table = state.tables[index]
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
                await Promise.all(tables.map(table => {
                    if (!table || !table.number) return Promise.resolve()
                    return firestore.saveTable(table.number, table)
                }))

                await firestore.saveSalesSummary(buildSalesSummaryForFirestore(state.sales))

                console.log('[Firestore] Sample data populated')
                return { success: true, menuItems: categories.length, tables: tables.length }
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
            await dispatch('saveMenuToFirestore')
        },

        async resetSalesData({ commit, state }) {
            if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
                console.log('[Firestore] resetSalesData skipped - not authenticated or initialized')
                return { error: 'Not authorized' }
            }
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
            }
        },

        async loadTogoSalesHistory({ state }) {
            if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
                console.log('[Firestore] loadTogoSalesHistory skipped - not authenticated or initialized')
                return []
            }
            try {
                const history = await firestore.loadTogoSalesHistory()
                return history.sort((a, b) => {
                    const tsA = a.timestamp ? new Date(a.timestamp).getTime() : 0
                    const tsB = b.timestamp ? new Date(b.timestamp).getTime() : 0
                    return tsB - tsA
                })
            } catch (error) {
                console.error('[Firestore] Failed to load togo sales history:', error)
                return []
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
                console.error('[Firebase] Sign-in failed:', error)
                commit('setAuthError', error.message)
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
        togoLines: JSON.parse(JSON.stringify(state.togoLines)),
        togoCustomizations: JSON.parse(JSON.stringify(state.togoCustomizations || {})),
        totalTogoPrice: state.totalTogoPrice,
        tableOrder: normalizeTableOrder(state.tableOrder, Array.isArray(state.tables) ? state.tables.length : 10)
    }

    if (!state.useFirebase) {
        snapshot.sales = JSON.parse(JSON.stringify(state.sales))
        snapshot.tables = JSON.parse(JSON.stringify(state.tables))
        snapshot.menu = JSON.parse(JSON.stringify(state.menu))
        snapshot.togoCustomizations = JSON.parse(JSON.stringify(state.togoCustomizations || {}))
    }

    return snapshot
}

function persistTableByIndex(state, index) {
    if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
        return
    }
    const table = state.tables[index]
    if (!table || !table.number) {
        return
    }
    firestore.saveTable(table.number, table).catch(err => {
        console.error('[Firestore] Failed to save table:', err)
    })
}

function persistCurrentTable(state) {
    persistTableByIndex(state, state.tableNum)
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

    store.subscribe((mutation, state) => {
        if (!state.useFirebase || !state.firebaseInitialized || !state.authUser) {
            return
        }
        if (ignoredMutations.has(mutation.type)) {
            return
        }
        if (syncTimeout) {
            clearTimeout(syncTimeout)
        }
        syncTimeout = setTimeout(async () => {
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
                    console.log('[Firestore] App state synced', timestamp ? `(@ ${timestamp})` : '')
                    lastSnapshotHash = snapshotHash
                } else if (response && response.error) {
                    console.error('[Firestore] Failed to sync app state:', response.error)
                }
            } catch (error) {
                console.error('[Firestore] Failed to sync app state:', error)
            } finally {
                pendingHash = null
            }
        }, 600)
    })
}

function stateSupportsSync(state) {
    if (!state || !state.useFirebase || !state.authUser) {
        return false
    }
    return typeof firestore.saveAppState === 'function'
}

attachFirestoreStateSync(store)

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