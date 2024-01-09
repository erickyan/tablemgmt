<template>
    <v-dialog width="600">
        <v-card>
            <div v-for="item in $store.state.menu[$store.state.catID].items">
                <v-card-title class="headline black d-flex" primary-title>
                    {{ item.name }} <v-spacer></v-spacer>
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