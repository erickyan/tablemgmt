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
        :disabled="!hasActivity"
        @click="printReceipt"
      >
        <v-icon start>mdi-printer</v-icon>
        {{ getTranslatedLabel('Print Receipt') }}
      </v-btn>
    </div>
  </div>
</template>

<script>
import { DRINK_OPTIONS, getDrinkLabel, isWater } from '../../utils/drinkOptions.js'
import { translate } from '../../utils/translations.js'
import { toChineseNumeral } from '../../utils/chineseNumerals.js'

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
      return this.subtotal * this.$store.state.TAX_RATE
    },
    hasActivity() {
      return this.lineItems.length > 0
    },
    taxAmount() {
      return this.totalWithTax - this.subtotal
    },
    isChinese() {
      return this.$store.state.language === 'zh'
    }
  },
  methods: {
    getTranslatedLabel(label) {
      return translate(label, this.isChinese)
    },
    async printReceipt() {
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
        // For receipts, use English-only label (no translation)
        const label = getDrinkLabel(code) // getDrinkLabel already returns English-only
        const unitPrice = isWater(code) ? this.pricing.water : this.pricing.drink
        addLine(label, qtyNum, unitPrice)
      })

      const subtotal = totals.reduce((sum, value) => sum + value, 0)
      const totalWithTax = subtotal * this.$store.state.TAX_RATE
      const taxAmount = totalWithTax - subtotal

      // Increment ticket counter and save immediately
      this.$store.commit('incrementTicketCount')
      const ticketCount = this.$store.state.ticketCount
      const ticketCountChinese = toChineseNumeral(ticketCount)
      const showTicketCount = this.$store.state.receiptSettings?.showTicketCount !== false
      
      // Immediately save app state to ensure ticket count persists
      if (this.$store.state.useFirebase && this.$store.state.firebaseInitialized && this.$store.state.authUser) {
        try {
          const state = this.$store.state
          const snapshot = {
            isDinner: state.isDinner,
            tableNum: state.tableNum,
            catID: state.catID,
            TAX_RATE: state.TAX_RATE,
            ADULTPRICE: state.ADULTPRICE,
            BIGKIDPRICE: state.BIGKIDPRICE,
            SMALLKIDPRICE: state.SMALLKIDPRICE,
            ADULTDINNERPRICE: state.ADULTDINNERPRICE,
            BIGKIDDINNERPRICE: state.BIGKIDDINNERPRICE,
            SMALLKIDDINNERPRICE: state.SMALLKIDDINNERPRICE,
            WATERPRICE: state.WATERPRICE,
            DRINKPRICE: state.DRINKPRICE,
            ticketCount: state.ticketCount,
            receiptSettings: JSON.parse(JSON.stringify(state.receiptSettings || { showTicketCount: true })),
            togoLines: JSON.parse(JSON.stringify(state.togoLines)),
            togoCustomizations: JSON.parse(JSON.stringify(state.togoCustomizations || {})),
            totalTogoPrice: state.totalTogoPrice,
            tableOrder: state.tableOrder,
          }
          snapshot.timestamp = new Date().toISOString()
          await this.$store.dispatch('saveAppStateImmediately', snapshot)
        } catch (error) {
          console.error('[Firestore] Failed to save ticket count:', error)
        }
      }
      
      const receiptSettings = this.$store.state.receiptSettings || {}
      const headerText = receiptSettings.headerText || 'China Buffet'
      const subHeaderText = receiptSettings.subHeaderText || ''
      const footerText = receiptSettings.footerText || 'Thank you for dining with us!'
      const showPrintTime = receiptSettings.showPrintTime !== false
      const showGratuity = receiptSettings.showGratuity !== false
      const gratuityPercentages = Array.isArray(receiptSettings.gratuityPercentages) && receiptSettings.gratuityPercentages.length > 0
          ? receiptSettings.gratuityPercentages
          : [10, 15, 20]
      const gratuityOnPreTax = receiptSettings.gratuityOnPreTax === true
      const gratuityBaseAmount = gratuityOnPreTax ? subtotal : totalWithTax
      
      const receiptHtml = '<html>' +
        '<head>' +
          '<title>Cashier Receipt</title>' +
          '<style>' +
            "body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 24px; color: #333; position: relative; }" +
            (showTicketCount ? '.ticket-count { position: absolute; top: 24px; right: 24px; font-size: 18px; font-weight: bold; color: #333; }' : '') +
            'h1 { text-align: center; margin-bottom: 4px; letter-spacing: 1px; }' +
            '.sub-header { text-align: center; margin-top: 4px; margin-bottom: 8px; font-size: 14px; color: #666; font-style: italic; white-space: pre-line; }' +
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
            '.footer { margin-top: 24px; text-align: center; font-size: 12px; color: #777; }' +
            '.gratuity { margin-top: 20px; padding-top: 16px; border-top: 1px dashed #ccc; }' +
            '.gratuity-title { text-align: center; font-size: 12px; color: #666; margin-bottom: 8px; }' +
            '.gratuity-options { display: flex; justify-content: space-around; font-size: 11px; }' +
            '.gratuity-option { text-align: center; }' +
            '.gratuity-option .percent { font-weight: bold; }' +
            '.gratuity-option .amount { color: #666; }' +
          '</style>' +
        '</head>' +
        '<body>' +
          (showTicketCount ? `<div class="ticket-count">${ticketCountChinese}</div>` : '') +
          `<h1>${headerText}</h1>` +
          (subHeaderText ? `<div class="sub-header">${subHeaderText}</div>` : '') +
          `<h2>${this.isDinner ? 'Dinner' : 'Lunch'} Receipt</h2>` +
          (showPrintTime ? `<div style="text-align: center; margin-top: 8px; font-size: 11px; color: #999;">${new Date().toLocaleString()}</div>` : '') +
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
              (lines.length ? lines
                .map(line => `
                  <tr>
                    <td class="item">${line.label}</td>
                    <td class="qty">${line.qty}</td>
                    <td class="price">$${line.unitPrice.toFixed(2)}</td>
                    <td class="price">$${line.total.toFixed(2)}</td>
                  </tr>
                `).join('') : '<tr><td colspan="4">No items</td></tr>') +
            '</tbody>' +
          '</table>' +
          '<div class="totals">' +
            `<div><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>` +
            `<div><span>Tax</span><span>$${taxAmount.toFixed(2)}</span></div>` +
            `<div><strong>Total</strong><strong>$${totalWithTax.toFixed(2)}</strong></div>` +
          '</div>' +
          (footerText ? `<div class="footer">${footerText}</div>` : '') +
          (showGratuity ? `
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
          ` : '') +
        '</body>' +
        '</html>'

      // Use the same print method as floor plan (openPrintDocument)
      this.openPrintDocument(receiptHtml)
      
      // Process payment: add sales to revenue and reset form
      this.$store.commit('processCashierPayment')
    },
    openPrintDocument(html) {
      // Use the same print method as floor plan - try popup first, then iframe
      try {
        const popup = window.open('', '_blank', 'width=600,height=800')
        if (popup && popup.document && !popup.closed) {
          // Extract body and head content for popup
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
          const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
          
          if (bodyMatch && headMatch) {
            const cleanHtml = `<!DOCTYPE html><html>${headMatch[0]}${bodyMatch[0]}</html>`
            popup.document.open()
            popup.document.write(cleanHtml)
            popup.document.close()
          } else {
            popup.document.open()
            popup.document.write(html)
            popup.document.close()
          }
          
          popup.focus()
          const cleanup = () => {
            popup.removeEventListener('afterprint', cleanup)
            try {
              if (popup && !popup.closed) {
                popup.close()
              }
            } catch (closeError) {
              console.warn('Print window already closed.', closeError)
            }
          }
          popup.addEventListener('afterprint', cleanup)
          // Small delay to ensure content is loaded
          setTimeout(() => {
            try {
              popup.print()
            } catch (printError) {
              console.warn('Print failed on popup, using iframe fallback', printError)
              popup.close()
              this.printWithIframe(html)
            }
          }, 100)
          return
        }
      } catch (error) {
        console.warn('Popup print blocked, falling back to iframe strategy.', error)
      }

      // Fallback to iframe method
      this.printWithIframe(html)
    },
    printWithIframe(html) {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.style.opacity = '0'
      iframe.style.pointerEvents = 'none'
      
      // Use srcdoc attribute (modern approach, no document.write warning)
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
      
      if (bodyMatch && headMatch) {
        const cleanHtml = `<!DOCTYPE html><html>${headMatch[0]}${bodyMatch[0]}</html>`
        iframe.srcdoc = cleanHtml
      } else {
        iframe.srcdoc = html
      }
      
      document.body.appendChild(iframe)

      const frameWindow = iframe.contentWindow || iframe.contentDocument
      let printed = false
      let fallbackTimeout = null
      
      const cleanup = () => {
        if (fallbackTimeout) {
          clearTimeout(fallbackTimeout)
          fallbackTimeout = null
        }
        if (iframe && iframe.parentNode) {
          try {
            iframe.parentNode.removeChild(iframe)
          } catch (e) {
            // Iframe may already be removed
          }
        }
      }
      
      const executePrint = () => {
        if (printed) return
        printed = true
        if (fallbackTimeout) {
          clearTimeout(fallbackTimeout)
          fallbackTimeout = null
        }
        try {
          if (frameWindow && frameWindow.print) {
            frameWindow.focus()
            frameWindow.print()
          }
        } catch (e) {
          console.error('Iframe print execution failed:', e)
        }
        // Cleanup after a delay
        setTimeout(cleanup, 2000)
      }
      
      // Try printing when iframe loads
      iframe.onload = () => {
        executePrint()
      }
      
      // Fallback timeout in case onload doesn't fire
      fallbackTimeout = setTimeout(() => {
        if (!printed) {
          executePrint()
        }
      }, 500)
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

/* Hide print button in side panel on mobile - it's moved to top of main view */
@media (max-width: 480px) and (orientation: portrait) {
  .desktop-print-btn {
    display: none;
  }
}
</style>

