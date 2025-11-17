<template>
  <v-dialog
    v-model="internalOpen"
    :max-width="isMobile ? '100%' : '860'"
    :fullscreen="isMobile"
    scrollable
    transition="dialog-bottom-transition"
  >
    <v-card class="menu-manager">
      <v-toolbar color="accent" density="comfortable" dark>
        <v-btn icon="mdi-close" @click="close" />
        <v-toolbar-title>Manage Menu</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          icon="mdi-plus"
          class="mr-2"
          @click="addCategory"
          :title="'Add Category'"
        ></v-btn>
        <v-btn
          color="white"
          variant="text"
          :disabled="saving"
          @click="save"
        >
          <v-icon start>mdi-content-save</v-icon>
          Save
        </v-btn>
      </v-toolbar>

      <v-card-text class="manager-content pa-6 pa-4-mobile">
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
                  density="compact"
                  hide-details
                  class="category-name-field"
                  @click.stop
                ></v-text-field>
                <div class="category-actions">
                  <v-chip size="small" color="accent" variant="tonal" class="item-count-chip">
                    {{ category.items.length }} {{ category.items.length === 1 ? 'item' : 'items' }}
                  </v-chip>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                    @click.stop="removeCategory(categoryIndex)"
                    :title="'Remove category'"
                  ></v-btn>
                </div>
              </div>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <div class="category-content">
                <v-table density="compact" class="items-table">
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
                          density="compact"
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
                          density="compact"
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
                          @click="removeItem(categoryIndex, itemIndex)"
                          :title="'Remove item'"
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
    isMobile() {
      // Check if Vuetify display service is available, otherwise fallback to window width
      if (this.$vuetify && this.$vuetify.display) {
        return this.$vuetify.display.mobile || this.$vuetify.display.width < 768
      }
      return window.innerWidth < 768
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
    removeCategory(index) {
      this.localMenu.splice(index, 1)
    },
    addItem(categoryIndex) {
      if (!this.localMenu[categoryIndex]) return
      this.localMenu[categoryIndex].items.push({
        name: 'New Item',
        listPrice: 0,
        quantity: 0,
      })
    },
    removeItem(categoryIndex, itemIndex) {
      if (!this.localMenu[categoryIndex]) return
      this.localMenu[categoryIndex].items.splice(itemIndex, 1)
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

@media (max-width: 768px) {
  .menu-manager {
    border-radius: 0;
  }
}

.manager-content {
  padding-bottom: 32px;
}

@media (max-width: 768px) {
  .manager-content {
    padding: 16px !important;
  }
  
  .pa-4-mobile {
    padding: 16px !important;
  }
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
  flex-wrap: wrap;
}

.category-name-field {
  flex: 1;
  max-width: 400px;
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.item-count-chip {
  font-weight: 500;
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

.empty-row td {
  padding: 24px;
  font-style: italic;
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
}
</style>
