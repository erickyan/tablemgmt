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
  },
  computed: {
    menuCategories() {
      const menu = this.$store.state.menu
      if (!Array.isArray(menu)) {
        return []
      }
      return menu.map((category, index) => ({
        title: category?.category || `Category ${index + 1}`,
        index
      }))
    }
  }
  
}


</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col
            v-for="category in menuCategories"
            :key="category.index"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              class="mx-auto"
              height="80"
              :title="category.title"
              @click="clickingItem(category.index + 1)"
            >
              <!-- displaying relevant food menus :title="$store.state.menu(i).title"-->
              <!-- <p>{{ $store.state.menu($store.state.catID).category }}</p> -->
            </v-card>
          </v-col>
          <v-col v-if="menuCategories.length === 0" cols="12">
            <v-alert type="info" variant="tonal">
              Menu data is not available yet. Please configure the menu from the admin panel.
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
      <togo-details v-model="togoCompose"></togo-details>
    </v-main>
  </v-app>
</template>


<style>

</style>
