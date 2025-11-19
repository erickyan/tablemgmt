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
      @click="(tableIndex) => handleTileClick(tableIndex)"
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
    const { getPrice: getTableTotalPriceMemoized } = useMemoizedTablePrices(store)

    const tableOrder = computed(() => store.state.tableOrder || [])
    const currentLanguage = computed(() => store.state.language || 'en')
    const isChinese = computed(() => store.state.language === 'zh')
    
    // Cache for table objects per render cycle - reduces store accesses in v-memo
    // This Map caches table objects within a single render cycle
    const tableCache = new Map()
    
    // Watch tables state to clear cache when table data changes
    const tables = computed(() => store.state.tables)
    
    // Clear cache when tableOrder or tables change (new render cycle or data update)
    watch([tableOrder, tables], () => {
      tableCache.clear()
    }, { immediate: false, deep: true })
    
    // Direct access to tables - Vue's reactivity will handle updates efficiently
    // The memoization in getTableTotalPrice will prevent unnecessary recalculations
    // tables is now an object keyed by table number: { [number]: Table }
    const getTable = (tableIndex) => {
      // tableIndex is the actual table number (not array index)
      // Access directly: tables[tableNumber]
      if (Array.isArray(store.state.tables)) {
        // Legacy array format - convert tableIndex (number) to array index
        return store.state.tables[tableIndex - 1] || {}
      }
      // New object format - direct access by number
      return store.state.tables[tableIndex] || {}
    }
    
    // Optimized version that caches table object per render cycle
    // This reduces multiple store accesses in v-memo array
    const getTableCached = (tableIndex) => {
      if (!tableCache.has(tableIndex)) {
        tableCache.set(tableIndex, getTable(tableIndex))
      }
      return tableCache.get(tableIndex)
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
    const getTableTotalPrice = (tableIndex) => {
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
          console.debug('TableGrid: Invalid or missing tableIndex, click ignored:', tableIndex)
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

