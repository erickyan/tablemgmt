<template>
  <div class="home-view">
    <v-container class="py-6">
      <v-row>
          <!-- default cols=4 -->
          <v-col 
            v-for="(tableIndex, index) in tableOrder" 
            :key="`${index}-${tableIndex}`" 
            cols="12" 
            md="6" 
            lg="4"
            :class="{ 'drag-over': draggedOverIndex === index }"
            @dragover.prevent="handleDragOver($event, index)"
            @dragenter.prevent="handleDragEnter(index)"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop($event, index)"
          >
            <v-card 
              class="mx-auto table-card" 
              height="200" 
              :draggable="true"
              :class="{ 'dragging': draggedIndex === index }"
              @click="addDetails(tableIndex)"
              @dragstart="handleDragStart($event, index)"
              @dragend="handleDragEnd($event)"
            >
              <v-card-item>
                <v-card-title class="headline black d-flex">
                  <v-icon icon="mdi-drag" class="drag-handle me-2" size="small"></v-icon>
                  <v-icon icon="mdi-check-circle-outline" :style="[isTableActive(tableIndex) ? { color: 'red' } : { color: 'green' }]"></v-icon>
                  Table {{ tableIndex }}
                  <v-spacer></v-spacer>
                  <span class="d-inline-flex align-center">
                    <v-icon
                      v-if="$store.state.tables[tableIndex-1].sitDownTime"
                      icon="mdi-clock-check-outline"
                      size="small"
                      class="me-1"
                      @click.stop="setSitDownTime(tableIndex - 1)"
                    ></v-icon>
                    <span>{{ $store.state.tables[tableIndex-1].sitDownTime }}</span>
                  </span>
                  <v-icon icon="mdi-cards-heart" color="pink-darken-1" size="x-small" v-if="$store.state.tables[tableIndex - 1].goodPpl"></v-icon>
                </v-card-title>
                <v-divider></v-divider>
                  <v-list-item>
                    <div class="d-flex justify-space-between ">
                      <v-list-item-title> Adult </v-list-item-title>
                      <v-list-item-title> {{ $store.state.tables[tableIndex - 1].adult }}</v-list-item-title>
                    </div>
                    <div class="d-flex justify-space-between">
                      <v-list-item-title> Kid(6-9) </v-list-item-title>
                      <v-list-item-title> {{ $store.state.tables[tableIndex - 1].bigKid }}</v-list-item-title>
                    </div>
                    <div class="d-flex justify-space-between">
                      <v-list-item-title> Kid(2-5) </v-list-item-title>
                      <v-list-item-title> {{ $store.state.tables[tableIndex - 1].smlKid }}</v-list-item-title>
                    </div>
                    <v-row no-gutters>
                      <v-col
                        cols="12"
                        sm="3"
                        v-for="(drink, drinkIndex) in $store.state.tables[tableIndex - 1].drinks"
                        :key="`${tableIndex}-${drinkIndex}-${drink}`"
                      > 
                       {{ drink }}
                      </v-col>
                    </v-row>
                  </v-list-item>
              </v-card-item>
            </v-card>
            <div class="d-flex justify-end mb-6">
              <v-list-item-title class="font-weight-black"> Total $ {{
                $store.state.tables[tableIndex - 1].totalPrice }}
              </v-list-item-title>
            </div>

          </v-col>
        </v-row>
      <order-details v-model="showDetails"></order-details>
    </v-container>
  </div>
</template>


<script>
export default {
  data: () => ({
    drawer: null,
    showDetails: false,
    draggedIndex: null,
    draggedOverIndex: null
  }),
  computed: {
    tableOrder() {
      return this.$store.state.tableOrder || []
    }
  },
  methods: {
    addDetails(n) {
      this.$store.state.tableNum = n - 1
      this.showDetails = true
    },
    handleDragStart(event, index) {
      this.draggedIndex = index
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', index.toString())
    },
    handleDragEnd(event) {
      this.draggedIndex = null
      this.draggedOverIndex = null
    },
    handleDragOver(event, index) {
      if (this.draggedIndex !== null && this.draggedIndex !== index) {
        event.dataTransfer.dropEffect = 'move'
      }
    },
    handleDragEnter(index) {
      if (this.draggedIndex !== null && this.draggedIndex !== index) {
        this.draggedOverIndex = index
      }
    },
    handleDragLeave() {
      // Drag leave will be handled by dragenter on the new target
      // This prevents flickering by not clearing immediately
    },
    handleDrop(event, dropIndex) {
      const dragIndex = this.draggedIndex
      
      if (dragIndex !== null && dragIndex !== dropIndex) {
        // Reorder the tableOrder array
        const newOrder = this.tableOrder.slice()
        const draggedTable = newOrder.splice(dragIndex, 1)[0]
        newOrder.splice(dropIndex, 0, draggedTable)
        this.$store.commit('setTableOrder', newOrder)
      }
      
      this.draggedIndex = null
      this.draggedOverIndex = null
    },
    isTableActive(tableIndex) {
      const table = this.$store.state.tables[tableIndex - 1] || {}
      const guestCount = Number(table.adult || 0) + Number(table.bigKid || 0) + Number(table.smlKid || 0)
      const hasDrinks = Array.isArray(table.drinks) && table.drinks.length > 0
      const hasTogo = Number(table.togo || 0) > 0
      return table.occupied && (guestCount > 0 || hasDrinks || hasTogo)
    },
    setSitDownTime(index) {
      if (index < 0) return
      this.$store.commit('getTimestamp', index)
    }
  }
}


</script>

<style scoped>
.table-card {
  cursor: move;
  transition: all 0.2s ease;
  user-select: none;
}

.table-card.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.table-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.drag-handle {
  cursor: grab;
  color: rgba(0, 0, 0, 0.4);
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-over {
  border: 2px dashed #1976d2;
  background-color: rgba(25, 118, 210, 0.1);
}

.v-col.drag-over {
  padding: 8px;
}
</style>