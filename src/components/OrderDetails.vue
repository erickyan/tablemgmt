<template>
  <v-dialog
    v-model="dialogOpen"
    :max-width="$vuetify.display.xs ? '100%' : ($vuetify.display.tablet ? '900' : '760')"
    :fullscreen="$vuetify.display.xs"
    transition="dialog-bottom-transition"
    role="dialog"
    :aria-labelledby="`table-dialog-title-${tableIndex}`"
    :aria-describedby="`table-dialog-description-${tableIndex}`"
  >
    <v-card class="pos-dialog">
      <div class="pos-dialog__header">
        <div class="header-info">
          <div class="header-title-row">
            <h3 class="dialog-title" :id="`table-dialog-title-${tableIndex}`">{{ getTableDisplayName() }}</h3>
            <v-chip
              :size="$vuetify.display.tablet && $vuetify.display.mdAndUp ? 'default' : 'small'"
              variant="tonal"
              color="accent"
            >
              {{ getTranslatedLabel(pricingModeWasDinner ? 'Dinner pricing' : 'Lunch pricing') }}
            </v-chip>
            <span class="meta-time" v-if="table.sitDownTime">
              <v-icon size="16" icon="mdi-clock-outline" class="me-1"></v-icon>
              {{ formattedSitDownTime }}
            </span>
          </div>
        </div>
        <div class="header-controls">
          <v-btn
            variant="outlined"
            color="accent"
            class="header-btn"
            :aria-label="`${getTranslatedLabel('Clear')} ${getTableDisplayName()}`"
            :loading="$store.state.ui.loadingStates.clearingTable"
            :disabled="$store.state.ui.loadingStates.clearingTable"
            @click="showClearConfirm = true"
            @keydown.enter.prevent="showClearConfirm = true"
          >
            <v-icon start>mdi-trash-can-outline</v-icon>
            {{ getTranslatedLabel('Clear') }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="accent"
            class="header-btn"
            :aria-label="`${getTranslatedLabel('Print')} receipt for ${getTableDisplayName()}`"
            :loading="$store.state.ui.loadingStates.printingReceipt"
            :disabled="$store.state.ui.loadingStates.printingReceipt"
            @click="printReceipt"
            @keydown.enter.prevent="printReceipt"
          >
            <v-icon start>mdi-printer</v-icon>
            {{ getTranslatedLabel('Print') }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="accent"
            class="header-btn"
            :aria-label="getTranslatedLabel(table.goodPpl ? 'Remove VIP status' : 'Mark as VIP')"
            @click="$store.dispatch('tables/updateTableGoodPpl', !table.goodPpl)"
            @keydown.enter.prevent="$store.dispatch('tables/updateTableGoodPpl', !table.goodPpl)"
          >
            <v-icon start>
              {{ table.goodPpl ? 'mdi-heart-off' : 'mdi-heart' }}
            </v-icon>
            {{ getTranslatedLabel(table.goodPpl ? 'Remove VIP' : 'Mark VIP') }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="accent"
            class="header-btn"
            :aria-label="`${getTranslatedLabel('Mark')} ${getTableDisplayName()} ${getTranslatedLabel('as paid')}`"
            :loading="$store.state.ui.loadingStates.payingTable"
            :disabled="$store.state.ui.loadingStates.payingTable"
            @click="payAndClose"
            @keydown.enter.prevent="payAndClose"
          >
            <v-icon start>mdi-cash-check</v-icon>
            {{ getTranslatedLabel('Paid') }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="accent"
            class="header-btn"
            :aria-label="`${getTranslatedLabel('Update')} ${getTableDisplayName()}`"
            @click="updateMenu"
            @keydown.enter.prevent="updateMenu"
          >
            <v-icon start>mdi-check</v-icon>
            {{ getTranslatedLabel('Update') }}
          </v-btn>
        </div>
      </div>

      <div class="pos-dialog__content" :id="`table-dialog-description-${tableIndex}`">
        <section class="dialog-section dialog-section--guests" aria-labelledby="guests-section-header">
          <header class="section-header">
             <h4 id="guests-section-header">{{ getTranslatedLabel('Buffet guests') }}</h4>
             <span class="section-note">{{ getTranslatedLabel('Tap + or − to adjust counts.') }}</span>
          </header>
          <div class="counter-grid">
            <div class="counter-card">
              <div class="counter-heading">
                <span class="counter-label">Adult</span>
                 <v-chip
                   :size="$vuetify.display.tablet && $vuetify.display.mdAndUp ? 'small' : 'x-small'"
                   color="accent"
                   variant="outlined"
                 >
                  ${{ pricing.adult.toFixed(2) }}
                </v-chip>
              </div>
              <div class="counter-value" :class="{ 'updated': updatedCounter === 'adult' }">
                <span>{{ table.adult }}</span>
                <div class="counter-actions">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    :aria-label="`${getTranslatedLabel('Decrease')} ${getTranslatedLabel('Adult')} count`"
                    @click="adjustGuest('adult', -1)"
                    @keydown.enter.prevent="adjustGuest('adult', -1)"
                    :disabled="table.adult <= 0"
                  >
                    <v-icon size="32">mdi-minus</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    :aria-label="`${getTranslatedLabel('Increase')} ${getTranslatedLabel('Adult')} count`"
                    @click="adjustGuest('adult', 1)"
                    @keydown.enter.prevent="adjustGuest('adult', 1)"
                  >
                    <v-icon size="32">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
            <div class="counter-card">
              <div class="counter-heading">
                <span class="counter-label">{{ getTranslatedLabel('Kid (6-9)') }}</span>
                 <v-chip
                   :size="$vuetify.display.tablet && $vuetify.display.mdAndUp ? 'small' : 'x-small'"
                   color="accent"
                   variant="outlined"
                 >
                  ${{ pricing.bigKid.toFixed(2) }}
                </v-chip>
              </div>
              <div class="counter-value" :class="{ 'updated': updatedCounter === 'bigKid' }">
                <span>{{ table.bigKid }}</span>
                <div class="counter-actions">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    :aria-label="`${getTranslatedLabel('Decrease')} ${getTranslatedLabel('Kid (6-9)')} count`"
                    @click="adjustGuest('bigKid', -1)"
                    @keydown.enter.prevent="adjustGuest('bigKid', -1)"
                    :disabled="table.bigKid <= 0"
                  >
                    <v-icon size="32">mdi-minus</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    :aria-label="`${getTranslatedLabel('Increase')} ${getTranslatedLabel('Kid (6-9)')} count`"
                    @click="adjustGuest('bigKid', 1)"
                    @keydown.enter.prevent="adjustGuest('bigKid', 1)"
                  >
                    <v-icon size="32">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
            <div class="counter-card">
              <div class="counter-heading">
                <span class="counter-label">{{ getTranslatedLabel('Kid (2-5)') }}</span>
                 <v-chip
                   :size="$vuetify.display.tablet && $vuetify.display.mdAndUp ? 'small' : 'x-small'"
                   color="accent"
                   variant="outlined"
                 >
                  ${{ pricing.smlKid.toFixed(2) }}
                </v-chip>
              </div>
              <div class="counter-value" :class="{ 'updated': updatedCounter === 'smlKid' }">
                <span>{{ table.smlKid }}</span>
                <div class="counter-actions">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    :aria-label="`${getTranslatedLabel('Decrease')} ${getTranslatedLabel('Kid (2-5)')} count`"
                    @click="adjustGuest('smlKid', -1)"
                    @keydown.enter.prevent="adjustGuest('smlKid', -1)"
                    :disabled="table.smlKid <= 0"
                  >
                    <v-icon size="32">mdi-minus</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    :aria-label="`${getTranslatedLabel('Increase')} ${getTranslatedLabel('Kid (2-5)')} count`"
                    @click="adjustGuest('smlKid', 1)"
                    @keydown.enter.prevent="adjustGuest('smlKid', 1)"
                  >
                    <v-icon size="32">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="dialog-section dialog-section--drinks" aria-labelledby="drinks-section-header">
          <header class="section-header">
            <h4 id="drinks-section-header">{{ getTranslatedLabel('Drinks') }}</h4>
            <span class="section-note">
              {{ table.drinks.length ? table.drinks.length : getTranslatedLabel('No') }} {{ getTranslatedLabel('drinks') }} {{ getTranslatedLabel('added.') }}
            </span>
          </header>

          <div class="drink-tags" :class="{ 'drink-tags--empty': !table.drinks.length }">
            <template v-if="table.drinks.length">
              <v-chip
                v-for="(drink, index) in table.drinks"
                :key="`drink-${index}-${drink}`"
                density="comfortable"
                variant="tonal"
                color="accent"
                size="small"
                class="drink-chip"
                :class="{ 'drink-chip--added': recentlyAddedDrink === drink }"
              >
                {{ drinkLabel(drink) }}
              </v-chip>
            </template>
          </div>

          <div class="drink-selector">
            <button
              v-for="option in drinkOptions"
              :key="option.code"
              type="button"
              class="drink-button"
              :aria-label="`${getTranslatedLabel('Add')} ${option.label}`"
              @click="addDrinks(option.code)"
              @keydown.enter.prevent="addDrinks(option.code)"
            >
              <v-icon size="18" :icon="option.icon" class="me-2"></v-icon>
              {{ option.label }}
            </button>
          </div>
          <v-alert
            v-if="!table.drinks.length"
            type="info"
            variant="text"
            density="compact"
            class="mt-3"
          >
            Tip: Use the quick buttons to add drinks; water is priced separately.
          </v-alert>
        </section>

        <section class="dialog-section" aria-labelledby="summary-section-header">
          <header class="section-header">
            <h4 id="summary-section-header">Summary</h4>
            <span class="section-note">Total updates on save or payment.</span>
          </header>
          <div class="summary-grid">
            <div class="summary-card">
              <span class="summary-label">Guests</span>
              <span class="summary-value">{{ guestCount }}</span>
            </div>
            <div class="summary-card">
              <span class="summary-label">To-go items</span>
              <span class="summary-value">{{ table.togo || 0 }}</span>
            </div>
            <div class="summary-card">
              <span class="summary-label">Estimated total</span>
              <span class="summary-value summary-value--accent">
                ${{ Number(table.totalPrice || 0).toFixed(2) }}
              </span>
            </div>
          </div>
        </section>
      </div>
      
      <!-- ARIA live region for dynamic updates -->
      <div aria-live="polite" aria-atomic="true" class="sr-only">
        <span>{{ getTranslatedLabel('Table') }} {{ getTableDisplayName() }}: {{ guestCount }} {{ getTranslatedLabel('guests') }}, {{ table.drinks.length || 0 }} {{ getTranslatedLabel('drinks') }}</span>
      </div>
    </v-card>

    <!-- Clear Table Confirmation Dialog -->
    <v-dialog 
      v-model="showClearConfirm" 
      :max-width="$vuetify.display.xs ? '95%' : '480'"
      persistent
      role="alertdialog"
      :aria-labelledby="`clear-confirm-title-${tableIndex}`"
      :aria-describedby="`clear-confirm-description-${tableIndex}`"
    >
      <v-card>
        <v-card-title class="text-h6" :id="`clear-confirm-title-${tableIndex}`">
          <v-icon color="error" class="mr-2" aria-hidden="true">mdi-alert-circle</v-icon>
          {{ getTranslatedLabel('Clear Table?') }}
        </v-card-title>
        <v-card-text :id="`clear-confirm-description-${tableIndex}`">
          <p class="mb-0">
            {{ getTranslatedLabel('Are you sure you want to clear') }} <strong>{{ getTableDisplayName() }}</strong>?
          </p>
          <p class="mt-2 text-medium-emphasis" style="font-size: 13px;">
            {{ getTranslatedLabel('This will clear all guest counts, drinks, and reset the table to empty. This action cannot be undone.') }}
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            variant="text" 
            @click="showClearConfirm = false"
            @keydown.enter.prevent="showClearConfirm = false"
            @keydown.esc="showClearConfirm = false"
          >
            {{ getTranslatedLabel('Cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :aria-label="`${getTranslatedLabel('Confirm clear')} ${getTableDisplayName()}`"
            :loading="$store.state.ui.loadingStates.clearingTable"
            :disabled="$store.state.ui.loadingStates.clearingTable"
            @click="confirmClearTable"
            @keydown.enter.prevent="confirmClearTable"
          >
            {{ getTranslatedLabel('Clear') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>


<script>
import { DRINK_OPTIONS, getDrinkLabel } from '../utils/drinkOptions.js'
import { translate } from '../utils/translations.js'
import { usePrinting } from '../composables/usePrinting.js'
import { DRINK_CODES } from '../constants/drinks.js'
import { errorHandler } from '../services/errorHandler.js'
import { showSuccess } from '../utils/successNotifications.js'
import { isOccupiedOrPrinted, isTablePrinted } from '../services/tableStatusService.js'
import { formatTime } from '../utils/timeUtils.js'

export default {
    props: {
        modelValue: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue'],
    data: () => ({
        drinkOptions: DRINK_OPTIONS,
        showClearConfirm: false,
        updatedCounter: null,
        counterUpdateTimeout: null,
        recentlyAddedDrink: null,
        drinkAddTimeout: null
    }),
    setup() {
        const { printTableReceipt: printTableReceiptComposable } = usePrinting()
        return { printTableReceiptComposable }
    },
    computed: {
        dialogOpen: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        },
        tableIndex() {
            // tableNum can be either a table number (new format) or index (legacy)
            return this.$store.state.ui.tableNum || 0
        },
        table() {
            // Access table by number (not index)
            // tables is now an object: { [tableNumber]: Table }
            const tables = this.$store.state.tables.tables || {}
            const indexOrNumber = this.tableIndex
            
            if (Array.isArray(tables)) {
                // Legacy array format - convert index to table number
                const table = tables[indexOrNumber] || {}
                return table
            }
            // New object format - direct access by number
            // If tableNum is still an index (legacy), try to find table by number
            const table = tables[indexOrNumber]
            if (table) {
                return table
            }
            // Fallback: try to find table by number if tableNum is actually an index
            const tableByNumber = Object.values(tables).find(t => t && t.number === indexOrNumber)
            return tableByNumber || {}
        },
        tableNumber() {
            // Use table.number if it exists and is valid, otherwise use tableIndex
            const table = this.table
            if (table && typeof table.number === 'number' && table.number > 0) {
                return table.number
            }
            // If tableIndex is already a table number, return it; otherwise add 1 (legacy index)
            return typeof this.tableIndex === 'number' && this.tableIndex > 0 
                ? this.tableIndex 
                : (this.tableIndex + 1)
        },
        guestCount() {
            return Number(this.table.adult || 0) + Number(this.table.bigKid || 0) + Number(this.table.smlKid || 0)
        },
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
            
            // Fallback to current mode
            return this.$store.state.settings.isDinner
        },
        pricing() {
            const state = this.$store.state
            // Use preserved mode for occupied tables, current mode for unoccupied
            const useDinnerMode = this.pricingModeWasDinner
            return {
                adult: useDinnerMode ? state.ADULTDINNERPRICE : state.ADULTPRICE,
                bigKid: useDinnerMode ? state.BIGKIDDINNERPRICE : state.BIGKIDPRICE,
                smlKid: useDinnerMode ? state.SMALLKIDDINNERPRICE : state.SMALLKIDPRICE,
                drink: state.DRINKPRICE,
                water: state.WATERPRICE
            }
        }
    },
    watch: {
        dialogOpen(value) {
            if (value) {
                this.emitFocus('check')
                this.notifyPanel('check', { tab: 'check', persistent: true })
            } else {
                window.dispatchEvent(new CustomEvent('pos-table-panel-blur', {
                    detail: { tableIndex: this.tableIndex }
                }))
            }
        },
        tableIndex(newIndex, oldIndex) {
            if (newIndex !== oldIndex && this.dialogOpen) {
                this.emitFocus('check')
            }
        }
    },
    methods: {
        getTableDisplayName() {
            const table = this.table
            if (table && table.name && table.name.trim()) {
                return table.name.trim()
            }
            return `${this.getTranslatedLabel('Table')} ${this.tableNumber}`
        },
        emitFocus(tab = 'check') {
            window.dispatchEvent(new CustomEvent('pos-table-panel-focus', {
                detail: { tableIndex: this.tableIndex, tab }
            }))
        },
    notifyPanel(section, options = {}) {
            const detail = {
                tableIndex: this.tableIndex,
                section,
                tab: options.tab || null,
                persistent: Boolean(options.persistent)
            }
            window.dispatchEvent(new CustomEvent('pos-table-panel-highlight', { detail }))
        },
        adjustGuest(type, delta) {
            this.$store.dispatch('tables/adjustGuestCount', { type, delta })
            this.notifyPanel('check', { tab: 'check' })
            
            // Visual feedback animation
            this.updatedCounter = type
            if (this.counterUpdateTimeout) {
                clearTimeout(this.counterUpdateTimeout)
            }
            this.counterUpdateTimeout = setTimeout(() => {
                this.updatedCounter = null
            }, 400)
        },
        addDrinks(code) {
            this.$store.dispatch('tables/addDrink', code)
            this.notifyPanel('drinks', { tab: 'check' })
            
            // Visual feedback for added drink
            this.recentlyAddedDrink = code
            if (this.drinkAddTimeout) {
                clearTimeout(this.drinkAddTimeout)
            }
            this.drinkAddTimeout = setTimeout(() => {
                this.recentlyAddedDrink = null
            }, 600)
        },
        drinkLabel(code) {
            // For UI display, use translated label (English with Chinese appended)
            const match = this.drinkOptions.find(option => option.code === code)
            const label = match ? match.label : code
            return this.getTranslatedLabel(label)
        },
        drinkLabelEnglish(code) {
            // For receipts, use English-only label (no translation)
            const match = this.drinkOptions.find(option => option.code === code)
            return match ? match.label : code
        },
        getTranslatedLabel(label) {
            return translate(label, this.isChinese)
        },
        isChinese() {
            return this.$store.state.settings.language === 'zh'
        },
        // openPrintDocument and printWithIframe are now provided by usePrinting composable
        confirmClearTable() {
            this.showClearConfirm = false
            try {
                this.$store.dispatch('tables/clearTable')
                this.notifyPanel('summary', { tab: 'check' })
                showSuccess(`${this.getTableDisplayName()} ${this.getTranslatedLabel('cleared')}`)
            } catch (error) {
                errorHandler.handle(error, {
                    context: 'clearTable',
                    showToUser: true
                })
            }
        },
        updateMenu() {
            this.$store.dispatch('tables/calculateTableTotal')
            if (this.tableHasActivity(this.tableIndex)) {
                    this.$store.dispatch('tables/getTableTimestamp', this.tableIndex)
                if (!this.table.occupied) {
                        this.$store.dispatch('tables/setTableOccupied', { index: this.tableIndex, value: true })
                }
                this.notifyPanel('check', { tab: 'check' })
                showSuccess(`${this.getTableDisplayName()} ${this.getTranslatedLabel('updated')}`)
            } else {
                    this.$store.dispatch('tables/setTableSitDownTime', { index: this.tableIndex, value: '' })
                    this.$store.dispatch('tables/setTableOccupied', { index: this.tableIndex, value: false })
                this.notifyPanel('summary', { tab: 'check' })
                showSuccess(`${this.getTableDisplayName()} ${this.getTranslatedLabel('cleared')}`)
            }
            this.dialogOpen = false
        },
        async printReceipt() {
                this.$store.commit('ui/setLoadingState', { key: 'printingReceipt', value: true })
            try {
                await this.printTableReceiptComposable({
                    store: this.$store,
                    tableIndex: this.tableIndex,
                    table: this.table
                })
                // Don't close dialog immediately after printing - let the print dialog appear first
                // The dialog will be closed by the caller if needed, or user can close it manually
                // Note: setTableOccupied(false) is already called inside printTableReceiptComposable
                this.notifyPanel('summary', { tab: 'check' })
                showSuccess(`${this.getTranslatedLabel('Receipt printed')} ${this.getTranslatedLabel('for')} ${this.getTableDisplayName()}`)
                // Removed auto-close: this.dialogOpen = false
            } catch (error) {
                errorHandler.handle(error, {
                    context: 'printReceipt',
                    showToUser: true
                })
            } finally {
                this.$store.commit('ui/setLoadingState', { key: 'printingReceipt', value: false })
            }
        },
        payAndClose() {
            try {
                this.$store.dispatch('tables/payTable')
                this.notifyPanel('summary', { tab: 'check' })
                this.dialogOpen = false
                showSuccess(`${this.getTableDisplayName()} ${this.getTranslatedLabel('marked as paid')}`)
            } catch (error) {
                errorHandler.handle(error, {
                    context: 'payTable',
                    showToUser: true
                })
            }
        },
        tableHasActivity(index) {
            // Access table by number (not index)
            const tables = this.$store.state.tables.tables || {}
            const table = Array.isArray(tables)
                ? tables[index] || {}
                : tables[index] || {}
            const guestCount = Number(table.adult || 0) + Number(table.bigKid || 0) + Number(table.smlKid || 0)
            const hasDrinks = Array.isArray(table.drinks) && table.drinks.length > 0
            const hasTogo = Number(table.togo || 0) > 0
            return guestCount > 0 || hasDrinks || hasTogo
        }
    },
    mounted() {
        if (this.dialogOpen) {
            this.emitFocus('check')
            this.notifyPanel('check', { tab: 'check', persistent: true })
        }
    },
    beforeUnmount() {
        window.dispatchEvent(new CustomEvent('pos-table-panel-blur', {
            detail: { tableIndex: this.tableIndex }
        }))
        if (this.counterUpdateTimeout) {
            clearTimeout(this.counterUpdateTimeout)
        }
        if (this.drinkAddTimeout) {
            clearTimeout(this.drinkAddTimeout)
        }
    }
}
</script>

<style scoped>
.pos-dialog {
  padding: 12px 4px 12px 4px;
  border-radius: 28px;
  box-shadow: 0 24px 42px rgba(15, 25, 35, 0.22);
}

.pos-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 24px 20px 24px;
  flex-wrap: wrap;
}

@media (min-width: 768px) and (max-width: 900px) and (orientation: landscape) {
  /* iPad Mini - compact header */
  .pos-dialog__header {
    padding: 18px 20px;
    gap: 12px;
    flex-wrap: wrap;
  }
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .pos-dialog__header {
    padding: 24px 28px 24px 28px;
    gap: 20px;
  }
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 auto;
}

.header-title-row {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.dialog-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.4px;
  line-height: 1.4;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  /* Regular iPad landscape */
  .dialog-title {
    font-size: 32px;
  }
}

.meta-time {
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  line-height: 1.5;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .meta-time {
    font-size: 15px;
  }
}

.header-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: nowrap;
  width: 100%;
}

.header-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  min-height: 42px;
  box-shadow: 0 6px 16px rgba(15, 25, 35, 0.12);
  flex: 0 1 auto;
  white-space: nowrap;
  font-size: 14px;
  padding: 10px 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (min-width: 768px) and (max-width: 900px) and (orientation: landscape) {
  /* iPad Mini - smaller buttons to fit in one row */
  .header-controls {
    gap: 4px;
    flex-wrap: nowrap;
  }
  
  .header-btn {
    min-height: 44px;
    padding: 8px 10px;
    font-size: 12px;
    flex: 0 1 auto;
    min-width: 0;
    letter-spacing: 0.3px;
  }
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .header-btn {
    min-height: 52px;
    padding: 14px 18px;
    font-size: 15px;
  }
}

.pos-dialog__content {
  padding: 8px 24px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .pos-dialog__content {
    padding: 12px 28px 24px 28px;
    gap: 28px;
  }
}

.dialog-section {
  background: rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .dialog-section {
    padding: 24px 28px;
    gap: 20px;
  }
}

.dialog-section + .dialog-section {
  margin-top: 6px;
}

.dialog-section--guests {
  margin-top: -10px;
  padding-top: 14px;
}

.dialog-section--drinks {
  margin-top: -4px;
  padding-top: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.section-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .section-header h4 {
    font-size: 22px;
  }
}

.section-actions {
  display: inline-flex;
  gap: 6px;
}

.section-note {
  font-size: 13px;
  color: rgba(31, 39, 51, 0.55);
  line-height: 1.6;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .section-note {
    font-size: 15px;
    color: rgba(31, 39, 51, 0.65);
  }
}

.counter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.counter-card {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 10px 22px rgba(15, 25, 35, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .counter-card {
    padding: 20px 24px;
    gap: 14px;
  }
}

.counter-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.counter-label {
  font-size: 13px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: rgba(31, 39, 51, 0.65);
  line-height: 1.5;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .counter-label {
    font-size: 14px;
    letter-spacing: 1px;
    color: rgba(31, 39, 51, 0.75);
  }
}

.counter-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  transition: transform 0.2s ease;
  line-height: 1.5;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .counter-value {
    font-size: 28px;
    gap: 16px;
  }
}

.counter-value.updated {
  animation: counterPulse 0.4s ease;
}

@keyframes counterPulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
    color: var(--v-theme-primary);
  }
  100% {
    transform: scale(1);
  }
}

.counter-actions {
  display: inline-flex;
  gap: 4px;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .counter-actions .v-btn {
    min-width: 48px;
    min-height: 48px;
    width: 48px;
    height: 48px;
  }
  
  .counter-actions .v-icon {
    font-size: 24px;
    width: 24px;
    height: 24px;
  }
}

.drink-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 0;
  min-height: 28px;
  max-height: 80px;
  overflow-y: auto;
}

.drink-tags--empty {
  visibility: hidden;
}

.drink-chip {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .drink-chip {
    font-size: 14px;
    height: 32px;
    padding: 0 12px;
  }
  
  .drink-chip .v-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }
}

.drink-chip--added {
  animation: chipAdded 0.5s ease;
}

@keyframes chipAdded {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.drink-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.drink-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 42px;
  border-radius: 14px;
  border: none;
  font-weight: 600;
  font-size: 14px;
  color: rgba(31, 39, 51, 0.85);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 16px rgba(15, 25, 35, 0.1);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  line-height: 1.5;
  min-height: 42px;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .drink-button {
    height: 48px;
    min-height: 48px;
    font-size: 16px;
    gap: 10px;
    padding: 0 16px;
  }
  
  .drink-button .v-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
  }
}

.drink-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(15, 25, 35, 0.16);
}

.drink-button:focus-visible {
  outline: 2px solid rgba(0, 137, 123, 0.5);
  outline-offset: 2px;
}

/* Focus indicators for accessibility */
.header-btn:focus-visible,
.counter-actions .v-btn:focus-visible {
  outline: 2px solid rgba(0, 137, 123, 0.6);
  outline-offset: 2px;
}

/* Ensure focus is visible for all interactive elements */
.v-btn:focus-visible,
button:focus-visible {
  outline: 2px solid rgba(0, 137, 123, 0.6);
  outline-offset: 2px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 22px rgba(15, 25, 35, 0.12);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .summary-card {
    padding: 20px 24px;
    gap: 10px;
  }
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.summary-label {
  font-size: 13px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: rgba(31, 39, 51, 0.8);
  line-height: 1.5;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .summary-label {
    font-size: 14px;
    letter-spacing: 1px;
    color: rgba(31, 39, 51, 0.85);
  }
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: rgba(31, 39, 51, 0.88);
  line-height: 1.5;
}

@media (min-width: 900px) and (max-width: 1024px) and (orientation: landscape) {
  .summary-value {
    font-size: 28px;
    color: rgba(31, 39, 51, 0.95);
  }
}

.summary-value--accent {
  color: var(--v-theme-primary);
}

@media (max-width: 600px) {
  .pos-dialog {
    border-radius: 0;
  }
  
  .dialog-title {
    font-size: 22px;
  }
  
  .pos-dialog__header {
    flex-direction: column;
    align-items: stretch;
    padding: 16px 20px;
  }
  
  .header-controls {
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }
  
  .header-controls .v-btn {
    flex: 1 1 calc(50% - 4px);
    min-width: 0;
    font-size: 12px;
    padding: 10px 12px;
  }
  
  .pos-dialog__content {
    padding: 8px 20px 20px 20px;
  }
  
  .counter-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .drink-selector {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>