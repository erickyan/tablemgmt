<template>
    <v-dialog width="600" v-model="dialogOpen">
        <v-card>
            <v-card-title class="headline black d-flex" primary-title>
                Table No {{ $store.state.tableNum + 1 }} <v-spacer></v-spacer>
                <!-- <v-btn size="small" @click="$store.commit('calculateTotal')" outlined color="primary">Update</v-btn> -->
                <v-btn size="small" @click=updateMenu outlined color="primary">Update</v-btn>
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
                <!-- <v-form ref="sendForm" v-model="valid" lazy-validation> -->
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 ps-3 me-auto">Buffet   </p>
                    <p class="text-h6 ma-1 me-auto">{{ $store.state.tables[$store.state.tableNum].adult }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseAdult')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseAdult')">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 ps-3 me-auto">B Kid</p>
                    <p class="text-h6 ma-1 me-auto">{{ $store.state.tables[$store.state.tableNum].bigKid }}</p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseBigKid')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseBidKid')">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet class="d-flex">
                    <p class="text-h6 ma-1 ps-3 me-auto">S Kid</p>
                    <p class="text-h6 ma-1 me-auto"> {{ $store.state.tables[$store.state.tableNum].smlKid }} </p>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('increaseSmlKid')">
                        <v-icon icon="mdi-plus"></v-icon>
                    </v-btn>
                    <v-btn size="small" class="ma-1 pa-2" color="primary" @click="$store.commit('decreaseSmlKid')">
                        <v-icon icon="mdi-minus"></v-icon>
                    </v-btn>
                </v-sheet>
                <v-sheet>


                    <v-container >
                        <div style="display: flex; height: 70px;">
                            <v-row no-gutters>
                                <v-col cols="12" sm="3" v-for="drink in $store.state.tables[$store.state.tableNum].drinks">
                                    {{ drink }}
                                </v-col>
                            </v-row>
                        </div>
                    </v-container>

                    <v-chip-group size="x-small" style="height: 130px; overflow-y: scroll;">
                        <!-- <v-btn @click="reorderDrink()" icon="mdi-cancel" color="red-accent-4" size="x-small"></v-btn> -->
                        <v-chip @click="addDrinks('WTER')"><v-icon start icon="mdi-cup-water"></v-icon>Water</v-chip>
                        <v-chip @click="addDrinks('COKE')"><v-icon start icon="mdi-bottle-soda"></v-icon>Coke</v-chip>
                        <v-chip @click="addDrinks('STEA')"><v-icon start icon="mdi-beer"></v-icon>SweetTea</v-chip>
                        <v-chip @click="addDrinks('SPRT')"><v-icon start icon="mdi-bottle-soda"></v-icon>Sprite</v-chip>
                        <v-chip @click="addDrinks('DRPP')"><v-icon start icon="mdi-bottle-soda"></v-icon>DrPepper</v-chip>
                        <v-chip @click="addDrinks('DIET')"><v-icon start icon="mdi-bottle-soda"></v-icon>DietCoke</v-chip>
                        <v-chip @click="addDrinks('UTEA')"><v-icon start icon="mdi-cup-off"></v-icon>UnsweetTea</v-chip>
                        <v-chip @click="addDrinks('LMND')"><v-icon start icon="mdi-fruit-citrus"></v-icon>Lemonade</v-chip>
                        <v-chip @click="addDrinks('HALF')"><v-icon start icon="mdi-cup"></v-icon>Half-Half</v-chip>
                        <v-chip @click="addDrinks('COFE')"><v-icon start icon="mdi-coffee"></v-icon>Coffee</v-chip>
                        <v-chip @click="addDrinks('HTEA')"><v-icon start icon="mdi-tea"></v-icon>Hot Tea</v-chip>
                        
                        <!-- <v-chip @click="addDrinks('')">Water</v-chip>
                            <v-chip @click="addDrinks('')">HotTea</v-chip>
                            <v-chip @click="addDrinks('')">Coke</v-chip>
                            <v-chip @click="addDrinks('')">Lemonate</v-chip>
                            <v-chip @click="addDrinks('')">DrPepper</v-chip>
                            <v-chip @click="addDrinks('')">DietCoke</v-chip>
                            <v-chip @click="addDrinks('')">SweetTea</v-chip>
                            <v-chip @click="addDrinks('')">UnsweetTea</v-chip>
                            <v-chip @click="addDrinks('')">Half-Half</v-chip> -->
                    </v-chip-group>

                </v-sheet>
                <!-- </v-form> -->
            </v-card-text>
            <v-card-actions>

                <!-- <v-btn class="ml-auto" @click="$store.commit('addingTogo')" outlined>
                    TOGO
                </v-btn> -->
                <!-- <v-text-field id="togobox" density="compact" variant="plain">  -->
                    <!-- TOGO:  -->
                    <!-- {{ $store.state.tables[$store.state.tableNum].togo }} -->
                <!-- </v-text-field> -->
                <v-btn class="ml-auto" @click="printReceipt" outlined>
                    <v-icon size="x-large" icon="mdi-printer"></v-icon>
                </v-btn>
                <v-btn class="ml-auto" @click="payAndClose" outlined>
                    <v-icon size="x-large" icon="mdi-cash-check"></v-icon>
                </v-btn>
                <v-btn class="ml-auto" @click="$store.commit('clearEverything')" outlined>
                    <v-icon size="x-large" icon="mdi-cancel"></v-icon>
                </v-btn>
                <v-btn class="ml-auto" @click="$store.commit('updateTableGoodPpl', !$store.state.tables[$store.state.tableNum].goodPpl)" outlined color="pink-darken-1">
                    <v-icon size="x-large" icon="mdi-heart-broken" v-if="$store.state.tables[$store.state.tableNum].goodPpl == true"></v-icon>
                    <v-icon size="x-large" icon="mdi-heart" v-if="$store.state.tables[$store.state.tableNum].goodPpl == false"></v-icon>
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
    data: () => ({
        valid: true
    }),
    computed: {
        dialogOpen: {
            get() {
                return this.modelValue
            },
            set(value) {
                this.$emit('update:modelValue', value)
            }
        }
    },
    methods: {
        addDrinks(btnV) {
            // Use mutation to add drink (will sync to Firestore if enabled)
            this.$store.commit('addDrink', btnV)
            // console.log(this.$store.state.dinnerTime)

            // let num = this.$store.state.tables[0].drinks
            // let result = {}
            // num.forEach((x) => {
            //     result[x] = result[x] || 0
            //     result[x]++
            // })

            // Object.keys(myObj).length
            // console.log('water: ' + result.Water)
            // console.log('others: '+ (num.length - result.Water))
            // console.log(btnV)
        },
        reorderDrink(){
            // Clear drinks and sync to Firestore
            this.$store.state.tables[this.$store.state.tableNum].drinks = []
            if (this.$store.state.useFirebase && this.$store.state.firebaseInitialized) {
                this.$store.dispatch('saveTableToFirestore', this.$store.state.tableNum)
            }
            // console.log(this.$store.state.tables[this.$store.state.tableNum].drinks )
        },
        updateMenu(){
            const tableIndex = this.$store.state.tableNum
            this.$store.commit('calculateTotal')
            if (this.tableHasActivity(tableIndex)) {
                this.$store.commit('getTimestamp', tableIndex)
            } else {
                this.$store.commit('setTableSitDownTime', { index: tableIndex, value: '' })
            }
            this.dialogOpen = false
        },
        printReceipt() {
            this.$store.commit('calculateTotal')
            const store = this.$store.state
            const tableIndex = store.tableNum
            const table = store.tables[tableIndex]
            const isDinner = store.isDinner
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
                if (!qty) return
                const total = qty * unitPrice
                lines.push({ label, qty, unitPrice, total })
                totals.push(total)
            }

            addLine('Adult Buffet', Number(table.adult || 0), pricing.adult)
            addLine('Big Kid Buffet', Number(table.bigKid || 0), pricing.bigKid)
            addLine('Small Kid Buffet', Number(table.smlKid || 0), pricing.smallKid)

            const drinkCodes = {
                WTER: 'Water',
                COKE: 'Coke',
                STEA: 'Sweet Tea',
                SPRT: 'Sprite',
                DRPP: 'Dr Pepper',
                DIET: 'Diet Coke',
                UTEA: 'Unsweet Tea',
                LMND: 'Lemonade',
                HALF: 'Half & Half',
                COFE: 'Coffee',
                HTEA: 'Hot Tea'
            }

            const drinkCounts = table.drinks.reduce((acc, code) => {
                acc[code] = (acc[code] || 0) + 1
                return acc
            }, {})

            Object.entries(drinkCounts).forEach(([code, qty]) => {
                const label = drinkCodes[code] || code
                const unitPrice = code === 'WTER' ? pricing.water : pricing.drink
                addLine(`${label}`, qty, unitPrice)
            })

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
                `<title>Receipt - Table ${table.number}</title>` +
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
                `<h2>Table ${table.number}</h2>` +
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
        },
        payAndClose() {
            this.$store.commit('paid')
            this.dialogOpen = false
        },
        tableHasActivity(index) {
            const table = this.$store.state.tables[index] || {}
            const guestCount = Number(table.adult || 0) + Number(table.bigKid || 0) + Number(table.smlKid || 0)
            const hasDrinks = Array.isArray(table.drinks) && table.drinks.length > 0
            const hasTogo = Number(table.togo || 0) > 0
            return guestCount > 0 || hasDrinks || hasTogo
        }
    },
    // computed: {
    //     tableNumLocal() { return this.$store.state.tableNum }
    //     }

}
</script>