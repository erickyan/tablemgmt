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
            totalTogoPriceState: 0
        },
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
        menu : [
            
        {
            category: 'Appetizers',
            items: [
            {
                name: 'Pork Egg Roll',
                quantity: 0,
                listPrice: 1.50
            },
            {
                name: 'Shrimp Egg Roll',
                quantity: 0,
                listPrice: 1.75
            },
            {
                name: 'Vegetable Egg Roll',
                quantity: 0,
                listPrice: 1.00
            }
            ]
        },
        {
            category: 'Soup',
            items: [
            {
                name: 'Egg Drop Soup',
                quantity: 0,
                listPrice: 2.50
            },
            {
                name: 'Wanton Soup',
                quantity: 0,
                listPrice: 2.50
            }
            ]
        },
        {
            category: 'Lo Mien',
            items: [
            {
                name: 'House Special Lo Mien',
                quantity: 0,
                listPrice: 7.00
            },
            {
                name: 'Beef Lo Mien',
                quantity: 0,
                listPrice: 6.00
            }
            ]
        },
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
                state.tables[state.tableNum].totalPrice = (state.tables[state.tableNum].drinkPrice + state.tables[state.tableNum].adult * state.ADULTDINNERPRICE + state.tables[state.tableNum].bigKid * state.BIGKIDDINNERPRICE + state.tables[state.tableNum].smlKid * state.SMALLKIDDINNERPRICE).toFixed(2)
            }else{
                // console.log('lunch')
                state.tables[state.tableNum].totalPrice = (state.tables[state.tableNum].drinkPrice + state.tables[state.tableNum].adult * state.ADULTPRICE + state.tables[state.tableNum].bigKid * state.BIGKIDPRICE + state.tables[state.tableNum].smlKid * state.SMALLKIDPRICE).toFixed(2)
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
            state.sales.totalTogoPriceState = totalTogoPrice.toFixed(2)
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

        addingTogo(state){
            console.log('togo')
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