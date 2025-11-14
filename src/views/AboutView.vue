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
      
      // Add regular menu categories
      if (Array.isArray(menu)) {
        menu.forEach((category, index) => {
          categories.push({
            title: category?.category || `Category ${index + 1}`,
            index,
            count: Array.isArray(category?.items) ? category.items.length : 0,
            color: this.categoryPalette[index % this.categoryPalette.length],
            isDrinks: false
          })
        })
      }
      
      // Add Drinks category as a special category (use -1 as index to differentiate)
      categories.push({
        title: 'Drinks',
        index: -1,
        count: 12, // Total number of drink options
        color: this.categoryPalette[categories.length % this.categoryPalette.length],
        isDrinks: true
      })
      
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
      return {
        background: `linear-gradient(135deg, ${category.color} 0%, rgba(255,255,255,0.08) 100%)`
      }
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
        <div class="category-card__header">
          <span class="category-icon">
            <v-icon size="22">{{ category.isDrinks ? 'mdi-cup-outline' : 'mdi-folder-outline' }}</v-icon>
          </span>
          <span class="category-count">{{ category.count }} items</span>
        </div>
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
  gap: 12px;
  padding: 18px;
  border-radius: 20px;
  border: none;
  color: #fff;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 12px 28px rgba(15, 25, 35, 0.2);
}

.category-card.is-active {
  box-shadow: 0 18px 36px rgba(15, 25, 35, 0.28);
  transform: translateY(-4px);
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 32px rgba(15, 25, 35, 0.24);
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
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.category-count {
  font-weight: 600;
}

.category-card__title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
}

@media (max-width: 600px) {
  .menu-view__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
