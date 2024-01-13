<template>
    <v-dialog width="600">
        <v-card>
            <v-card-title class="headline black d-flex" primary-title>
                <p class="text-h6 ps-3 me-auto">ITEM </p>
                <p class="text-h6 pr-3"> Price </p>
                <p class="text-h6 pr-8"> Quantity</p>
                {{ $store.state.sales.totalTogoPriceState }}
                <v-btn size="small" @click="$store.commit('calculateTogoTotal')" outlined color="primary">Update</v-btn>
            </v-card-title>
            <div v-for="(item, index ) in $store.state.menu[$store.state.catID].items">
                <v-card-title class="headline black d-flex" primary-title>
                    <p class="text-h6 ma-1 ps-3 me-auto">{{ item.name }} </p>
                    <p class="text-h6 pr-10">{{ item.listPrice }} </p>
                    <p class="text-h6 pr-10">{{ item.quantity }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseOrderQuantity', index)">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseOrderQuantity', index)">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-card-title>
                <v-divider></v-divider>
            </div>
            
        </v-card>
    </v-dialog>
</template>


<script>
export default {
  
}
</script>
  
<!-- <style>
    #id{
        /* text-field-details-padding-inline: 0px; */
        text-field-input-padding-start: 0px
    }
</style> -->