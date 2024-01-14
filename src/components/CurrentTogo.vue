<script>
  
  // import ref from 'vue'
export default {
  
  
}


</script>

<template>
    <v-dialog width="700">
        <v-card>
            <v-card-title class="headline black d-flex" primary-title>
                <p class="text-h6 ps-3 me-auto">Current Order </p>
                <p class="text-h6 pr-3"> Price </p>
                <p class="text-h6 pr-8"> Quantity</p>
                <!-- {{ $store.state.sales.totalTogoPriceState }} -->
                <v-btn size="small" @click="$store.commit('calculateTogoTotal')" outlined color="primary">Update</v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <div v-if="$store.state.seletedTogo.length === 0" >
                <p class="text-h6 ma-1 ps-3 me-auto text-center"> No one ordered nothing </p>
            </div>
            <div v-for="(item, index ) in $store.state.seletedTogo">
                <v-card-title class="headline black d-flex" primary-title>
                    <p class="text-h6 ma-1 ps-3 me-auto">{{ item.item }} </p>
                    <p class="text-h6 pr-10">${{ item.price }} </p>
                    <p class="text-h6 pr-10">{{ item.quantity }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseSelectedQuantity', index)">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseSelectedQuantity', index)">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-card-title>
                <v-divider></v-divider>
            </div>

            <v-card-actions>
                <v-btn class="ml-auto" @click="$store.commit('togoPaid')" outlined>
                    <v-icon size="x-large" icon="mdi-cash-check"></v-icon>
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>