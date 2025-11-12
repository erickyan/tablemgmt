<template>
  <v-dialog v-model="internalOpen" fullscreen scrollable transition="dialog-bottom-transition">
    <v-card>
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

      <v-card-text>
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
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center flex-wrap w-100">
                <v-text-field
                  v-model="category.category"
                  label="Category Name"
                  variant="underlined"
                  density="comfortable"
                  class="flex-grow-1"
                ></v-text-field>
                <v-btn
                  color="red"
                  icon="mdi-delete"
                  variant="tonal"
                  class="ml-4"
                  @click.stop="removeCategory(categoryIndex)"
                ></v-btn>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list density="comfortable">
                <v-list-item
                  v-for="(item, itemIndex) in category.items"
                  :key="itemIndex"
                  class="align-center"
                >
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="item.name"
                        label="Item Name"
                        variant="outlined"
                        density="comfortable"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="8" md="4">
                      <v-text-field
                        v-model.number="item.listPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        prefix="$"
                        label="Price"
                        variant="outlined"
                        density="comfortable"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="4" md="2" class="d-flex align-center">
                      <v-btn
                        color="red"
                        icon="mdi-delete"
                        variant="text"
                        @click="removeItem(categoryIndex, itemIndex)"
                      ></v-btn>
                    </v-col>
                  </v-row>
                </v-list-item>
              </v-list>
              <div class="text-right">
                <v-btn
                  color="primary"
                  variant="text"
                  @click="addItem(categoryIndex)"
                >
                  <v-icon start>mdi-plus</v-icon>
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
