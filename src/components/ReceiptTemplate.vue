<template>
  <div class="receipt">
    <!-- Ticket Count (if enabled) -->
    <div v-if="showTicketCount" class="receipt__ticket-count">
      {{ ticketCountChinese }}
    </div>

    <!-- Header -->
    <h1 class="receipt__header">{{ headerText }}</h1>
    <div v-if="subHeaderText" class="receipt__sub-header">
      {{ subHeaderText }}
    </div>

    <!-- Title (Table Number, To-Go, or Cashier) -->
    <h2 class="receipt__title">{{ title }}</h2>

    <!-- Server Mode / Print Time -->
    <div v-if="serverMode" class="receipt__meta">
      Server Mode: {{ serverMode }}
    </div>
    <div v-if="showPrintTime" class="receipt__print-time">
      {{ printTime }}
    </div>

    <!-- Items Table -->
    <table class="receipt__table">
      <thead>
        <tr>
          <th class="receipt__table-header receipt__table-header--item">Item</th>
          <th class="receipt__table-header receipt__table-header--qty">Qty</th>
          <th class="receipt__table-header receipt__table-header--price">Price</th>
          <th class="receipt__table-header receipt__table-header--price">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="items.length === 0">
          <td colspan="4" class="receipt__table-cell receipt__table-cell--empty">
            No items
          </td>
        </tr>
        <template v-for="(item, index) in items" :key="index">
          <tr>
            <td class="receipt__table-cell receipt__table-cell--item">
              {{ item.label }}
            </td>
            <td class="receipt__table-cell receipt__table-cell--qty">
              {{ item.qty }}
            </td>
            <td class="receipt__table-cell receipt__table-cell--price">
              ${{ item.unitPrice.toFixed(2) }}
            </td>
            <td class="receipt__table-cell receipt__table-cell--price">
              ${{ item.total.toFixed(2) }}
            </td>
          </tr>
          <tr v-if="item.note" class="receipt__table-row--note">
            <td colspan="4" class="receipt__table-cell receipt__table-cell--note">
              <strong>Note:</strong> {{ item.note }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="receipt__totals">
      <div class="receipt__total-row">
        <span>Subtotal</span>
        <span>${{ subtotal.toFixed(2) }}</span>
      </div>
      <div class="receipt__total-row">
        <span>Tax</span>
        <span>${{ taxAmount.toFixed(2) }}</span>
      </div>
      <div class="receipt__total-row receipt__total-row--final">
        <strong>Total</strong>
        <strong>${{ total.toFixed(2) }}</strong>
      </div>
    </div>

    <!-- Footer -->
    <div v-if="footerText" class="receipt__footer">
      {{ footerText }}
    </div>

    <!-- Gratuity Suggestions -->
    <div v-if="showGratuity && gratuityOptions.length > 0" class="receipt__gratuity">
      <div class="receipt__gratuity-title">Gratuity Suggestions</div>
      <div class="receipt__gratuity-options">
        <div
          v-for="(option, index) in gratuityOptions"
          :key="index"
          class="receipt__gratuity-option"
        >
          <div class="receipt__gratuity-percent">{{ option.percent }}%</div>
          <div class="receipt__gratuity-amount">${{ option.amount.toFixed(2) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReceiptTemplate',
  props: {
    // Header
    headerText: {
      type: String,
      default: 'China Buffet'
    },
    subHeaderText: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      required: true
    },
    serverMode: {
      type: String,
      default: ''
    },
    showPrintTime: {
      type: Boolean,
      default: true
    },
    printTime: {
      type: String,
      default: () => new Date().toLocaleString()
    },
    // Ticket Count
    showTicketCount: {
      type: Boolean,
      default: false
    },
    ticketCountChinese: {
      type: String,
      default: ''
    },
    // Items
    items: {
      type: Array,
      default: () => [],
      validator: (items) => {
        return items.every(item => 
          item && 
          typeof item.label === 'string' &&
          typeof item.qty === 'number' &&
          typeof item.unitPrice === 'number' &&
          typeof item.total === 'number'
        )
      }
    },
    // Totals
    subtotal: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    // Footer
    footerText: {
      type: String,
      default: ''
    },
    // Gratuity
    showGratuity: {
      type: Boolean,
      default: false
    },
    gratuityOptions: {
      type: Array,
      default: () => [],
      validator: (options) => {
        return options.every(option =>
          option &&
          typeof option.percent === 'number' &&
          typeof option.amount === 'number'
        )
      }
    }
  }
}
</script>

<style scoped>
.receipt {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  padding: 24px;
  color: #333;
  position: relative;
}

.receipt__ticket-count {
  position: absolute;
  top: 24px;
  right: 24px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.receipt__header {
  text-align: center;
  margin-bottom: 4px;
  letter-spacing: 1px;
}

.receipt__sub-header {
  text-align: center;
  margin-top: 4px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #666;
  font-style: italic;
  white-space: pre-line;
}

.receipt__title {
  text-align: center;
  margin-top: 0;
  font-weight: normal;
  font-size: 16px;
}

.receipt__meta {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.receipt__print-time {
  text-align: center;
  margin-top: 8px;
  font-size: 11px;
  color: #999;
}

.receipt__table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 24px;
  font-size: 14px;
  table-layout: fixed;
}

.receipt__table-header {
  padding: 8px 6px;
  border-bottom: 1px solid #ddd;
  background: #f5f5f5;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.receipt__table-header--item {
  text-align: left;
  width: 50%;
}

.receipt__table-header--qty {
  text-align: center;
  width: 10%;
}

.receipt__table-header--price {
  text-align: right;
  width: 20%;
}

.receipt__table-cell {
  padding: 8px 6px;
  border-bottom: 1px solid #ddd;
}

.receipt__table-cell--item {
  text-align: left;
}

.receipt__table-cell--qty {
  text-align: center;
}

.receipt__table-cell--price {
  text-align: right;
}

.receipt__table-cell--empty {
  text-align: center;
  color: #999;
  font-style: italic;
}

.receipt__table-row--note .receipt__table-cell {
  padding: 6px 6px 10px;
  font-style: italic;
  color: #4a4a4a;
  background: #f9fbff;
  border-bottom: 1px solid #ddd;
}

.receipt__totals {
  margin-top: 16px;
  font-size: 14px;
}

.receipt__total-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.receipt__total-row--final {
  font-size: 16px;
}

.receipt__total-row--final strong {
  font-weight: bold;
}

.receipt__footer {
  margin-top: 24px;
  text-align: center;
  font-size: 12px;
  color: #777;
}

.receipt__gratuity {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #ccc;
}

.receipt__gratuity-title {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.receipt__gratuity-options {
  display: flex;
  justify-content: space-around;
  font-size: 11px;
}

.receipt__gratuity-option {
  text-align: center;
}

.receipt__gratuity-percent {
  font-weight: bold;
}

.receipt__gratuity-amount {
  color: #666;
}
</style>


