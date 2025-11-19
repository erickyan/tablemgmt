<template>
  <v-dialog 
    v-model="internalOpen" 
    :max-width="$vuetify.display.xs ? '100%' : ($vuetify.display.tablet ? '900' : '760')"
    :fullscreen="$vuetify.display.xs"
    scrollable 
    transition="dialog-bottom-transition"
  >
    <v-card class="togo-sales">
      <v-toolbar color="accent" density="comfortable" dark>
        <v-toolbar-title>To-Go Sales</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="close"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-6">
        <div class="summary-row">
          <v-chip color="accent" variant="tonal" size="small">
            <v-icon start size="18">mdi-receipt</v-icon>
            {{ sales.length }} Orders
          </v-chip>
          <v-chip color="accent" variant="tonal" size="small">
            <v-icon start size="18">mdi-currency-usd</v-icon>
            ${{ totalRevenue }}
          </v-chip>
        </div>

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
          color="accent"
          class="mb-4"
        ></v-progress-linear>

        <div class="sales-list" v-if="!loading && enrichedSales.length > 0">
          <div
            v-for="(entry, index) in enrichedSales"
            :key="index"
            class="sales-card"
          >
            <div class="sales-card__header">
              <h4>Order {{ enrichedSales.length - index }}</h4>
              <span class="sales-card__timestamp">{{ formatTimestamp(entry.timestamp) }}</span>
            </div>
            <div class="sales-card__body">
              <div v-if="entry.itemsList.length" class="chip-group">
                <v-chip
                  v-for="(itemLabel, chipIndex) in entry.itemsList"
                  :key="chipIndex"
                  size="small"
                  variant="tonal"
                  color="accent"
                >
                  {{ itemLabel }}
                </v-chip>
              </div>
              <div v-else class="text-caption text-medium-emphasis">
                Items unavailable for this order.
              </div>
            </div>
            <div class="sales-card__footer">
              <span class="footer-label">Total</span>
              <span class="footer-value">${{ formatCurrency(entry.revenue) }}</span>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4 justify-end">
        <div class="text-caption mr-auto">
          Total Orders: <strong>{{ sales.length }}</strong>
          &nbsp;|&nbsp; Total Revenue: <strong>${{ totalRevenue }}</strong>
        </div>
        <v-btn variant="tonal" color="accent" @click="close">Close</v-btn>
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
          const base = qty > 1 ? `${item.name} x${qty}` : item.name
          const note = item.note ? ` — ${item.note}` : ''
          return `${base}${note}`
        })
    }
  }
}
</script>

<style scoped>
.togo-sales {
  border-radius: 26px;
  box-shadow: 0 24px 44px rgba(15, 25, 35, 0.24);
  background: linear-gradient(180deg, rgba(247, 249, 255, 0.95), rgba(255, 255, 255, 0.98));
}

.summary-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.sales-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sales-card {
  border-radius: 18px;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 14px 28px rgba(15, 25, 35, 0.18);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sales-card__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.sales-card__header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.sales-card__timestamp {
  font-size: 13px;
  color: rgba(31, 39, 51, 0.62);
}

.sales-card__body {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sales-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: rgba(31, 39, 51, 0.85);
}

.footer-label {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.footer-value {
  font-size: 18px;
}

@media (max-width: 600px) {
  .togo-sales {
    border-radius: 0;
  }
  
  .v-toolbar {
    padding: 0 8px;
  }
  
  .v-toolbar-title {
    font-size: 16px;
  }
  
  .v-card-text {
    padding: 16px;
  }
  
  .summary-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .sales-card {
    padding: 12px 14px;
  }
  
  .sales-card__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .sales-card__header h4 {
    font-size: 16px;
  }
  
  .sales-card__footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .v-card-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .v-card-actions .v-btn {
    width: 100%;
  }
  
  .v-card-actions .text-caption {
    margin: 0;
    text-align: center;
    width: 100%;
  }
}
</style>
