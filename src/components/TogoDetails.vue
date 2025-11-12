<template>
    <v-dialog width="750" v-model="dialogOpen">
        <v-card>
            <v-card-title class="headline black d-flex" primary-title>
                <p class="text-h6 ps-3 me-auto">Item</p>
                <p class="text-h6 pr-3">Price</p>
                <p class="text-h6 pr-8">Quantity</p>
                <v-btn size="small" @click="$store.commit('calculateTogoTotal')" outlined color="primary">Update</v-btn>
                <v-btn size="small" class="ml-2" variant="tonal" color="primary" @click="printReceipt">
                    <v-icon icon="mdi-printer"></v-icon>
                </v-btn>
            </v-card-title>
            <div v-for="(item, index) in menuItems" :key="index">
                <v-card-title class="headline black d-flex" primary-title>
                    <p class="text-h6 ma-1 ps-3 me-auto">{{ item.name }}</p>
                    <p class="text-h6 pr-10">${{ item.listPrice.toFixed(2) }}</p>
                    <p class="text-h6 pr-10">{{ item.quantity }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseOrderQuantity', index)">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseOrderQuantity', index)">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-card-title>
                <v-divider></v-divider>
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
        menuItems() {
            const store = this.$store.state
            const category = store.menu[store.catID]
            if (!category || !Array.isArray(category.items)) {
                return []
            }
            return category.items
        },
        selectedItems() {
            const store = this.$store.state
            return (store.seletedTogo || []).filter(item => Number(item.quantity ?? 0) > 0)
        }
    },
    methods: {
        printReceipt() {
            this.$store.commit('calculateTogoTotal')
            const store = this.$store.state
            const items = this.selectedItems.map(item => ({
                name: item.name,
                quantity: Number(item.quantity ?? 0),
                price: Number(item.price ?? 0)
            }))

            if (items.length === 0) {
                console.warn('No items selected for to-go receipt')
                return
            }

            const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
            const total = parseFloat(store.totalTogoPrice || (subtotal * store.TAX_RATE).toFixed(2))
            const taxAmount = parseFloat((total - subtotal).toFixed(2))

            const rows = items.map(item => `
                <tr>
                    <td>${item.name}</td>
                    <td class="qty">${item.quantity}</td>
                    <td class="price">$${item.price.toFixed(2)}</td>
                    <td class="price">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
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
  
<!-- <style>
    #id{
        /* text-field-details-padding-inline: 0px; */
        text-field-input-padding-start: 0px
    }
</style> -->