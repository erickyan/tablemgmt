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
            prepend-avatar="https://randomuser.me/api/portraits/men/78.jpg"
            title="China Buffet">
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
          <v-list-item
            prepend-icon='mdi-currency-usd'
          >${{ $store.state.sales.revenue }}</v-list-item>
          <v-divider></v-divider>
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
          <v-list-item>
            <v-switch
              v-model="dinnertime"
              color="primary"
              @click="toggleDinner"
              inset
              label="Blue is Lunch price"
              density:compact
            ></v-switch>
          </v-list-item>
          <v-divider></v-divider>
        </v-navigation-drawer>
        <v-app-bar 
          :elevation="2"
        >
        <v-app-bar-nav-icon @click="drawer = !drawer">
        </v-app-bar-nav-icon>
        <v-app-bar-title>China Buffet</v-app-bar-title>



        <v-layout style="height: 56px;">
            <v-bottom-navigation v-model="toggleTogo">
              <v-btn value>
                <v-icon size="x-large" v-bind:style="[($store.state.seletedTogo.length !== 0) ? {'color': 'red'} : {'color': 'black'}]" >mdi-food-takeout-box-outline</v-icon>
                <span>Togo</span>
                
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
    // detailCompose: false,
    sideBarList: [
      {title: 'Home', icon: 'mdi-view-dashboard', to:'/'},
      {title: 'About', icon: 'mdi-forum', to:'/about'}
    ]
  }),
  methods: {
    toggleDinner(){
      this.$store.state.isDinner = this.dinnertime
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
</style>