<template>
    <v-dialog width="600" v-if="updateBtn">
        <v-card>
            <v-card-title class="headline black d-flex font-weight-black" primary-title>
                Table {{ $store.state.tableNum + 1 }} <v-spacer></v-spacer>
                <!-- <v-btn size="small" @click="$store.commit('calculateTotal')" outlined color="primary">Update</v-btn> -->
                <p class="text-h6 pr-5 me-auto"> $ {{ $store.state.tables[$store.state.tableNum].totalPrice }} </p>
                <v-btn size="small" @click=updateMenu outlined color="primary">Update</v-btn>
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
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseAdult'); $store.commit('calculateTotal')">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 me-auto">Kid(6-9)</p>
                    <p class="text-h6 ma-1 pr-5 me-auto">{{ $store.state.tables[$store.state.tableNum].bigKid }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseBigKid'); $store.commit('calculateTotal')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseBidKid'); $store.commit('calculateTotal')">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 me-auto">Kid(2-5)</p>
                    <p class="text-h6 ma-1 pr-5 me-auto"> {{ $store.state.tables[$store.state.tableNum].smlKid }} </p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseSmlKid'); $store.commit('calculateTotal')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseSmlKid'); $store.commit('calculateTotal')">
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
                <v-btn class="ma-auto" @click="printTicket" outlined >
                    <v-icon size="x-large" icon="mdi-printer"></v-icon>
                </v-btn>
                <v-btn class="ma-auto" @click="$store.state.tables[$store.state.tableNum].goodPpl = !$store.state.tables[$store.state.tableNum].goodPpl" outlined color="pink-darken-1">
                    <v-icon size="x-large" icon="mdi-heart-broken" v-if="$store.state.tables[$store.state.tableNum].goodPpl == true"></v-icon>
                    <v-icon size="x-large" icon="mdi-heart" v-if="$store.state.tables[$store.state.tableNum].goodPpl == false"></v-icon>
                </v-btn>
            </v-card-actions>
        </v-card>

 <v-card id="printJS-lunch" class="d-none">
    <img src='/src/assets/RECEIPT_TOP_NO_BG.png' style="display: block;
                                                        padding-top: 100px;
                                                        margin-left: auto;
                                                        margin-right: auto;
                                                        width: 90%;">
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].adult }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Buffet</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 270px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].adult * $store.state.ADULTPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].bigKid }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Kid(6-9)</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 190px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].bigKid * $store.state.BIGKIDPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].smlKid }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Kid(2-5)</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 190px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].smlKid * $store.state.SMALLKIDPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].drinks.length }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Drink</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 275px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].totalPrice - ($store.state.tables[$store.state.tableNum].adult * $store.state.ADULTPRICE*$store.state.TAX_RATE) - ($store.state.tables[$store.state.tableNum].bigKid * $store.state.BIGKIDPRICE*$store.state.TAX_RATE).toFixed(2) - ($store.state.tables[$store.state.tableNum].smlKid * $store.state.SMALLKIDPRICE*$store.state.TAX_RATE).toFixed(2)).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 150%; padding-left: 150px; margin-bottom: -10px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Total</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 360px;"><h1 style="font-size: 80px">$ {{ $store.state.tables[$store.state.tableNum].totalPrice }}</h1></div>
    </div>
    <img src='/src/assets/RECEIPT_BTM_NO_BG.png'  style="display: block;
                                                        margin-left: auto;
                                                        margin-right: auto;
                                                        width: 90%;">
     <div style="width: 100%; height: 80px">
    </div>
 </v-card>

 <v-card id="printJS-dinner" class="d-none">
    <img src='/src/assets/RECEIPT_TOP_NO_BG.png' style="display: block;
                                                        padding-top: 100px;
                                                        margin-left: auto;
                                                        margin-right: auto;
                                                        width: 90%;">
    <div style="width: 50%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].adult }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Buffet</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 270px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].adult * $store.state.ADULTDINNERPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 50%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].bigKid }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Kid(6-9)</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 190px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].bigKid * $store.state.BIGKIDDINNERPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 50%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].smlKid }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Kid(2-5)</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 190px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].smlKid * $store.state.SMALLKIDDINNERPRICE*$store.state.TAX_RATE).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 50%; padding-left: 150px; margin-bottom: -50px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">{{ $store.state.tables[$store.state.tableNum].drinks.length }}</h1></div>
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Drink</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 275px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].totalPrice - ($store.state.tables[$store.state.tableNum].adult * $store.state.ADULTDINNERPRICE*$store.state.TAX_RATE) - ($store.state.tables[$store.state.tableNum].bigKid * $store.state.BIGKIDDINNERPRICE*$store.state.TAX_RATE).toFixed(2) - ($store.state.tables[$store.state.tableNum].smlKid * $store.state.SMALLKIDDINNERPRICE*$store.state.TAX_RATE).toFixed(2)).toFixed(2) }}</h1></div>
    </div>
    <div style="width: 50%; padding-left: 150px; margin-bottom: -10px;">
        <div style="display: inline-block; margin: 10px;"><h1 style="font-size: 80px">Total</h1></div>
        <div style="display: inline-block; margin: 10px; padding-left: 360px;"><h1 style="font-size: 80px">$ {{ ($store.state.tables[$store.state.tableNum].totalPrice).toFixed(2) }}</h1></div>
    </div>
    <img src='/src/assets/RECEIPT_BTM_NO_BG.png'  style="display: block;
                                                        margin-left: auto;
                                                        margin-right: auto;
                                                        width: 90%;">
     <div style="width: 100%; height: 80px"></div>
 </v-card>

    </v-dialog>
    
</template>


<script>
export default {
    data: () => ({
        valid: true,
        updateBtn: true
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
            this.$store.commit('getTimestamp')
        },
        printTicket(){
            if (this.$store.state.isDinner == false){
                printJS({ printable: 'printJS-lunch', type: 'html'})
            } else {
                printJS({ printable: 'printJS-dinner', type: 'html'})
            }
        
        },
        paying(){
            this.updateBtn = !this.updateBtn
            this.$store.commit('paid');
        }
    },
    // computed: {
    //     tableNumLocal() { return this.$store.state.tableNum }
    //     }

}
</script>
  



<!-- <style>
      @media print{
    /* @page { 
            margin-top: 10mm;
            margin-bottom:10mm; 
     }; */
    body * {
      display: block;
    }
  }
</style> -->