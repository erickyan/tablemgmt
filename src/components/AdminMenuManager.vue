<template>
  <v-dialog
    v-model="internalOpen"
    :max-width="$vuetify.display.xs ? '100%' : ($vuetify.display.tablet ? '950' : '800')"
    :fullscreen="$vuetify.display.xs"
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card class="menu-manager">
      <v-toolbar color="accent" density="comfortable" dark>
        <v-btn 
          icon="mdi-close" 
          @click="close"
          aria-label="Close menu manager"
          @keydown.enter.prevent="close"
          @keydown.esc="close"
        />
        <v-toolbar-title id="menu-manager-title">Manage Menu</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          icon="mdi-plus"
          class="mr-2"
          @click="addCategory"
          aria-label="Add category"
          @keydown.enter.prevent="addCategory"
        ></v-btn>
        <v-btn
          color="white"
          variant="text"
          :loading="$store.state.loadingStates.savingMenu"
          :disabled="$store.state.loadingStates.savingMenu"
          @click="save"
          aria-label="Save menu"
          @keydown.enter.prevent="save"
        >
          <v-icon start>mdi-content-save</v-icon>
          Save
        </v-btn>
      </v-toolbar>

      <v-card-text class="manager-content pa-6" id="menu-manager-description">
        <div class="summary-bar">
          <v-chip color="accent" variant="tonal" size="small">
            <v-icon start size="18">mdi-view-grid-plus</v-icon>
            {{ categoryCount }} Categories
          </v-chip>
          <v-chip color="accent" variant="tonal" size="small">
            <v-icon start size="18">mdi-silverware-fork-knife</v-icon>
            {{ itemCount }} Items
          </v-chip>
        </div>

        <v-alert
          v-if="localMenu.length === 0"
          type="info"
          variant="tonal"
          class="mb-4"
        >
          No menu data found. Click the plus button to add the first category.
        </v-alert>

        <v-expansion-panels multiple class="categories-container">
          <v-expansion-panel
            v-for="(category, categoryIndex) in localMenu"
            :key="categoryIndex"
            class="category-panel"
          >
            <v-expansion-panel-title>
              <div class="panel-header">
                <v-text-field
                  v-model="category.category"
                  label="Category Name"
                  variant="underlined"
                  :density="$vuetify.display.tablet && $vuetify.display.mdAndUp ? 'comfortable' : 'compact'"
                  hide-details
                  class="category-name-field"
                  @click.stop
                ></v-text-field>
                <div class="category-actions">
                  <v-btn
                    icon="mdi-delete-outline"
                    variant="text"
                    color="error"
                    size="small"
                    @click.stop="confirmDeleteCategory(categoryIndex)"
                    :aria-label="`Delete category ${localMenu[categoryIndex]?.category || categoryIndex + 1}`"
                    @keydown.enter.prevent="confirmDeleteCategory(categoryIndex)"
                    class="delete-btn"
                  ></v-btn>
                  <v-chip size="small" color="accent" variant="tonal" class="item-count-chip">
                    {{ category.items.length }} {{ category.items.length === 1 ? 'item' : 'items' }}
                  </v-chip>
                </div>
              </div>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <div class="category-content">
                <v-table :density="$vuetify.display.tablet && $vuetify.display.mdAndUp ? 'comfortable' : 'compact'" class="items-table">
                  <thead>
                    <tr>
                      <th class="text-left" style="width: 60%">Item Name</th>
                      <th class="text-right" style="width: 30%">Price</th>
                      <th class="text-center" style="width: 10%">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, itemIndex) in category.items"
                      :key="itemIndex"
                      class="item-table-row"
                    >
                      <td class="text-left" data-label="Item Name">
                        <v-text-field
                          v-model="item.name"
                          variant="plain"
                          :density="$vuetify.display.tablet && $vuetify.display.mdAndUp ? 'comfortable' : 'compact'"
                          hide-details
                          class="item-name-input"
                          placeholder="Item name"
                        ></v-text-field>
                      </td>
                      <td class="text-right" data-label="Price">
                        <v-text-field
                          v-model.number="item.listPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          prefix="$"
                          variant="plain"
                          :density="$vuetify.display.tablet && $vuetify.display.mdAndUp ? 'comfortable' : 'compact'"
                          hide-details
                          class="item-price-input"
                          placeholder="0.00"
                        ></v-text-field>
                      </td>
                      <td class="text-center" data-label="">
                        <v-btn
                          icon="mdi-delete-outline"
                          variant="text"
                          color="error"
                          size="small"
                          @click="confirmDeleteItem(categoryIndex, itemIndex)"
                          :aria-label="`Delete menu item ${localMenu[categoryIndex]?.items[itemIndex]?.name || itemIndex + 1}`"
                          @keydown.enter.prevent="confirmDeleteItem(categoryIndex, itemIndex)"
                          class="delete-btn"
                        ></v-btn>
                      </td>
                    </tr>
                    <tr v-if="category.items.length === 0" class="empty-row">
                      <td colspan="3" class="text-center text-medium-emphasis py-4">
                        No items in this category
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                
                <div class="add-item-section">
                  <v-btn
                    color="accent"
                    variant="tonal"
                    size="small"
                    @click="addItem(categoryIndex)"
                  >
                    <v-icon start size="18">mdi-plus</v-icon>
                    Add Item
                  </v-btn>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>

    <!-- Delete Category Confirmation Dialog -->
    <v-dialog 
      v-model="showDeleteConfirm" 
      :max-width="$vuetify.display.xs ? '95%' : '480'"
      persistent
      role="alertdialog"
      aria-labelledby="delete-category-title"
      aria-describedby="delete-category-description"
    >
      <v-card>
        <v-card-title class="text-h6" id="delete-category-title">
          <v-icon color="error" class="mr-2" aria-hidden="true">mdi-alert-circle</v-icon>
          Delete Category?
        </v-card-title>
        <v-card-text id="delete-category-description">
          <p class="mb-0">
            Are you sure you want to delete 
            <strong>"{{ categoryToDelete !== null ? localMenu[categoryToDelete]?.category : '' }}"</strong>?
          </p>
          <p class="mt-2 text-medium-emphasis" style="font-size: 13px;">
            This will also delete all items in this category. This action cannot be undone.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            variant="text" 
            @click="cancelDelete"
            @keydown.enter.prevent="cancelDelete"
            @keydown.esc="cancelDelete"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="error" 
            variant="flat" 
            @click="removeCategory"
            @keydown.enter.prevent="removeCategory"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Item Confirmation Dialog -->
    <v-dialog 
      v-model="showDeleteItemConfirm" 
      :max-width="$vuetify.display.xs ? '95%' : '480'"
      persistent
      role="alertdialog"
      aria-labelledby="delete-item-title"
      aria-describedby="delete-item-description"
    >
      <v-card>
        <v-card-title class="text-h6" id="delete-item-title">
          <v-icon color="error" class="mr-2" aria-hidden="true">mdi-alert-circle</v-icon>
          Delete Menu Item?
        </v-card-title>
        <v-card-text id="delete-item-description">
          <p class="mb-0">
            Are you sure you want to delete 
            <strong>"{{ itemToDelete !== null ? (localMenu[itemToDelete.categoryIndex]?.items[itemToDelete.itemIndex]?.name || 'this item') : '' }}"</strong>?
          </p>
          <p class="mt-2 text-medium-emphasis" style="font-size: 13px;">
            This action cannot be undone.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            variant="text" 
            @click="cancelDeleteItem"
            @keydown.enter.prevent="cancelDeleteItem"
            @keydown.esc="cancelDeleteItem"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="error" 
            variant="flat" 
            @click="removeItem"
            @keydown.enter.prevent="removeItem"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script>
import { DRINK_OPTIONS } from '../utils/drinkOptions.js'

export default {
  name: 'AdminMenuManager',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    menu: {
      type: Array,
      default: () => [],
    },
    saving: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'save'],
  data() {
    return {
      localMenu: [],
      showDeleteConfirm: false,
      categoryToDelete: null,
      showDeleteItemConfirm: false,
      itemToDelete: null,
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
    categoryCount() {
      return this.localMenu.length
    },
    itemCount() {
      return this.localMenu.reduce((acc, category) => acc + (category.items?.length || 0), 0)
    }
  },
  watch: {
    modelValue(value) {
      if (value) {
        this.syncMenu()
      }
    },
    menu: {
      deep: true,
      handler() {
        if (this.modelValue) {
          this.syncMenu()
        }
      },
    },
  },
  methods: {
    syncMenu() {
      this.localMenu = Array.isArray(this.menu)
        ? this.menu.map(category => ({
            category: category?.category || '',
            items: Array.isArray(category?.items)
              ? category.items.map(item => ({
                  name: item?.name || '',
                  listPrice: Number(item?.listPrice ?? 0),
                  quantity: Number(item?.quantity ?? 0),
                }))
              : [],
          }))
        : []
      
      // Note: Drinks category is optional - user can add/remove it as needed
      // No longer auto-creating it to allow users to remove it if desired
    },
    addCategory() {
      this.localMenu.push({
        category: 'New Category',
        items: [],
      })
    },
    confirmDeleteCategory(index) {
      this.categoryToDelete = index
      this.showDeleteConfirm = true
    },
    removeCategory() {
      if (this.categoryToDelete !== null) {
        this.localMenu.splice(this.categoryToDelete, 1)
        this.categoryToDelete = null
      }
      this.showDeleteConfirm = false
    },
    cancelDelete() {
      this.categoryToDelete = null
      this.showDeleteConfirm = false
    },
    addItem(categoryIndex) {
      if (!this.localMenu[categoryIndex]) return
      this.localMenu[categoryIndex].items.push({
        name: 'New Item',
        listPrice: 0,
        quantity: 0,
      })
    },
    confirmDeleteItem(categoryIndex, itemIndex) {
      this.itemToDelete = { categoryIndex, itemIndex }
      this.showDeleteItemConfirm = true
    },
    removeItem() {
      if (this.itemToDelete !== null) {
        const { categoryIndex, itemIndex } = this.itemToDelete
        if (this.localMenu[categoryIndex]) {
          this.localMenu[categoryIndex].items.splice(itemIndex, 1)
        }
        this.itemToDelete = null
      }
      this.showDeleteItemConfirm = false
    },
    cancelDeleteItem() {
      this.itemToDelete = null
      this.showDeleteItemConfirm = false
    },
    close() {
      this.$emit('update:modelValue', false)
    },
    save() {
      const sanitized = this.localMenu.map(category => ({
        category: category.category?.trim() || 'Untitled Category',
        items: category.items
          .filter(item => item.name?.trim())
          .map(item => ({
            name: item.name.trim(),
            listPrice: Number(item.listPrice ?? 0),
            quantity: Number(item.quantity ?? 0),
          })),
      }))
      this.$emit('save', sanitized)
    },
  },
}
</script>

<style scoped>
.menu-manager {
  background: linear-gradient(180deg, rgba(245, 247, 252, 0.92), rgba(255, 255, 255, 0.95));
  border-radius: 28px;
  box-shadow: 0 26px 48px rgba(15, 25, 35, 0.26);
}

.manager-content {
  padding-bottom: 32px;
}

.summary-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.categories-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-panel {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(15, 25, 35, 0.1);
  margin-bottom: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  flex-wrap: nowrap;
}

.category-name-field {
  flex: 1;
  min-width: 0;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  width: 140px;
  justify-content: flex-start;
}

.item-count-chip {
  font-weight: 500;
}

.delete-btn {
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
}

.category-content {
  padding: 16px 0 0 0 !important;
}

.items-table {
  width: 100%;
}

.items-table thead th {
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(0, 0, 0, 0.6);
  padding: 12px 16px;
  background: rgba(var(--v-theme-surface), 0.3);
  border-bottom: 2px solid rgba(0, 0, 0, 0.12);
}

.items-table thead th.text-left {
  text-align: left;
}

.items-table thead th.text-right {
  text-align: right;
}

.items-table thead th.text-center {
  text-align: center;
}

.item-table-row {
  transition: background-color 0.2s;
}

.item-table-row:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.item-table-row td {
  padding: 12px 16px;
  vertical-align: middle;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.item-table-row td.text-left {
  text-align: left;
}

.item-table-row td.text-right {
  text-align: right;
}

.item-table-row td.text-center {
  text-align: center;
}

.item-table-row:last-child td {
  border-bottom: none;
}

.item-name-input {
  font-size: 14px;
  width: 100%;
}

.item-name-input :deep(.v-field) {
  padding: 0;
}

.item-name-input :deep(.v-field__input) {
  min-height: 40px;
  padding: 8px 12px;
  font-size: 14px;
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .item-name-input {
    font-size: 16px;
  }
  
  .item-name-input :deep(.v-field__input) {
    min-height: 48px;
    padding: 12px 16px;
    font-size: 16px;
  }
}

.item-price-input {
  font-size: 14px;
  width: 100%;
}

.item-price-input :deep(.v-field) {
  padding: 0;
}

.item-price-input :deep(.v-field__input) {
  min-height: 40px;
  padding: 8px 12px;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .item-price-input {
    font-size: 16px;
  }
  
  .item-price-input :deep(.v-field__input) {
    min-height: 48px;
    padding: 12px 16px;
    font-size: 16px;
  }
}

.category-name-field {
  font-size: 14px;
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .category-name-field {
    font-size: 16px;
  }
}

.empty-row td {
  padding: 24px;
  font-style: italic;
}

/* Focus indicators for accessibility */
.delete-btn:focus-visible,
.v-btn:focus-visible,
button:focus-visible {
  outline: 2px solid rgba(0, 137, 123, 0.6);
  outline-offset: 2px;
}

.add-item-section {
  padding: 12px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(var(--v-theme-surface), 0.3);
}

@media (max-width: 960px) {
  .category-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .category-name-field {
    max-width: 100%;
  }
  
  .category-actions {
    justify-content: space-between;
  }
  
  .items-table {
    font-size: 13px;
  }
  
  .item-table-row td {
    padding: 6px 12px;
  }
}

@media (max-width: 600px) {
  .menu-manager {
    border-radius: 0;
  }
  
  .manager-content {
    padding: 16px;
  }
  
  .v-toolbar {
    padding: 0 8px;
  }
  
  .v-toolbar-title {
    font-size: 16px;
  }
  
  .panel-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .category-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .items-table thead {
    display: none;
  }
  
  .item-table-row {
    display: block;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 8px;
    margin-bottom: 8px;
    padding: 12px;
  }
  
  .item-table-row td {
    display: block;
    padding: 4px 0;
    text-align: left !important;
  }
  
  .item-table-row td:before {
    content: attr(data-label);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(0, 0, 0, 0.6);
    display: block;
    margin-bottom: 4px;
  }
  
  .item-table-row td.text-right:before {
    content: "Price: ";
  }
  
  .item-table-row td.text-center {
    text-align: right !important;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);
  }
  
  .item-table-row td.text-center:before {
    display: none;
  }
  
  .v-dialog > .v-card > .v-card-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .v-dialog > .v-card > .v-card-actions .v-btn {
    width: 100%;
  }
}
</style>
