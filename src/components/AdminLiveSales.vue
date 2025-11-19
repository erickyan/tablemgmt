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
            <span class="metric-value">${{ formatCurrency(metrics.revenue) }}</span>
            <span class="metric-caption">Includes buffet + to-go</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">Buffet Revenue</span>
            <span class="metric-value">${{ formatCurrency(metrics.buffetRevenue) }}</span>
            <span class="metric-caption">{{ metrics.guestTotal }} guests served</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">To-Go Revenue</span>
            <span class="metric-value">${{ formatCurrency(metrics.togoRevenue) }}</span>
            <span class="metric-caption">{{ metrics.togoOrders }} orders today</span>
          </div>

          <div class="metric-card">
            <span class="metric-label">Open Tables</span>
            <span class="metric-value">{{ openTables.length }}</span>
            <span class="metric-caption">Avg. check ${{ formatCurrency(metrics.averageCheck) }}</span>
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
            <h3>Today’s snapshot</h3>
            <span class="section-note">Key counts pulled from the register.</span>
          </div>

          <div class="snapshot-grid">
            <div class="snapshot-card">
              <span class="snapshot-label">Adult Guests</span>
              <span class="snapshot-value">{{ sales.adultCount }}</span>
            </div>
            <div class="snapshot-card">
              <span class="snapshot-label">Kid (6-9)</span>
              <span class="snapshot-value">{{ sales.bigKidCount }}</span>
            </div>
            <div class="snapshot-card">
              <span class="snapshot-label">Kid (2-5)</span>
              <span class="snapshot-value">{{ sales.smlKidCount }}</span>
            </div>
            <div class="snapshot-card">
              <span class="snapshot-label">Tickets Closed</span>
              <span class="snapshot-value">{{ sales.totalCount }}</span>
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

export default {
  name: 'AdminLiveSales',
  setup() {
    // Use timer management composable for automatic cleanup
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
    refreshTimeoutId: null // Store timeout ID for clearing
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
    sales() {
      return this.$store.state.sales || {}
    },
    tables() {
      return Array.isArray(this.$store.state.tables) ? this.$store.state.tables : []
    },
    metrics() {
      const revenue = Number(this.sales.revenue || 0)
      const togoRevenue = Number(this.sales.totalTogoRevenue || 0)
      const buffetRevenue = Math.max(0, revenue - togoRevenue)
      const togoOrders = this.$store.state.togoSales?.length || 0
      const openRevenue = this.openTables.reduce((sum, table) => sum + table.total, 0)
      const averageCheck = this.openTables.length ? openRevenue / this.openTables.length : 0
      const guestTotal = Number(this.sales.totalCount || 0)

      return {
        revenue,
        togoRevenue,
        buffetRevenue,
        togoOrders,
        averageCheck,
        guestTotal
      }
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
            since: this.formatSeatedTime(table.sitDownTime),
            guestCount,
            total
          }
        })
    }
  },
  methods: {
    close() {
      this.internalOpen = false
    },
    refreshMetrics() {
      this.refreshing = true
      // Use managed timeout for automatic cleanup
      this.refreshTimeoutId = this.setManagedTimeout(() => {
        this.refreshing = false
        this.refreshTimeoutId = null
      }, 600)
    },
    formatCurrency(value) {
      return Number(value || 0).toFixed(2)
    },
    formatSeatedTime(raw) {
      if (!raw) return '—'
      if (typeof raw === 'string' && raw.includes(':')) {
        return `since ${raw}`
      }
      return raw
    }
  },
  beforeUnmount() {
    // Clear timeout if it exists (composable will also clean up automatically on unmount)
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



