<template>
  <v-container class="cashier-view pa-4 pa-2-mobile">
    <v-card class="mx-auto cashier-card" max-width="520">
      <!-- Print button at top for mobile -->
      <div class="cashier-print-header mobile-only">
        <v-btn
          block
          variant="flat"
          color="accent"
          size="large"
          :disabled="!hasActivity"
          @click="printReceipt"
          class="print-btn-top"
        >
          <v-icon start>mdi-printer</v-icon>
          {{ getTranslatedLabel('Print Receipt') }}
        </v-btn>
        <div class="mobile-total-display">
          <span class="mobile-total-label">{{ getTranslatedLabel('Total') }}</span>
          <span class="mobile-total-value">${{ totalWithTax }}</span>
        </div>
      </div>

      <v-card-title class="d-flex align-center justify-space-between cashier-title">
        <span class="desktop-only">{{ getTranslatedLabel('Cashier Receipt') }}</span>
        <span class="mobile-only">{{ getTranslatedLabel('Cashier') }}</span>
        <v-chip color="accent" variant="tonal" class="desktop-only">{{ getTranslatedLabel('Total') }} ${{ totalWithTax }}</v-chip>
      </v-card-title>
      <v-card-subtitle class="desktop-only">{{ getTranslatedLabel('Quick receipt builder for walk-in customers') }}</v-card-subtitle>

      <v-card-text class="cashier-content">
        <div class="mb-4 mb-2-mobile price-mode-section">
          <div class="d-flex align-center justify-space-between price-mode-row">
            <v-btn-toggle
              v-model="mode"
              density="comfortable"
              variant="outlined"
              mandatory
              class="price-mode-toggle"
            >
              <v-btn value="lunch">
                <v-icon start size="18">mdi-white-balance-sunny</v-icon>
                <span class="desktop-only">{{ getTranslatedLabel('Lunch') }}</span>
                <span class="mobile-only">L</span>
              </v-btn>
              <v-btn value="dinner">
                <v-icon start size="18">mdi-weather-night</v-icon>
                <span class="desktop-only">{{ getTranslatedLabel('Dinner') }}</span>
                <span class="mobile-only">D</span>
              </v-btn>
            </v-btn-toggle>
            <v-btn 
              variant="outlined" 
              color="secondary" 
              @click="clearForm"
              class="clear-btn"
              size="small"
            >
              <v-icon start size="16">mdi-refresh</v-icon>
              <span class="desktop-only">{{ getTranslatedLabel('Clear') }}</span>
            </v-btn>
          </div>
        </div>

        <v-divider class="my-4 my-2-mobile"></v-divider>

        <section class="buffet-section">
          <div
            v-for="option in buffetOptions"
            :key="option.key"
            class="count-row"
          >
            <span class="count-label">{{ option.label }}</span>
            <div class="count-controls">
              <v-btn
                icon="mdi-minus"
                density="comfortable"
                variant="text"
                size="small"
                @click="stepBuffet(option.key, -1)"
                :disabled="buffetCounts[option.key] === 0"
              />
              <span class="count-value">{{ buffetCounts[option.key] }}</span>
              <v-btn
                icon="mdi-plus"
                density="comfortable"
                variant="text"
                size="small"
                @click="stepBuffet(option.key, 1)"
              />
            </div>
          </div>
        </section>

        <v-divider class="my-4 my-2-mobile"></v-divider>

        <section class="drinks-section">
          <div class="text-subtitle-2 mb-2 mb-1-mobile drinks-label">{{ getTranslatedLabel('Drinks') }}</div>
          <v-row dense class="drinks-grid">
            <v-col
              v-for="drink in drinkOptions"
              :key="drink.code"
              cols="6"
              class="py-2 py-1-mobile"
            >
              <v-card variant="outlined" class="pa-2 pa-1-mobile d-flex align-center drink-card">
                <div class="flex-grow-1 drink-name">{{ getTranslatedLabel(drink.label) }}</div>
                <div class="count-controls">
                  <v-btn
                    icon="mdi-minus"
                    density="comfortable"
                    variant="text"
                    size="small"
                    @click="stepDrink(drink.code, -1)"
                    :disabled="drinkCounts[drink.code] === 0"
                  />
                  <span class="count-value">{{ drinkCounts[drink.code] }}</span>
                  <v-btn
                    icon="mdi-plus"
                    density="comfortable"
                    variant="text"
                    size="small"
                    @click="stepDrink(drink.code, 1)"
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
        </section>

        <v-divider class="my-4 my-2-mobile desktop-only"></v-divider>

        <section class="totals-preview desktop-only">
          <div class="d-flex justify-space-between mb-1">
            <span>Subtotal</span>
            <span>${{ subtotal }}</span>
          </div>
          <div class="d-flex justify-space-between mb-1">
            <span>Tax</span>
            <span>${{ taxAmount }}</span>
          </div>
          <div class="d-flex justify-space-between font-weight-medium">
            <span>Total</span>
            <span>${{ totalWithTax }}</span>
          </div>
        </section>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { DRINK_OPTIONS, getDrinkLabel, isWater } from '../utils/drinkOptions.js'
import { translate } from '../utils/translations.js'
import { usePrinting } from '../composables/usePrinting.js'

export default {
  name: 'CashierView',
  data: () => ({
    mode: 'lunch',
    buffetCounts: {
      adult: 0,
      bigKid: 0,
      smallKid: 0,
    },
    drinkCounts: {},
    buffetOptions: [
      { key: 'adult', label: 'Adult Buffet' },
      { key: 'bigKid', label: 'Big Kid Buffet (6-9)' },
      { key: 'smallKid', label: 'Small Kid Buffet (2-5)' },
    ],
    drinkOptions: DRINK_OPTIONS.map(opt => ({
      code: opt.code,
      label: opt.label,
      type: opt.type
    })),
    isChinese() {
      return this.$store.state.language === 'zh'
    }
  }),
  computed: {
    pricing() {
      const isDinner = this.mode === 'dinner'
      const state = this.$store.state
      return {
        adult: isDinner ? state.ADULTDINNERPRICE : state.ADULTPRICE,
        bigKid: isDinner ? state.BIGKIDDINNERPRICE : state.BIGKIDPRICE,
        smallKid: isDinner ? state.SMALLKIDDINNERPRICE : state.SMALLKIDPRICE,
        drink: state.DRINKPRICE,
        water: state.WATERPRICE,
        taxRate: state.TAX_RATE,
      }
    },
    hasActivity() {
      const buffetSum = Object.values(this.buffetCounts).reduce((acc, value) => acc + Number(value || 0), 0)
      const drinkSum = Object.values(this.drinkCounts).reduce((acc, value) => acc + Number(value || 0), 0)
      return buffetSum > 0 || drinkSum > 0
    },
    subtotal() {
      const buffetTotal =
        this.buffetCounts.adult * this.pricing.adult +
        this.buffetCounts.bigKid * this.pricing.bigKid +
        this.buffetCounts.smallKid * this.pricing.smallKid

      let drinkTotal = 0
      Object.entries(this.drinkCounts).forEach(([code, count]) => {
        const option = this.drinkOptions.find(item => item.code === code)
        const unitPrice = option?.type === 'water' ? this.pricing.water : this.pricing.drink
        drinkTotal += count * unitPrice
      })

      return (buffetTotal + drinkTotal).toFixed(2)
    },
    taxAmount() {
      const subtotal = Number(this.subtotal)
      const total = subtotal * this.pricing.taxRate
      const tax = total - subtotal
      return tax.toFixed(2)
    },
    totalWithTax() {
      const subtotal = Number(this.subtotal)
      const total = subtotal * this.pricing.taxRate
      return total.toFixed(2)
    },
  },
  watch: {
    mode: {
      immediate: true,
      handler(value) {
        const isDinner = value === 'dinner'
        this.$store.dispatch('setDinnerMode', isDinner)
        // Update cashier form mode in store
        this.$store.dispatch('setCashierMode', value)
      },
    },
    buffetCounts: {
      deep: true,
      handler() {
        // Update store when buffet counts change
        Object.entries(this.buffetCounts).forEach(([key, count]) => {
          this.$store.dispatch('setCashierBuffetCount', { key, count })
        })
      },
    },
    drinkCounts: {
      deep: true,
      handler() {
        // Update store when drink counts change
        Object.entries(this.drinkCounts).forEach(([code, count]) => {
          this.$store.dispatch('setCashierDrinkCount', { code, count })
        })
      },
    },
    // Watch store changes and sync back to component (only when store is cleared/reset)
    '$store.state.cashierForm': {
      deep: true,
      handler(newForm, oldForm) {
        if (!newForm) return
        
        // Only sync if all counts are zero (form was reset)
        const allBuffetZero = newForm.buffetCounts && 
          Object.values(newForm.buffetCounts).every(count => Number(count || 0) === 0)
        const allDrinkZero = newForm.drinkCounts && 
          Object.values(newForm.drinkCounts).every(count => Number(count || 0) === 0)
        
        // If form was reset (all zeros), sync to component
        if (allBuffetZero && allDrinkZero) {
          Object.keys(this.buffetCounts).forEach(key => {
            this.buffetCounts[key] = 0
          })
          Object.keys(this.drinkCounts).forEach(code => {
            this.drinkCounts[code] = 0
          })
        }
      },
    },
  },
  mounted() {
    // Initialize drinkCounts with all drink options
    const initialDrinkCounts = {}
    DRINK_OPTIONS.forEach(opt => {
      initialDrinkCounts[opt.code] = 0
    })
    this.drinkCounts = initialDrinkCounts
    
    this.mode = this.$store.state.isDinner ? 'dinner' : 'lunch'
    // Sync initial state with store
    if (this.$store.state.cashierForm) {
      this.mode = this.$store.state.cashierForm.mode || this.mode
      if (this.$store.state.cashierForm.buffetCounts) {
        this.buffetCounts = { ...this.buffetCounts, ...this.$store.state.cashierForm.buffetCounts }
      }
      if (this.$store.state.cashierForm.drinkCounts) {
        // Merge store counts with initialized counts
        this.drinkCounts = { ...this.drinkCounts, ...this.$store.state.cashierForm.drinkCounts }
      }
    }
  },
  methods: {
    getTranslatedLabel(label) {
      return translate(label, this.isChinese)
    },
    stepBuffet(key, delta) {
      const next = Math.max(0, (this.buffetCounts[key] || 0) + delta)
      this.buffetCounts[key] = next
    },
    stepDrink(code, delta) {
      const next = Math.max(0, (this.drinkCounts[code] || 0) + delta)
      this.drinkCounts[code] = next
    },
    clearForm() {
      Object.keys(this.buffetCounts).forEach(key => {
        this.buffetCounts[key] = 0
      })
      Object.keys(this.drinkCounts).forEach(code => {
        this.drinkCounts[code] = 0
      })
      // Clear store
      this.$store.dispatch('clearCashierForm')
    },
    async printReceipt() {
      if (!this.hasActivity) {
        return
      }

      // Get print function from composable
      const { printCashierReceipt } = usePrinting()
      
      await printCashierReceipt({
        store: this.$store,
        buffetCounts: this.buffetCounts,
        drinkCounts: this.drinkCounts,
        isDinner: this.mode === 'dinner',
        getDrinkLabelFn: getDrinkLabel,
        isWaterFn: isWater
      })
    },
  },
}
</script>

<style scoped>
.cashier-view {
  max-width: 720px;
}

.cashier-card {
  overflow: visible;
}

/* Mobile-only elements */
.mobile-only {
  display: none;
}

.desktop-only {
  display: block;
}

/* Print button header for mobile */
.cashier-print-header {
  padding: 12px 16px;
  background: color-mix(in srgb, var(--v-theme-surface) 95%, transparent);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin: -16px -16px 16px -16px;
  border-radius: 4px 4px 0 0;
}

.print-btn-top {
  margin-bottom: 8px;
}

.mobile-total-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 137, 123, 0.08);
  border-radius: 8px;
}

.mobile-total-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(31, 39, 51, 0.7);
}

.mobile-total-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--v-theme-accent);
}

.count-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.count-label {
  font-size: 14px;
  font-weight: 500;
}

.count-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-value {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
}

.totals-preview {
  font-size: 14px;
}

.price-mode-section {
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.02);
}

.price-mode-toggle {
  flex-shrink: 0;
}

.clear-btn {
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-size: 13px;
}

.drink-card {
  background: #ffffff !important;
}

.drink-name {
  font-size: 13px;
}

/* iPhone Vertical Responsive Styles */
@media (max-width: 480px) and (orientation: portrait) {
  .mobile-only {
    display: block;
  }

  .desktop-only {
    display: none;
  }

  .cashier-view {
    padding: 8px !important;
    max-width: 100%;
  }

  .cashier-card {
    max-width: 100%;
    margin: 0;
  }

  .cashier-title {
    padding: 12px 16px !important;
    font-size: 18px !important;
  }

  .cashier-content {
    padding: 12px 16px !important;
  }

  .cashier-print-header {
    margin: -16px -16px 12px -16px;
    padding: 10px 12px;
  }

  .print-btn-top {
    height: 44px;
    font-size: 14px;
  }

  .mobile-total-display {
    padding: 6px 10px;
  }

  .mobile-total-label {
    font-size: 12px;
  }

  .mobile-total-value {
    font-size: 18px;
  }

  .price-mode-section {
    padding: 12px;
    margin-bottom: 12px !important;
  }

  .price-mode-row {
    gap: 8px;
  }

  .price-mode-toggle .v-btn {
    min-width: 60px;
    padding: 6px 8px;
  }

  .price-mode-toggle .v-btn .v-icon {
    margin-right: 4px;
  }

  .clear-btn {
    min-width: 40px;
    padding: 6px 8px;
  }

  .count-row {
    padding: 6px 0;
  }

  .count-label {
    font-size: 13px;
  }

  .count-controls {
    gap: 8px;
  }

  .count-controls .v-btn {
    width: 32px;
    height: 32px;
  }

  .count-value {
    min-width: 20px;
    font-size: 14px;
  }

  .drinks-label {
    font-size: 13px !important;
    margin-bottom: 8px !important;
  }

  .drinks-grid {
    margin: 0 -4px;
  }

  .drink-card {
    padding: 8px !important;
    min-height: 48px;
  }

  .drink-name {
    font-size: 12px;
    line-height: 1.3;
  }

  .drink-card .count-controls {
    gap: 6px;
  }

  .drink-card .count-controls .v-btn {
    width: 28px;
    height: 28px;
  }

  .drink-card .count-value {
    min-width: 18px;
    font-size: 13px;
  }

  /* Ensure everything fits in viewport */
  .cashier-view {
    height: calc(100vh - 88px); /* Account for bottom nav */
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .cashier-card {
    min-height: fit-content;
  }
}

/* Utility classes for responsive spacing */
@media (max-width: 480px) {
  .pa-2-mobile {
    padding: 8px !important;
  }

  .mb-2-mobile {
    margin-bottom: 8px !important;
  }

  .mb-1-mobile {
    margin-bottom: 4px !important;
  }

  .my-2-mobile {
    margin-top: 8px !important;
    margin-bottom: 8px !important;
  }

  .py-1-mobile {
    padding-top: 4px !important;
    padding-bottom: 4px !important;
  }

  .pa-1-mobile {
    padding: 4px !important;
  }
}
</style>
