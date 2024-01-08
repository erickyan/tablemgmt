<script>
  
  // import ref from 'vue'
export default {
  
  data: () => ({
    menu : [
      {
        category: 'Appetizers',
        items: [
          {
            name: 'Pork Egg Roll',
            Quantity: 0,
            listPrice: 0
          },
          {
            name: 'Shrimp Egg Roll',
            Quantity: 0,
            listPrice: 0
          }
        ]
      },
      {
        category: 'Soup',
        items: [
        {
            name: 'Egg Drop Soup',
            Quantity: 0,
            listPrice: 0
          },
          {
            name: 'Wanton Soup',
            Quantity: 0,
            listPrice: 0
          }
        ]
      },
    ]
  }),
  methods: {
    clickingItem(e, item){
      console.log(e, "items: "+item.items[0].name)
    }
  }
  
}


</script>

<template>
    <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col v-for="item in menu" cols="4">
            <v-card class="mx-auto" :title=item.category @click="clickingItem($event, item)">
              <!-- displaying relevant food menus -->
              
            </v-card>

          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>


<style>

</style>
