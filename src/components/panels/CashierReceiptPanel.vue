<template>
  <div class="panel">
    <div class="panel__header">
      <div>
        <h3 class="panel__title">{{ getTranslatedLabel('Cashier Receipt') }}</h3>
        <p class="panel__subtitle">
          {{ getTranslatedLabel(isDinner ? 'Dinner pricing' : 'Lunch pricing') }}
        </p>
      </div>
    </div>

    <div class="panel__content">
      <div
        v-if="lineItems.length"
        :class="['line-items']"
      >
        <div
          v-for="item in lineItems"
          :key="item.label"
          class="line-item"
        >
          <div>
            <div class="line-item__label">{{ getTranslatedLabel(item.label) }}</div>
            <div class="line-item__meta">{{ getTranslatedLabel('Qty') }} {{ item.qty }}</div>
          </div>
          <div class="line-item__amount">
            ${{ item.total.toFixed(2) }}
          </div>
        </div>
      </div>
      <div class="line-items line-items--empty" v-else>
        <v-icon size="28" color="accent">mdi-receipt-outline</v-icon>
        <p>{{ getTranslatedLabel('No items added yet.') }}</p>
      </div>
    </div>

    <div class="panel__summary">
      <div class="summary-row">
        <span>{{ getTranslatedLabel('Subtotal') }}</span>
        <strong>${{ subtotal.toFixed(2) }}</strong>
      </div>
      <div class="summary-row">
        <span>{{ getTranslatedLabel('Total (incl. tax)') }}</span>
        <strong class="summary-accent">
          ${{ totalWithTax.toFixed(2) }}
        </strong>
      </div>
    </div>

    <div class="panel__actions desktop-print-btn">
      <v-btn
        block
        variant="flat"
        color="accent"
        size="large"
        :disabled="!hasActivity || isPrinting"
        :loading="isPrinting"
        @click="printReceipt"
        class="print-btn-panel"
      >
        <v-icon start size="20">mdi-printer</v-icon>
        {{ isPrinting ? getTranslatedLabel('Printing...') : getTranslatedLabel('Print Receipt') }}
      </v-btn>
    </div>
  </div>
</template>

<script>
import { DRINK_OPTIONS, getDrinkLabel, isWater } from '../../utils/drinkOptions.js'
import { translate } from '../../utils/translations.js'
import { usePrinting } from '../../composables/usePrinting.js'
import { showSuccess } from '../../utils/successNotifications.js'

export default {
  name: 'CashierReceiptPanel',
  data: () => ({
    isPrinting: false
  }),
  setup() {
    const { printCashierReceipt: printCashierReceiptComposable } = usePrinting()
    return { printCashierReceiptComposable }
  },
  computed: {
    cashierForm() {
      return this.$store.getters['cashier/getCashierForm'] || {
        mode: 'lunch',
        buffetCounts: { adult: 0, bigKid: 0, smallKid: 0 },
        drinkCounts: {}
      }
    },
    isDinner() {
      return this.cashierForm.mode === 'dinner'
    },
    pricing() {
      const settings = this.$store.state.settings || {}
      return {
        adult: this.isDinner ? settings.ADULTDINNERPRICE : settings.ADULTPRICE,
        bigKid: this.isDinner ? settings.BIGKIDDINNERPRICE : settings.BIGKIDPRICE,
        smlKid: this.isDinner ? settings.SMALLKIDDINNERPRICE : settings.SMALLKIDPRICE,
        drink: settings.DRINKPRICE,
        water: settings.WATERPRICE
      }
    },
    lineItems() {
      const items = []
      const addItem = (label, qty, price) => {
        const quantity = Number(qty || 0)
        if (quantity <= 0) return
        const unitPrice = Number(price || 0)
        items.push({
          label,
          qty: quantity,
          total: unitPrice * quantity
        })
      }

      const buffetCounts = this.cashierForm.buffetCounts || {}
      addItem('Adult buffet', buffetCounts.adult, this.pricing.adult)
      addItem('Kid buffet (6-9)', buffetCounts.bigKid, this.pricing.bigKid)
      addItem('Kid buffet (2-5)', buffetCounts.smallKid, this.pricing.smlKid)

      const drinkCounts = this.cashierForm.drinkCounts || {}
      
      Object.entries(drinkCounts).forEach(([code, qty]) => {
        const quantity = Number(qty || 0)
        if (quantity <= 0) return
        // For UI display, use translated label (English with Chinese appended)
        const label = getDrinkLabel(code)
        const price = isWater(code) ? this.pricing.water : this.pricing.drink
        addItem(label, quantity, price)
      })

      return items
    },
    subtotal() {
      return this.lineItems.reduce((sum, item) => sum + item.total, 0)
    },
    totalWithTax() {
      const settings = this.$store.state.settings || {}
      return this.subtotal * (settings.TAX_RATE || 1.07)
    },
    hasActivity() {
      return this.lineItems.length > 0
    },
    taxAmount() {
      return this.totalWithTax - this.subtotal
    },
    isChinese() {
      const settings = this.$store.state.settings || {}
      return settings.language === 'zh'
    }
  },
  methods: {
    getTranslatedLabel(label) {
      return translate(label, this.isChinese)
    },
    async printReceipt() {
      if (!this.hasActivity || this.isPrinting) {
        return
      }

      try {
        this.isPrinting = true
        
        const buffetCounts = this.cashierForm.buffetCounts || {}
        const drinkCounts = this.cashierForm.drinkCounts || {}

        await this.printCashierReceiptComposable({
          store: this.$store,
          buffetCounts,
          drinkCounts,
          isDinner: this.isDinner,
          getDrinkLabelFn: getDrinkLabel,
          isWaterFn: isWater
        })
        
        // Show success feedback
        const ticketCount = this.$store.state.sales.ticketCount || 0
        const totalDisplay = this.totalWithTax.toFixed(2)
        showSuccess(
          this.getTranslatedLabel(`Receipt printed successfully! Ticket #${ticketCount} - Total: $${totalDisplay}`),
          4000
        )
      } catch (error) {
        // Error handling is done by error handler service
        console.error('Print failed:', error)
      } finally {
        this.isPrinting = false
      }
    }
    // openPrintDocument and printWithIframe are now provided by usePrinting composable
  },
}
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100%;
}

.panel__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.panel__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.panel__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(31, 39, 51, 0.6);
}

.panel__content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.line-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 4px;
  max-height: 260px;
  overflow-y: auto;
}

.line-items--empty {
  align-items: center;
  text-align: center;
  color: rgba(31, 39, 51, 0.6);
}

.line-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 6px 16px rgba(15, 25, 35, 0.1);
}

.line-item__label {
  font-weight: 600;
}

.line-item__meta {
  font-size: 12px;
  color: rgba(31, 39, 51, 0.55);
}

.line-item__amount {
  font-weight: 700;
}

.panel__summary {
  border-top: 1px solid rgba(31, 39, 51, 0.08);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.summary-row strong {
  font-weight: 700;
}

.summary-accent {
  color: var(--v-theme-primary);
}

.panel__actions {
  border-top: 1px solid rgba(31, 39, 51, 0.08);
  padding-top: 16px;
}

.print-btn-panel {
  font-weight: 600;
  letter-spacing: 0.5px;
  height: 48px;
}

/* Hide print button in side panel on mobile - it's moved to top of main view */
@media (max-width: 600px) {
  .desktop-print-btn {
    display: none;
  }
}

/* iPad Mini optimizations for side panel */
@media (min-width: 768px) and (max-width: 1024px) {
  .print-btn-panel {
    height: 52px;
    font-size: 16px;
  }

  .panel__title {
    font-size: 24px;
  }

  .panel__subtitle {
    font-size: 14px;
  }

  .line-item {
    padding: 14px 16px;
  }

  .line-item__label {
    font-size: 15px;
  }

  .line-item__amount {
    font-size: 16px;
  }

  .summary-row {
    font-size: 15px;
  }

  .summary-accent {
    font-size: 18px;
  }
}
</style>

