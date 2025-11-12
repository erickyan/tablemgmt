import { createStore } from 'vuex'
import * as firestore from '../services/firestoreData'
import { auth } from '../firebase'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth'

const ADMIN_EMAILS = (import.meta.env.VITE_FIREBASE_ADMIN_EMAILS || '')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean)

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
        sales:{
            totalCount: 0,
            adultCount: 0,
            bigKidCount: 0,
            smlKidCount: 0,
            revenue:0,
            totalTogoRevenue: 0
        },
        TAX_RATE: 1.07,
        ADULTPRICE: 9.99,
        BIGKIDPRICE: 5.99,
        SMALLKIDPRICE: 4.99,
        ADULTDINNERPRICE: 12.25,
        BIGKIDDINNERPRICE: 6.99,
        SMALLKIDDINNERPRICE: 5.99,
        WATERPRICE: 0.27,
        DRINKPRICE:1.75,
        tableNum:0,
        catID: 0,
        seletedTogo: [],
        tables: [
            {
                number: 1,
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
            // change table to occupied
            state.tables[state.tableNum].occupied = true
            let num = state.tables[state.tableNum].drinks
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
            state.tables[state.tableNum].drinkPrice = state.WATERPRICE*numWater + state.DRINKPRICE*numDrink
            if(state.isDinner){
                // console.log('diner')
                state.tables[state.tableNum].totalPrice = ((state.tables[state.tableNum].drinkPrice + state.tables[state.tableNum].adult * state.ADULTDINNERPRICE + state.tables[state.tableNum].bigKid * state.BIGKIDDINNERPRICE + state.tables[state.tableNum].smlKid * state.SMALLKIDDINNERPRICE)*state.TAX_RATE).toFixed(2)
            }else{
                // console.log('lunch')
                state.tables[state.tableNum].totalPrice = ((state.tables[state.tableNum].drinkPrice + state.tables[state.tableNum].adult * state.ADULTPRICE + state.tables[state.tableNum].bigKid * state.BIGKIDPRICE + state.tables[state.tableNum].smlKid * state.SMALLKIDPRICE)*state.TAX_RATE).toFixed(2)
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
            
            // Calculate total price based on lunch/dinner
            let subtotal = table.drinkPrice
            if (state.isDinner) {
                subtotal += (adultCount * state.ADULTDINNERPRICE) + (bigKidCount * state.BIGKIDDINNERPRICE) + (smlKidCount * state.SMALLKIDDINNERPRICE)
            } else {
                subtotal += (adultCount * state.ADULTPRICE) + (bigKidCount * state.BIGKIDPRICE) + (smlKidCount * state.SMALLKIDPRICE)
            }
            
            const revenue = parseFloat((subtotal * state.TAX_RATE).toFixed(2))
            table.totalPrice = revenue.toFixed(2)
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
            persistCurrentTable(state)
        },



        // togo stuff
        increaseOrderQuantity(state, n){
            // console.log(state.menu[state.catID].items[n].quantity)
            // console.log(state)
            // console.log(n)
            state.menu[state.catID].items[n].quantity++
            let currIndex = state.seletedTogo.findIndex(({item}) => item === state.menu[state.catID].items[n].name)
            // state.sales.totalTogoPriceState = state.menu[state.catID].items[n].quantity * state.menu[state.catID].items[n].listPrice
            if (currIndex === -1) {
                // console.log("a")
                state.seletedTogo.push({
                    "item":state.menu[state.catID].items[n].name,
                    "price":state.menu[state.catID].items[n].listPrice.toFixed(2),
                    "quantity":state.menu[state.catID].items[n].quantity,

                    // George's code
                    id:state.catID,
                    nTerm:n
                    
                })
            } else {
                // console.log("b")
                state.seletedTogo[currIndex].quantity = state.menu[state.catID].items[n].quantity
            }
            
            // console.log(state.seletedTogo)
            // console.log(state.seletedTogo.find(({item}) => item === "Pork Egg Roll"))

            // console.log(state.menu[state.catID].category)
        },
        decreaseOrderQuantity(state, n){
            // console.log(state.menu[state.catID].items[n].quantity)
            // console.log(state)
            // console.log(n)
            const menuCategory = state.menu[state.catID]
            if (!menuCategory || !menuCategory.items[n]) {
                return
            }
            const item = menuCategory.items[n]
            if (item.quantity <= 0) {
                item.quantity = 0
                return
            }
            item.quantity -= 1

            const currIndex = state.seletedTogo.findIndex(({ item: itemName }) => itemName === item.name)
            if (currIndex !== -1) {
                if (item.quantity <= 0) {
                    state.seletedTogo.splice(currIndex, 1)
                } else {
                    state.seletedTogo[currIndex].quantity = item.quantity
                }
            }
        },
        calculateTogoTotal(state){
            // console.log(state.menu[state.catID].items[n].quantity)
            // console.log(state)
            // console.log(n)
            // state.sales.totalTogoPriceState = state.menu[state.catID].items[n].quantity * state.menu[state.catID].items[n].listPrice
            let totalTogoPrice = 0
            let currentMenuItem = state.menu
            let currentPrice = 0
            for(var i=0; i<currentMenuItem.length; i++){
                let items=currentMenuItem[i].items
                // console.log(currentMenuItem[0].items[0].name)
                for(var j=0; j<items.length; j++){
                    // console.log("inside")
                    currentPrice = items[j].listPrice*items[j].quantity
                    totalTogoPrice += currentPrice
                    currentPrice=0
                }
                // console.log("side")
            }
            // console.log(totalTogoPrice)
            state.totalTogoPrice = (totalTogoPrice*state.TAX_RATE).toFixed(2)
            // console.log(state.sales.totalTogoPriceState)
        },
        increaseSelectedQuantity(state, n){
            const selected = state.seletedTogo[n]
            if (!selected) {
                return
            }
            selected.quantity++
            const menuCategory = state.menu[selected.id]
            const menuItem = menuCategory && menuCategory.items[selected.nTerm]
            if (menuItem) {
                menuItem.quantity = selected.quantity
            }
        },
        decreaseSelectedQuantity(state, n){
            const selected = state.seletedTogo[n]
            if (!selected) {
                return
            }
            if (selected.quantity <= 1) {
                const menuCategory = state.menu[selected.id]
                const menuItem = menuCategory && menuCategory.items[selected.nTerm]
                if (menuItem) {
                    menuItem.quantity = 0
                }
                state.seletedTogo.splice(n, 1)
                return
            }
            selected.quantity -= 1
            const menuCategory = state.menu[selected.id]
            const menuItem = menuCategory && menuCategory.items[selected.nTerm]
            if (menuItem) {
                menuItem.quantity = selected.quantity
            }
        },
        togoPaid(state){
            // Recalculate togo total before payment (ensure price is up to date)
            let totalTogoPrice = 0
            let currentMenuItem = state.menu
            const orderItems = []
            for(var i=0; i<currentMenuItem.length; i++){
                let items=currentMenuItem[i].items
                for(var j=0; j<items.length; j++){
                    const quantity = Number(items[j].quantity ?? 0)
                    if (quantity > 0) {
                        orderItems.push({
                            name: items[j].name,
                            quantity,
                            price: Number(items[j].listPrice ?? 0)
                        })
                        totalTogoPrice += items[j].listPrice * quantity
                    }
                }
            }
            const togoRevenue = (totalTogoPrice * state.TAX_RATE).toFixed(2)
            const togoRevenueNum = parseFloat(togoRevenue) || 0
            
            // Only process payment if there's actual revenue
            if (togoRevenueNum > 0) {
                // Update sales summary in state (this updates the UI immediately)
                const currentTogoRevenue = parseFloat(state.sales.totalTogoRevenue) || 0
                const currentTotalRevenue = parseFloat(state.sales.revenue) || 0
                state.sales.totalTogoRevenue = (currentTogoRevenue + togoRevenueNum).toFixed(2)
                state.sales.revenue = (currentTotalRevenue + togoRevenueNum).toFixed(2)
                
                console.log('Togo sales updated:', {
                    totalTogoRevenue: state.sales.totalTogoRevenue,
                    orderRevenue: togoRevenueNum
                })
                
                // Add sales record to Firestore if enabled
                if (state.useFirebase && state.firebaseInitialized) {
                    Promise.all([
                        firestore.addSalesRecord({
                            tableNumber: 0,
                            orderType: 'togo',
                            revenue: togoRevenueNum,
                            adultCount: 0,
                            bigKidCount: 0,
                            smlKidCount: 0,
                            items: orderItems
                        }),
                        firestore.saveSalesSummary(buildSalesSummaryForFirestore(state.sales))
                    ]).then(() => {
                        console.log('[Firestore] Togo sales saved')
                    }).catch(err => {
                        console.error('[Firestore] Failed to save togo sales:', err)
                    })
                }
            } else {
                console.warn('Togo payment attempted but no items in order')
            }
            
            // resetting menu and cart (always clear cart after payment attempt)
            state.seletedTogo=[]
            state.totalTogoPrice=0
            for(var i=0; i<currentMenuItem.length; i++){
                let items=currentMenuItem[i].items
                for(var j=0; j<items.length; j++){
                    items[j].quantity = 0
                }
            }
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
        },
        setTableOrder(state, order = []) {
            if (Array.isArray(order) && order.length > 0) {
                state.tableOrder = order.slice()
            }
        },
        setAppState(state, payload = {}) {
            const usingFirebase = !!state.useFirebase
            if (payload.isDinner !== undefined) {
                state.isDinner = payload.isDinner
            }
            if (typeof payload.tableNum === 'number') {
                state.tableNum = payload.tableNum
            }
            if (typeof payload.catID === 'number') {
                state.catID = payload.catID
            }
            if (Array.isArray(payload.seletedTogo)) {
                state.seletedTogo = JSON.parse(JSON.stringify(payload.seletedTogo))
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
                state.tableOrder = JSON.parse(JSON.stringify(payload.tableOrder))
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
        }
        
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
                return
            }
            if (!auth) {
                console.warn('[Firebase] Auth is not configured. Check environment variables.')
                commit('setAuthLoading', false)
                return
            }
            if (state.authUnsubscriber) {
                return
            }
            commit('setAuthLoading', true)
            commit('setAuthError', null)

            const unsubscribe = onAuthStateChanged(auth, async user => {
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
                commit('setAuthLoading', false)
            }, error => {
                console.error('[Firebase] Auth state change error:', error)
                commit('setAuthError', error.message)
                commit('setAuthLoading', false)
            })

            commit('setAuthUnsubscriber', unsubscribe)
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
        seletedTogo: JSON.parse(JSON.stringify(state.seletedTogo)),
        totalTogoPrice: state.totalTogoPrice,
        tableOrder: JSON.parse(JSON.stringify(state.tableOrder))
    }

    if (!state.useFirebase) {
        snapshot.sales = JSON.parse(JSON.stringify(state.sales))
        snapshot.tables = JSON.parse(JSON.stringify(state.tables))
        snapshot.menu = JSON.parse(JSON.stringify(state.menu))
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