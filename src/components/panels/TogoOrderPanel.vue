<template>
  <div class="panel">
    <div class="panel__header">
      <div>
        <h3 class="panel__title">To-go summary</h3>
        <p class="panel__subtitle">
          {{ itemCount }} item{{ itemCount === 1 ? '' : 's' }} selected
        </p>
      </div>
      <v-chip
        size="small"
        color="accent"
        variant="tonal"
      >
        <v-icon start size="16">mdi-currency-usd</v-icon>
        ${{ totalWithTax.toFixed(2) }}
      </v-chip>
    </div>

    <div class="line-items" v-if="lineItems.length">
      <div
        v-for="item in lineItems"
        :key="item.name"
        class="line-item"
      >
        <div class="line-item__info">
          <div class="line-item__label">{{ item.name }}</div>
          <div class="line-item__meta">
            Qty {{ item.quantity }}
            <span v-if="item.note">• {{ item.note }}</span>
          </div>
        </div>
        <div class="line-item__amount">
          ${{ item.total.toFixed(2) }}
        </div>
      </div>
    </div>
    <div class="line-items line-items--empty" v-else>
      <v-icon size="28" color="accent">mdi-food-takeout-box</v-icon>
      <p>No to-go items have been added yet.</p>
    </div>

    <div class="panel__summary">
      <div class="summary-row">
        <span>Subtotal</span>
        <strong>${{ subtotal.toFixed(2) }}</strong>
      </div>
      <div class="summary-row">
        <span>Estimated total</span>
        <strong class="summary-accent">
          ${{ totalWithTax.toFixed(2) }}
        </strong>
      </div>
    </div>

    <div class="panel__actions">
      <v-btn
        block
        variant="outlined"
        color="accent"
        class="mb-2"
        :disabled="!lineItems.length"
        @click="emitEdit"
      >
        <v-icon start>mdi-pencil-outline</v-icon>
        Edit items
      </v-btn>
      <v-btn
        block
        variant="outlined"
        color="accent"
        class="mb-2"
        :disabled="!lineItems.length"
        @click="emitPrint"
      >
        <v-icon start>mdi-printer</v-icon>
        Print
      </v-btn>
      <v-btn
        block
        variant="flat"
        color="success"
        :disabled="!lineItems.length"
        @click="emitPaid"
      >
        <v-icon start>mdi-cash-check</v-icon>
        Mark paid
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TogoOrderPanel',
  emits: ['edit', 'print', 'paid'],
  computed: {
    selections() {
      return this.$store.state.togo.togoLines || []
    },
    lineItems() {
      return this.selections
        .filter(item => Number(item.quantity ?? 0) > 0)
        .map(item => {
          const unitPrice = Number(item.basePrice ?? 0) + Number(item.extraPrice ?? 0)
          return {
            name: item.itemName,
            quantity: Number(item.quantity ?? 0),
            note: item.note || '',
            total: unitPrice * Number(item.quantity ?? 0)
          }
        })
    },
    itemCount() {
      return this.lineItems.reduce((sum, item) => sum + item.quantity, 0)
    },
    subtotal() {
      return this.lineItems.reduce((sum, item) => sum + item.total, 0)
    },
    totalWithTax() {
      const explicit = Number(this.$store.state.togo.totalTogoPrice || 0)
      if (explicit > 0) return explicit
      return this.subtotal * (this.$store.state.settings.TAX_RATE || 1.07)
    }
  },
  methods: {
    emitEdit() {
      this.$emit('edit')
    },
    emitPrint() {
      this.$emit('print')
    },
    emitPaid() {
      this.$emit('paid')
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
  align-items: center;
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

.line-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
  max-height: 340px;
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

.line-item__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.line-item__label {
  font-weight: 600;
}

.line-item__meta {
  font-size: 12px;
  color: rgba(31, 39, 51, 0.6);
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

.summary-accent {
  color: var(--v-theme-primary);
}

.panel__actions {
  display: flex;
  flex-direction: column;
}
</style>

