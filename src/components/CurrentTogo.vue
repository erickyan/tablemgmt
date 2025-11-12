<template>
    <v-dialog width="600" v-model="dialogOpen">
        <v-card>
            <v-card-title class="headline black d-flex" primary-title>
                <p class="text-h6 ps-3 me-auto">Current Order </p>
                <p class="text-h6 pr-3"> Price </p>
                <p class="text-h6 pr-8"> Quantity</p>
                <!-- {{ $store.state.sales.totalTogoPriceState }} -->
                <v-btn size="small" @click="$store.commit('calculateTogoTotal')" outlined color="accent">Update</v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <div v-if="$store.state.seletedTogo.length === 0" >
                <p class="text-h6 ma-1 ps-3 me-auto text-center"> No one ordered nothing </p>
            </div>
            <div
                v-for="(item, index ) in $store.state.seletedTogo"
                :key="`current-togo-${item.item}-${index}`"
                class="px-3"
            >
                <v-row class="align-center py-2">
                    <v-col cols="6">
                        <div class="d-flex flex-column">
                            <span class="text-subtitle-1 font-weight-medium">{{ item.item }}</span>
                            <span
                                v-if="noteFor(item.item)"
                                class="text-body-2 text-secondary d-flex align-center"
                            >
                                <v-icon size="16" class="mr-1" icon="mdi-note-text-outline"></v-icon>
                                {{ noteFor(item.item) }}
                            </span>
                        </div>
                    </v-col>
                    <v-col cols="2" class="text-right">
                        <span class="text-subtitle-1">${{ displayPrice(item.item).toFixed(2) }}</span>
                    </v-col>
                    <v-col cols="4" class="d-flex align-center justify-end">
                        <span class="text-subtitle-1 mr-3">{{ item.quantity }}</span>
                        <v-btn icon size="small" color="accent" @click="$store.commit('increaseSelectedQuantity', index)">
                            <v-icon icon="mdi-plus"></v-icon>
                        </v-btn>
                        <v-btn icon size="small" color="accent" @click="$store.commit('decreaseSelectedQuantity', index)">
                            <v-icon icon="mdi-minus"></v-icon>
                        </v-btn>
                    </v-col>
                </v-row>
                <v-divider></v-divider>
            </div>

            <v-card-actions>
                <v-btn class="ml-auto" @click="printTogoReceipt" outlined color="accent">
                    <v-icon size="x-large" icon="mdi-printer"></v-icon>
                </v-btn>
                <v-btn class="ml-auto" @click="$store.commit('togoPaid')" outlined>
                    <v-icon size="x-large" icon="mdi-cash-check"></v-icon>
                </v-btn>
            </v-card-actions>
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
  emits: ['update:modelValue'],
  computed: {
    dialogOpen: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    notes() {
      return this.$store.state.togoCustomizations || {}
    },
    selectedItems() {
      const cartItems = this.$store.state.seletedTogo || []
      return cartItems
        .filter(item => Number(item.quantity ?? 0) > 0)
        .map(item => {
          const name = item.item
          const basePrice = this.findBasePrice(name)
          const customization = this.notes[name] || {}
          const extra = Number(customization?.price ?? 0)
          return {
            name,
            quantity: Number(item.quantity ?? 0),
            price: basePrice + extra,
            note: customization?.label || ''
          }
        })
    }
  },
  methods: {
    findBasePrice(itemName) {
      const menu = this.$store.state.menu || []
      for (const category of menu) {
        if (!Array.isArray(category?.items)) continue
        const match = category.items.find(menuItem => menuItem?.name === itemName)
        if (match) {
          return Number(match.listPrice ?? 0)
        }
      }
      return Number(this.$store.state.seletedTogo?.find(item => item.item === itemName)?.price ?? 0)
    },
    displayPrice(itemName) {
      const base = this.findBasePrice(itemName)
      const customization = this.notes[itemName] || {}
      const extra = Number(customization?.price ?? 0)
      return base + extra
    },
    noteFor(itemName) {
      if (!itemName) {
        return ''
      }
      return this.notes[itemName]?.label || ''
    },
    printTogoReceipt() {
      this.$store.commit('calculateTogoTotal')
      const store = this.$store.state
      const items = this.selectedItems
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
        '.footer { margin-top: 24px; text-align: center; font-size: 12px; color: #777; }' +
        '.note-row td { padding: 6px 6px 10px; font-style: italic; color: #4a4a4a; background: #f9fbff; border-bottom: 1px solid #ddd; }' +
        '</style>' +
        '</head>' +
        '<body>' +
        '<h1>China Buffet</h1>' +
        '<h2>To-Go Order</h2>' +
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
        '<div class="footer">Thank you for your order!</div>' +
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