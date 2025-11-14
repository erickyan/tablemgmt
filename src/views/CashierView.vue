<template>
  <v-container class="cashier-view pa-4">
    <v-card class="mx-auto" max-width="520">
      <v-card-title class="d-flex align-center justify-space-between">
        {{ getTranslatedLabel('Cashier Receipt') }}
        <v-chip color="accent" variant="tonal">{{ getTranslatedLabel('Total') }} ${{ totalWithTax }}</v-chip>
      </v-card-title>
      <v-card-subtitle>{{ getTranslatedLabel('Quick receipt builder for walk-in customers') }}</v-card-subtitle>

      <v-card-text>
        <div class="mb-4 price-mode-section">
          <div class="d-flex align-center justify-space-between">
            <v-btn-toggle
              v-model="mode"
              density="comfortable"
              variant="outlined"
              mandatory
              class="price-mode-toggle"
            >
              <v-btn value="lunch">
                <v-icon start size="18">mdi-white-balance-sunny</v-icon>
                {{ getTranslatedLabel('Lunch') }}
              </v-btn>
              <v-btn value="dinner">
                <v-icon start size="18">mdi-weather-night</v-icon>
                {{ getTranslatedLabel('Dinner') }}
              </v-btn>
            </v-btn-toggle>
            <v-btn 
              variant="outlined" 
              color="secondary" 
              @click="clearForm"
              class="clear-btn"
            >
              <v-icon start size="18">mdi-refresh</v-icon>
              {{ getTranslatedLabel('Clear') }}
            </v-btn>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <section>
          <div
            v-for="option in buffetOptions"
            :key="option.key"
            class="count-row"
          >
            <span>{{ option.label }}</span>
            <div class="count-controls">
              <v-btn
                icon="mdi-minus"
                density="comfortable"
                variant="text"
                @click="stepBuffet(option.key, -1)"
                :disabled="buffetCounts[option.key] === 0"
              />
              <span class="count-value">{{ buffetCounts[option.key] }}</span>
              <v-btn
                icon="mdi-plus"
                density="comfortable"
                variant="text"
                @click="stepBuffet(option.key, 1)"
              />
            </div>
          </div>
        </section>

        <v-divider class="my-4"></v-divider>

        <section>
          <div class="text-subtitle-2 mb-2">{{ getTranslatedLabel('Drinks') }}</div>
          <v-row dense>
            <v-col
              v-for="drink in drinkOptions"
              :key="drink.code"
              cols="6"
              class="py-2"
            >
              <v-card variant="outlined" class="pa-2 d-flex align-center drink-card">
                <div class="flex-grow-1">{{ getTranslatedLabel(drink.label) }}</div>
                <div class="count-controls">
                  <v-btn
                    icon="mdi-minus"
                    density="comfortable"
                    variant="text"
                    @click="stepDrink(drink.code, -1)"
                    :disabled="drinkCounts[drink.code] === 0"
                  />
                  <span class="count-value">{{ drinkCounts[drink.code] }}</span>
                  <v-btn
                    icon="mdi-plus"
                    density="comfortable"
                    variant="text"
                    @click="stepDrink(drink.code, 1)"
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
        </section>

        <v-divider class="my-4"></v-divider>

        <section class="totals-preview">
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
import { DRINK_OPTIONS } from '../utils/drinkOptions.js'
import { translate } from '../utils/translations.js'

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
        this.$store.commit('setDinnerMode', isDinner)
        // Update cashier form mode in store
        this.$store.commit('setCashierMode', value)
      },
    },
    buffetCounts: {
      deep: true,
      handler() {
        // Update store when buffet counts change
        Object.entries(this.buffetCounts).forEach(([key, count]) => {
          this.$store.commit('setCashierBuffetCount', { key, count })
        })
      },
    },
    drinkCounts: {
      deep: true,
      handler() {
        // Update store when drink counts change
        Object.entries(this.drinkCounts).forEach(([code, count]) => {
          this.$store.commit('setCashierDrinkCount', { code, count })
        })
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
      this.$store.commit('clearCashierForm')
    },
  },
}
</script>

<style scoped>
.cashier-view {
  max-width: 720px;
}

.count-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
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
  background: transparent !important;
}
</style>
