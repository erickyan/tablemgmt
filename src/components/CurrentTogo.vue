<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="620"
    transition="dialog-bottom-transition"
  >
    <v-card class="pos-dialog">
      <div class="pos-dialog__header">
        <div>
          <h3 class="dialog-title">Current to-go order</h3>
          <p class="dialog-subtitle">
            Update quantities or edit line details before printing or marking paid.
          </p>
        </div>
        <v-btn
          size="small"
          variant="tonal"
          color="accent"
          @click="$store.commit('calculateTogoTotal')"
        >
          <v-icon start>mdi-reload</v-icon>
          Refresh totals
        </v-btn>
      </div>

      <v-divider></v-divider>

      <div class="pos-dialog__content">
        <div v-if="!editableLines.length" class="empty-state">
          <v-icon size="36" color="accent">mdi-cart-outline</v-icon>
          <p>No items added yet.</p>
        </div>

        <div
          v-for="line in editableLines"
          :key="line.lineId"
          class="item-row"
        >
          <div class="item-info">
            <span class="item-title">{{ line.name }}</span>
            <span v-if="line.note" class="item-note">
              <v-icon size="16" icon="mdi-note-text-outline" class="me-1"></v-icon>
              {{ line.note }}
            </span>
          </div>
          <div class="item-pricing">
            <span class="price">${{ displayPrice(line).toFixed(2) }}</span>
            <div class="quantity-controls">
              <v-btn
                icon
                variant="text"
                density="comfortable"
                color="accent"
                @click="decrementLine(line)"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <span class="quantity">{{ line.quantity }}</span>
              <v-btn
                icon
                variant="text"
                density="comfortable"
                color="accent"
                @click="incrementLine(line)"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                density="comfortable"
                color="accent"
                @click="openEditDialog"
                :title="'Open edit dialog'"
              >
                <v-icon>mdi-square-edit-outline</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <v-divider></v-divider>

      <div class="pos-dialog__actions">
        <div class="totals">
          <span class="totals-label">Estimated total</span>
          <span class="totals-value">
            ${{ totalWithTax.toFixed(2) }}
          </span>
        </div>
        <div class="actions-right">
          <v-btn variant="outlined" color="accent" @click="printTogoReceipt" :disabled="!editableLines.length">
            <v-icon start>mdi-printer</v-icon>
            Print
          </v-btn>
          <v-btn variant="flat" color="success" @click="markPaid" :disabled="!editableLines.length">
            <v-icon start>mdi-cash-check</v-icon>
            Paid
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>


<script>
export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'edit'],
  computed: {
    dialogOpen: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    editableLines() {
      return (this.$store.state.togoLines || []).map(line => ({
        lineId: line.lineId,
        name: line.itemName,
        quantity: Number(line.quantity ?? 0),
        note: line.note || '',
        basePrice: Number(line.basePrice ?? 0),
        extraPrice: Number(line.extraPrice ?? 0)
      }))
    },
    subtotal() {
      return this.editableLines.reduce((sum, line) => sum + this.displayPrice(line) * line.quantity, 0)
    },
    totalWithTax() {
      const explicit = Number(this.$store.state.totalTogoPrice || 0)
      if (explicit > 0) return explicit
      return this.subtotal * this.$store.state.TAX_RATE
    }
  },
  methods: {
    displayPrice(line) {
      return Number(line.basePrice || 0) + Number(line.extraPrice || 0)
    },
    incrementLine(line) {
      this.$store.commit('updateTogoLine', {
        lineId: line.lineId,
        quantity: line.quantity + 1
      })
    },
    decrementLine(line) {
      this.$store.commit('updateTogoLine', {
        lineId: line.lineId,
        quantity: line.quantity - 1
      })
    },
    openEditDialog() {
      this.dialogOpen = false
      this.$emit('edit')
    },
    markPaid() {
      this.$store.commit('togoPaid')
      this.dialogOpen = false
    },
    printTogoReceipt() {
      this.$store.commit('calculateTogoTotal')
      const store = this.$store.state
      const items = this.editableLines.map(line => ({
        name: line.name,
        quantity: Number(line.quantity ?? 0),
        price: this.displayPrice(line),
        note: line.note
      }))

      if (!items.length) {
        console.warn('No items selected for to-go receipt')
        return
      }

      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const total = parseFloat(store.totalTogoPrice || (subtotal * store.TAX_RATE).toFixed(2))
      const taxAmount = parseFloat((total - subtotal).toFixed(2))

      const escapeHtml = (str = '') => String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

      const rows = items.map(item => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td class="qty">${item.quantity}</td>
          <td class="price">$${item.price.toFixed(2)}</td>
          <td class="price">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
        ${item.note ? `<tr class="note-row"><td colspan="4"><strong>Note:</strong> ${escapeHtml(item.note)}</td></tr>` : ''}
      `).join('')

      const receiptHtml = '<html>' +
        '<head>' +
          '<title>Receipt - To-Go Order</title>' +
          '<style>' +
            "body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #333; }" +
            'h1 { text-align: center; margin-bottom: 4px; letter-spacing: 1px; }' +
            'h2 { text-align: center; margin-top: 0; font-weight: normal; font-size: 16px; }' +
            'table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px; table-layout: fixed; }' +
            'th, td { padding: 8px 6px; border-bottom: 1px solid #ddd; }' +
            'th { background: #f5f5f5; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }' +
            'th.item, td.item { text-align: left; width: 50%; }' +
            'th.qty, td.qty { text-align: center; width: 10%; }' +
            'th.price, td.price { text-align: right; width: 20%; }' +
            '.totals { margin-top: 16px; font-size: 14px; }' +
            '.totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }' +
            '.totals div strong { font-size: 16px; }' +
            '.sub-header { text-align: center; margin-top: 4px; margin-bottom: 8px; font-size: 14px; color: #666; font-style: italic; white-space: pre-line; }' +
            '.footer { margin-top: 24px; text-align: center; font-size: 12px; color: #777; }' +
            '.gratuity { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #ccc; }' +
            '.gratuity-title { text-align: center; font-size: 12px; color: #666; margin-bottom: 8px; }' +
            '.gratuity-options { display: flex; justify-content: space-around; font-size: 11px; }' +
            '.gratuity-option { text-align: center; }' +
            '.gratuity-option .percent { font-weight: bold; }' +
            '.gratuity-option .amount { color: #666; }' +
            '.note-row td { padding: 6px 6px 10px; font-style: italic; color: #4a4a4a; background: #f9fbff; border-bottom: 1px solid #ddd; }' +
          '</style>' +
        '</head>' +
        '<body>' +
          `<h1>${(this.$store.state.receiptSettings || {}).headerText || 'China Buffet'}</h1>` +
          ((this.$store.state.receiptSettings || {}).subHeaderText ? `<div class="sub-header">${(this.$store.state.receiptSettings || {}).subHeaderText}</div>` : '') +
          '<h2>To-Go Order</h2>' +
          (((this.$store.state.receiptSettings || {}).showPrintTime !== false) ? `<div style="text-align: center; margin-top: 8px; font-size: 11px; color: #999;">${new Date().toLocaleString()}</div>` : '') +
          '<table>' +
            '<thead>' +
              '<tr>' +
                '<th class="item">Item</th>' +
                '<th class="qty">Qty</th>' +
                '<th class="price">Price</th>' +
                '<th class="price">Total</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              rows +
            '</tbody>' +
          '</table>' +
          '<div class="totals">' +
            `<div><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>` +
            `<div><span>Tax</span><span>$${taxAmount.toFixed(2)}</span></div>` +
            `<div><strong>Total</strong><strong>$${total.toFixed(2)}</strong></div>` +
          '</div>' +
          `<div class="footer">${(this.$store.state.receiptSettings || {}).thankYouText || 'Thank you for your order!'}</div>` +
          (((this.$store.state.receiptSettings || {}).showGratuity !== false) ? (() => {
            const receiptSettings = this.$store.state.receiptSettings || {}
            const gratuityPercentages = Array.isArray(receiptSettings.gratuityPercentages) && receiptSettings.gratuityPercentages.length > 0
                ? receiptSettings.gratuityPercentages
                : [10, 15, 20]
            const gratuityOnPreTax = receiptSettings.gratuityOnPreTax === true
            const gratuityBaseAmount = gratuityOnPreTax ? subtotal : total
            return `
              <div class="gratuity">
                <div class="gratuity-title">Gratuity Suggestions</div>
                <div class="gratuity-options">
                  ${gratuityPercentages.map(percent => `
                    <div class="gratuity-option">
                      <div class="percent">${percent}%</div>
                      <div class="amount">$${(gratuityBaseAmount * percent / 100).toFixed(2)}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `
          })() : '') +
        '</body>' +
        '</html>'

      const printWindow = window.open('', '_blank', 'width=600,height=800')
      if (!printWindow) {
        console.error('Failed to open print window')
        return
      }
      printWindow.document.write(receiptHtml)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }
}
</script>

<style scoped>
.pos-dialog {
  border-radius: 26px;
  box-shadow: 0 24px 42px rgba(15, 25, 35, 0.2);
}

.pos-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 24px;
}

.dialog-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.dialog-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(31, 39, 51, 0.6);
}

.pos-dialog__content {
  max-height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.empty-state {
  padding: 36px 24px;
  text-align: center;
  color: rgba(31, 39, 51, 0.65);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(31, 39, 51, 0.08);
  align-items: center;
}

.item-row:last-child {
  border-bottom: none;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-title {
  font-weight: 600;
  font-size: 17px;
}

.item-note {
  font-size: 13px;
  color: rgba(31, 39, 51, 0.65);
  display: inline-flex;
  align-items: center;
}

.item-pricing {
  display: flex;
  align-items: center;
  gap: 20px;
}

.price {
  font-size: 16px;
  font-weight: 700;
}

.quantity-controls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.quantity {
  font-size: 16px;
  font-weight: 600;
  width: 24px;
  text-align: center;
}

.pos-dialog__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  gap: 12px;
}

.totals {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.totals-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: rgba(31, 39, 51, 0.6);
}

.totals-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--v-theme-primary);
}

.actions-right {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 520px) {
  .item-row {
    grid-template-columns: 1fr;
  }
  .item-pricing {
    justify-content: space-between;
  }
  .pos-dialog__actions {
    flex-direction: column;
    align-items: stretch;
  }
  .actions-right {
    width: 100%;
    justify-content: stretch;
  }
  .actions-right .v-btn {
    flex: 1 1 auto;
  }
}
</style>