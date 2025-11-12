<template>
    <v-dialog width="750" v-model="dialogOpen">
        <v-card>
            <v-card-title class="headline black d-flex" primary-title>
                <p class="text-h6 ps-3 me-auto">Item</p>
                <p class="text-h6 pr-3">Price</p>
                <p class="text-h6 pr-8">Quantity</p>
                <v-btn
                    size="small"
                    outlined
                    color="accent"
                    @click="updateAndClose"
                >
                    Update
                </v-btn>
                <v-btn size="small" class="ml-2" variant="tonal" color="accent" @click="printReceipt">
                    <v-icon icon="mdi-printer"></v-icon>
                </v-btn>
            </v-card-title>
            <div v-for="(item, index) in menuItems" :key="item.name || index">
                <v-card-title class="headline black d-flex align-center" primary-title>
                    <div class="d-flex align-center flex-wrap ma-1 ps-3 me-auto">
                        <span class="text-h6">{{ item.name }}</span>
                        <v-chip
                            v-if="getCustomization(item.name)?.label"
                            class="ml-2"
                            size="small"
                            color="accent"
                            variant="tonal"
                        >
                            {{ getCustomization(item.name).label }}
                        </v-chip>
                    </div>
                    <p class="text-h6 pr-6">${{ formattedPrice(item).toFixed(2) }}</p>
                    <p class="text-h6 pr-6">{{ item.quantity }}</p>
                    <v-btn
                        icon
                        variant="text"
                        color="accent"
                        class="ma-1"
                        @click="openCustomization(item)"
                        :title="'Edit special request'"
                    >
                        <v-icon>mdi-square-edit-outline</v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="accent" @click="$store.commit('increaseOrderQuantity', index)">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="accent" @click="$store.commit('decreaseOrderQuantity', index)">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-card-title>
                <v-divider></v-divider>
            </div>
        </v-card>

        <v-dialog v-model="customizationDialog.open" max-width="420">
            <v-card>
                <v-card-title class="text-h6">
                    Special Request — {{ customizationDialog.item?.name || '' }}
                </v-card-title>
                <v-card-subtitle>
                    Select an add-on. Additional price applies per item.
                </v-card-subtitle>
                <v-divider></v-divider>
                <v-card-text>
                    <v-radio-group v-model="customizationDialog.selected" hide-details>
                        <v-radio
                            v-for="option in customizationOptions"
                            :key="option.label"
                            :label="optionLabel(option)"
                            :value="option"
                        ></v-radio>
                    </v-radio-group>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="customizationDialog.open = false">Cancel</v-btn>
                    <v-btn color="accent" variant="tonal" @click="applyCustomization">Apply</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
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
    data: () => ({
        customizationDialog: {
            open: false,
            item: null,
            selected: null
        },
        customizationOptions: [
            { label: 'No special request', price: 0 },
            { label: 'Extra Beef', price: 2 },
            { label: 'Extra Chicken', price: 2 },
            { label: 'Extra Shrimp', price: 3 },
            { label: 'Extra Sauce', price: 0.5 }
        ]
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
            return (store.seletedTogo || [])
                .filter(item => Number(item.quantity ?? 0) > 0)
                .map(item => {
                    const basePrice = this.findBasePrice(item.item)
                    const customization = this.getCustomization(item.item)
                    const extra = Number(customization?.price ?? 0)
                    return {
                        name: item.item,
                        quantity: Number(item.quantity ?? 0),
                        price: basePrice + extra,
                        note: customization?.label || ''
                    }
                })
        },
        togoCustomizations() {
            return this.$store.state.togoCustomizations || {}
        }
    },
    methods: {
        updateAndClose() {
            this.$store.commit('calculateTogoTotal')
            this.dialogOpen = false
        },
        getCustomization(itemName) {
            if (!itemName) return null
            return this.togoCustomizations[itemName] || null
        },
        findBasePrice(itemName) {
            const menu = this.$store.state.menu || []
            for (const category of menu) {
                if (!Array.isArray(category?.items)) continue
                const match = category.items.find(menuItem => menuItem?.name === itemName)
                if (match) {
                    return Number(match.listPrice ?? 0)
                }
            }
            return 0
        },
        formattedPrice(item) {
            const base = Number(item.listPrice ?? 0)
            const customization = this.getCustomization(item.name)
            const extra = Number(customization?.price ?? 0)
            return base + extra
        },
        openCustomization(item) {
            const current = this.getCustomization(item.name) || { label: 'No special request', price: 0 }
            const selectedOption = this.customizationOptions.find(option =>
                option.label === current.label && Number(option.price) === Number(current.price)
            ) || this.customizationOptions[0]
            this.customizationDialog = {
                open: true,
                item,
                selected: selectedOption
            }
        },
        optionLabel(option) {
            if (!option) return ''
            const price = Number(option.price || 0)
            if (price > 0) {
                return `${option.label} (+$${price.toFixed(2)})`
            }
            return option.label
        },
        applyCustomization() {
            if (!this.customizationDialog.item || !this.customizationDialog.selected) {
                this.customizationDialog.open = false
                return
            }
            const option = this.customizationDialog.selected
            const label = option.label === 'No special request' ? '' : option.label
            this.$store.commit('setTogoCustomization', {
                itemName: this.customizationDialog.item.name,
                label,
                price: Number(option.price || 0)
            })
            this.customizationDialog.open = false
        },
        printReceipt() {
            this.$store.commit('calculateTogoTotal')
            const store = this.$store.state
            const items = this.selectedItems.map(item => ({
                name: item.name,
                quantity: Number(item.quantity ?? 0),
                price: Number(item.price ?? 0),
                note: item.note ? item.note : ''
            }))

            if (items.length === 0) {
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
  
<!-- <style>
    #id{
        /* text-field-details-padding-inline: 0px; */
        text-field-input-padding-start: 0px
    }
</style> -->