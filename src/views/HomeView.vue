<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <!-- default cols=4 -->
          <v-col v-for="n in 30" :key="n" cols="4">
            <v-card class="mx-auto" height="200" @click="addDetails(n)">
              <v-card-item>
                <v-card-title class="headline font-weight-black d-flex">
                  <!-- <v-chip size="x-small" variant="flat" v-bind:style="[$store.state.tables[n - 1].occupied ? {'color': 'green'} : {'color': 'red'}]"> -->
                    <v-icon icon="mdi-check-circle-outline" v-bind:style="[$store.state.tables[n - 1].occupied ? {'color': 'red'} : {'color': 'green'}]"> </v-icon>
                  <!-- </v-chip> -->
                  Table {{ n }}
                  <v-spacer></v-spacer>
                  {{ $store.state.tables[n-1].sitDownTime }}
                  <v-icon icon="mdi-cards-heart" color="pink-darken-1" size="x-small" v-if="$store.state.tables[n - 1].goodPpl"></v-icon>
                </v-card-title>
                <v-divider></v-divider>
                  <v-list-item>
                    <!-- <v-icon icon="mdi-account"></v-icon> -->
                    <div class="d-flex justify-space-between ">
                      <!-- <v-icon icon="mdi-account"></v-icon> -->
                      <v-list-item-title> Adult </v-list-item-title>
                      <v-list-item-title> {{ $store.state.tables[n - 1].adult }}</v-list-item-title>
                      <!-- <v-list-item-title > Price </v-list-item-title> -->
                    </div>
                    <div class="d-flex justify-space-between">
                      <!-- <v-icon icon="mdi-nintendo-game-boy"></v-icon> -->
                      <v-list-item-title> Kid(6-9) </v-list-item-title>
                      <v-list-item-title> {{ $store.state.tables[n - 1].bigKid }}</v-list-item-title>
                      <!-- <v-list-item-title> Price </v-list-item-title> -->
                    </div>
                    <div class="d-flex justify-space-between">
                      <!-- <v-icon icon="mdi-teddy-bear"></v-icon> -->
                      <v-list-item-title> Kid(2-5) </v-list-item-title>
                      <v-list-item-title> {{ $store.state.tables[n - 1].smlKid }}</v-list-item-title>
                      <!-- <v-list-item-title> Price </v-list-item-title> -->
                    </div>
                    <v-row no-gutters>
                      <v-col cols="12" sm="3" v-for="drink in $store.state.tables[n - 1].drinks"> 
                       {{ drink }}
                      </v-col>
                    </v-row>
                  </v-list-item>
              </v-card-item>
            </v-card>
            <div class="d-flex justify-end mb-6">
              <v-list-item-title class="font-weight-black text-h6 pr-3"> Total $ {{
                $store.state.tables[n - 1].totalPrice }}
              </v-list-item-title>
            </div>

          </v-col>
        </v-row>
      </v-container>
      <!-- <order-details v-model="detailCompose"></order-details> -->
      <order-details v-model="detailCompose" v-if="$store.state.showDetailSwitch"></order-details>
    </v-main>
  </v-app>
</template>


<script>

// const printBtn = document.getElementById('printMeId');

//   printBtn.addEventListener('click', function (){
//     print()
//     console.log('1')
//   })
export default {
  data: () => ({
    drawer: null,
    detailCompose: false,
    showDetails: false
    // goodPpl: true,

  }),
  methods: {
    addDetails(n) {
      // console.log($store.state.tables.adult)
      this.$store.state.tableNum = n - 1
      // this.detailCompose = true
      this.detailCompose = true
      this.showDetails = !this.showDetails
      this.$store.state.showDetailSwitch = !this.$store.state.showDetailSwitch
      // console.log(this.$store.state.tableNum )
    },
    // printMe(){
    //   console.log('h')
    //   window.print()
    // }
  },
  // computed: {
  //   tableNumLocal() { return this.$store.state.tableNum }
  // }

}

  
    

</script>