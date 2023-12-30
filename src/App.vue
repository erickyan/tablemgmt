<script setup>
import { RouterLink, RouterView } from 'vue-router'

</script>

<template>
  <v-app>
    <v-navigation-drawer 
          v-model="drawer"
          temporary
        >
        <v-list-item
            prepend-avatar="https://randomuser.me/api/portraits/men/78.jpg"
            title="China Buffet"
          ></v-list-item>
  
          <v-divider></v-divider>
          <v-list-item
            prepend-icon='mdi-view-dashboard'
            title="Home"
            to='/'
          ></v-list-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon='mdi-forum'
            title="About"
            to="about"
          ></v-list-item>
          <v-divider></v-divider>
        </v-navigation-drawer>
        <v-app-bar 
          :elevation="2"
        >
        <v-app-bar-nav-icon @click="drawer = !drawer">
        </v-app-bar-nav-icon>
        <v-app-bar-title>Tables</v-app-bar-title>
      </v-app-bar>
      <v-main>
        
        <RouterView />
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
    // detailCompose: false,
    sideBarList: [
      {title: 'Home', icon: 'mdi-view-dashboard', to:'/'},
      {title: 'About', icon: 'mdi-forum', to:'/about'}
    ]
  }),
}
</script>