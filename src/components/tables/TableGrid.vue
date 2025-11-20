<template>
  <div class="floor-plan__grid">
    <table-tile
      v-for="(tableIndex, index) in tableOrder"
      :key="`table-${index}-${tableIndex}`"
      v-memo="[
        tableIndex,
        getTableCached(tableIndex)?.occupied,
        getTableCached(tableIndex)?.adult,
        getTableCached(tableIndex)?.bigKid,
        getTableCached(tableIndex)?.smlKid,
        getTableCached(tableIndex)?.drinks?.length,
        getTableCached(tableIndex)?.togo,
        getTableCached(tableIndex)?.totalPrice,
        getTableCached(tableIndex)?.goodPpl,
        getTableCached(tableIndex)?.sitDownTime,
        getTableCached(tableIndex)?.name,
        getTableCached(tableIndex)?.pricingModeDinner,
        isDinner,
        getTableTotalPrice(tableIndex),
        isOccupiedOverHour(tableIndex),
        draggedIndex === index,
        draggedOverIndex === index,
        currentLanguage
      ]"
      :table-index="tableIndex"
      :table="getTableCached(tableIndex)"
      :status="getTableStatus(tableIndex)"
      :table-name="getTableName(tableIndex)"
      :sit-down-time="getSitDownTime(tableIndex)"
      :total-price="getTableTotalPrice(tableIndex)"
      :is-occupied-over-hour="isOccupiedOverHour(tableIndex)"
      :is-dragged="draggedIndex === index"
      :is-drag-over="draggedOverIndex === index"
      :is-chinese="isChinese"
      @click="handleTileClick"
      @dragstart="handleDragStart"
      @dragover="handleDragOver"
      @dragenter="handleDragEnter"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @dragend="handleDragEnd"
      @set-sit-down-time="handleSetSitDownTime"
    />
  </div>
</template>

<script>
import { computed, ref, onMounted, getCurrentInstance, watch } from 'vue'
import TableTile from './TableTile.vue'
import { useTableCalculations } from '../../composables/useTableCalculations.js'
import { useMemoizedTablePrices } from '../../composables/useMemoizedTablePrices.js'
import { useTimerManagement } from '../../composables/useTimerManagement.js'
import { translate } from '../../utils/translations.js'
import logger from '../../services/logger.js'

export default {
  name: 'TableGrid',
  components: {
    TableTile
  },
  emits: ['tile-click'],
  setup(props, { emit }) {
    const instance = getCurrentInstance()
    const store = instance.appContext.config.globalProperties.$store
    const draggedIndex = ref(null)
    const draggedOverIndex = ref(null)
    const currentTime = ref(Date.now())
    
    // Use timer management composable for automatic cleanup
    const { setManagedInterval } = useTimerManagement()

    const {
      isOccupiedOverHour: isOccupiedOverHourCalc,
      getTableStatus: getTableStatusCalc,
      getDrinkCount
    } = useTableCalculations(store)

    // Use memoized table prices for better performance
    const { getPrice: getTableTotalPriceMemoized, clearCache: clearPriceCache } = useMemoizedTablePrices(store)

    const tableOrder = computed(() => store.state.ui.tableOrder || [])
    const currentLanguage = computed(() => store.state.settings.language || 'en')
    const isChinese = computed(() => store.state.settings.language === 'zh')
    const isDinner = computed(() => store.state.settings.isDinner)
    
    // Cache for table objects per render cycle - reduces store accesses in v-memo
    // This Map caches table objects within a single render cycle
    const tableCache = new Map()
    
    // Watch tables state to clear cache when table data changes
    const tables = computed(() => store.state.tables.tables)
    
    // Clear cache when tableOrder or tables change
    // Use deep watch to detect nested property changes
    watch([tableOrder, tables], () => {
      tableCache.clear()
      clearPriceCache()
    }, { immediate: false, deep: true })
    
    // Watch isDinner separately and clear price cache when it changes
    // This must happen BEFORE v-memo re-evaluates to ensure fresh prices
    watch(isDinner, (newVal, oldVal) => {
      if (newVal !== oldVal) {
        // Clear price cache FIRST when pricing mode changes
        clearPriceCache()
        // Also clear table cache to force re-render
        tableCache.clear()
      }
    }, { immediate: false })
    
    // Direct access to tables - Vue's reactivity will handle updates efficiently
    // Always access state directly to ensure Vue tracks changes to nested properties
    const getTable = (tableIndex) => {
      // Access tables state directly - this ensures reactivity
      const tablesState = store.state.tables?.tables || {}
      // tableIndex is the actual table number (not array index)
      if (Array.isArray(tablesState)) {
        // Legacy array format - convert tableIndex (number) to array index
        return tablesState[tableIndex - 1] || {}
      }
      // New object format - direct access by number
      // Always return fresh object reference to ensure reactivity
      return tablesState[tableIndex] || {}
    }
    
    // Don't cache - always access directly to ensure reactivity
    // Caching breaks reactivity because Vue can't track changes to cached objects
    const getTableCached = (tableIndex) => {
      // Always get fresh table object to ensure reactivity
      return getTable(tableIndex)
    }

    const getTableName = (tableIndex) => {
      const table = getTable(tableIndex)
      if (table && table.name && table.name.trim()) {
        return table.name.trim()
      }
      return `Table ${tableIndex}`
    }

    const getSitDownTime = (tableIndex) => {
      return getTable(tableIndex)?.sitDownTime || ''
    }

    // Use memoized price calculation
    // Make it explicitly reactive to isDinner by accessing it in the function
    // This ensures Vue tracks the dependency and re-runs when isDinner changes
    const getTableTotalPrice = (tableIndex) => {
      // Access isDinner.value to establish reactivity
      // When isDinner changes, Vue will re-run this function
      // The cache key includes isDinner, so it will be different and force recalculation
      const _ = isDinner.value // Establish reactivity
      return getTableTotalPriceMemoized(tableIndex)
    }

    const isOccupiedOverHour = (tableIndex) => {
      return isOccupiedOverHourCalc(tableIndex, currentTime.value)
    }

    const getTableStatus = (tableIndex) => {
      const getTranslatedLabel = (label) => translate(label, isChinese.value)
      return getTableStatusCalc(tableIndex, getTranslatedLabel)
    }

    const handleTileClick = (tableIndex) => {
      // Validate tableIndex before emitting
      // Handle both direct tableIndex and potential event object
      const index = typeof tableIndex === 'number' 
        ? tableIndex 
        : (tableIndex?.target?.dataset?.tableIndex 
            ? Number(tableIndex.target.dataset.tableIndex) 
            : null)
      
      if (index === undefined || index === null || isNaN(Number(index)) || Number(index) <= 0) {
        // Only log warning, don't crash - might be a click on a child element
        if (process.env.NODE_ENV === 'development') {
          logger.component.debug('TableGrid', 'Invalid or missing tableIndex, click ignored:', tableIndex)
        }
        return
      }
      
      emit('tile-click', index)
    }

    const handleDragStart = (event, tableIndex) => {
      const index = tableOrder.value.indexOf(tableIndex)
      draggedIndex.value = index
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/html', index.toString())
    }

    const handleDragEnd = () => {
      draggedIndex.value = null
      draggedOverIndex.value = null
    }

    const handleDragOver = (event, tableIndex) => {
      const index = tableOrder.value.indexOf(tableIndex)
      if (draggedIndex.value !== null && draggedIndex.value !== index) {
        event.dataTransfer.dropEffect = 'move'
      }
    }

    const handleDragEnter = (tableIndex) => {
      const index = tableOrder.value.indexOf(tableIndex)
      if (draggedIndex.value !== null && draggedIndex.value !== index) {
        draggedOverIndex.value = index
      }
    }

    const handleDragLeave = () => {
      draggedOverIndex.value = null
    }

    const handleDrop = (event, dropTableIndex) => {
      const dragIndex = draggedIndex.value
      const dropIndex = tableOrder.value.indexOf(dropTableIndex)
      
      if (dragIndex !== null && dragIndex !== dropIndex) {
        // Reorder the tableOrder array
        const newOrder = tableOrder.value.slice()
        const draggedTable = newOrder.splice(dragIndex, 1)[0]
        newOrder.splice(dropIndex, 0, draggedTable)
        store.commit('setTableOrder', newOrder)
      }
      
      draggedIndex.value = null
      draggedOverIndex.value = null
    }

    const handleSetSitDownTime = (index) => {
      if (index < 0) return
      store.commit('getTimestamp', index)
    }

    onMounted(() => {
      // Update current time every minute to trigger color changes for tables occupied > 1 hour
      // Timer will be automatically cleaned up on unmount via useTimerManagement
      setManagedInterval(() => {
        currentTime.value = Date.now()
      }, 60000) // Update every minute
    })

    return {
      tableOrder,
      tables,
      currentLanguage,
      isChinese,
      isDinner,
      draggedIndex,
      draggedOverIndex,
      currentTime,
      getTable,
      getTableCached,
      getTableName,
      getSitDownTime,
      getTableTotalPrice,
      isOccupiedOverHour,
      getTableStatus,
      handleTileClick,
      handleDragStart,
      handleDragEnd,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      handleSetSitDownTime
    }
  }
}
</script>

<style scoped>
.floor-plan__grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 20px;
}

@media (min-width: 560px) {
  .floor-plan__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }
}

@media (min-width: 820px) {
  .floor-plan__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 24px;
  }
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  /* iPad landscape - 3 columns per row */
  .floor-plan__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }
}

@media (min-width: 1280px) {
  .floor-plan__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 24px;
  }
}
</style>

