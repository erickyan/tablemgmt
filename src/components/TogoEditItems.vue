<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="760"
    transition="dialog-bottom-transition"
  >
    <v-card class="togo-edit-dialog">
      <div class="togo-edit-dialog__header">
        <div>
          <h3 class="dialog-title">Edit to-go items</h3>
          <p class="dialog-subtitle">
            Adjust quantities or add special requests for the selected items.
          </p>
        </div>
        <v-btn
          color="accent"
          variant="flat"
          @click="closeDialog"
        >
          Done
        </v-btn>
      </div>

      <v-divider></v-divider>

      <v-card-text>
        <div v-if="editableItems.length" class="editable-list">
          <div
            v-for="item in editableItems"
            :key="item.name"
            class="editable-row"
          >
            <div class="editable-row__info">
              <div class="editable-row__title">{{ item.name }}</div>
              <div class="editable-row__meta">
                <span class="price">${{ item.price.toFixed(2) }}</span>
                <span v-if="item.note" class="note">• {{ item.note }}</span>
              </div>
            </div>
            <div class="editable-row__actions">
              <div class="quantity-control">
                <v-btn
                  icon
                  variant="text"
                  density="comfortable"
                  color="accent"
                  @click="decrementItem(item)"
                  :disabled="item.quantity <= 0"
                >
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
                <span>{{ item.quantity }}</span>
                <v-btn
                  icon
                  variant="text"
                  density="comfortable"
                  color="accent"
                  @click="incrementItem(item)"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </div>
              <v-btn
                size="small"
                variant="outlined"
                color="accent"
                @click="openCustomization(item)"
              >
                <v-icon start size="16">mdi-note-edit</v-icon>
                Special request
              </v-btn>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <v-icon size="36" color="accent">mdi-food-takeout-box</v-icon>
          <p>No to-go items have been added yet.</p>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-text class="totals">
        <div class="summary-row">
          <span>Subtotal</span>
          <strong>${{ subtotal.toFixed(2) }}</strong>
        </div>
        <div class="summary-row">
          <span>Estimated total</span>
          <strong>${{ totalWithTax.toFixed(2) }}</strong>
        </div>
      </v-card-text>
    </v-card>

    <v-dialog v-model="customizationDialog.open" max-width="420">
      <v-card class="custom-dialog">
        <div class="custom-dialog__header">
          <h4>Special request</h4>
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
export default {
  name: 'TogoEditItems',
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
    editableItems() {
      const lines = this.$store.state.togoLines || []
      return lines.map(line => ({
         lineId: line.lineId,
         name: line.itemName,
         quantity: Number(line.quantity ?? 0),
         note: line.note || '',
         basePrice: Number(line.basePrice ?? 0),
         extraPrice: Number(line.extraPrice ?? 0),
        categoryIndex: line.categoryIndex,
        itemIndex: line.itemIndex,
         price: Number(line.basePrice ?? 0) + Number(line.extraPrice ?? 0)
       }))
     },
    subtotal() {
      return this.editableItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },
    totalWithTax() {
      const explicit = Number(this.$store.state.totalTogoPrice || 0)
      if (explicit > 0) return explicit
      return this.subtotal * this.$store.state.TAX_RATE
    }
  },
  methods: {
    closeDialog() {
      this.dialogOpen = false
    },
    incrementItem(item) {
      const nextQuantity = Number(item.quantity ?? 0) + 1
      this.$store.commit('updateTogoLine', {
        lineId: item.lineId,
        quantity: nextQuantity
      })
    },
    decrementItem(item) {
      const nextQuantity = Number(item.quantity ?? 0) - 1
      this.$store.commit('updateTogoLine', {
        lineId: item.lineId,
        quantity: nextQuantity
      })
    },
    openCustomization(item) {
      const current = {
        label: item.note || 'No special request',
        price: Number(item.extraPrice || 0)
      }
      let selectedOption = this.customizationOptions.find(option =>
        option.label === current.label && Number(option.price) === Number(current.price)
      )
      let customLabel = ''
      let customPrice = '0'
      if (!selectedOption) {
        customLabel = current.label || ''
        customPrice = String(current.price || 0)
        this.customOptionRef = {
          label: customLabel,
          price: Number(customPrice || 0),
          custom: true
        }
        selectedOption = this.customOptionRef
      } else {
        this.customOptionRef = { label: '', price: 0, custom: true }
      }
      this.customizationDialog = {
        open: true,
        item,
        selected: selectedOption,
        customLabel,
        customPrice
      }
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
      this.$store.commit('updateTogoLine', {
        lineId: this.customizationDialog.item.lineId,
        note: label,
        extraPrice: Number(option.price || 0)
      })
      this.customizationDialog.open = false
    },
    optionLabel(option) {
      if (!option) return ''
      if (option.custom) {
        const label = (this.customizationDialog.customLabel || '').trim()
        const price = Number(this.customizationDialog.customPrice || 0)
        const displayLabel = label || 'Custom'
        if (price > 0) {
          return `${displayLabel} (+$${price.toFixed(2)})`
        }
        return displayLabel
      }
      const price = Number(option.price || 0)
      if (price > 0) {
        return `${option.label} (+$${price.toFixed(2)})`
      }
      return option.label
    }
  },
  watch: {
    dialogOpen(value) {
      if (!value) {
        this.dialogOpen = false
        this.customizationDialog = {
          open: false,
          item: null,
          selected: null,
          customLabel: '',
          customPrice: '0'
        }
        this.customOptionRef = { label: '', price: 0, custom: true }
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
.togo-edit-dialog {
  border-radius: 26px;
  box-shadow: 0 24px 42px rgba(15, 25, 35, 0.22);
  overflow: hidden;
}

.togo-edit-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
}

.dialog-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.dialog-subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: rgba(31, 39, 51, 0.6);
}

.editable-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editable-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.65);
  box-shadow: 0 12px 24px rgba(15, 25, 35, 0.16);
}

.editable-row__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.editable-row__title {
  font-size: 18px;
  font-weight: 700;
  color: rgba(31, 39, 51, 0.95);
}

.editable-row__meta {
  font-size: 13px;
  color: rgba(31, 39, 51, 0.65);
  display: inline-flex;
  gap: 12px;
  align-items: center;
}

.editable-row__meta .price {
  font-weight: 700;
  color: rgba(31, 39, 51, 0.92);
}

.editable-row__meta .note {
  font-style: italic;
}

.editable-row__actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  padding: 6px 14px;
  box-shadow: inset 0 0 0 1px rgba(15, 25, 35, 0.1);
  font-weight: 600;
}

.quantity-control span {
  min-width: 24px;
  text-align: center;
}

.empty-state {
  padding: 40px 24px;
  text-align: center;
  color: rgba(31, 39, 51, 0.65);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.totals {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 15px;
}

.summary-row strong {
  font-weight: 700;
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
  .togo-edit-dialog__header {
    flex-direction: column;
    align-items: stretch;
  }
  .editable-row {
    flex-direction: column;
    align-items: stretch;
  }
  .editable-row__actions {
    justify-content: space-between;
  }
  .quantity-control {
    width: 100%;
    justify-content: center;
  }
}
</style>
