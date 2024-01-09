<script>
  
  // import ref from 'vue'
export default {
  
  data: () => ({
    togoCompose: false,
  }),
  methods: {
    clickingItem(i){
      // console.log("items: "+this.$store.state.menu[i].category)
      this.$store.state.catID = i - 1
      // console.log("items after: "+this.$store.state.menu[i].category)
      this.togoCompose=true
    }
  }
  
}


</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col v-for="i in 3" :key="i" cols="4">
            <v-card class="mx-auto" height="150" :title=$store.state.menu[i-1].category @click="clickingItem(i)">
              <!-- displaying relevant food menus :title="$store.state.menu(i).title"-->
              <!-- <p>{{ $store.state.menu($store.state.catID).category }}</p> -->
              <togo-details v-model="togoCompose"></togo-details>
            </v-card>

          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>


<style>

</style>
