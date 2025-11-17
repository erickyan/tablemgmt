<template>
  <v-dialog v-model="internalOpen" fullscreen scrollable transition="dialog-bottom-transition">
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

      <v-card-text class="manager-content">
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

        <v-expansion-panels multiple>
          <v-expansion-panel
            v-for="(category, categoryIndex) in localMenu"
            :key="categoryIndex"
            class="manager-panel"
          >
            <v-expansion-panel-title>
              <div class="panel-header">
                <v-text-field
                  v-model="category.category"
                  label="Category Name"
                  variant="underlined"
                  density="comfortable"
                  class="panel-header__field"
                ></v-text-field>
                <div class="panel-header__meta">
                  <v-chip size="small" color="accent" variant="tonal">
                    {{ category.items.length }} items
                  </v-chip>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="accent"
                    @click.stop="removeCategory(categoryIndex)"
                    :title="'Remove category'"
                  ></v-btn>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div
                v-for="(item, itemIndex) in category.items"
                :key="itemIndex"
                class="item-row"
              >
                <div class="item-row__fields">
                  <v-text-field
                    v-model="item.name"
                    label="Item Name"
                    variant="outlined"
                    density="comfortable"
                    class="mr-md-4 flex-grow-1"
                  ></v-text-field>
                  <v-text-field
                    v-model.number="item.listPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    prefix="$"
                    label="Price"
                    variant="outlined"
                    density="comfortable"
                    style="max-width: 160px;"
                  ></v-text-field>
                </div>
                <div class="item-row__actions">
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="accent"
                    @click="removeItem(categoryIndex, itemIndex)"
                    :title="'Remove item'"
                  ></v-btn>
                </div>
              </div>
              <div class="item-row__add">
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
      
      // Ensure "Drinks" category exists - if not, initialize it with default drinks
      const hasDrinksCategory = this.localMenu.some(
        cat => cat?.category && cat.category.toLowerCase().trim() === 'drinks'
      )
      
      if (!hasDrinksCategory) {
        // Initialize drinks category with default drinks from DRINK_OPTIONS
        const store = this.$store || {}
        const state = store.state || {}
        const drinksItems = DRINK_OPTIONS.map(drink => ({
          name: drink.label,
          listPrice: drink.type === 'water' 
            ? Number(state.WATERPRICE || 0.27)
            : Number(state.DRINKPRICE || 1.75),
          quantity: 0,
        }))
        
        this.localMenu.push({
          category: 'Drinks',
          items: drinksItems,
        })
      }
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

.manager-panel {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 18px 36px rgba(15, 25, 35, 0.12);
  margin-bottom: 14px;
}

.panel-header {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.panel-header__field {
  flex: 1 1 220px;
}

.panel-header__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.item-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(15, 25, 35, 0.08);
}

.item-row:last-of-type {
  border-bottom: none;
  padding-bottom: 8px;
}

.item-row__fields {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 12px;
}

.item-row__actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
}

.item-row__add {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

@media (max-width: 600px) {
  .panel-header__meta {
    width: 100%;
    justify-content: space-between;
  }
  .item-row__actions {
    width: 100%;
    justify-content: flex-start;
  }
  .item-row__add {
    justify-content: flex-start;
  }
}
</style>
