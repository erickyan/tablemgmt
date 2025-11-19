<template>
  <v-dialog
    v-model="dialogOpen"
    :max-width="$vuetify.display.xs ? '100%' : ($vuetify.display.tablet ? '950' : '820')"
    :fullscreen="$vuetify.display.xs"
    transition="dialog-bottom-transition"
  >
    <v-card class="pos-dialog">
      <div class="pos-dialog__header">
        <div class="pos-dialog__header-titles">
          <h3 class="dialog-title">{{ getTranslatedLabel('Build to-go order') }}</h3>
          <p class="dialog-subtitle">{{ getTranslatedLabel('Tap an item to adjust quantity or add special requests.') }}</p>
        </div>
        <div class="pos-dialog__header-actions">
          <v-btn color="accent" variant="flat" @click="updateAndClose">
            <v-icon start>mdi-check</v-icon>
            {{ getTranslatedLabel('Update') }}
          </v-btn>
        </div>
      </div>

      <v-divider></v-divider>

      <div class="pos-dialog__content">
        <div
          v-for="(item, index) in menuItems"
          :key="item.name || index"
          :class="['item-row', { 'item-row--focused': highlightIndex === index } ]"
        >
          <div class="item-row__info">
            <div class="item-row__title">
              <span class="item-name">{{ isDrinksCategory ? getTranslatedLabel(item.name) : item.name }}</span>
              <v-chip
                v-if="getCustomizationForKey(dialogKey(index))?.label"
                size="small"
                variant="tonal"
                color="accent"
              >
                {{ getCustomizationForKey(dialogKey(index)).label }}
              </v-chip>
            </div>
            <div class="item-row__meta">
              <span class="price">${{ formattedPrice(item, index).toFixed(2) }}</span>
              <span class="quantity">{{ getTranslatedLabel('Qty') }} {{ draftQuantities[dialogKey(index)] || 0 }}</span>
            </div>
          </div>
          <div class="item-row__actions">
            <v-btn
              v-if="!isDrinksCategory"
              icon
              variant="text"
              color="accent"
              density="comfortable"
              @click="openCustomization(item, index)"
              :title="getTranslatedLabel('Edit special request')"
            >
              <v-icon>mdi-square-edit-outline</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              density="comfortable"
              color="accent"
              @click="decrementItem(index)"
            >
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              density="comfortable"
              color="accent"
              @click="incrementItem(index)"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </div>
        </div>
        <div v-if="menuItems.length === 0" class="empty-state">
          <v-icon size="36" color="accent">mdi-food-takeout-box</v-icon>
          <p>{{ getTranslatedLabel('No menu items configured for this category.') }}</p>
        </div>
      </div>
    </v-card>

    <v-dialog v-model="customizationDialog.open" :max-width="$vuetify.display.xs ? '95%' : '500'">
      <v-card class="custom-dialog">
        <div class="custom-dialog__header">
          <h4>{{ getTranslatedLabel('Special request') }}</h4>
          <p>{{ customizationDialog.item?.name }}</p>
        </div>
        <v-divider></v-divider>
        <v-card-text>
          <v-radio-group v-model="customizationDialog.selected" hide-details>
            <v-radio
              v-for="option in customizationOptions"
              :key="option.label"
              :label="optionLabel(option)"
              :value="option"
            ></v-radio>
            <v-radio
              class="custom-radio-option"
              :value="customOptionRef"
              aria-label="Custom"
            >
              <template #label>
                <div class="custom-entry__inputs">
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Description"
                    hide-details
                    v-model="customizationDialog.customLabel"
                    @focus="customizationDialog.selected = customOptionRef"
                  ></v-text-field>
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Extra price"
                    hide-details
                    v-model="customizationDialog.customPrice"
                    prefix="$"
                    type="number"
                    step="0.5"
                    min="0"
                    @focus="customizationDialog.selected = customOptionRef"
                  ></v-text-field>
                </div>
              </template>
            </v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions class="custom-dialog__actions">
          <v-btn variant="text" @click="customizationDialog.open = false">Cancel</v-btn>
          <v-btn color="accent" variant="tonal" @click="applyCustomization">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>


<script>
import { DRINK_OPTIONS, getDrinkLabel, isWater } from '../utils/drinkOptions.js'
import { translate } from '../utils/translations.js'
import { usePrinting } from '../composables/usePrinting.js'
import { showSuccess } from '../utils/successNotifications.js'

export default {
    props: {
        modelValue: {
            type: Boolean,
            default: false
        },
        focusIndex: {
            type: Number,
            default: null
        }
    },
    emits: ['update:modelValue', 'close'],
    setup() {
        const { printTogoReceipt: printTogoReceiptComposable } = usePrinting()
        return { printTogoReceiptComposable }
    },
    data: () => ({
        customizationDialog: {
            open: false,
            item: null,
            selected: null,
            customLabel: '',
            customPrice: '0'
        },
        customizationOptions: [
            { label: 'No special request', price: 0 },
            { label: 'Extra Beef', price: 2 },
            { label: 'Extra Chicken', price: 2 },
            { label: 'Extra Shrimp', price: 3 },
            { label: 'Extra Sauce', price: 0.5 }
        ],
        highlightIndex: null,
        pendingFocus: null,
        focusHandled: null,
        draftQuantities: {},
        draftCustomizations: {},
        customOptionRef: { label: '', price: 0, custom: true }
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
            // Check if drinks category is selected (catID === -1)
            if (store.catID === -1) {
                // First, check if there's a "Drinks" category in the menu
                const drinksCategory = Array.isArray(store.menu)
                    ? store.menu.find(cat => 
                        cat?.category && cat.category.toLowerCase().trim() === 'drinks'
                      )
                    : null
                
                // If drinks category exists in menu, use it
                if (drinksCategory && Array.isArray(drinksCategory.items) && drinksCategory.items.length > 0) {
                    return drinksCategory.items.map(item => {
                        // Try to match with DRINK_OPTIONS to preserve code and icon
                        const drinkOption = DRINK_OPTIONS.find(d => 
                            d.label.toLowerCase() === item.name?.toLowerCase()
                        )
                        return {
                            name: item.name || '',
                            listPrice: Number(item.listPrice ?? 0),
                            code: drinkOption?.code,
                            icon: drinkOption?.icon
                        }
                    })
                }
                
                // Fallback: Return drinks as menu items from DRINK_OPTIONS
                return DRINK_OPTIONS.map(drink => ({
                    name: drink.label,
                    listPrice: isWater(drink.code) ? store.WATERPRICE : store.DRINKPRICE,
                    code: drink.code,
                    icon: drink.icon
                }))
            }
            // Regular menu category
            const category = store.menu[store.catID]
            if (!category || !Array.isArray(category.items)) {
                return []
            }
            return category.items
        },
        isDrinksCategory() {
            return this.$store.state.catID === -1
        },
        isChinese() {
            return this.$store.state.language === 'zh'
        },
        visibleItems() {
            const base = this.menuItems.map((item, index) => ({ item, index }))
            return base
        },
        selectedItems() {
            return (this.$store.state.togoLines || [])
                .filter(line => Number(line.quantity ?? 0) > 0)
                .map(line => {
                    const unitPrice = Number(line.basePrice ?? 0) + Number(line.extraPrice ?? 0)
                    return {
                        name: line.itemName,
                        quantity: Number(line.quantity ?? 0),
                        price: unitPrice,
                        note: line.note || ''
                    }
                })
        },
        draftSpecialRequestChips() {
            const chips = {}
            this.menuItems.forEach((item, index) => {
                const key = this.dialogKey(index)
                const customization = this.draftCustomizations[key]
                if (customization) {
                    chips[key] = {
                        label: customization.label,
                        price: customization.price
                    }
                }
            })
            return chips
        }
    },
    methods: {
        getTranslatedLabel(label) {
            return translate(label, this.isChinese)
        },
        dialogKey(index) {
            return `${this.$store.state.catID}-${index}`
        },
        resetDraft() {
            this.draftQuantities = {}
            this.draftCustomizations = {}
            this.highlightIndex = null
            this.pendingFocus = null
            this.focusHandled = null
            this.customOptionRef = { label: '', price: 0, custom: true }
        },
        updateAndClose() {
            const lines = []
            const categoryIndex = this.$store.state.catID
            this.menuItems.forEach((item, index) => {
                const key = this.dialogKey(index)
                const quantity = Number(this.draftQuantities[key] || 0)
                if (!Number.isFinite(quantity) || quantity <= 0) {
                    return
                }
                const customization = this.draftCustomizations[key]
                const extraPrice = Number(customization?.price || 0)
                const note = customization?.label === 'No special request' ? '' : (customization?.label || '')
                
                // For drinks category, use -1 as categoryIndex and store the drink code
                const finalCategoryIndex = this.isDrinksCategory ? -1 : categoryIndex
                
                lines.push({
                    itemName: item.name,
                    categoryIndex: finalCategoryIndex,
                    itemIndex: this.isDrinksCategory ? (item.code ? DRINK_OPTIONS.findIndex(d => d.code === item.code) : index) : index,
                    quantity,
                    basePrice: Number(item.listPrice ?? 0),
                    extraPrice,
                    note
                })
            })
            if (lines.length) {
                // Lines now include menuItemId when available for normalized state
                this.$store.dispatch('appendTogoLines', lines)
                const itemCount = lines.reduce((sum, line) => sum + (line.quantity || 0), 0)
                showSuccess(`${itemCount} ${this.getTranslatedLabel('item')}${itemCount !== 1 ? 's' : ''} ${this.getTranslatedLabel('added to order')}`)
            }
            this.resetDraft()
            this.dialogOpen = false
            this.$store.dispatch('setOrderPanel', { type: 'togo' })
        },
        getCustomizationForKey(key) {
            return this.draftCustomizations[key] || null
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
        formattedPrice(item, index) {
            const key = this.dialogKey(index)
            const base = Number(item.listPrice ?? 0)
            const customization = this.getCustomizationForKey(key)
            const extra = Number(customization?.price ?? 0)
            return base + extra
        },
        openCustomization(item, index) {
            const key = this.dialogKey(index)
            const current = this.getCustomizationForKey(key) || { label: 'No special request', price: 0 }
            let selectedOption = this.customizationOptions.find(option =>
                option.label === current.label && Number(option.price) === Number(current.price)
            ) || null
            if (!selectedOption) {
                this.customizationDialog.customLabel = current.label || ''
                this.customizationDialog.customPrice = String(current.price || 0)
                this.customOptionRef = {
                    label: current.label || '',
                    price: Number(current.price || 0),
                    custom: true
                }
                selectedOption = this.customOptionRef
            } else {
                this.customizationDialog.customLabel = ''
                this.customizationDialog.customPrice = '0'
                this.customOptionRef = { label: '', price: 0, custom: true }
            }
            this.customizationDialog = {
                open: true,
                item: { ...item, index, key },
                selected: selectedOption,
                customLabel: this.customizationDialog.customLabel,
                customPrice: this.customizationDialog.customPrice
            }
        },
        optionLabel(option) {
            if (!option) return ''
            if (option.custom) {
                const label = (this.customizationDialog.customLabel || '').trim() || 'Custom'
                const price = Number(this.customizationDialog.customPrice || 0)
                return price > 0 ? `${label} (+$${price.toFixed(2)})` : label
            }
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
            let option = this.customizationDialog.selected
            if (option.custom) {
                const rawLabel = (this.customizationDialog.customLabel || '').trim()
                const rawPrice = Number(this.customizationDialog.customPrice || 0)
                option = {
                    label: rawLabel,
                    price: Number.isFinite(rawPrice) ? rawPrice : 0
                }
            }
            const label = option.label === 'No special request' ? '' : option.label
            const price = Number(option.price || 0)
            this.draftCustomizations = {
                ...this.draftCustomizations,
                [this.customizationDialog.item.key]: {
                    label,
                    price
                }
            }
            this.customizationDialog.open = false
        },
        incrementItem(index) {
            const key = this.dialogKey(index)
            const current = Number(this.draftQuantities[key] || 0)
            this.draftQuantities = {
                ...this.draftQuantities,
                [key]: current + 1
            }
            // Visual feedback
            this.highlightIndex = index
            setTimeout(() => {
                if (this.highlightIndex === index) {
                    this.highlightIndex = null
                }
            }, 300)
        },
        decrementItem(index) {
            const key = this.dialogKey(index)
            const current = Number(this.draftQuantities[key] || 0)
            if (current <= 0) return
            const next = current - 1
            if (next <= 0) {
                const { [key]: _removedQty, ...restQty } = this.draftQuantities
                this.draftQuantities = restQty
                const { [key]: _removedCustom, ...restCustom } = this.draftCustomizations
                this.draftCustomizations = restCustom
            } else {
                this.draftQuantities = {
                    ...this.draftQuantities,
                    [key]: next
                }
            }
            // Visual feedback
            this.highlightIndex = index
            setTimeout(() => {
                if (this.highlightIndex === index) {
                    this.highlightIndex = null
                }
            }, 300)
        },
        // openPrintDocument and printWithIframe are now provided by usePrinting composable
        async printReceipt() {
            const items = this.selectedItems.map(item => ({
                name: item.name,
                quantity: Number(item.quantity ?? 0),
                price: Number(item.price ?? 0),
                note: item.note ? item.note : ''
            }))

            await this.printTogoReceiptComposable({
                store: this.$store,
                items
            })
        },
        triggerFocus(index) {
            if (!Number.isInteger(index) || index < 0 || index >= this.menuItems.length) {
                this.highlightIndex = null
                return
            }
            this.highlightIndex = index
            if (this.focusHandled === index && this.customizationDialog.open) {
                return
            }
            this.focusHandled = index
            this.pendingFocus = null
            this.$nextTick(() => {
                const target = this.menuItems[index]
                if (target) {
                    this.openCustomization(target, index)
                }
            })
        }
    },
    watch: {
        dialogOpen(value) {
            if (!value) {
                this.resetDraft()
                this.$emit('close')
            } else {
                this.resetDraft()
                this.focusHandled = null
                if (Number.isInteger(this.pendingFocus)) {
                    this.triggerFocus(this.pendingFocus)
                }
            }
        },
        focusIndex: {
            immediate: true,
            handler(value) {
                if (!Number.isInteger(value)) {
                    this.pendingFocus = null
                    if (!this.customizationDialog.open) {
                        this.highlightIndex = null
                    }
                    this.focusHandled = null
                    return
                }
                this.pendingFocus = value
                if (this.dialogOpen) {
                    this.triggerFocus(value)
                }
            }
        },
        'customizationDialog.customLabel'(value) {
            this.customOptionRef.label = (value || '').trim()
        },
        'customizationDialog.customPrice'(value) {
            const parsed = Number(value)
            this.customOptionRef.price = Number.isFinite(parsed) ? parsed : 0
        }
    }
}
</script>

<style scoped>
.pos-dialog {
  border-radius: 28px;
  box-shadow: 0 24px 42px rgba(15, 25, 35, 0.22);
  overflow: hidden;
}

.pos-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 20px 24px;
}

.pos-dialog__header-titles {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
}

.dialog-subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(31, 39, 51, 0.65);
}

.pos-dialog__header-actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.pos-dialog__content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
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

.item-row--focused {
  background: rgba(0, 137, 123, 0.09);
  box-shadow: inset 0 0 0 1px rgba(0, 137, 123, 0.35);
  border-radius: 18px;
}

.item-row__info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row__title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
}

.item-row__meta {
  display: inline-flex;
  gap: 16px;
  font-size: 14px;
  color: rgba(31, 39, 51, 0.78);
}

.item-row__meta .price {
  font-weight: 700;
  color: rgba(31, 39, 51, 0.92);
}

.item-row__actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.item-row--focused {
  background: rgba(0, 137, 123, 0.08);
  border-radius: 18px;
  box-shadow: 0 16px 32px rgba(0, 137, 123, 0.18);
}

.empty-state {
  padding: 40px 24px;
  text-align: center;
  color: rgba(31, 39, 51, 0.65);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-dialog {
  border-radius: 20px;
}

.custom-dialog__header {
  padding: 20px 24px 0;
}

.custom-dialog__header h4 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.custom-dialog__header p {
  margin: 6px 0 0;
  font-size: 14px;
  color: rgba(31, 39, 51, 0.6);
}

.custom-dialog__actions {
  padding: 12px 20px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.custom-entry {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  column-gap: 12px;
  row-gap: 12px;
  margin-top: 12px;
}

.custom-entry > .v-input {
  margin: 0;
  justify-self: start;
}

.custom-entry__inputs {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.custom-radio-option .v-selection-control__wrapper {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  min-height: 40px;
  padding-block: 0;
}

.custom-radio-option .v-selection-control__input {
  margin-top: 0;
}

.custom-radio-option .v-label {
  flex: 1 1 auto;
  padding-inline-start: 0;
}

.custom-entry__inputs .v-text-field:first-child {
  flex: 1 1 220px;
  min-width: 160px;
}

.custom-entry__inputs .v-text-field:last-child {
  flex: 0 0 110px;
  max-width: 110px;
}

@media (max-width: 900px) {
  .custom-entry__inputs {
    flex-wrap: wrap;
  }
  .custom-entry__inputs .v-text-field:first-child {
    flex: 1 1 100%;
    min-width: 0;
  }
  .custom-entry__inputs .v-text-field:last-child {
    flex: 1 1 140px;
    max-width: none;
  }
}

@media (max-width: 600px) {
  .pos-dialog {
    border-radius: 0;
  }
  
  .pos-dialog__header {
    flex-direction: column;
    align-items: stretch;
    padding: 16px 20px;
  }
  
  .pos-dialog__header-actions {
    justify-content: stretch;
    width: 100%;
  }
  
  .pos-dialog__header-actions .v-btn {
    flex: 1 1 auto;
    width: 100%;
  }
  
  .pos-dialog__content {
    padding: 8px 0;
  }
  
  .item-row {
    grid-template-columns: 1fr;
    padding: 16px 18px;
    gap: 12px;
  }
  
  .item-row__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .custom-entry {
    grid-template-columns: auto 1fr;
  }
  
  .custom-entry__inputs {
    flex-wrap: wrap;
  }
  
  .custom-entry__inputs .v-text-field {
    flex: 1 1 100%;
    min-width: 0;
  }
  
  .custom-dialog {
    border-radius: 0;
  }
}
</style>
  
<!-- <style>
    #id{
        /* text-field-details-padding-inline: 0px; */
        text-field-input-padding-start: 0px
    }
</style> -->