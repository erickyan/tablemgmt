<template>
    <v-dialog width="600" v-if="updateBtn">
        <v-card>
            <v-card-title class="headline black d-flex" primary-title>
                Table No {{ $store.state.tableNum + 1 }} <v-spacer></v-spacer>
                <!-- <v-btn size="small" @click="$store.commit('calculateTotal')" outlined color="primary">Update</v-btn> -->
                <v-btn size="small" @click=updateMenu outlined color="primary">Update</v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <!-- <v-form ref="sendForm" v-model="valid" lazy-validation> -->
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 ps-3 me-auto">Buffet   </p>
                    <p class="text-h6 ma-1 me-auto">{{ $store.state.tables[$store.state.tableNum].adult }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseAdult')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseAdult')">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 ps-3 me-auto">B Kid</p>
                    <p class="text-h6 ma-1 me-auto">{{ $store.state.tables[$store.state.tableNum].bigKid }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseBigKid')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseBidKid')">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 ps-3 me-auto">S Kid</p>
                    <p class="text-h6 ma-1 me-auto"> {{ $store.state.tables[$store.state.tableNum].smlKid }} </p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseSmlKid')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseSmlKid')">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet>


                    <v-container >
                        <div style="display: flex; height: 70px;">
                            <v-row no-gutters>
                                <v-col cols="12" sm="3" v-for="drink in $store.state.tables[$store.state.tableNum].drinks">
                                    {{ drink }}
                                </v-col>
                            </v-row>
                        </div>
                    </v-container>

                    <v-chip-group size="x-small" style="height: 130px; overflow-y: scroll;">
                        <!-- <v-btn @click="reorderDrink()" icon="mdi-cancel" color="red-accent-4" size="x-small"></v-btn> -->
                        <v-chip @click="addDrinks('WTER')"><v-icon start icon="mdi-cube"></v-icon>Water</v-chip>
                        <v-chip @click="addDrinks('COKE')"><v-icon start icon="mdi-cube"></v-icon>Coke</v-chip>
                        <v-chip @click="addDrinks('STEA')"><v-icon start icon="mdi-cube"></v-icon>SweetTea</v-chip>
                        <v-chip @click="addDrinks('SPRT')"><v-icon start icon="mdi-cube"></v-icon>Sprite</v-chip>
                        <v-chip @click="addDrinks('DRPP')"><v-icon start icon="mdi-cube"></v-icon>DrPepper</v-chip>
                        <v-chip @click="addDrinks('DIET')"><v-icon start icon="mdi-cube"></v-icon>DietCoke</v-chip>
                        <v-chip @click="addDrinks('UTEA')"><v-icon start icon="mdi-cube"></v-icon>UnsweetTea</v-chip>
                        <v-chip @click="addDrinks('LMND')"><v-icon start icon="mdi-cube"></v-icon>Lemonade</v-chip>
                        <v-chip @click="addDrinks('HALF')"><v-icon start icon="mdi-cube"></v-icon>Half-Half</v-chip>
                        <v-chip @click="addDrinks('COFE')"><v-icon start icon="mdi-cube"></v-icon>Coffee</v-chip>
                        <v-chip @click="addDrinks('HTEA')"><v-icon start icon="mdi-cube"></v-icon>Hot Tea</v-chip>
                        
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
            <v-card-actions>

                <!-- <v-btn class="ml-auto" @click="$store.commit('addingTogo')" outlined>
                    TOGO
                </v-btn> -->
                <!-- <v-text-field id="togobox" density="compact" variant="plain">  -->
                    <!-- TOGO:  -->
                    <!-- {{ $store.state.tables[$store.state.tableNum].togo }} -->
                <!-- </v-text-field> -->
                <v-btn class="ml-auto" @click="$store.commit('paid')" outlined>
                    <v-icon size="x-large" icon="mdi-cash-check"></v-icon>
                </v-btn>
                <v-btn class="ml-auto" @click="$store.commit('clearEverything')" outlined>
                    <v-icon size="x-large" icon="mdi-cancel"></v-icon>
                </v-btn>
                <v-btn class="ml-auto" @click="$store.commit('getTimestamp')" outlined >
                    <v-icon size="x-large" icon="mdi-clock-check-outline"></v-icon>
                </v-btn>
                <v-btn class="ml-auto" @click="$store.state.tables[$store.state.tableNum].goodPpl = !$store.state.tables[$store.state.tableNum].goodPpl" outlined color="pink-darken-1">
                    <v-icon size="x-large" icon="mdi-heart-broken" v-if="$store.state.tables[$store.state.tableNum].goodPpl == true"></v-icon>
                    <v-icon size="x-large" icon="mdi-heart" v-if="$store.state.tables[$store.state.tableNum].goodPpl == false"></v-icon>
                </v-btn>
            </v-card-actions>
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
        }
    },
    // computed: {
    //     tableNumLocal() { return this.$store.state.tableNum }
    //     }

}
</script>
  
<!-- <style>
    #id{
        /* text-field-details-padding-inline: 0px; */
        text-field-input-padding-start: 0px
    }
</style> -->