<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="760"
    transition="dialog-bottom-transition"
  >
    <v-card class="pos-dialog">
      <div class="pos-dialog__header">
        <div class="header-info">
          <div class="header-title-row">
            <h3 class="dialog-title">{{ getTableDisplayName() }}</h3>
            <v-chip
              size="small"
              variant="tonal"
              color="accent"
            >
              {{ getTranslatedLabel(pricingModeWasDinner ? 'Dinner pricing' : 'Lunch pricing') }}
            </v-chip>
            <span class="meta-time" v-if="table.sitDownTime">
              <v-icon size="16" icon="mdi-clock-outline" class="me-1"></v-icon>
              {{ getTranslatedLabel('Sat') }} {{ table.sitDownTime }}
            </span>
          </div>
        </div>
        <div class="header-controls">
          <v-btn
            variant="outlined"
            color="accent"
            class="header-btn"
            @click="clearTable"
          >
            <v-icon start>mdi-trash-can-outline</v-icon>
            {{ getTranslatedLabel('Clear') }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="accent"
            class="header-btn"
            @click="printReceipt"
          >
            <v-icon start>mdi-printer</v-icon>
            {{ getTranslatedLabel('Print') }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="accent"
            class="header-btn"
            @click="$store.commit('updateTableGoodPpl', !table.goodPpl)"
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
            @click="payAndClose"
          >
            <v-icon start>mdi-cash-check</v-icon>
            {{ getTranslatedLabel('Paid') }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="accent"
            class="header-btn"
            @click="updateMenu"
          >
            <v-icon start>mdi-check</v-icon>
            {{ getTranslatedLabel('Update') }}
          </v-btn>
        </div>
      </div>

      <div class="pos-dialog__content">
        <section class="dialog-section dialog-section--guests">
          <header class="section-header">
             <h4>{{ getTranslatedLabel('Buffet guests') }}</h4>
             <span class="section-note">{{ getTranslatedLabel('Tap + or − to adjust counts.') }}</span>
          </header>
          <div class="counter-grid">
            <div class="counter-card">
              <div class="counter-heading">
                <span class="counter-label">Adult</span>
                 <v-chip
                   size="x-small"
                   color="accent"
                   variant="outlined"
                 >
                  ${{ pricing.adult.toFixed(2) }}
                </v-chip>
              </div>
              <div class="counter-value">
                <span>{{ table.adult }}</span>
                <div class="counter-actions">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="adjustGuest('adult', -1)"
                    :disabled="table.adult <= 0"
                  >
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="adjustGuest('adult', 1)"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
            <div class="counter-card">
              <div class="counter-heading">
                <span class="counter-label">{{ getTranslatedLabel('Kid (6-9)') }}</span>
                 <v-chip
                   size="x-small"
                   color="accent"
                   variant="outlined"
                 >
                  ${{ pricing.bigKid.toFixed(2) }}
                </v-chip>
              </div>
              <div class="counter-value">
                <span>{{ table.bigKid }}</span>
                <div class="counter-actions">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="adjustGuest('bigKid', -1)"
                    :disabled="table.bigKid <= 0"
                  >
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="adjustGuest('bigKid', 1)"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
            <div class="counter-card">
              <div class="counter-heading">
                <span class="counter-label">{{ getTranslatedLabel('Kid (2-5)') }}</span>
                 <v-chip
                   size="x-small"
                   color="accent"
                   variant="outlined"
                 >
                  ${{ pricing.smlKid.toFixed(2) }}
                </v-chip>
              </div>
              <div class="counter-value">
                <span>{{ table.smlKid }}</span>
                <div class="counter-actions">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="adjustGuest('smlKid', -1)"
                    :disabled="table.smlKid <= 0"
                  >
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="adjustGuest('smlKid', 1)"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="dialog-section dialog-section--drinks">
          <header class="section-header">
            <h4>{{ getTranslatedLabel('Drinks') }}</h4>
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
              @click="addDrinks(option.code)"
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

        <section class="dialog-section">
          <header class="section-header">
            <h4>Summary</h4>
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
    </v-card>
  </v-dialog>
</template>


<script>
import { DRINK_OPTIONS, getDrinkLabel } from '../utils/drinkOptions.js'
import { translate } from '../utils/translations.js'

export default {
    props: {
        modelValue: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue'],
    data: () => ({
        drinkOptions: DRINK_OPTIONS
    }),
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
            return this.$store.state.tableNum || 0
        },
        table() {
            return this.$store.state.tables[this.tableIndex] || {}
        },
        tableNumber() {
            return this.tableIndex + 1
        },
        guestCount() {
            return Number(this.table.adult || 0) + Number(this.table.bigKid || 0) + Number(this.table.smlKid || 0)
        },
        pricingModeWasDinner() {
            // If table has a stored pricing mode, use it
            if (this.table.pricingModeDinner !== undefined) {
                return !!this.table.pricingModeDinner
            }
            // For occupied or printed tables without stored mode, infer from stored price
            // This handles tables that were calculated before pricingModeDinner was added
            // A table is printed if it has a totalPrice > 0 but is not occupied
            const isOccupied = this.table.occupied
            const isPrinted = !isOccupied && this.table.totalPrice && parseFloat(this.table.totalPrice) > 0
            const hasTimeStamp = this.table.time && this.table.time > 0
            const isOccupiedOrPrinted = isOccupied || isPrinted || hasTimeStamp
            if (isOccupiedOrPrinted && this.table.totalPrice && parseFloat(this.table.totalPrice) > 0) {
                const state = this.$store.state
                const adultCount = parseInt(this.table.adult) || 0
                const bigKidCount = parseInt(this.table.bigKid) || 0
                const smlKidCount = parseInt(this.table.smlKid) || 0
                const drinkPrice = parseFloat(this.table.drinkPrice) || 0
                
                // Calculate what price would be in dinner mode
                const dinnerSubtotal = drinkPrice + 
                  (adultCount * state.ADULTDINNERPRICE) + 
                  (bigKidCount * state.BIGKIDDINNERPRICE) + 
                  (smlKidCount * state.SMALLKIDDINNERPRICE)
                const dinnerTotal = parseFloat((dinnerSubtotal * state.TAX_RATE).toFixed(2))
                
                // Calculate what price would be in lunch mode
                const lunchSubtotal = drinkPrice + 
                  (adultCount * state.ADULTPRICE) + 
                  (bigKidCount * state.BIGKIDPRICE) + 
                  (smlKidCount * state.SMALLKIDPRICE)
                const lunchTotal = parseFloat((lunchSubtotal * state.TAX_RATE).toFixed(2))
                
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
            return this.$store.state.isDinner
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
            const mutations = {
                adult: delta > 0 ? 'increaseAdult' : 'decreaseAdult',
                bigKid: delta > 0 ? 'increaseBigKid' : 'decreaseBidKid',
                smlKid: delta > 0 ? 'increaseSmlKid' : 'decreaseSmlKid'
            }
            const mutation = mutations[type]
            if (mutation) {
                this.$store.commit(mutation)
                this.notifyPanel('check', { tab: 'check' })
            }
        },
        addDrinks(code) {
            this.$store.commit('addDrink', code)
            this.notifyPanel('drinks', { tab: 'check' })
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
            return this.$store.state.language === 'zh'
        },
        openPrintDocument(html) {
            // Use the same print method as togo orders - try popup first, then iframe
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
            // Extract body content from full HTML string
            const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
            const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)
            
            if (bodyMatch && headMatch) {
                // Build HTML with just head and body content
                const cleanHtml = `<!DOCTYPE html><html>${headMatch[0]}${bodyMatch[0]}</html>`
                iframe.srcdoc = cleanHtml
            } else {
                // Fallback: use full HTML
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
                    frameWindow.focus()
                    // Use requestAnimationFrame for better performance
                    requestAnimationFrame(() => {
                        try {
                            frameWindow.print()
                            // Cleanup after print dialog appears (shorter timeout)
                            setTimeout(cleanup, 300)
                        } catch (printError) {
                            console.error('Print failed on iframe:', printError)
                            cleanup()
                        }
                    })
                } catch (error) {
                    console.error('Error in print:', error)
                    cleanup()
                }
            }
            
            // Wait for iframe to load
            iframe.onload = executePrint
            
            // Fallback timeout in case onload doesn't fire (shorter timeout)
            fallbackTimeout = setTimeout(() => {
                if (!printed && iframe && iframe.parentNode) {
                    const frameDoc = iframe.contentDocument
                    if (frameDoc && (frameDoc.readyState === 'complete' || frameDoc.readyState === 'interactive')) {
                        executePrint()
                    } else {
                        // If still not ready, cleanup
                        cleanup()
                    }
                } else if (printed) {
                    // Already printed, just clear the timeout
                    if (fallbackTimeout) {
                        clearTimeout(fallbackTimeout)
                        fallbackTimeout = null
                    }
                }
            }, 200) // Reduced from 500ms to 200ms
        },
        clearTable() {
            this.$store.commit('clearEverything')
            this.notifyPanel('summary', { tab: 'check' })
        },
        updateMenu() {
            this.$store.commit('calculateTotal')
            if (this.tableHasActivity(this.tableIndex)) {
                this.$store.commit('getTimestamp', this.tableIndex)
                if (!this.table.occupied) {
                    this.$store.commit('setTableOccupied', { index: this.tableIndex, value: true })
                }
                this.notifyPanel('check', { tab: 'check' })
            } else {
                this.$store.commit('setTableSitDownTime', { index: this.tableIndex, value: '' })
                this.$store.commit('setTableOccupied', { index: this.tableIndex, value: false })
                this.notifyPanel('summary', { tab: 'check' })
            }
            this.dialogOpen = false
        },
        printReceipt() {
            this.$store.commit('calculateTotal')
            // Ensure pricingModeDinner is stored when printing, even if table was already occupied
            const table = this.table
            const isOccupied = table.occupied
            const isPrinted = !isOccupied && table.totalPrice && parseFloat(table.totalPrice) > 0
            const hasTimeStamp = table.time && table.time > 0
            if (table && (isOccupied || isPrinted || hasTimeStamp) && table.pricingModeDinner === undefined) {
                // If table is occupied/printed but doesn't have pricingModeDinner, store it now
                // Use the preserved pricing mode (inferred if needed), not current mode
                table.pricingModeDinner = this.pricingModeWasDinner
                // Persist the table to save pricingModeDinner
                this.$store.commit('setTableOccupied', { index: this.tableIndex, value: table.occupied })
            }
            const store = this.$store.state
            const isDinner = this.pricingModeWasDinner // Use preserved mode for pricing
            const pricing = {
                adult: isDinner ? store.ADULTDINNERPRICE : store.ADULTPRICE,
                bigKid: isDinner ? store.BIGKIDDINNERPRICE : store.BIGKIDPRICE,
                smallKid: isDinner ? store.SMALLKIDDINNERPRICE : store.SMALLKIDPRICE,
                drink: store.DRINKPRICE,
                water: store.WATERPRICE
            }

            const lines = []
            const totals = []
            const addLine = (label, qty, unitPrice) => {
                const quantity = Number(qty || 0)
                if (quantity <= 0) return
                const total = quantity * Number(unitPrice || 0)
                lines.push({ label, qty: quantity, unitPrice: Number(unitPrice || 0), total })
                totals.push(total)
            }

            addLine('Adult Buffet', table.adult, pricing.adult)
            addLine('Kid Buffet (6-9)', table.bigKid, pricing.bigKid)
            addLine('Kid Buffet (2-5)', table.smlKid, pricing.smallKid)

            const drinkCounts = (Array.isArray(table.drinks) ? table.drinks : []).reduce((acc, code) => {
                acc[code] = (acc[code] || 0) + 1
                return acc
            }, {})

            Object.entries(drinkCounts).forEach(([code, qty]) => {
                // For receipts, use English-only labels (not translated)
                const label = this.drinkLabelEnglish(code)
                const unitPrice = code === 'WTER' ? pricing.water : pricing.drink
                addLine(label, qty, unitPrice)
            })

            const tableNumber = table?.number || this.tableNumber
            const subtotal = totals.reduce((sum, value) => sum + value, 0)
            const totalWithTax = parseFloat(table.totalPrice || 0)
            const taxAmount = totalWithTax && subtotal
                ? parseFloat((totalWithTax - subtotal).toFixed(2))
                : parseFloat((subtotal * (store.TAX_RATE - 1)).toFixed(2))

            const htmlRows = lines.map(line => `
                <tr>
                    <td>${line.label}</td>
                    <td class="qty">${line.qty}</td>
                    <td class="price">$${line.unitPrice.toFixed(2)}</td>
                    <td class="price">$${line.total.toFixed(2)}</td>
                </tr>
            `).join('')

            const receiptHtml = '<html>' +
              '<head>' +
                `<title>Receipt - Table ${tableNumber}</title>` +
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
                  '.footer { margin-top: 24px; text-align: center; font-size: 12px; color: #777; }' +
                '</style>' +
              '</head>' +
              '<body>' +
                '<h1>China Buffet</h1>' +
                `<h2>Table ${tableNumber}</h2>` +
                `<div>Server Mode: ${isDinner ? 'Dinner' : 'Lunch'}</div>` +
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
                    (htmlRows || '<tr><td colspan="4">No items</td></tr>') +
                  '</tbody>' +
                '</table>' +
                '<div class="totals">' +
                  `<div><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>` +
                  `<div><span>Tax</span><span>$${taxAmount.toFixed(2)}</span></div>` +
                  `<div><strong>Total</strong><strong>$${totalWithTax ? totalWithTax.toFixed(2) : (subtotal * store.TAX_RATE).toFixed(2)}</strong></div>` +
                '</div>' +
                '<div class="footer">Thank you for dining with us!</div>' +
              '</body>' +
              '</html>'

            // Use the same print method as togo orders
            this.openPrintDocument(receiptHtml)

            // Don't close dialog immediately after printing - let the print dialog appear first
            // The dialog will be closed by the caller if needed, or user can close it manually
            // Only update the table state, don't auto-close
            this.$store.commit('setTableOccupied', { index: this.tableIndex, value: false })
            this.notifyPanel('summary', { tab: 'check' })
            // Removed auto-close: this.dialogOpen = false
        },
        payAndClose() {
            this.$store.commit('paid')
            this.notifyPanel('summary', { tab: 'check' })
            this.dialogOpen = false
        },
        clearTable() {
            this.$store.commit('clearEverything')
            this.notifyPanel('summary', { tab: 'check' })
        },
        tableHasActivity(index) {
            const table = this.$store.state.tables[index] || {}
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
}

.meta-time {
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
}

.header-controls {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

.header-btn {
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  min-height: 42px;
  box-shadow: 0 6px 16px rgba(15, 25, 35, 0.12);
}

.pos-dialog__content {
  padding: 8px 24px 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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
}

.section-actions {
  display: inline-flex;
  gap: 6px;
}

.section-note {
  font-size: 13px;
  color: rgba(31, 39, 51, 0.55);
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

.counter-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.counter-label {
  font-size: 13px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.6px;
  color: rgba(31, 39, 51, 0.65);
}

.counter-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
}

.counter-actions {
  display: inline-flex;
  gap: 4px;
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
}

.drink-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(15, 25, 35, 0.16);
}

.drink-button:focus-visible {
  outline: 2px solid rgba(0, 137, 123, 0.5);
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

.summary-label {
  font-size: 13px;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.6px;
  color: rgba(31, 39, 51, 0.6);
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: rgba(31, 39, 51, 0.88);
}

.summary-value--accent {
  color: var(--v-theme-primary);
}

@media (max-width: 600px) {
  .dialog-title {
    font-size: 22px;
  }
  .pos-dialog__header {
    flex-direction: column;
    align-items: stretch;
  }
  .header-controls {
    justify-content: stretch;
  }
  .header-controls .v-btn {
    flex: 1 1 auto;
  }
  .counter-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}
</style>