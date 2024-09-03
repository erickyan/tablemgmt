<script setup>
import { RouterView } from 'vue-router'

</script>


<template>
  <v-app>
    <v-navigation-drawer 
          v-model="drawer"
          temporary
        >
        <v-list-item
            prepend-avatar="/public/RY_DP.png"
            title="China Restaurant v1.1">
        </v-list-item>
  
          <v-divider></v-divider>
          <v-list-item
            prepend-icon='mdi-store'
            title="Home"
            to='/'
          ></v-list-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon='mdi-food-takeout-box'
            title="Order"
            to="about"
          ></v-list-item>
          <v-divider></v-divider>
          <!-- <v-list-item
            prepend-icon='mdi-currency-usd'
          >
          ${{ $store.state.sales.revenue }}
        </v-list-item>
          <v-divider></v-divider> -->
          <v-list-item
            prepend-icon='mdi-account-multiple'
          >{{ $store.state.sales.totalCount }}</v-list-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon='mdi-account'
          >{{ $store.state.sales.adultCount }}</v-list-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon='mdi-nintendo-game-boy'
          >{{ $store.state.sales.bigKidCount }}</v-list-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon='mdi-teddy-bear'
          >{{ $store.state.sales.smlKidCount }}</v-list-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon='mdi-food-takeout-box-outline'
          >${{ $store.state.sales.totalTogoRevenue }}</v-list-item>
          <v-divider></v-divider>
          <!-- <v-list-item>
            <v-switch
              v-model="dinnertime"
              color="primary"
              @click="toggleDinner"
              inset
              label="Blue is Lunch price"
              density:compact
            ></v-switch>
          </v-list-item> -->
          <v-divider></v-divider>
        </v-navigation-drawer>
        <v-app-bar 
          :elevation="2"
        >
        <v-app-bar-nav-icon @click="drawer = !drawer">
        </v-app-bar-nav-icon>
        <v-app-bar-title>China Restaurant</v-app-bar-title>



        <!-- <v-layout style="height: 56px;">
            <v-bottom-navigation v-model="toggleTogo">
              <v-btn value>
                <v-icon size="x-large" v-bind:style="[($store.state.seletedTogo.length !== 0) ? {'color': 'red'} : {'color': 'black'}]" >mdi-food-takeout-box-outline</v-icon>
                <span>Togo</span>
                
              </v-btn>
              <div v-if="$store.state.totalTogoPrice !== 0"><v-chip class="ma-2" label color="red"> ${{ $store.state.totalTogoPrice}} </v-chip></div>
            </v-bottom-navigation>
         
          </v-layout> -->

          <v-layout style="height: 56px;">
            <v-bottom-navigation>
              <v-btn @click=toggleDinner>

                <v-icon size="x-large" icon="mdi-white-balance-sunny" v-if="$store.state.isDinner == false"></v-icon>
                <v-icon size="x-large" icon="mdi-weather-night" v-if="$store.state.isDinner == true"></v-icon>
                <!-- <v-icon size="x-large" v-bind:style="[($store.state.seletedTogo.length !== 0) ? {'color': 'red'} : {'color': 'black'}]" >mdi-food-takeout-box-outline</v-icon> -->
                <!-- <span v-bind:style="[($store.state.isDinner) ? {'content': 'red'} : {'content': 'black'}]">dinner</span> -->
                {{ label }}
              </v-btn>
              <div v-if="$store.state.totalTogoPrice !== 0"><v-chip class="ma-2" label color="red"> ${{ $store.state.totalTogoPrice}} </v-chip></div>
            </v-bottom-navigation>
         
          </v-layout>

      </v-app-bar>
      <v-main>
        <RouterView />
        <currenttogo-details v-model="toggleTogo"></currenttogo-details>
      </v-main>
  </v-app>
  
</template>

<script>
export default {
  props: {
        // adultNo: 
    },
  data: () => ({ 
    drawer: null,
    dinnertime: true,
    toggleTogo: false,
    label: 'LUNCH',
    // detailCompose: false,
    sideBarList: [
      {title: 'Home', icon: 'mdi-view-dashboard', to:'/'},
      {title: 'About', icon: 'mdi-forum', to:'/about'}
    ]
  }),
  methods: {
    toggleDinner(){
      this.$store.state.isDinner = !this.$store.state.isDinner
      if (this.$store.state.isDinner === true){
        this.label = 'DINNER'
      } else {
        this.label = 'LUNCH'
      }
      // console.log("local: " + this.dinnertime)
      // console.log("global: " + this.$store.state.isDinner)
    }
  },
  toggleTogo(){
    this.toggleTogo=true
  }
}
</script>
<style>
* {
    -ms-touch-action: manipulation;
    touch-action: manipulation;
}
  /* @media print{
     @page { 
            margin-top: 10mm;
            margin-bottom:10mm; 
     }; 
     * {
      display: none
    }
  } */
</style>