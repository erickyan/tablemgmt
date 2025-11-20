<template>
  <v-dialog
    v-model="internalOpen"
    max-width="800"
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card class="live-sales">
      <v-toolbar color="accent" density="comfortable" dark>
        <v-toolbar-title>Live Sales Overview</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-refresh" variant="text" @click="refreshMetrics" :loading="refreshing" />
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-toolbar>

      <v-card-text class="pa-6">
        <section class="metrics-grid">
          <div class="metric-card metric-card--primary">
            <span class="metric-label">Total Revenue</span>
            <span class="metric-value">${{ formatCurrency(totalRevenue) }}</span>
            <span class="metric-caption">Includes buffet + to-go</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">Buffet Revenue</span>
            <span class="metric-value">${{ formatCurrency(buffetRevenue) }}</span>
            <span class="metric-caption">{{ guestTotal }} guests served</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">To-Go Revenue</span>
            <span class="metric-value">${{ formatCurrency(togoRevenue) }}</span>
            <span class="metric-caption">{{ togoOrders }} orders today</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">Open Tables</span>
            <span class="metric-value">{{ openTables.length }}</span>
            <span class="metric-caption">Avg. check ${{ formatCurrency(averageCheck) }}</span>
          </div>
        </section>

        <section class="section">
          <div class="section-heading">
            <h3>Open tables</h3>
            <span class="section-note">{{ openTables.length ? 'Monitor seated guests and totals.' : 'All tables are settled.' }}</span>
          </div>

          <div v-if="openTables.length" class="table-wrapper">
            <v-table
              density="compact"
              class="mt-3 open-tables-table"
            >
            <thead>
              <tr>
                <th class="text-left">Table</th>
                <th class="text-left">Seated</th>
                <th class="text-center">Guests</th>
                <th class="text-right">Running Total</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in openTables"
                :key="entry.number"
              >
                <td>
                  <strong>Table {{ entry.number }}</strong>
                </td>
                <td>{{ entry.since }}</td>
                <td class="text-center">{{ entry.guestCount }}</td>
                <td class="text-right">${{ formatCurrency(entry.total) }}</td>
              </tr>
            </tbody>
          </v-table>
          </div>
          <v-alert
            v-else
            type="success"
            variant="tonal"
            density="comfortable"
            class="mt-3"
          >
            No open tables at the moment. Great job keeping the floor clear!
          </v-alert>
        </section>

        <section class="section">
          <div class="section-heading">
            <h3>Today's snapshot</h3>
            <span class="section-note">Key counts pulled from the register.</span>
          </div>

          <div class="snapshot-grid">
            <div class="snapshot-card">
              <span class="snapshot-label">Adult Guests</span>
              <span class="snapshot-value">{{ salesData.adultCount }}</span>
            </div>
            <div class="snapshot-card">
              <span class="snapshot-label">Kid (6-9)</span>
              <span class="snapshot-value">{{ salesData.bigKidCount }}</span>
            </div>
            <div class="snapshot-card">
              <span class="snapshot-label">Kid (2-5)</span>
              <span class="snapshot-value">{{ salesData.smlKidCount }}</span>
            </div>
            <div class="snapshot-card">
              <span class="snapshot-label">Tickets Closed</span>
              <span class="snapshot-value">{{ salesData.totalCount }}</span>
            </div>
          </div>
        </section>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="justify-end pa-4">
        <v-btn variant="tonal" color="accent" @click="close">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { useTimerManagement } from '../composables/useTimerManagement.js'
import { formatTime } from '../utils/timeUtils.js'

export default {
  name: 'AdminLiveSales',
  setup() {
    const { setManagedTimeout, clearManagedTimeout } = useTimerManagement()
    return {
      setManagedTimeout,
      clearManagedTimeout
    }
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  data: () => ({
    refreshing: false,
    refreshTimeoutId: null,
    // Cache sales data to ensure reactivity
    cachedSalesData: {
      totalCount: 0,
      adultCount: 0,
      bigKidCount: 0,
      smlKidCount: 0,
      revenue: 0,
      totalTogoRevenue: 0,
      togoOrderCount: 0
    }
  }),
  computed: {
    internalOpen: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    
    // Use cached data which is updated by watcher - this ensures reactivity
    salesData() {
      return this.cachedSalesData
    },
    
    // Individual computed properties - use cached data
    buffetRevenue() {
      return Number(this.cachedSalesData.revenue || 0)
    },
    
    togoRevenue() {
      return Number(this.cachedSalesData.totalTogoRevenue || 0)
    },
    
    totalRevenue() {
      return this.buffetRevenue + this.togoRevenue
    },
    
    togoOrders() {
      return Number(this.cachedSalesData.togoOrderCount || 0)
    },
    
    guestTotal() {
      // Use cached data which is updated by watcher - this ensures reactivity
      return Number(this.cachedSalesData.totalCount || 0)
    },
    
    tables() {
      const tablesState = this.$store.state.tables?.tables || {}
      return Array.isArray(tablesState) ? tablesState : Object.values(tablesState)
    },
    
    openTables() {
      return this.tables
        .filter(table => table && table.occupied)
        .map(table => {
          const guestCount =
            Number(table.adult || 0) +
            Number(table.bigKid || 0) +
            Number(table.smlKid || 0)
          const total = Number(table.totalPrice || 0)
          return {
            number: table.number || '-',
            since: table.sitDownTime ? `since ${formatTime(table.sitDownTime)}` : '—',
            guestCount,
            total
          }
        })
    },
    
    averageCheck() {
      const openRevenue = this.openTables.reduce((sum, table) => sum + table.total, 0)
      return this.openTables.length ? openRevenue / this.openTables.length : 0
    }
  },
  methods: {
    close() {
      this.internalOpen = false
    },
    refreshMetrics() {
      this.refreshing = true
      this.refreshTimeoutId = this.setManagedTimeout(() => {
        this.refreshing = false
        this.refreshTimeoutId = null
      }, 600)
    },
    formatCurrency(value) {
      return Number(value || 0).toFixed(2)
    }
  },
  watch: {
    // Watch the nested sales state and update cached data
    '$store.state.sales.sales': {
      handler(newVal, oldVal) {
        if (newVal) {
          // Update cached data - this triggers reactivity
          this.cachedSalesData = {
            totalCount: Number(newVal.totalCount || 0),
            adultCount: Number(newVal.adultCount || 0),
            bigKidCount: Number(newVal.bigKidCount || 0),
            smlKidCount: Number(newVal.smlKidCount || 0),
            revenue: Number(newVal.revenue || 0),
            totalTogoRevenue: Number(newVal.totalTogoRevenue || 0),
            togoOrderCount: Number(newVal.togoOrderCount || 0)
          }
        }
      },
      deep: true,
      immediate: true // Update immediately on mount
    }
  },
  mounted() {
    // Initialize cached data from current state
    const salesState = this.$store.state.sales?.sales
    if (salesState) {
      this.cachedSalesData = {
        totalCount: Number(salesState.totalCount || 0),
        adultCount: Number(salesState.adultCount || 0),
        bigKidCount: Number(salesState.bigKidCount || 0),
        smlKidCount: Number(salesState.smlKidCount || 0),
        revenue: Number(salesState.revenue || 0),
        totalTogoRevenue: Number(salesState.totalTogoRevenue || 0),
        togoOrderCount: Number(salesState.togoOrderCount || 0)
      }
    }
  },
  beforeUnmount() {
    if (this.refreshTimeoutId !== null) {
      this.clearManagedTimeout(this.refreshTimeoutId)
      this.refreshTimeoutId = null
    }
  }
}
</script>

<style scoped>
.live-sales {
  border-radius: 28px;
  box-shadow: 0 26px 48px rgba(15, 25, 35, 0.26);
}

.metrics-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  margin-bottom: 24px;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 16px 32px rgba(15, 25, 35, 0.16);
}

.metric-card--primary {
  background: linear-gradient(135deg, rgba(0, 137, 123, 0.95), rgba(0, 137, 123, 0.75));
  color: #fff;
}

.metric-card--primary .metric-caption {
  color: rgba(255, 255, 255, 0.82);
}

.metric-label {
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: 600;
  color: rgba(31, 39, 51, 0.6);
}

.metric-card--primary .metric-label {
  color: rgba(255, 255, 255, 0.8);
}

.metric-value {
  font-size: 26px;
  font-weight: 700;
}

.metric-caption {
  font-size: 12px;
  color: rgba(31, 39, 51, 0.6);
}

.section {
  margin-top: 32px;
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-heading h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.section-note {
  font-size: 13px;
  color: rgba(31, 39, 51, 0.6);
}

.snapshot-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  margin-top: 18px;
}

.snapshot-card {
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 12px 24px rgba(15, 25, 35, 0.14);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.snapshot-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.55px;
  color: rgba(31, 39, 51, 0.58);
}

.snapshot-value {
  font-size: 20px;
  font-weight: 700;
  color: rgba(31, 39, 51, 0.9);
}

/* Mobile and Tablet Responsive Styles */
@media (max-width: 1024px) {
  .live-sales {
    border-radius: 0;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .metric-card {
    padding: 14px;
  }

  .metric-value {
    font-size: 22px;
  }

  .snapshot-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

/* iPad Portrait and smaller tablets */
@media (max-width: 768px) {
  .live-sales {
    border-radius: 0;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .metric-card {
    padding: 12px;
    border-radius: 16px;
  }

  .metric-label {
    font-size: 11px;
  }

  .metric-value {
    font-size: 20px;
  }

  .metric-caption {
    font-size: 11px;
  }

  .section {
    margin-top: 24px;
  }

  .section-heading h3 {
    font-size: 18px;
  }

  .section-note {
    font-size: 12px;
  }

  .snapshot-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 14px;
  }

  .snapshot-card {
    padding: 12px;
  }

  .snapshot-label {
    font-size: 11px;
  }

  .snapshot-value {
    font-size: 18px;
  }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin-top: 12px;
  }

  .open-tables-table {
    min-width: 500px;
  }

  .open-tables-table th,
  .open-tables-table td {
    padding: 8px 12px !important;
    font-size: 13px;
  }
}

/* iPhone and small phones */
@media (max-width: 480px) {
  .live-sales {
    border-radius: 0;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 10px;
    margin-bottom: 18px;
  }

  .metric-card {
    padding: 14px;
  }

  .metric-value {
    font-size: 24px;
  }

  .section {
    margin-top: 20px;
  }

  .section-heading h3 {
    font-size: 16px;
  }

  .snapshot-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-top: 12px;
  }

  .snapshot-card {
    padding: 10px;
  }

  .snapshot-value {
    font-size: 16px;
  }

  .table-wrapper {
    margin-top: 10px;
  }

  .open-tables-table {
    min-width: 450px;
  }

  .open-tables-table th,
  .open-tables-table td {
    padding: 6px 8px !important;
    font-size: 12px;
  }

  .open-tables-table th {
    font-size: 11px;
    font-weight: 600;
  }
}

/* Landscape orientation adjustments */
@media (max-width: 1024px) and (orientation: landscape) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .snapshot-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
}

@media (max-width: 768px) and (orientation: landscape) {
  .metrics-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .snapshot-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .metric-value {
    font-size: 18px;
  }

  .snapshot-value {
    font-size: 16px;
  }
}

@media (max-width: 480px) and (orientation: landscape) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .snapshot-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .metric-card {
    padding: 10px;
  }

  .metric-value {
    font-size: 18px;
  }

  .snapshot-card {
    padding: 8px;
  }

  .snapshot-value {
    font-size: 14px;
  }
}

/* Ensure dialog actions are accessible on mobile */
@media (max-width: 768px) {
  .v-card-actions {
    padding: 12px 16px !important;
  }

  .v-card-actions .v-btn {
    min-width: auto;
    padding: 8px 16px;
  }
}
</style>
