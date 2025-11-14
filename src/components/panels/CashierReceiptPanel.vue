<template>
  <div class="panel">
    <div class="panel__header">
      <div>
        <h3 class="panel__title">Cashier Receipt</h3>
        <p class="panel__subtitle">
          {{ isDinner ? 'Dinner pricing' : 'Lunch pricing' }}
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
            <div class="line-item__label">{{ item.label }}</div>
            <div class="line-item__meta">Qty {{ item.qty }}</div>
          </div>
          <div class="line-item__amount">
            ${{ item.total.toFixed(2) }}
          </div>
        </div>
      </div>
      <div class="line-items line-items--empty" v-else>
        <v-icon size="28" color="accent">mdi-receipt-outline</v-icon>
        <p>No items added yet.</p>
      </div>
    </div>

    <div class="panel__summary">
      <div class="summary-row">
        <span>Subtotal</span>
        <strong>${{ subtotal.toFixed(2) }}</strong>
      </div>
      <div class="summary-row">
        <span>Total (incl. tax)</span>
        <strong class="summary-accent">
          ${{ totalWithTax.toFixed(2) }}
        </strong>
      </div>
    </div>

    <div class="panel__actions">
      <v-btn
        block
        variant="flat"
        color="accent"
        :disabled="!hasActivity"
        @click="printReceipt"
      >
        <v-icon start>mdi-printer</v-icon>
        Print Receipt
      </v-btn>
    </div>
  </div>
</template>

<script>
import { DRINK_OPTIONS, getDrinkLabel, isWater } from '../../utils/drinkOptions.js'

export default {
  name: 'CashierReceiptPanel',
  computed: {
    cashierForm() {
      return this.$store.state.cashierForm || {
        mode: 'lunch',
        buffetCounts: { adult: 0, bigKid: 0, smallKid: 0 },
        drinkCounts: {}
      }
    },
    isDinner() {
      return this.cashierForm.mode === 'dinner'
    },
    pricing() {
      const state = this.$store.state
      return {
        adult: this.isDinner ? state.ADULTDINNERPRICE : state.ADULTPRICE,
        bigKid: this.isDinner ? state.BIGKIDDINNERPRICE : state.BIGKIDPRICE,
        smlKid: this.isDinner ? state.SMALLKIDDINNERPRICE : state.SMALLKIDPRICE,
        drink: state.DRINKPRICE,
        water: state.WATERPRICE
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
      return this.subtotal * this.$store.state.TAX_RATE
    },
    hasActivity() {
      return this.lineItems.length > 0
    },
    taxAmount() {
      return this.totalWithTax - this.subtotal
    }
  },
  methods: {
    printReceipt() {
      if (!this.hasActivity) {
        return
      }

      const lines = []
      const totals = []
      const addLine = (label, qty, unitPrice) => {
        if (!qty) return
        const total = qty * unitPrice
        lines.push({ label, qty, unitPrice, total })
        totals.push(total)
      }

      const buffetCounts = this.cashierForm.buffetCounts || {}
      addLine('Adult Buffet', Number(buffetCounts.adult || 0), this.pricing.adult)
      addLine('Big Kid Buffet', Number(buffetCounts.bigKid || 0), this.pricing.bigKid)
      addLine('Small Kid Buffet', Number(buffetCounts.smallKid || 0), this.pricing.smlKid)

      const drinkCounts = this.cashierForm.drinkCounts || {}
      
      Object.entries(drinkCounts).forEach(([code, qty]) => {
        const qtyNum = Number(qty || 0)
        if (!qtyNum) return
        const label = getDrinkLabel(code)
        const unitPrice = isWater(code) ? this.pricing.water : this.pricing.drink
        addLine(label, qtyNum, unitPrice)
      })

      const subtotal = totals.reduce((sum, value) => sum + value, 0)
      const totalWithTax = subtotal * this.$store.state.TAX_RATE
      const taxAmount = totalWithTax - subtotal

      const receiptHtml = `
        <html>
          <head>
            <title>Cashier Receipt</title>
            <style>
              body { font-family: 'Consolas', 'Courier New', monospace; padding: 24px; color: #333; font-size: 12px; }
              h1 { text-align: center; margin-bottom: 4px; font-size: 20px; }
              h2 { text-align: center; margin-top: 0; font-weight: normal; font-size: 16px; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { padding: 4px 6px; border-bottom: 1px dashed #ccc; text-align: left; }
              th { font-weight: bold; }
              td.qty { text-align: center; width: 40px; }
              td.price { text-align: right; width: 60px; }
              .totals { margin-top: 16px; border-top: 1px dashed #ccc; padding-top: 8px; }
              .totals div { display: flex; justify-content: space-between; margin-bottom: 4px; }
              .totals strong { font-size: 14px; }
              .footer { margin-top: 24px; text-align: center; font-size: 11px; }
            </style>
          </head>
          <body>
            <h1>China Buffet</h1>
            <h2>${this.isDinner ? 'Dinner' : 'Lunch'} Receipt</h2>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="qty">Qty</th>
                  <th class="price">Price</th>
                  <th class="price">Total</th>
                </tr>
              </thead>
              <tbody>
                ${lines.length ? lines
                  .map(line => `
                    <tr>
                      <td>${line.label}</td>
                      <td class="qty">${line.qty}</td>
                      <td class="price">$${line.unitPrice.toFixed(2)}</td>
                      <td class="price">$${line.total.toFixed(2)}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="4" style="text-align:center;">No items</td></tr>'}
              </tbody>
            </table>
            <div class="totals">
              <div><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
              <div><span>Tax</span><span>$${taxAmount.toFixed(2)}</span></div>
              <div><strong>Total</strong><strong>$${totalWithTax.toFixed(2)}</strong></div>
            </div>
            <div class="footer">Thank you for dining with us!</div>
          </body>
        </html>
      `

      const printWindow = window.open('', '_blank', 'width=600,height=800')
      if (!printWindow) {
        alert('Please allow pop-ups for printing.')
        return
      }
      printWindow.document.open()
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
</style>

