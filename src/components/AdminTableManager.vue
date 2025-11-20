<template>
  <v-dialog 
    v-model="internalOpen" 
    :max-width="$vuetify.display.xs ? '100%' : ($vuetify.display.tablet ? '950' : '800')"
    :fullscreen="$vuetify.display.xs"
    scrollable 
    transition="dialog-bottom-transition"
  >
    <v-card class="table-manager">
      <v-toolbar color="accent" density="comfortable" dark>
        <v-toolbar-title>Manage Tables</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-toolbar>

      <v-card-text class="pa-6">
        <div class="summary-bar mb-4">
          <v-chip color="accent" variant="tonal" size="small">
            <v-icon start size="18">mdi-table-multiple</v-icon>
            {{ tables.length }} Tables
          </v-chip>
        </div>

        <v-alert
          v-if="tables.length === 0"
          type="info"
          variant="tonal"
          class="mb-4"
        >
          No tables found. Click "Add Table" to create your first table.
        </v-alert>

        <div v-else class="tables-list">
          <v-card
            v-for="table in tables"
            :key="table.number"
            variant="outlined"
            class="mb-3 table-card"
            :class="{ 'table-occupied': table.occupied }"
          >
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="d-flex align-center flex-grow-1">
                  <v-icon 
                    :color="table.occupied ? 'error' : 'success'" 
                    class="mr-3"
                    size="24"
                  >
                    {{ table.occupied ? 'mdi-table-chair' : 'mdi-table' }}
                  </v-icon>
                  <div class="flex-grow-1">
                    <div class="d-flex align-center gap-2">
                      <v-text-field
                        v-if="editingTable === table.number"
                        v-model="editingTableName"
                        density="compact"
                        variant="outlined"
                        hide-details
                        autofocus
                        @keyup.enter="saveTableName(table)"
                        @keyup.esc="cancelEdit"
                        class="table-name-input"
                      ></v-text-field>
                      <div v-else class="text-h6 table-name-display" @dblclick="startEdit(table)">
                        {{ getTableDisplayName(table) }}
                      </div>
                      <v-btn
                        v-if="editingTable !== table.number"
                        icon="mdi-pencil"
                        variant="text"
                        size="small"
                        @click="startEdit(table)"
                        title="Edit table name"
                      >
                        <v-icon size="18">mdi-pencil</v-icon>
                      </v-btn>
                      <v-btn
                        v-if="editingTable === table.number"
                        icon="mdi-check"
                        variant="text"
                        color="success"
                        size="small"
                        @click="saveTableName(table)"
                        title="Save"
                      >
                        <v-icon size="18">mdi-check</v-icon>
                      </v-btn>
                      <v-btn
                        v-if="editingTable === table.number"
                        icon="mdi-close"
                        variant="text"
                        color="error"
                        size="small"
                        @click="cancelEdit"
                        title="Cancel"
                      >
                        <v-icon size="18">mdi-close</v-icon>
                      </v-btn>
                    </div>
                    <div class="text-caption text-medium-emphasis mt-1">
                      <span v-if="table.occupied">
                        Occupied
                        <span v-if="table.sitDownTime"> since {{ formatTime(table.sitDownTime) }}</span>
                      </span>
                      <span v-else>Available</span>
                    </div>
                  </div>
                </div>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  :disabled="table.occupied"
                  @click="confirmRemoveTable(table)"
                  :title="table.occupied ? 'Cannot remove occupied table' : 'Remove table'"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn
          color="accent"
          variant="flat"
          @click="addTable"
          :disabled="saving"
        >
          <v-icon start>mdi-plus</v-icon>
          Add Table
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          variant="tonal"
          color="accent"
          @click="close"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Confirmation dialog for removing table -->
    <v-dialog 
      v-model="showRemoveConfirm" 
      :max-width="$vuetify.display.xs ? '95%' : '480'"
      persistent
      role="alertdialog"
      aria-labelledby="remove-table-title"
      aria-describedby="remove-table-description"
    >
      <v-card>
        <v-card-title class="text-h6" id="remove-table-title">
          <v-icon color="error" class="mr-2" aria-hidden="true">mdi-alert-circle</v-icon>
          Remove Table?
        </v-card-title>
        <v-card-text id="remove-table-description">
          <p class="mb-0">
            Are you sure you want to remove <strong>Table {{ tableToRemove?.number }}</strong>?
          </p>
          <span v-if="tableToRemove?.occupied" class="text-error d-block mt-2">
            <strong>Warning:</strong> This table is currently occupied. You cannot remove it.
          </span>
          <p v-else class="mt-2 text-medium-emphasis" style="font-size: 13px;">
            This action cannot be undone.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            variant="text" 
            @click="showRemoveConfirm = false"
            @keydown.enter.prevent="showRemoveConfirm = false"
            @keydown.esc="showRemoveConfirm = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :aria-label="`Confirm remove Table ${tableToRemove?.number || ''}`"
            :disabled="tableToRemove?.occupied"
            @click="removeTable"
            @keydown.enter.prevent="removeTable"
          >
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
import { showSuccess } from '../utils/successNotifications.js'
import { formatTime } from '../utils/timeUtils.js'

export default {
  name: 'AdminTableManager',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    saving: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      showRemoveConfirm: false,
      tableToRemove: null,
      editingTable: null,
      editingTableName: '',
    }
  },
  computed: {
    internalOpen: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      },
    },
    tables() {
      const tables = this.$store.state.tables.tables || {}
      if (Array.isArray(tables)) {
        return tables
      }
      // Convert object format to array, sorted by table number
      return Object.values(tables).sort((a, b) => {
        const numA = Number(a?.number || 0)
        const numB = Number(b?.number || 0)
        return numA - numB
      })
    },
  },
  methods: {
    close() {
      this.internalOpen = false
      this.showRemoveConfirm = false
      this.tableToRemove = null
    },
    addTable() {
      this.$store.dispatch('tables/addTable')
      const tables = this.$store.state.tables.tables || []
      const newTable = Array.isArray(tables) ? tables[tables.length - 1] : Object.values(tables).pop()
      const tableName = this.getTableDisplayName(newTable)
      showSuccess(`Table ${tableName} added`)
    },
    confirmRemoveTable(table) {
      if (table.occupied) {
        return
      }
      this.tableToRemove = table
      this.showRemoveConfirm = true
    },
    removeTable() {
      if (!this.tableToRemove || this.tableToRemove.occupied) {
        return
      }
      const tableName = this.getTableDisplayName(this.tableToRemove)
      this.$store.dispatch('tables/removeTable', this.tableToRemove.number)
      this.showRemoveConfirm = false
      showSuccess(`Table ${tableName} removed`)
      this.tableToRemove = null
    },
    getTableDisplayName(table) {
      return table.name && table.name.trim() ? table.name.trim() : `Table ${table.number}`
    },
    startEdit(table) {
      this.editingTable = table.number
      this.editingTableName = table.name || ''
    },
    cancelEdit() {
      this.editingTable = null
      this.editingTableName = ''
    },
    saveTableName(table) {
      const name = (this.editingTableName || '').trim()
      this.$store.dispatch('tables/updateTableName', {
        tableNumber: table.number,
        name: name || null
      })
      const displayName = name || `Table ${table.number}`
      showSuccess(`Table name updated to "${displayName}"`)
      this.cancelEdit()
    },
    formatTime(timestamp) {
      return formatTime(timestamp)
    },
  },
}
</script>

<style scoped>
.table-manager {
  border-radius: 8px;
}

.summary-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.tables-list {
  max-height: 500px;
  overflow-y: auto;
}

.table-card {
  transition: all 0.2s ease;
}

.table-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.table-occupied {
  border-color: rgba(211, 47, 47, 0.3);
  background-color: rgba(211, 47, 47, 0.02);
}

.table-name-display {
  cursor: pointer;
  user-select: none;
  min-width: 120px;
}

.table-name-display:hover {
  opacity: 0.7;
}

.table-name-input {
  max-width: 200px;
}

.gap-2 {
  gap: 8px;
}

@media (max-width: 600px) {
  .table-manager {
    border-radius: 0;
  }
  
  .v-toolbar {
    padding: 0 8px;
  }
  
  .v-toolbar-title {
    font-size: 16px;
  }
  
  .v-card-text {
    padding: 16px;
  }
  
  .table-card {
    margin-bottom: 12px;
  }
  
  .table-card .v-card-text {
    padding: 12px;
  }
  
  .d-flex.align-center.justify-space-between {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .table-name-input {
    max-width: 100%;
    width: 100%;
  }
  
  .v-card-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .v-card-actions .v-btn {
    width: 100%;
  }
}
</style>

