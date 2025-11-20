<template>
  <section class="floor-plan">
    <table-grid @tile-click="addDetails" />

    <order-details ref="orderDetails" v-model="showDetails"></order-details>
  </section>
</template>

<script>
import TableGrid from '../components/tables/TableGrid.vue'
import OrderDetails from '../components/OrderDetails.vue'
import { usePrinting } from '../composables/usePrinting.js'
import { translate } from '../utils/translations.js'
import logger from '../services/logger.js'

export default {
  name: 'HomeView',
  components: {
    TableGrid,
    OrderDetails
  },
  data: () => ({
    showDetails: false,
    listenersRegistered: false
  }),
  computed: {
    // Only compute tableOrder when it actually changes
    tableOrder() {
      return this.$store.state.ui.tableOrder || []
    },
    // Memoize language checks - only recalculate when language changes
    isChinese() {
      return this.$store.state.settings.language === 'zh'
    },
    currentLanguage() {
      return this.$store.state.settings.language
    },
    // Memoize price mode - only recalculate when isDinner changes
    currentPriceMode() {
      return this.$store.state.settings.isDinner
    }
  },
  setup() {
    const { printTableReceipt: printTableReceiptComposable } = usePrinting()
    return { printTableReceiptComposable }
  },
  methods: {
    registerPanelListeners() {
      if (this.listenersRegistered) return
      window.addEventListener('pos-open-table-details', this.handlePanelOpen)
      window.addEventListener('pos-print-table', this.handlePanelPrint)
      window.addEventListener('pos-pay-table', this.handlePanelPay)
      window.addEventListener('pos-table-panel-focus', this.handlePanelFocus)
      this.listenersRegistered = true
    },
    unregisterPanelListeners() {
      if (!this.listenersRegistered) return
      window.removeEventListener('pos-open-table-details', this.handlePanelOpen)
      window.removeEventListener('pos-print-table', this.handlePanelPrint)
      window.removeEventListener('pos-pay-table', this.handlePanelPay)
      window.removeEventListener('pos-table-panel-focus', this.handlePanelFocus)
      this.listenersRegistered = false
    },
    handlePanelOpen(event) {
      const index = typeof event.detail?.tableIndex === 'number'
        ? event.detail.tableIndex
        : this.$store.state.ui.tableNum || 0
      this.$store.commit('ui/setTableNum', index)
      this.$store.dispatch('ui/setOrderPanel', { type: 'table', tableIndex: index })
      this.showDetails = true
    },
    async handlePanelPrint(event) {
      const index = typeof event.detail?.tableIndex === 'number'
        ? event.detail.tableIndex
        : this.$store.state.ui.tableNum || 0
      this.$store.commit('ui/setTableNum', index)
      this.$store.dispatch('ui/setOrderPanel', { type: 'table', tableIndex: index })
      // Print directly without opening the dialog
      await this.printTableReceipt(index)
    },
    async printTableReceipt(tableIndex) {
      // tableIndex is the actual table number (not array index)
      const tables = this.$store.state.tables.tables || {}
      const table = Array.isArray(tables)
        ? tables[tableIndex] || null  // Legacy array format
        : tables[tableIndex] || null  // New object format
      
      await this.printTableReceiptComposable({
        store: this.$store,
        tableIndex,
        table
      })
    },
    handlePanelPay(event) {
      const index = typeof event.detail?.tableIndex === 'number'
        ? event.detail.tableIndex
        : this.$store.state.ui.tableNum || 0
      this.$store.commit('ui/setTableNum', index)
      this.$store.dispatch('ui/setOrderPanel', { type: 'table', tableIndex: index })
      this.$store.dispatch('tables/payTable')
    },
    handlePanelFocus(event) {
      const index = typeof event.detail?.tableIndex === 'number'
        ? event.detail.tableIndex
        : this.$store.state.ui.tableNum || 0
      this.$store.commit('ui/setTableNum', index)
      this.$store.dispatch('ui/setOrderPanel', { type: 'table', tableIndex: index })
    },
    addDetails(n) {
      // Validate input
      if (n === undefined || n === null || n === '') {
        logger.component.warn('HomeView', 'addDetails called with invalid table number:', n)
        return
      }
      
      const tables = this.$store.state.tables.tables || {}
      const tableNumber = Number(n)
      
      // Validate that tableNumber is a valid number
      if (isNaN(tableNumber) || tableNumber <= 0) {
        logger.component.warn('HomeView', 'addDetails called with invalid table number:', n, 'converted to:', tableNumber)
        return
      }
      
      // With object format, access directly by table number - no need to findIndex
      if (Array.isArray(tables)) {
        // Legacy array format - find by number
        const foundIndex = tables.findIndex(table => {
          if (!table) return false
          return Number(table.number) === tableNumber
        })
        
        if (foundIndex >= 0) {
          // Found by number - use it directly
          this.$store.commit('ui/setTableNum', foundIndex)
          this.$store.dispatch('ui/setOrderPanel', { type: 'table', tableIndex: foundIndex })
          // Open the dialog
          this.showDetails = true
        } else {
          // Not found by number - try index-based as fallback
          const fallbackIndex = tableNumber - 1
          if (fallbackIndex >= 0 && fallbackIndex < tables.length) {
            this.$store.commit('ui/setTableNum', fallbackIndex)
            this.$store.dispatch('ui/setOrderPanel', { type: 'table', tableIndex: fallbackIndex })
            // Open the dialog
            this.showDetails = true
          } else {
            logger.component.warn('HomeView', `Table ${tableNumber} not found and invalid index ${fallbackIndex}`)
          }
        }
      } else {
        // New object format - direct access by table number
        // Check if table exists
        if (tables[tableNumber]) {
          // Table exists - use table number directly (not index)
          this.$store.commit('ui/setTableNum', tableNumber)
          this.$store.dispatch('ui/setOrderPanel', { type: 'table', tableIndex: tableNumber })
          // Open the dialog
          this.showDetails = true
        } else {
          logger.component.warn('HomeView', 'Table', tableNumber, 'not found')
        }
      }
    },
    getTranslatedLabel(label) {
      return translate(label, this.isChinese)
    }
  },
  mounted() {
    this.$store.dispatch('ui/setOrderPanel', null)
    this.registerPanelListeners()
  },
  beforeUnmount() {
    this.unregisterPanelListeners()
    this.$store.dispatch('ui/setOrderPanel', null)
  }
}
</script>

<style scoped>
.floor-plan {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>

