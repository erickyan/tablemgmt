<script>
import { translate } from '../utils/translations.js'

export default {
  data: () => ({
    togoCompose: false,
    categoryPalette: ['#FF7043', '#FFA726', '#AB47BC', '#42A5F5', '#26A69A', '#7E57C2', '#EC407A', '#66BB6A'],
    listenersRegistered: false,
    activeCategoryIndex: 0,
    pendingFocusIndex: null
  }),
  computed: {
    menuCategories() {
      const menu = this.$store.state.menu
      const categories = []
      
      // Find drinks category in menu (if it exists)
      const drinksCategory = Array.isArray(menu)
        ? menu.find(cat => cat?.category && cat.category.toLowerCase().trim() === 'drinks')
        : null
      
      // Add regular menu categories (excluding Drinks if it exists, since we'll add it separately)
      if (Array.isArray(menu)) {
        menu.forEach((category, index) => {
          // Skip the drinks category - we'll add it as a special category below
          const isDrinks = category?.category && category.category.toLowerCase().trim() === 'drinks'
          if (isDrinks) {
            return
          }
          
          categories.push({
            title: category?.category || `Category ${index + 1}`,
            index,
            count: Array.isArray(category?.items) ? category.items.length : 0,
            color: this.categoryPalette[categories.length % this.categoryPalette.length],
            isDrinks: false
          })
        })
      }
      
      // Add Drinks category as a special category only if it exists in the menu
      // Use -1 as index to differentiate it from regular categories
      if (drinksCategory) {
        const drinksCount = Array.isArray(drinksCategory.items)
          ? drinksCategory.items.length
          : 12 // Default count from DRINK_OPTIONS
        
        categories.push({
          title: 'Drinks',
          index: -1,
          count: drinksCount,
          color: this.categoryPalette[categories.length % this.categoryPalette.length],
          isDrinks: true
        })
      }
      
      // Translate category titles for display
      return categories.map(cat => ({
        ...cat,
        title: cat.isDrinks ? this.getTranslatedLabel(cat.title) : cat.title
      }))
    },
    isChinese() {
      return this.$store.state.language === 'zh'
    }
  },
  methods: {
    getTranslatedLabel(label) {
      return translate(label, this.isChinese)
    },
    categoryStyle(category) {
      // Create a richer gradient with better contrast
      // Use the category color with darker shades for depth
      return {
        background: `linear-gradient(135deg, ${category.color} 0%, ${this.darkenColor(category.color, 15)} 100%)`,
        color: '#ffffff'
      }
    },
    darkenColor(hex, percent) {
      // Convert hex to RGB
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      
      // Darken each component
      const newR = Math.max(0, Math.floor(r * (1 - percent / 100)))
      const newG = Math.max(0, Math.floor(g * (1 - percent / 100)))
      const newB = Math.max(0, Math.floor(b * (1 - percent / 100)))
      
      // Convert back to hex
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
    },
    selectCategory(categoryArrayIndex) {
      const targetIndex = Number.isFinite(categoryArrayIndex) ? categoryArrayIndex : 0
      if (!this.menuCategories.length) {
        this.activeCategoryIndex = 0
        return
      }
      const safeIndex = Math.min(Math.max(targetIndex, 0), this.menuCategories.length - 1)
      this.activeCategoryIndex = safeIndex
      this.pendingFocusIndex = null
      // Get the category object at this position
      const category = this.menuCategories[safeIndex]
      if (category && category.isDrinks) {
        this.$store.state.catID = -1 // Special marker for drinks
      } else if (category) {
        this.$store.state.catID = category.index // Use the category's actual index
      } else {
        this.$store.state.catID = 0 // Fallback
      }
      this.$store.commit('setOrderPanel', { type: 'togo' })
    },
    handleCategoryTap(categoryArrayIndex) {
      // categoryArrayIndex is the position in the menuCategories array
      this.selectCategory(categoryArrayIndex)
      this.togoCompose = true
      this.$store.commit('setOrderPanel', { type: 'togo' })
    },
    registerPanelListeners() {
      if (this.listenersRegistered) return
      window.addEventListener('pos-open-togo-builder', this.handleOpenTogoBuilder)
      this.listenersRegistered = true
    },
    unregisterPanelListeners() {
      if (!this.listenersRegistered) return
      window.removeEventListener('pos-open-togo-builder', this.handleOpenTogoBuilder)
      this.listenersRegistered = false
    },
    handleOpenTogoBuilder(event) {
      const detail = event?.detail || {}
      const fromKnownSource = typeof detail.source === 'string'
      if (!fromKnownSource && !Number.isInteger(detail.categoryIndex) && !Number.isInteger(detail.itemIndex)) {
        return
      }
      if (Number.isInteger(detail.categoryIndex)) {
        this.selectCategory(detail.categoryIndex)
      } else {
        this.$store.commit('setOrderPanel', { type: 'togo' })
      }
      if (Number.isInteger(detail.itemIndex)) {
        this.pendingFocusIndex = detail.itemIndex
      } else {
        this.pendingFocusIndex = null
      }
      this.togoCompose = true
    }
  },
  mounted() {
    const catID = Number(this.$store.state.catID || 0)
    // Find the array index that corresponds to this catID
    if (catID === -1) {
      // Find drinks category array index
      const drinksIndex = this.menuCategories.findIndex(cat => cat.isDrinks)
      this.activeCategoryIndex = drinksIndex >= 0 ? drinksIndex : 0
    } else {
      // Find regular category array index
      const categoryIndex = this.menuCategories.findIndex(cat => cat.index === catID && !cat.isDrinks)
      this.activeCategoryIndex = categoryIndex >= 0 ? categoryIndex : 0
    }
    this.selectCategory(this.activeCategoryIndex)
    this.$store.commit('setOrderPanel', { type: 'togo' })
    this.registerPanelListeners()
  },
  beforeUnmount() {
    this.unregisterPanelListeners()
    this.$store.commit('setOrderPanel', null)
  },
  watch: {
    '$store.state.catID'(value) {
      const parsed = Number(value || 0)
      if (Number.isNaN(parsed)) {
        return
      }
      // Find the array index that corresponds to this catID
      let newIndex = 0
      if (parsed === -1) {
        const drinksIndex = this.menuCategories.findIndex(cat => cat.isDrinks)
        newIndex = drinksIndex >= 0 ? drinksIndex : 0
      } else {
        const categoryIndex = this.menuCategories.findIndex(cat => cat.index === parsed && !cat.isDrinks)
        newIndex = categoryIndex >= 0 ? categoryIndex : 0
      }
      if (newIndex !== this.activeCategoryIndex) {
        this.activeCategoryIndex = newIndex
      }
    },
    togoCompose(value) {
      if (!value) {
        this.pendingFocusIndex = null
      }
    }
  }
}
</script>

<template>
  <section class="menu-view">
    <div class="menu-view__header">
      <div>
        <h2 class="menu-title">{{ getTranslatedLabel('To-go menu') }}</h2>
        <p class="menu-subtitle">
          {{ getTranslatedLabel('Tap a category, then add items with the controls below.') }}
        </p>
      </div>
    </div>

    <div v-if="menuCategories.length" class="category-grid">
      <button
        v-for="(category, arrayIndex) in menuCategories"
        :key="category.index === -1 ? 'drinks' : `cat-${category.index}`"
        class="category-card"
        type="button"
        :class="{ 'is-active': activeCategoryIndex === arrayIndex }"
        @click="handleCategoryTap(arrayIndex)"
        :style="categoryStyle(category)"
      >
        <div class="category-card__title">
          {{ category.title }}
        </div>
      </button>
    </div>
    <v-alert
      v-else
      type="info"
      variant="tonal"
      class="mt-4"
    >
      Menu data is not available yet. Please configure the menu from the admin panel.
    </v-alert>

    <togo-details
      v-model="togoCompose"
      ref="togoDetails"
      :focus-index="pendingFocusIndex"
      @close="pendingFocusIndex = null"
    ></togo-details>
  </section>
</template>


<style scoped>
.menu-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.menu-view__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.menu-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.menu-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(31, 39, 51, 0.65);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 18px;
}

@media (min-width: 600px) {
  .category-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 820px) {
  .category-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.category-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 32px 20px;
  border-radius: 20px;
  border: none;
  color: #ffffff;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  min-height: 120px;
}

.category-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  z-index: 1;
}

.category-card > * {
  position: relative;
  z-index: 2;
}

.category-card.is-active {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
  opacity: 1;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0.95;
}

.category-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.category-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.category-count {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.category-card__title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.4;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.3px;
  text-align: center;
}

@media (max-width: 600px) {
  .menu-view__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
