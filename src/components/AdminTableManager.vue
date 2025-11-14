<template>
  <v-dialog v-model="internalOpen" max-width="800" scrollable transition="dialog-bottom-transition">
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
                        <span v-if="table.sitDownTime"> since {{ table.sitDownTime }}</span>
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
    <v-dialog v-model="showRemoveConfirm" max-width="400">
      <v-card>
        <v-card-title>Remove Table?</v-card-title>
        <v-card-text>
          Are you sure you want to remove <strong>Table {{ tableToRemove?.number }}</strong>?
          <span v-if="tableToRemove?.occupied" class="text-error">
            <br><br>Warning: This table is currently occupied. You cannot remove it.
          </span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showRemoveConfirm = false">Cancel</v-btn>
          <v-btn
            color="error"
            variant="flat"
            :disabled="tableToRemove?.occupied"
            @click="removeTable"
          >
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
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
      return Array.isArray(this.$store.state.tables) ? this.$store.state.tables : []
    },
  },
  methods: {
    close() {
      this.internalOpen = false
      this.showRemoveConfirm = false
      this.tableToRemove = null
    },
    addTable() {
      this.$store.commit('addTable')
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
      this.$store.commit('removeTable', this.tableToRemove.number)
      this.showRemoveConfirm = false
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
      this.$store.commit('updateTableName', {
        tableNumber: table.number,
        name: name || null
      })
      this.cancelEdit()
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
</style>

