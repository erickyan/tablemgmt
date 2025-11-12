<template>
  <v-dialog v-model="internalOpen" max-width="720" scrollable>
    <v-card>
      <v-toolbar color="primary" density="comfortable" dark>
        <v-toolbar-title>To-Go Sales</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="close"></v-btn>
      </v-toolbar>

      <v-card-text>
        <v-alert
          v-if="!loading && sales.length === 0"
          type="info"
          variant="tonal"
          class="mb-4"
        >
          No to-go sales have been recorded yet.
        </v-alert>

        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-4"
        ></v-progress-linear>

        <v-list
          v-if="!loading && enrichedSales.length > 0"
          density="comfortable"
          lines="two"
        >
          <v-list-item
            v-for="(entry, index) in enrichedSales"
            :key="index"
          >
            <v-list-item-title class="text-subtitle-1 font-weight-medium">
              Order {{ enrichedSales.length - index }}
            </v-list-item-title>
            <v-list-item-subtitle>
              <div v-if="entry.itemsList.length" class="d-flex flex-wrap py-1" style="gap: 8px;">
                <v-chip
                  v-for="(itemLabel, chipIndex) in entry.itemsList"
                  :key="chipIndex"
                  size="small"
                  variant="tonal"
                  color="primary"
                >
                  {{ itemLabel }}
                </v-chip>
              </div>
              <div v-else class="text-caption">Items unavailable for this order</div>
              <div class="text-caption mt-1">
                {{ formatTimestamp(entry.timestamp) }} • ${{ formatCurrency(entry.revenue) }}
              </div>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="d-flex justify-space-between">
        <div class="text-caption">
          Total Orders: <strong>{{ sales.length }}</strong>
          &nbsp;|&nbsp; Total Revenue: <strong>${{ totalRevenue }}</strong>
        </div>
        <v-btn variant="tonal" color="primary" @click="close">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'AdminTogoSales',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    sales: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  computed: {
    internalOpen: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    totalRevenue() {
      const total = this.sales.reduce((sum, entry) => sum + Number(entry.revenue ?? 0), 0)
      return total.toFixed(2)
    },
    enrichedSales() {
      return this.sales.map(entry => {
        const itemsList = this.formatItems(entry.items)
        return {
          ...entry,
          itemsList
        }
      })
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
    formatTimestamp(value) {
      if (!value) return '—'
      try {
        let date
        if (typeof value === 'string' || typeof value === 'number') {
          date = new Date(value)
        } else if (value?.toDate && typeof value.toDate === 'function') {
          date = value.toDate()
        } else if (typeof value === 'object' && typeof value.seconds === 'number') {
          date = new Date(value.seconds * 1000)
        } else {
          date = new Date(value)
        }
        if (Number.isNaN(date.getTime())) {
          return value
        }
        return date.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (err) {
        return value
      }
    },
    formatCurrency(value) {
      return Number(value ?? 0).toFixed(2)
    },
    formatItems(items) {
      if (!Array.isArray(items) || items.length === 0) {
        return []
      }
      return items
        .filter(item => item?.name)
        .map(item => {
          const qty = Number(item.quantity ?? 0)
          return qty > 1 ? `${item.name} x${qty}` : item.name
        })
    }
  }
}
</script>
