<template>
  <div class="panel">
    <div class="panel__header">
      <div>
        <h3 class="panel__title">{{ getTableDisplayName() }}</h3>
        <p class="panel__subtitle">
          {{ getTranslatedLabel(pricingModeWasDinner ? 'Dinner pricing' : 'Lunch pricing') }}
        </p>
      </div>
      <v-chip
        v-if="table.sitDownTime"
        size="small"
        color="accent"
        variant="tonal"
      >
        <v-icon start size="16">mdi-clock-outline</v-icon>
        {{ formattedSitDownTime }}
      </v-chip>
    </div>

    <div class="panel__content">
      <div
        v-if="lineItems.length"
        :class="['line-items', { 'line-items--highlighted': highlightSection === 'check' }]"
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
        <p>{{ getTranslatedLabel('No guests or drinks recorded yet.') }}</p>
      </div>
      
      <div :class="['action-list', { 'action-list--highlighted': highlightSection === 'actions' }]">
        <v-btn
          block
          variant="outlined"
          color="accent"
          class="mb-2"
          @click="emitManage"
        >
          <v-icon start>mdi-square-edit-outline</v-icon>
          {{ getTranslatedLabel('Manage table') }}
        </v-btn>
        <v-btn
          block
          variant="outlined"
          color="accent"
          class="mb-2"
          @click="emitPrint"
          :disabled="!hasGuests"
        >
          <v-icon start>mdi-printer</v-icon>
          {{ getTranslatedLabel('Print Preview') }}
        </v-btn>
        <v-btn
          block
          variant="flat"
          color="success"
          :disabled="!hasGuests"
          @click="emitPaid"
        >
          <v-icon start>mdi-cash-check</v-icon>
          {{ getTranslatedLabel('Mark Paid') }}
        </v-btn>
      </div>
    </div>

    <div :class="['panel__summary', { 'panel__summary--highlighted': highlightSection === 'summary' }]">
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
  </div>
</template>

<script>
import { translate, getTranslation } from '../../utils/translations.js'
import { DRINK_CODES } from '../../constants/drinks.js'
import { useTimerManagement } from '../../composables/useTimerManagement.js'
import { isOccupiedOrPrinted, isTablePrinted } from '../../services/tableStatusService.js'
import { formatTime } from '../../utils/timeUtils.js'

export default {
  name: 'TableOrderPanel',
  props: {
    tableIndex: {
      type: Number,
      required: true
    }
  },
  emits: ['manage-table', 'print-table', 'pay-table'],
  setup() {
    // Use timer management composable for automatic cleanup
    const { setManagedTimeout, clearManagedTimeout } = useTimerManagement()
    return {
      setManagedTimeout,
      clearManagedTimeout
    }
  },
  data: () => ({
    highlightSection: null,
    highlightTimeoutId: null // Store timeout ID for clearing
  }),
  computed: {
    table() {
      return this.$store.state.tables.tables?.[this.tableIndex] || {}
    },
    tableNumber() {
      const number = this.table?.number
      if (typeof number === 'number') return number
      return this.tableIndex + 1
    },
    isDinner() {
      return this.$store.state.settings.isDinner
    },
    // For occupied/printed tables, use the stored pricing mode that was used when calculated
    // For unoccupied tables, use current mode
    formattedSitDownTime() {
      return this.table?.sitDownTime ? formatTime(this.table.sitDownTime) : ''
    },
    pricingModeWasDinner() {
      // Only printed tables preserve their pricing mode
      // All other tables (empty or occupied) should follow current nav bar mode
      if (!isTablePrinted(this.table)) {
        return this.$store.state.settings.isDinner
      }
      
      // For printed tables, use stored pricing mode if available
      if (this.table.pricingModeDinner !== undefined) {
        return !!this.table.pricingModeDinner
      }
      
      // For printed tables without stored mode, infer from stored price
      // This handles tables that were printed before pricingModeDinner was added
      if (this.table.totalPrice && parseFloat(this.table.totalPrice) > 0) {
        const settings = this.$store.state.settings || {}
        const adultCount = parseInt(this.table.adult) || 0
        const bigKidCount = parseInt(this.table.bigKid) || 0
        const smlKidCount = parseInt(this.table.smlKid) || 0
        const drinkPrice = parseFloat(this.table.drinkPrice) || 0
        
        // Calculate what price would be in dinner mode
        const dinnerSubtotal = drinkPrice + 
          (adultCount * (settings.ADULTDINNERPRICE || 0)) + 
          (bigKidCount * (settings.BIGKIDDINNERPRICE || 0)) + 
          (smlKidCount * (settings.SMALLKIDDINNERPRICE || 0))
        const dinnerTotal = parseFloat((dinnerSubtotal * (settings.TAX_RATE || 1.07)).toFixed(2))
        
        // Calculate what price would be in lunch mode
        const lunchSubtotal = drinkPrice + 
          (adultCount * (settings.ADULTPRICE || 0)) + 
          (bigKidCount * (settings.BIGKIDPRICE || 0)) + 
          (smlKidCount * (settings.SMALLKIDPRICE || 0))
        const lunchTotal = parseFloat((lunchSubtotal * (settings.TAX_RATE || 1.07)).toFixed(2))
        
        // Compare stored price to see which mode was used
        const storedPrice = parseFloat(this.table.totalPrice)
        // Use a small tolerance for floating point comparison
        const dinnerDiff = Math.abs(dinnerTotal - storedPrice)
        const lunchDiff = Math.abs(lunchTotal - storedPrice)
        
        if (dinnerDiff < lunchDiff) {
          return true // Was dinner mode
        }
        return false // Was lunch mode
      }
      // For unoccupied tables, use current mode
      return this.isDinner
    },
    pricing() {
      const settings = this.$store.state.settings || {}
      // Use preserved mode for occupied tables, current mode for unoccupied
      const useDinnerMode = this.pricingModeWasDinner
      return {
        adult: useDinnerMode ? (settings.ADULTDINNERPRICE || 0) : (settings.ADULTPRICE || 0),
        bigKid: useDinnerMode ? (settings.BIGKIDDINNERPRICE || 0) : (settings.BIGKIDPRICE || 0),
        smlKid: useDinnerMode ? (settings.SMALLKIDDINNERPRICE || 0) : (settings.SMALLKIDPRICE || 0),
        drink: settings.DRINKPRICE || 0,
        water: settings.WATERPRICE || 0
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

      addItem('Adult buffet', this.table.adult, this.pricing.adult)
      addItem('Kid buffet (6-9)', this.table.bigKid, this.pricing.bigKid)
      addItem('Kid buffet (2-5)', this.table.smlKid, this.pricing.smlKid)

      const drinks = Array.isArray(this.table.drinks) ? this.table.drinks : []
      const counts = drinks.reduce((acc, code) => {
        acc[code] = (acc[code] || 0) + 1
        return acc
      }, {})

      Object.entries(counts).forEach(([code, qty]) => {
        const label = this.drinkLabel(code)
        const price = code === DRINK_CODES.WATER ? this.pricing.water : this.pricing.drink
        addItem(label, qty, price)
      })

      return items
    },
    subtotal() {
      // If table is occupied or has a price set, calculate subtotal from stored price
      // Otherwise, calculate from line items based on current mode
      if (this.table.occupied && this.table.totalPrice && parseFloat(this.table.totalPrice) > 0) {
        // Use stored totalPrice to avoid recalculation based on mode changes
        return parseFloat(this.table.totalPrice) / (this.$store.state.settings.TAX_RATE || 1.07)
      }
      return this.lineItems.reduce((sum, item) => sum + item.total, 0)
    },
    totalWithTax() {
      // For occupied/seated or printed tables, always use stored totalPrice
      // This prevents price changes when switching lunch/dinner modes
      if (this.table.occupied || (this.table.totalPrice && parseFloat(this.table.totalPrice) > 0)) {
        return Number(this.table.totalPrice || 0)
      }
      // For new/unoccupied tables, calculate based on current mode
      return this.subtotal * (this.$store.state.settings.TAX_RATE || 1.07)
    },
    hasGuests() {
      return this.lineItems.some(item => item.qty > 0)
    }
  },
  methods: {
    setHighlight(section, options = {}) {
      const normalized = section === 'drinks' ? 'check' : section
      this.highlightSection = normalized || null
      // Clear existing timeout if any
      if (this.highlightTimeoutId !== null) {
        this.clearManagedTimeout(this.highlightTimeoutId)
        this.highlightTimeoutId = null
      }
      // Set new timeout if not persistent
      if (!options.persistent && normalized) {
        this.highlightTimeoutId = this.setManagedTimeout(() => {
          this.highlightSection = null
          this.highlightTimeoutId = null
        }, options.duration || 1600)
      }
    },
    handleExternalHighlight(event = {}) {
      const detail = event.detail || {}
      if (detail.tableIndex !== undefined && detail.tableIndex !== this.tableIndex) {
        return
      }
      this.setHighlight(detail.section, detail)
    },
    handleExternalFocus(event = {}) {
      const detail = event.detail || {}
      if (detail.tableIndex !== undefined && detail.tableIndex !== this.tableIndex) {
        return
      }
      if (detail.section) {
        this.setHighlight(detail.section, { ...detail, persistent: true })
      }
    },
    handleExternalBlur(event = {}) {
      const detail = event.detail || {}
      if (detail.tableIndex !== undefined && detail.tableIndex !== this.tableIndex) {
        return
      }
      this.setHighlight(null)
    },
    drinkLabel(code) {
      const map = {
        WTER: 'Water',
        DRNK: 'Drink',
        COKE: 'Coke',
        STEA: 'Sweet tea',
        UTEA: 'Unsweet tea',
        HTEA: 'Hot tea',
        SPRT: 'Sprite',
        DRPP: 'Dr Pepper',
        DIET: 'Diet Coke',
        LMND: 'Lemonade',
        HALF: 'Half & Half',
        COFE: 'Coffee'
      }
      const label = map[code] || code
      // For display, use translated label (English with Chinese appended)
      return this.getTranslatedLabel(label)
    },
    getTableDisplayName() {
      if (this.table && this.table.name && this.table.name.trim()) {
        return this.table.name.trim()
      }
      return `Table ${this.tableNumber}`
    },
    getTranslatedLabel(label) {
      return translate(label, this.isChinese)
    },
    isChinese() {
      return this.$store.state.settings.language === 'zh'
    },
    emitManage() {
      this.setHighlight('actions')
      this.$emit('manage-table', this.tableIndex)
    },
    emitPrint() {
      this.setHighlight('check')
      this.$emit('print-table', this.tableIndex)
    },
    emitPaid() {
      this.setHighlight('summary')
      this.$emit('pay-table', this.tableIndex)
    }
  },
  mounted() {
    window.addEventListener('pos-table-panel-highlight', this.handleExternalHighlight)
    window.addEventListener('pos-table-panel-focus', this.handleExternalFocus)
    window.addEventListener('pos-table-panel-blur', this.handleExternalBlur)
  },
  beforeUnmount() {
    window.removeEventListener('pos-table-panel-highlight', this.handleExternalHighlight)
    window.removeEventListener('pos-table-panel-focus', this.handleExternalFocus)
    window.removeEventListener('pos-table-panel-blur', this.handleExternalBlur)
    // Clear timeout if it exists (composable will also clean up automatically on unmount)
    if (this.highlightTimeoutId !== null) {
      this.clearManagedTimeout(this.highlightTimeoutId)
      this.highlightTimeoutId = null
    }
  }
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

.panel__tabs {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.35);
  padding: 4px;
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
  transition: box-shadow 160ms ease, background 160ms ease, padding 160ms ease;
}

.line-items--highlighted {
  background: rgba(0, 137, 123, 0.08);
  border-radius: 18px;
  padding: 18px 12px;
  box-shadow: 0 16px 36px rgba(0, 137, 123, 0.18);
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

.action-list {
  display: flex;
  flex-direction: column;
  transition: box-shadow 160ms ease, background 160ms ease, padding 160ms ease;
}

.action-list--highlighted {
  background: rgba(0, 137, 123, 0.08);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 14px 32px rgba(0, 137, 123, 0.22);
}

.panel__summary {
  border-top: 1px solid rgba(31, 39, 51, 0.08);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: box-shadow 160ms ease, background 160ms ease, padding 160ms ease;
}

.panel__summary--highlighted {
  background: rgba(0, 137, 123, 0.08);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 16px 36px rgba(0, 137, 123, 0.22);
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
</style>

