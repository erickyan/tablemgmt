<template>
  <v-container class="cashier-view pa-4">
    <v-card class="mx-auto" max-width="520">
      <v-card-title class="d-flex align-center justify-space-between">
        Cashier Receipt
        <v-chip color="primary" variant="tonal">Total ${{ totalWithTax }}</v-chip>
      </v-card-title>
      <v-card-subtitle>Quick receipt builder for walk-in customers</v-card-subtitle>

      <v-card-text>
        <div class="mb-4">
          <div class="text-subtitle-2 mb-2">Price Mode</div>
          <v-btn-toggle
            v-model="mode"
            density="comfortable"
            variant="outlined"
            mandatory
          >
            <v-btn value="lunch">
              <v-icon start size="18">mdi-white-balance-sunny</v-icon>
              Lunch
            </v-btn>
            <v-btn value="dinner">
              <v-icon start size="18">mdi-weather-night</v-icon>
              Dinner
            </v-btn>
          </v-btn-toggle>
        </div>

        <v-divider class="my-4"></v-divider>

        <section>
          <div class="text-subtitle-2 mb-2">Buffet Guests</div>
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
          <div class="text-subtitle-2 mb-2">Drinks</div>
          <v-row dense>
            <v-col
              v-for="drink in drinkOptions"
              :key="drink.code"
              cols="6"
              class="py-2"
            >
              <v-card variant="outlined" class="pa-2 d-flex align-center">
                <div class="flex-grow-1">{{ drink.label }}</div>
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

      <v-card-actions class="justify-end">
        <v-btn variant="outlined" color="secondary" @click="clearForm">
          Clear
        </v-btn>
        <v-btn color="primary" @click="printReceipt" :disabled="!hasActivity">
          <v-icon start>mdi-printer</v-icon>
          Print Receipt
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
export default {
  name: 'CashierView',
  data: () => ({
    mode: 'lunch',
    buffetCounts: {
      adult: 0,
      bigKid: 0,
      smallKid: 0,
    },
    drinkCounts: {
      WTER: 0,
      COKE: 0,
      SPRT: 0,
      STEA: 0,
      DRPP: 0,
      DIET: 0,
      UTEA: 0,
      LMND: 0,
      HALF: 0,
      COFE: 0,
      HTEA: 0,
    },
    buffetOptions: [
      { key: 'adult', label: 'Adult Buffet' },
      { key: 'bigKid', label: 'Big Kid Buffet (6-9)' },
      { key: 'smallKid', label: 'Small Kid Buffet (2-5)' },
    ],
    drinkOptions: [
      { code: 'WTER', label: 'Water', type: 'water' },
      { code: 'COKE', label: 'Coke', type: 'drink' },
      { code: 'SPRT', label: 'Sprite', type: 'drink' },
      { code: 'STEA', label: 'Sweet Tea', type: 'drink' },
      { code: 'DRPP', label: 'Dr Pepper', type: 'drink' },
      { code: 'DIET', label: 'Diet Coke', type: 'drink' },
      { code: 'UTEA', label: 'Unsweet Tea', type: 'drink' },
      { code: 'LMND', label: 'Lemonade', type: 'drink' },
      { code: 'HALF', label: 'Half & Half', type: 'drink' },
      { code: 'COFE', label: 'Coffee', type: 'drink' },
      { code: 'HTEA', label: 'Hot Tea', type: 'drink' },
    ],
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
      },
    },
  },
  mounted() {
    this.mode = this.$store.state.isDinner ? 'dinner' : 'lunch'
  },
  methods: {
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
    },
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

      addLine('Adult Buffet', Number(this.buffetCounts.adult || 0), this.pricing.adult)
      addLine('Big Kid Buffet', Number(this.buffetCounts.bigKid || 0), this.pricing.bigKid)
      addLine('Small Kid Buffet', Number(this.buffetCounts.smallKid || 0), this.pricing.smallKid)

      this.drinkOptions.forEach(option => {
        const qty = Number(this.drinkCounts[option.code] || 0)
        if (!qty) return
        const unitPrice = option.type === 'water' ? this.pricing.water : this.pricing.drink
        addLine(option.label, qty, unitPrice)
      })

      const subtotal = totals.reduce((sum, value) => sum + value, 0)
      const totalWithTax = subtotal * this.pricing.taxRate
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
            <h2>${this.mode === 'dinner' ? 'Dinner' : 'Lunch'} Receipt</h2>
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
</style>
