<template>
  <section class="floor-plan">
    <div class="floor-plan__grid">
      <div
        v-for="(tableIndex, index) in tableOrder"
        :key="`${index}-${tableIndex}-${currentLanguage}`"
        class="floor-plan__tile"
        :class="[statusForTable(tableIndex).appearance, { 'is-dragged': draggedIndex === index, 'is-drag-over': draggedOverIndex === index }]"
        draggable="true"
        @dragstart="handleDragStart($event, index)"
        @dragover.prevent="handleDragOver($event, index)"
        @dragenter.prevent="handleDragEnter(index)"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop($event, index)"
        @dragend="handleDragEnd($event)"
        @click="addDetails(tableIndex)"
      >
        <div class="floor-plan__tile-header">
          <div class="tile-name">
            <v-icon icon="mdi-drag-variant" size="18" class="tile-drag"></v-icon>
            {{ getTableName(tableIndex) }}
          </div>
          <div class="tile-timer" :class="{ 'has-time': tableTick(tableIndex) }">
            <v-icon
              v-if="$store.state.tables[tableIndex - 1].sitDownTime"
              icon="mdi-clock-outline"
              size="16"
              class="me-1"
              @click.stop="setSitDownTime(tableIndex - 1)"
            ></v-icon>
            <span>{{ tableTick(tableIndex) || '—' }}</span>
          </div>
        </div>

        <div class="floor-plan__tile-body">
          <div class="tile-status">
            <span class="status-chip" :class="statusForTable(tableIndex).appearance">
              <v-icon size="14" :icon="statusForTable(tableIndex).icon" class="me-1"></v-icon>
              {{ statusForTable(tableIndex).label }}
            </span>
          </div>
          <div class="tile-counts">
            <span class="count">
              <strong>{{ $store.state.tables[tableIndex - 1].adult }}</strong>
              {{ getTranslatedLabel('Adult') }}
            </span>
            <span class="count">
              <strong>{{ $store.state.tables[tableIndex - 1].bigKid }}</strong>
              {{ getTranslatedLabel('Kid (6-9)') }}
            </span>
            <span class="count">
              <strong>{{ $store.state.tables[tableIndex - 1].smlKid }}</strong>
              {{ getTranslatedLabel('Kid (2-5)') }}
            </span>
          </div>
          <div class="tile-meta">
            <span class="meta-item">
              <v-icon size="16" icon="mdi-cup-water" class="me-1"></v-icon>
              {{ drinkCount(tableIndex) }} {{ getTranslatedLabel('drinks') }}
            </span>
            <span class="meta-item">
              <v-icon size="16" icon="mdi-food-takeout-box" class="me-1"></v-icon>
              {{ $store.state.tables[tableIndex - 1].togo || 0 }} {{ getTranslatedLabel('to-go') }}
            </span>
          </div>
        </div>

        <div class="floor-plan__tile-footer">
          <span class="tile-total">{{ getTranslatedLabel('Total') }} ${{ Number($store.state.tables[tableIndex - 1].totalPrice || 0).toFixed(2) }}</span>
          <v-icon
            icon="mdi-cards-heart"
            color="pink-darken-1"
            size="18"
            v-if="$store.state.tables[tableIndex - 1].goodPpl"
          ></v-icon>
        </div>
      </div>
    </div>

    <order-details ref="orderDetails" v-model="showDetails"></order-details>
  </section>
</template>


<script>
import { translate } from '../utils/translations.js'

export default {
  data: () => ({
    showDetails: false,
    draggedIndex: null,
    draggedOverIndex: null,
    listenersRegistered: false
  }),
  computed: {
    tableOrder() {
      return this.$store.state.tableOrder || []
    },
    isChinese() {
      return this.$store.state.language === 'zh'
    },
    // This computed property ensures Vue tracks language changes
    currentLanguage() {
      return this.$store.state.language
    }
  },
  methods: {
    getTableName(tableIndex) {
      const table = this.$store.state.tables[tableIndex - 1]
      if (table && table.name && table.name.trim()) {
        return table.name.trim()
      }
      return `Table ${tableIndex}`
    },
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
        : this.$store.state.tableNum || 0
      this.$store.state.tableNum = index
      this.$store.commit('setOrderPanel', { type: 'table', tableIndex: index })
      this.showDetails = true
    },
    handlePanelPrint(event) {
      const index = typeof event.detail?.tableIndex === 'number'
        ? event.detail.tableIndex
        : this.$store.state.tableNum || 0
      this.$store.state.tableNum = index
      this.$store.commit('setOrderPanel', { type: 'table', tableIndex: index })
      // Print directly without opening the dialog
      this.printTableReceipt(index)
    },
    printTableReceipt(tableIndex) {
      // Ensure total is calculated
      this.$store.commit('calculateTotal')
      
      const table = this.$store.state.tables[tableIndex] || {}
      const store = this.$store.state
      
      // Determine pricing mode (same logic as OrderDetails)
      let isDinner = store.isDinner
      if (table.pricingModeDinner !== undefined) {
        isDinner = !!table.pricingModeDinner
      } else {
        // Infer from stored price if available
        const isOccupied = table.occupied
        const isPrinted = !isOccupied && table.totalPrice && parseFloat(table.totalPrice) > 0
        const hasTimeStamp = table.time && table.time > 0
        const isOccupiedOrPrinted = isOccupied || isPrinted || hasTimeStamp
        
        if (isOccupiedOrPrinted && table.totalPrice && parseFloat(table.totalPrice) > 0) {
          const adultCount = parseInt(table.adult) || 0
          const bigKidCount = parseInt(table.bigKid) || 0
          const smlKidCount = parseInt(table.smlKid) || 0
          const drinkPrice = parseFloat(table.drinkPrice) || 0
          
          const dinnerSubtotal = drinkPrice + 
            (adultCount * store.ADULTDINNERPRICE) + 
            (bigKidCount * store.BIGKIDDINNERPRICE) + 
            (smlKidCount * store.SMALLKIDDINNERPRICE)
          const dinnerTotal = parseFloat((dinnerSubtotal * store.TAX_RATE).toFixed(2))
          
          const lunchSubtotal = drinkPrice + 
            (adultCount * store.ADULTPRICE) + 
            (bigKidCount * store.BIGKIDPRICE) + 
            (smlKidCount * store.SMALLKIDPRICE)
          const lunchTotal = parseFloat((lunchSubtotal * store.TAX_RATE).toFixed(2))
          
          const storedPrice = parseFloat(table.totalPrice)
          const dinnerDiff = Math.abs(dinnerTotal - storedPrice)
          const lunchDiff = Math.abs(lunchTotal - storedPrice)
          
          isDinner = dinnerDiff < lunchDiff
        }
      }
      
      // Get pricing based on mode
      const pricing = {
        adult: isDinner ? store.ADULTDINNERPRICE : store.ADULTPRICE,
        bigKid: isDinner ? store.BIGKIDDINNERPRICE : store.BIGKIDPRICE,
        smallKid: isDinner ? store.SMALLKIDDINNERPRICE : store.SMALLKIDPRICE,
        drink: store.DRINKPRICE,
        water: store.WATERPRICE
      }
      
      // Build receipt lines
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
      
      // For receipts, use English-only labels (no translation)
      const drinkLabelMap = {
        WTER: 'Water', DRNK: 'Drink', COKE: 'Coke', STEA: 'Sweet tea', UTEA: 'Unsweet tea',
        HTEA: 'Hot tea', SPRT: 'Sprite', DRPP: 'Dr Pepper', DIET: 'Diet Coke',
        LMND: 'Lemonade', HALF: 'Half & Half', COFE: 'Coffee'
      }
      
      Object.entries(drinkCounts).forEach(([code, qty]) => {
        const label = drinkLabelMap[code] || code
        const unitPrice = code === 'WTER' ? pricing.water : pricing.drink
        addLine(label, qty, unitPrice)
      })
      
      const tableNumber = table?.number || (tableIndex + 1)
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
      
      // Use the same print function as togo orders
      this.openPrintDocument(receiptHtml)
      
      // Update table state (same as OrderDetails.printReceipt)
      // Ensure pricingModeDinner is stored when printing
      if (table && (table.occupied || (!table.occupied && table.totalPrice && parseFloat(table.totalPrice) > 0) || (table.time && table.time > 0)) && table.pricingModeDinner === undefined) {
        table.pricingModeDinner = isDinner
        this.$store.commit('setTableOccupied', { index: tableIndex, value: table.occupied })
      }
      this.$store.commit('setTableOccupied', { index: tableIndex, value: false })
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
          frameWindow.focus()
          requestAnimationFrame(() => {
            try {
              frameWindow.print()
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
      
      iframe.onload = executePrint
      
      fallbackTimeout = setTimeout(() => {
        if (!printed && iframe && iframe.parentNode) {
          const frameDoc = iframe.contentDocument
          if (frameDoc && (frameDoc.readyState === 'complete' || frameDoc.readyState === 'interactive')) {
            executePrint()
          } else {
            cleanup()
          }
        } else if (printed && fallbackTimeout) {
          clearTimeout(fallbackTimeout)
          fallbackTimeout = null
        }
      }, 200)
    },
    handlePanelPay(event) {
      const index = typeof event.detail?.tableIndex === 'number'
        ? event.detail.tableIndex
        : this.$store.state.tableNum || 0
      this.$store.state.tableNum = index
      this.$store.commit('setOrderPanel', { type: 'table', tableIndex: index })
      this.$store.commit('paid')
    },
    handlePanelFocus(event) {
      const index = typeof event.detail?.tableIndex === 'number'
        ? event.detail.tableIndex
        : this.$store.state.tableNum || 0
      this.$store.state.tableNum = index
      this.$store.commit('setOrderPanel', { type: 'table', tableIndex: index })
    },
    addDetails(n) {
      const tableIndex = n - 1
      this.$store.state.tableNum = tableIndex
      this.$store.commit('setOrderPanel', { type: 'table', tableIndex })

      const status = this.statusForTable(n)
      if (status && status.label === this.getTranslatedLabel('Empty')) {
        this.showDetails = true
      } else {
        this.showDetails = false
      }
    },
    tableTick(tableIndex) {
      return this.$store.state.tables[tableIndex - 1]?.sitDownTime || ''
    },
    drinkCount(tableIndex) {
      const drinks = this.$store.state.tables[tableIndex - 1]?.drinks || []
      return drinks.length
    },
    isChinese() {
      return this.$store.state.language === 'zh'
    },
    getTranslatedLabel(label) {
      return translate(label, this.isChinese)
    },
    statusForTable(tableIndex) {
      // Explicitly reference language to ensure reactivity
      const _lang = this.currentLanguage // This ensures Vue tracks language changes
      const table = this.$store.state.tables[tableIndex - 1] || {}
      const total = parseFloat(table.totalPrice || 0)
      const guestCount = Number(table.adult || 0) + Number(table.bigKid || 0) + Number(table.smlKid || 0)
      const drinks = Array.isArray(table.drinks) ? table.drinks.length : 0
      const togo = Number(table.togo || 0)
      const hasActivity = guestCount > 0 || drinks > 0 || togo > 0

      if (!hasActivity && !table.occupied) {
        return { label: this.getTranslatedLabel('Empty'), appearance: 'status-vacant', icon: 'mdi-checkbox-blank-circle-outline' }
      }

      if (total > 0 && !table.occupied) {
        return { label: this.getTranslatedLabel('Printed'), appearance: 'status-ready', icon: 'mdi-check-circle' }
      }

      if (table.occupied || hasActivity) {
        return { label: this.getTranslatedLabel('Occupied'), appearance: 'status-seated', icon: 'mdi-account-clock-outline' }
      }

      return { label: this.getTranslatedLabel('Empty'), appearance: 'status-vacant', icon: 'mdi-checkbox-blank-circle-outline' }
    },
    handleDragStart(event, index) {
      this.draggedIndex = index
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', index.toString())
    },
    handleDragEnd(event) {
      this.draggedIndex = null
      this.draggedOverIndex = null
    },
    handleDragOver(event, index) {
      if (this.draggedIndex !== null && this.draggedIndex !== index) {
        event.dataTransfer.dropEffect = 'move'
      }
    },
    handleDragEnter(index) {
      if (this.draggedIndex !== null && this.draggedIndex !== index) {
        this.draggedOverIndex = index
      }
    },
    handleDragLeave(event) {
      const relatedTarget = event.relatedTarget
      if (!relatedTarget || !event.currentTarget.contains(relatedTarget)) {
        this.draggedOverIndex = null
      }
    },
    handleDrop(event, dropIndex) {
      const dragIndex = this.draggedIndex
      
      if (dragIndex !== null && dragIndex !== dropIndex) {
        // Reorder the tableOrder array
        const newOrder = this.tableOrder.slice()
        const draggedTable = newOrder.splice(dragIndex, 1)[0]
        newOrder.splice(dropIndex, 0, draggedTable)
        this.$store.commit('setTableOrder', newOrder)
      }
      
      this.draggedIndex = null
      this.draggedOverIndex = null
    },
    setSitDownTime(index) {
      if (index < 0) return
      this.$store.commit('getTimestamp', index)
    }
  },
  mounted() {
    this.$store.commit('setOrderPanel', null)
    this.registerPanelListeners()
  },
  beforeUnmount() {
    this.unregisterPanelListeners()
    this.$store.commit('setOrderPanel', null)
  }
}


</script>

<style scoped>
.floor-plan {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.floor-plan__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.floor-plan__tabs {
  background: rgba(255, 255, 255, 0.38);
  border-radius: 999px;
  padding: 4px;
  max-width: 340px;
}

.floor-plan__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.32);
}

.legend-item--ready {
  color: #2e7d32;
}

.legend-item--seated {
  color: #fb8c00;
}

.legend-item--vacant {
  color: #546e7a;
}

.floor-plan__grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 18px;
}

@media (min-width: 560px) {
  .floor-plan__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 820px) {
  .floor-plan__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.floor-plan__tile {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  user-select: none;
  background: rgba(255, 255, 255, 0.42);
  box-shadow: 0 10px 24px rgba(15, 25, 35, 0.12);
}

.floor-plan__tile.status-ready {
  background: rgba(46, 125, 50, 0.16);
  border: 1px solid rgba(46, 125, 50, 0.32);
}

.floor-plan__tile.status-seated {
  background: rgba(251, 140, 0, 0.16);
  border: 1px solid rgba(251, 140, 0, 0.32);
}

.floor-plan__tile.status-vacant {
  background: rgba(84, 110, 122, 0.12);
  border: 1px solid rgba(84, 110, 122, 0.26);
}

.floor-plan__tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(15, 25, 35, 0.18);
}

.floor-plan__tile.is-dragged {
  opacity: 0.6;
  transform: scale(0.98);
}

.floor-plan__tile.is-drag-over {
  outline: 2px dashed rgba(33, 150, 243, 0.7);
  outline-offset: 4px;
}

.floor-plan__tile-header,
.floor-plan__tile-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tile-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.tile-drag {
  opacity: 0.4;
}

.tile-timer {
  font-size: 13px;
  color: rgba(31, 39, 51, 0.6);
  display: inline-flex;
  align-items: center;
}

.tile-timer.has-time {
  font-weight: 600;
  color: rgba(31, 39, 51, 0.85);
}

.floor-plan__tile-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.status-chip.status-ready {
  background: rgba(46, 125, 50, 0.18);
  color: #2e7d32;
}

.status-chip.status-seated {
  background: rgba(251, 140, 0, 0.18);
  color: #fb8c00;
}

.status-chip.status-vacant {
  background: rgba(84, 110, 122, 0.15);
  color: #546e7a;
}

.tile-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: rgba(31, 39, 51, 0.72);
}

.tile-counts .count {
  display: inline-flex;
  flex-direction: column;
  min-width: 70px;
}

.tile-counts strong {
  font-size: 16px;
  color: rgba(31, 39, 51, 0.92);
}

.tile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: rgba(31, 39, 51, 0.72);
}

.meta-item {
  display: inline-flex;
  align-items: center;
}

.tile-total {
  font-weight: 700;
  letter-spacing: 0.3px;
}

@media (max-width: 960px) {
  .floor-plan__grid {
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  }
}
</style>