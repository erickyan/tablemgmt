import { createStore } from 'vuex'

export default createStore({
    state: {
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
        ADULTPRICE: 11.12,
        BIGKIDPRICE: 6.47,
        SMALLKIDPRICE: 5.39,
        ADULTDINNERPRICE: 13.26,
        BIGKIDDINNERPRICE: 7.55,
        SMALLKIDDINNERPRICE: 6.47,
        WATERPRICE: 0.27,
        DRINKPRICE:1.72,
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
        },
        decreaseAdult(state){
            state.tables[state.tableNum].adult--
        },
        increaseBigKid(state){
            state.tables[state.tableNum].bigKid++
        },
        decreaseBidKid(state){
            state.tables[state.tableNum].bigKid--
        },
        increaseSmlKid(state){
            state.tables[state.tableNum].smlKid++
        },
        decreaseSmlKid(state){
            state.tables[state.tableNum].smlKid--
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
            
        },
        getTimestamp(state){
            const today = new Date();
            const now = today.getHours() + ":" + today.getMinutes()
            state.tables[state.tableNum].sitDownTime = now
            // console.log(state.sitDownTime)
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
        },
        // saveFile(state) {
        //     const data = JSON.stringify(state.tables)
        //     const fs = require('fs')
        //     try { fs.writeFileSync('myfile.txt', data, 'utf-8'); }
        //     catch(e) { alert('Failed to save the file !'); }
        // }
        // rev = price+price 
        // count = 
        paid(state){
            state.sales.revenue = (state.sales.revenue*1 + state.tables[state.tableNum].totalPrice*1).toFixed(2)
            state.sales.adultCount = (state.sales.adultCount*1 + state.tables[state.tableNum].adult*1)
            state.sales.bigKidCount = (state.sales.bigKidCount*1 + state.tables[state.tableNum].bigKid*1)
            state.sales.smlKidCount = (state.sales.smlKidCount*1 + state.tables[state.tableNum].smlKid*1)
            state.sales.totalCount = state.sales.adultCount + state.sales.bigKidCount + state.sales.smlKidCount
            // resetting table
            state.tables[state.tableNum].sitDownTime=""
            state.tables[state.tableNum].adult=0
            state.tables[state.tableNum].bigKid=0
            state.tables[state.tableNum].smlKid=0
            state.tables[state.tableNum].drinks=[]
            state.tables[state.tableNum].drinkPrice=0
            state.tables[state.tableNum].totalPrice=0
            state.tables[state.tableNum].goodPpl=false
            state.tables[state.tableNum].occupied = false
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
            state.menu[state.catID].items[n].quantity--
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
            this.state.seletedTogo[n].quantity++
            let temp = this.state.seletedTogo[n]
            
            this.state.menu[temp.id].items[temp.nTerm].quantity = temp.quantity
        },
        decreaseSelectedQuantity(state, n){
            this.state.seletedTogo[n].quantity--
            let temp = this.state.seletedTogo[n]
            
            this.state.menu[temp.id].items[temp.nTerm].quantity = temp.quantity
        },
        togoPaid(state){
            state.sales.totalTogoRevenue = (state.sales.totalTogoRevenue*1 +state.totalTogoPrice*1).toFixed(2)
            // resetting menu and cart
            state.seletedTogo=[]
            state.totalTogoPrice=0
            let currentMenuItem = state.menu
            for(var i=0; i<currentMenuItem.length; i++){
                let items=currentMenuItem[i].items
                for(var j=0; j<items.length; j++){
                    items[j].quantity = 0
                    // console.log("name: " + items[j].name + ", quantity: " + items[j].quantity)
                }
            }
        }
        
    },
    getters: {

    },
    setters: {

    },
    actions: {
//for asyn stuff. no need for now
    },
    modules: {}
})