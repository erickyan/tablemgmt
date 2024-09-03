<template>
    <v-dialog width="600" v-if="updateBtn" persistent>
        
        <!-- <v-btn size="small" @click=newQuote outlined color="primary">get quote</v-btn> -->
        <!-- {{ msg }} -->
        <v-card>
            <v-card-title class="headline black d-flex font-weight-black" primary-title>
                Table {{ $store.state.tableNum + 1 }} <v-spacer></v-spacer>
                <!-- <v-btn size="small" @click="$store.commit('calculateTotal')" outlined color="primary">Update</v-btn> -->
                <p class="text-h6 pr-5 me-auto"> $ {{ $store.state.tables[$store.state.tableNum].totalPrice }} </p>
                <v-btn size="small" @click = updateMenu outlined 
                                    :color = "$store.state.tables[$store.state.tableNum].totalPrice-0 <= 0 ? 'error' : 'primary' "
                                    :text = "$store.state.tables[$store.state.tableNum].totalPrice-0 <= 0 ? 'X' : 'Update'" ></v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <!-- <v-form ref="sendForm" v-model="valid" lazy-validation> -->
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 me-auto">Buffet</p>
                    <p class="text-h6 ma-1 me-auto">{{ $store.state.tables[$store.state.tableNum].adult }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseAdult'); $store.commit('calculateTotal')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <!-- <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseAdult'); $store.commit('calculateTotal')" v-bind:style="[$store.state.tables[$store.state.tableNum].adult === 0 ? {disabled: true} : {disabled : false}]"> -->
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseAdult'); $store.commit('calculateTotal')" :disabled="$store.state.tables[$store.state.tableNum].adult === 0">
  
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 me-auto">Kid(6-9)</p>
                    <p class="text-h6 ma-1 pr-5 me-auto">{{ $store.state.tables[$store.state.tableNum].bigKid }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseBigKid'); $store.commit('calculateTotal')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseBidKid'); $store.commit('calculateTotal')" :disabled="$store.state.tables[$store.state.tableNum].bigKid === 0">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 me-auto">Kid(2-5)</p>
                    <p class="text-h6 ma-1 pr-5 me-auto"> {{ $store.state.tables[$store.state.tableNum].smlKid }} </p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseSmlKid'); $store.commit('calculateTotal')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseSmlKid'); $store.commit('calculateTotal')" :disabled="$store.state.tables[$store.state.tableNum].smlKid === 0">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet>
                    <v-container >
                        <div style="display: flex; height: 70px;">
                            <v-row no-gutters>
                                <v-col cols="12" sm="2" v-for="drink in $store.state.tables[$store.state.tableNum].drinks">
                                    {{ drink }}
                                </v-col>
                            </v-row>
                        </div>
                    </v-container>

                    <v-chip-group size="x-small" style="height: auto; overflow-y: auto;">
                        <!-- <v-btn @click="reorderDrink()" icon="mdi-cancel" color="red-accent-4" size="x-small"></v-btn> -->
                        <v-chip @click="addDrinks('WTER'); $store.commit('calculateTotal')"><v-icon start icon="mdi-cup-water"></v-icon>Water</v-chip>
                        <v-chip @click="addDrinks('COKE'); $store.commit('calculateTotal')"><v-icon start icon="mdi-bottle-soda-classic"></v-icon>Coke</v-chip>
                        <v-chip @click="addDrinks('STEA'); $store.commit('calculateTotal')"><v-icon start icon="mdi-cube"></v-icon>SweetTea</v-chip>
                        <v-chip @click="addDrinks('SPRT'); $store.commit('calculateTotal')"><v-icon start icon="mdi-cube"></v-icon>Sprite</v-chip>
                        <v-chip @click="addDrinks('DRPP'); $store.commit('calculateTotal')"><v-icon start icon="mdi-cube"></v-icon>DrPepper</v-chip>
                        <v-chip @click="addDrinks('DIET'); $store.commit('calculateTotal')"><v-icon start icon="mdi-cube"></v-icon>DietCoke</v-chip>
                        <v-chip @click="addDrinks('UTEA'); $store.commit('calculateTotal')"><v-icon start icon="mdi-cube"></v-icon>UnsweetTea</v-chip>
                        <v-chip @click="addDrinks('FANT'); $store.commit('calculateTotal')"><v-icon start icon="mdi-cube"></v-icon>Fanta</v-chip>
                        <v-chip @click="addDrinks('HALF'); $store.commit('calculateTotal')"><v-icon start icon="mdi-cube"></v-icon>Half-Half</v-chip>
                        <v-chip @click="addDrinks('COFE'); $store.commit('calculateTotal')"><v-icon start icon="mdi-coffee"></v-icon>Coffee</v-chip>
                        <v-chip @click="addDrinks('HTEA'); $store.commit('calculateTotal')"><v-icon start icon="mdi-tea"></v-icon>Hot Tea</v-chip>
                        
                        <!-- <v-chip @click="addDrinks('')">Water</v-chip>
                            <v-chip @click="addDrinks('')">HotTea</v-chip>
                            <v-chip @click="addDrinks('')">Coke</v-chip>
                            <v-chip @click="addDrinks('')">Lemonate</v-chip>
                            <v-chip @click="addDrinks('')">DrPepper</v-chip>
                            <v-chip @click="addDrinks('')">DietCoke</v-chip>
                            <v-chip @click="addDrinks('')">SweetTea</v-chip>
                            <v-chip @click="addDrinks('')">UnsweetTea</v-chip>
                            <v-chip @click="addDrinks('')">Half-Half</v-chip> -->
                    </v-chip-group>

                </v-sheet>
                <!-- </v-form> -->
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>

                <!-- <v-btn class="ml-auto" @click="$store.commit('addingTogo')" outlined>
                    TOGO
                </v-btn> -->
                <!-- <v-text-field id="togobox" density="compact" variant="plain">  -->
                    <!-- TOGO:  -->
                    <!-- {{ $store.state.tables[$store.state.tableNum].togo }} -->
                <!-- </v-text-field> -->
                <v-btn class="ma-auto" @click="paying" outlined color="green-darken-1">
                    <v-icon size="x-large" icon="mdi-cash-check"></v-icon>
                </v-btn>
                <v-btn class="ma-auto" @click="$store.commit('clearEverything')" outlined color="red-darken-4">
                    <v-icon size="x-large" icon="mdi-cancel"></v-icon>
                </v-btn>
                <!-- <v-btn class="ma-auto" @click="newQuote(); printTicket()" outlined >
                    <v-icon size="x-large" icon="mdi-printer"></v-icon>
                </v-btn> -->
                <v-btn class="ma-auto" @click="printTicket()" outlined >
                    <v-icon size="x-large" icon="mdi-printer"></v-icon>
                </v-btn>
                <v-btn class="ma-auto" @click="$store.state.tables[$store.state.tableNum].goodPpl = !$store.state.tables[$store.state.tableNum].goodPpl" outlined color="pink-darken-1">
                    <v-icon size="x-large" icon="mdi-heart-broken" v-if="$store.state.tables[$store.state.tableNum].goodPpl == true"></v-icon>
                    <v-icon size="x-large" icon="mdi-heart" v-if="$store.state.tables[$store.state.tableNum].goodPpl == false"></v-icon>
                </v-btn>
            </v-card-actions>
        </v-card>

 <v-card id="printJS-lunch" class="d-none">
    <h1 style="font-size: 40px; float: inline-end; position: relative;left: -40px">{{ this.$store.state.ticketCounterCN }}</h1>
    <br />
    <img src='/src/assets/RECEIPT_TOP_NO_BG.png' style="display: block;
                                                        padding-top: 100px;
                                                        margin-left: auto;
                                                        margin-right: auto;
                                                        width: 75%;">
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].adult }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px"> Buffet</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 270px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].adult * $store.state.ADULTPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].bigKid }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px"> Kid(6-9)</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 190px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].bigKid * $store.state.BIGKIDPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].smlKid }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px"> Kid(2-5)</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 190px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].smlKid * $store.state.SMALLKIDPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].drinks.length }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px"> Drink</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 275px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].totalPrice - ($store.state.tables[$store.state.tableNum].adult * $store.state.ADULTPRICE*$store.state.TAX_RATE) - ($store.state.tables[$store.state.tableNum].bigKid * $store.state.BIGKIDPRICE*$store.state.TAX_RATE).toFixed(2) - ($store.state.tables[$store.state.tableNum].smlKid * $store.state.SMALLKIDPRICE*$store.state.TAX_RATE).toFixed(2)).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px;">
        <div style="position: relative; top: -20px;"><h1>-----------------------------------------------------------------------------</h1></div>
        <div style="display: inline-block; position: relative; top: -230px; margin: 10px;"><h1 style="font-size: 80px"> Total</h1></div>
        <div style="display: inline-block; position: relative; top: -230px; margin: 10px; padding-left: 360px;"><h1 style="font-size: 80px">$ {{ $store.state.tables[$store.state.tableNum].totalPrice }}</h1></div>
        <div style="position: relative; top: -230px; padding-left: 260px;"><h1 style="font-size: 50px"> * 7% Tax Included $ {{ ($store.state.tables[$store.state.tableNum].totalPrice*0.07).toFixed(2) }}</h1></div>
    </div>
    <img src='/src/assets/RECEIPT_BTM_NO_BG.png'  style="
                                                        display: block;
                                                        position: relative;
                                                        top: -150px;
                                                        margin-left: auto;
                                                        margin-right: auto; 
                                                        margin-top: -60px;
                                                        width: 75%;">
    <div style="width: 100%; margin-bottom: -50px; ">
        <div>
            <p style="font-size: 40px; font-style: italic; position: relative; top: -150px;">{{ this.$store.state.quote }}</p>
            <p style="font-size: 40px; float: inline-end; position: relative; top: -190px; left: -40px">{{ this.$store.state.author }}</p>
        </div>
    </div>
 </v-card>

 <v-card id="printJS-dinner" class="d-none">
    <h1 style="font-size: 40px; float: inline-end; position: relative;left: -40px">{{ this.$store.state.ticketCounterCN }}</h1>
    <img src='/src/assets/RECEIPT_TOP_NO_BG.png' style="display: block;
                                                        padding-top: 100px;
                                                        margin-left: auto;
                                                        margin-right: auto;
                                                        width: 75%;">
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].adult }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Buffet</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 270px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].adult * $store.state.ADULTDINNERPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].bigKid }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Kid(6-9)</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 190px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].bigKid * $store.state.BIGKIDDINNERPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].smlKid }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Kid(2-5)</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 190px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].smlKid * $store.state.SMALLKIDDINNERPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].drinks.length }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Drink</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 275px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].totalPrice - ($store.state.tables[$store.state.tableNum].adult * $store.state.ADULTDINNERPRICE*$store.state.TAX_RATE) - ($store.state.tables[$store.state.tableNum].bigKid * $store.state.BIGKIDDINNERPRICE*$store.state.TAX_RATE).toFixed(2) - ($store.state.tables[$store.state.tableNum].smlKid * $store.state.SMALLKIDDINNERPRICE*$store.state.TAX_RATE).toFixed(2)).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px;">
        <div style="position: relative; top: -20px;"><h1>-----------------------------------------------------------------------------</h1></div>
        <div style="display: inline-block; position: relative; top: -230px; margin: 10px;"><h1 style="font-size: 80px"> Total</h1></div>
        <div style="display: inline-block; position: relative; top: -230px; margin: 10px; padding-left: 360px;"><h1 style="font-size: 80px">$ {{ $store.state.tables[$store.state.tableNum].totalPrice }}</h1></div>
        <div style="position: relative; top: -230px; padding-left: 260px;"><h1 style="font-size: 50px"> * 7% Tax Included $ {{ ($store.state.tables[$store.state.tableNum].totalPrice*0.07).toFixed(2) }}</h1></div>
    </div>
    <img src='/src/assets/RECEIPT_BTM_NO_BG.png'  style="
                                                        display: block;
                                                        position: relative;
                                                        top: -150px;
                                                        margin-left: auto;
                                                        margin-right: auto; 
                                                        margin-top: -60px;
                                                        width: 75%;">
    <div style="width: 100%; margin-bottom: -50px; ">
        <div>
            <p style="font-size: 40px; font-style: italic; position: relative; top: -150px;">{{ this.$store.state.quote }}</p>
            <p style="font-size: 40px; float: inline-end; position: relative; top: -190px; left: -40px">{{ this.$store.state.author }}</p>
        </div>
    </div>
 </v-card>

    </v-dialog>
    
</template>


<script>
    
export default {
    data: () => ({
        valid: true,
        updateBtn: true,
        // quote: "Knowing is not enough, we must apply. Willing is not enough, we must do.",
        // author: "Bruce Lee",
        // ticketCounter: 1,
        // ticketCounterCN: '一'
    }),
    methods: {
        addDrinks(btnV) {
            // const buttonValue = e.target.value;
            this.$store.state.tables[this.$store.state.tableNum].drinks.push(btnV)
            this.$store.state.tables[this.$store.state.tableNum].drinks.sort()
            // console.log(this.$store.state.dinnerTime)

            // let num = this.$store.state.tables[0].drinks
            // let result = {}
            // num.forEach((x) => {
            //     result[x] = result[x] || 0
            //     result[x]++
            // })

            // Object.keys(myObj).length
            // console.log('water: ' + result.Water)
            // console.log('others: '+ (num.length - result.Water))
            // console.log(btnV)
        },
        reorderDrink(){
            this.$store.state.tables[this.$store.state.tableNum].drinks = []
            // console.log(this.$store.state.tables[this.$store.state.tableNum].drinks )
        },
        updateMenu(){
            this.$store.commit('calculateTotal')
            this.updateBtn = !this.updateBtn
            this.$store.state.showDetailSwitch = !this.$store.state.showDetailSwitch
            if(this.$store.state.tables[this.$store.state.tableNum].occupied){
                this.$store.commit('getTimestamp')
            }
            // console.log(numberToZh(this.$store.state.ticketCounter)); 
            
        },
        printTicket(){
            // console.log('a'+this.ticketCounterCN)
            this.$store.commit('newQuote')
            this.$store.commit('increaseTicketCounter')
            if (this.$store.state.isDinner == false){
                // console.log('b'+this.$store.state.ticketCounterCN)
                printJS({ printable: 'printJS-lunch', type: 'html'})
            } else {
                printJS({ printable: 'printJS-dinner', type: 'html'})
            }
            // this.$store.state.ticketCounter++
            // console.log('c'+this.ticketCounterCN)
            
            // this.ticketCounterCN = numberToZh(this.$store.state.ticketCounter)
            // console.log('d'+this.ticketCounterCN)
            
        },
        paying(){
            this.updateBtn = !this.updateBtn
            this.$store.commit('paid');
            this.$store.state.showDetailSwitch = !this.$store.state.showDetailSwitch
        },
        // fetchData() {
		// 	fetch('https://zenquotes.io/api/quotes/', {
		// 		// method: 'GET',
        //         mode: 'no-cors',
		// 		// headers: {
        //         //     // 'Content-Type': 'application/json',
        //         //     // 'Accept': 'application/json',
        //         //     // 'Content-Type': 'application/json'
		// 		// 	// 'x-rapidapi-host': 'random-facts2.p.rapidapi.com',
        //         //     'Access-Control-Allow-Origin': '*',
        //         //     'Access-Control-Allow-Methods':'GET, POST, PUT, DELETE, OPTIONS'
		// 		// },
		// 	})
        //     .then(response => {
        //         // if(!response.ok){
        //         //     throw new Error ('some network error')
        //         // }
        //         response.json()
        //     })
        //     .then(data => {
        //         try {
        //         const data = data ? JSON.parse(data) : {};
        //         console.log(data);
        //         } catch (error) {
        //         console.error('Error parsing JSON:', error);
        //         }
        //         console.log(data)
        //     })
        //     .catch(err => {console.log("err: ", err)})
		// },
        // newQuote(){
        //     // const api_url = "https://api.allorigins.win/get?url=https://zenquotes.io/api/random";
        //     const api_url ="https://api.allorigins.win/get?url=https://zenquotes.io/api/random"
        //     // async function getapi(url){
        //     // {
        //     const getapi = async (url) => {
        //     const response = await fetch(url, {method: "GET"});
        //     var data = await response.json();
        //     var resJson = JSON.parse(data.contents)
        //     this.quote = resJson[0].q
        //     this.author = resJson[0].a
        //     console.log("quote: " + resJson[0].q + ". author: " + resJson[0].a);
        //     // this.quote = JSON.stringify(resJson[0].q)
        //     // this.author = JSON.stringify(resJson[0].a)
        //     }
        //     getapi(api_url);
        // }
    },
    // computed: {
    //     tableNumLocal() { return this.$store.state.tableNum }
    //     }

}
</script>