<template>
  <v-dialog
    v-model="dialogOpen"
    max-width="620"
    transition="dialog-bottom-transition"
  >
    <v-card class="pos-dialog">
      <div class="pos-dialog__header">
        <div>
          <h3 class="dialog-title">Current to-go order</h3>
          <p class="dialog-subtitle">
            Update quantities or edit line details before printing or marking paid.
          </p>
        </div>
        <v-btn
          size="small"
          variant="tonal"
          color="accent"
          @click="$store.dispatch('togo/calculateTogoTotal')"
        >
          <v-icon start>mdi-reload</v-icon>
          Refresh totals
        </v-btn>
      </div>

      <v-divider></v-divider>

      <div class="pos-dialog__content">
        <div v-if="!editableLines.length" class="empty-state">
          <v-icon size="36" color="accent">mdi-cart-outline</v-icon>
          <p>No items added yet.</p>
        </div>

        <div
          v-for="line in editableLines"
          :key="line.lineId"
          class="item-row"
        >
          <div class="item-info">
            <span class="item-title">{{ line.name }}</span>
            <span v-if="line.note" class="item-note">
              <v-icon size="16" icon="mdi-note-text-outline" class="me-1"></v-icon>
              {{ line.note }}
            </span>
          </div>
          <div class="item-pricing">
            <span class="price">${{ displayPrice(line).toFixed(2) }}</span>
            <div class="quantity-controls">
              <v-btn
                icon
                variant="text"
                density="comfortable"
                color="accent"
                @click="decrementLine(line)"
              >
                <v-icon size="32">mdi-minus</v-icon>
              </v-btn>
              <span class="quantity">{{ line.quantity }}</span>
              <v-btn
                icon
                variant="text"
                density="comfortable"
                color="accent"
                @click="incrementLine(line)"
              >
                <v-icon size="32">mdi-plus</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                density="comfortable"
                color="accent"
                @click="openEditDialog"
                :title="'Open edit dialog'"
              >
                <v-icon>mdi-square-edit-outline</v-icon>
              </v-btn>
            </div>
          </div>
        </div>
      </div>

      <v-divider></v-divider>

      <div class="pos-dialog__actions">
        <div class="totals">
          <span class="totals-label">Estimated total</span>
          <span class="totals-value">
            ${{ totalWithTax.toFixed(2) }}
          </span>
        </div>
        <div class="actions-right">
          <v-btn variant="outlined" color="accent" @click="printTogoReceipt" :disabled="!editableLines.length">
            <v-icon start>mdi-printer</v-icon>
            Print
          </v-btn>
          <v-btn variant="flat" color="success" @click="markPaid" :disabled="!editableLines.length">
            <v-icon start>mdi-cash-check</v-icon>
            Paid
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>


<script>
import { usePrinting } from '../composables/usePrinting.js'
import { showSuccess } from '../utils/successNotifications.js'

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'edit'],
  setup() {
    const { printTogoReceipt: printTogoReceiptComposable } = usePrinting()
    return { printTogoReceiptComposable }
  },
  computed: {
    dialogOpen: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    editableLines() {
      return (this.$store.state.togo.togoLines || []).map(line => ({
        lineId: line.lineId,
        name: line.itemName,
        quantity: Number(line.quantity ?? 0),
        note: line.note || '',
        basePrice: Number(line.basePrice ?? 0),
        extraPrice: Number(line.extraPrice ?? 0)
      }))
    },
    subtotal() {
      return this.editableLines.reduce((sum, line) => sum + this.displayPrice(line) * line.quantity, 0)
    },
    totalWithTax() {
      const explicit = Number(this.$store.state.togo.totalTogoPrice || 0)
      if (explicit > 0) return explicit
      return this.subtotal * (this.$store.state.settings.TAX_RATE || 1.07)
    }
  },
  methods: {
    displayPrice(line) {
      return Number(line.basePrice || 0) + Number(line.extraPrice || 0)
    },
    incrementLine(line) {
      this.$store.dispatch('togo/updateTogoLine', {
        lineId: line.lineId,
        quantity: line.quantity + 1
      })
    },
    decrementLine(line) {
      this.$store.dispatch('togo/updateTogoLine', {
        lineId: line.lineId,
        quantity: line.quantity - 1
      })
    },
    openEditDialog() {
      this.dialogOpen = false
      this.$emit('edit')
    },
    markPaid() {
      this.$store.dispatch('togo/payTogo')
      this.dialogOpen = false
    },
    async printTogoReceipt() {
      const items = this.editableLines.map(line => ({
        name: line.name,
        quantity: Number(line.quantity ?? 0),
        price: this.displayPrice(line),
        note: line.note
      }))

      await this.printTogoReceiptComposable({
        store: this.$store,
        items
      })
      showSuccess('To-go receipt printed')
    },
    markPaid() {
      this.$store.dispatch('togo/payTogo')
      this.dialogOpen = false
      showSuccess('To-go order marked as paid')
    }
  }
}
</script>

<style scoped>
.pos-dialog {
  border-radius: 26px;
  box-shadow: 0 24px 42px rgba(15, 25, 35, 0.2);
}

.pos-dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 20px 24px;
}

.dialog-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
}

.dialog-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: rgba(31, 39, 51, 0.6);
}

.pos-dialog__content {
  max-height: 60vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.empty-state {
  padding: 36px 24px;
  text-align: center;
  color: rgba(31, 39, 51, 0.65);
  display: flex;
  flex-direction: column;
  gap: 8px;
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

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-title {
  font-weight: 600;
  font-size: 17px;
}

.item-note {
  font-size: 13px;
  color: rgba(31, 39, 51, 0.65);
  display: inline-flex;
  align-items: center;
}

.item-pricing {
  display: flex;
  align-items: center;
  gap: 20px;
}

.price {
  font-size: 16px;
  font-weight: 700;
}

.quantity-controls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.quantity {
  font-size: 16px;
  font-weight: 600;
  width: 24px;
  text-align: center;
}

.pos-dialog__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  gap: 12px;
}

.totals {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.totals-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: rgba(31, 39, 51, 0.6);
}

.totals-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--v-theme-primary);
}

.actions-right {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 520px) {
  .item-row {
    grid-template-columns: 1fr;
  }
  .item-pricing {
    justify-content: space-between;
  }
  .pos-dialog__actions {
    flex-direction: column;
    align-items: stretch;
  }
  .actions-right {
    width: 100%;
    justify-content: stretch;
  }
  .actions-right .v-btn {
    flex: 1 1 auto;
  }
}
</style>