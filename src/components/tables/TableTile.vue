<template>
  <div
    class="floor-plan__tile"
    :class="[
      status.appearance,
      {
        'is-dragged': isDragged,
        'is-drag-over': isDragOver,
        'occupied-over-hour': isOccupiedOverHour
      }
    ]"
    role="button"
    tabindex="0"
    :aria-label="`${tableName}, ${status.label}, ${adultCount} ${getTranslatedLabel('adults')}, ${bigKidCount} ${getTranslatedLabel('big kids')}, ${smlKidCount} ${getTranslatedLabel('small kids')}, ${drinkCount} ${getTranslatedLabel('drinks')}, ${getTranslatedLabel('Total')} $${totalPrice.toFixed(2)}`"
    draggable="true"
    @dragstart="handleDragStart"
    @dragover.prevent="handleDragOver"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
    @dragend="handleDragEnd"
    @click.stop="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <div class="floor-plan__tile-header">
      <div class="tile-name">
        <v-icon icon="mdi-drag-variant" size="20" class="tile-drag"></v-icon>
        {{ tableName }}
      </div>
      <div class="tile-timer" :class="{ 'has-time': sitDownTime }">
        <v-icon
          v-if="sitDownTime"
          icon="mdi-clock-outline"
          size="18"
          class="me-1"
          :aria-label="`${getTranslatedLabel('Set sit down time for')} ${tableName}`"
          @click.stop="handleSetSitDownTime"
        ></v-icon>
        <span>{{ sitDownTime || '—' }}</span>
      </div>
    </div>

    <div class="floor-plan__tile-body">
      <div class="tile-status">
        <table-status-chip :status="status" />
      </div>
      <div class="tile-counts">
        <span class="count">
          <strong>{{ adultCount }}</strong>
          {{ getTranslatedLabel('Adult') }}
        </span>
        <span class="count">
          <strong>{{ bigKidCount }}</strong>
          {{ getTranslatedLabel('Kid (6-9)') }}
        </span>
        <span class="count">
          <strong>{{ smlKidCount }}</strong>
          {{ getTranslatedLabel('Kid (2-5)') }}
        </span>
      </div>
      <div class="tile-meta" @click.stop.prevent>
        <span class="meta-item">
          <v-icon size="18" icon="mdi-cup-water" class="me-1"></v-icon>
          {{ drinkCount }} {{ getTranslatedLabel('drinks') }}
        </span>
        <span class="meta-item">
          <v-icon size="18" icon="mdi-food-takeout-box" class="me-1"></v-icon>
          {{ togoCount }} {{ getTranslatedLabel('to-go') }}
        </span>
      </div>
    </div>

    <div class="floor-plan__tile-footer">
      <v-icon
        icon="mdi-cards-heart"
        color="pink-darken-1"
        size="20"
        v-if="goodPpl"
      ></v-icon>
      <span class="tile-total">{{ getTranslatedLabel('Total') }} ${{ totalPrice.toFixed(2) }}</span>
    </div>
  </div>
</template>

<script>
import TableStatusChip from './TableStatusChip.vue'
import { translate } from '../../utils/translations.js'

export default {
  name: 'TableTile',
  components: {
    TableStatusChip
  },
  props: {
    tableIndex: {
      type: Number,
      required: true
    },
    table: {
      type: Object,
      required: true
    },
    status: {
      type: Object,
      required: true
    },
    tableName: {
      type: String,
      required: true
    },
    sitDownTime: {
      type: String,
      default: ''
    },
    totalPrice: {
      type: Number,
      required: true
    },
    isOccupiedOverHour: {
      type: Boolean,
      default: false
    },
    isDragged: {
      type: Boolean,
      default: false
    },
    isDragOver: {
      type: Boolean,
      default: false
    },
    isChinese: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    // Memoize computed properties - only recalculate when table props change
    adultCount() {
      return Number(this.table?.adult || 0)
    },
    bigKidCount() {
      return Number(this.table?.bigKid || 0)
    },
    smlKidCount() {
      return Number(this.table?.smlKid || 0)
    },
    drinkCount() {
      return Array.isArray(this.table?.drinks) ? this.table.drinks.length : 0
    },
    togoCount() {
      return Number(this.table?.togo || 0)
    },
    goodPpl() {
      return !!this.table?.goodPpl
    }
  },
  methods: {
    getTranslatedLabel(label) {
      return translate(label, this.isChinese)
    },
    handleClick(event) {
      // Validate tableIndex before emitting
      if (this.tableIndex === undefined || this.tableIndex === null || isNaN(Number(this.tableIndex)) || Number(this.tableIndex) <= 0) {
        console.warn('TableTile: Invalid tableIndex:', this.tableIndex, 'Event:', event)
        return
      }
      // Emit the tableIndex (not the event)
      this.$emit('click', this.tableIndex)
    },
    handleDragStart(event) {
      this.$emit('dragstart', event, this.tableIndex)
    },
    handleDragOver(event) {
      this.$emit('dragover', event, this.tableIndex)
    },
    handleDragEnter() {
      this.$emit('dragenter', this.tableIndex)
    },
    handleDragLeave(event) {
      this.$emit('dragleave', event)
    },
    handleDrop(event) {
      this.$emit('drop', event, this.tableIndex)
    },
    handleDragEnd(event) {
      this.$emit('dragend', event)
    },
    handleSetSitDownTime() {
      this.$emit('set-sit-down-time', this.tableIndex - 1)
    }
  }
}
</script>

<style scoped>
.floor-plan__tile {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
  user-select: none;
  background: rgba(255, 255, 255, 0.42);
  box-shadow: 0 8px 20px rgba(15, 25, 35, 0.12);
  min-width: 140px;
  min-height: 140px;
}

.floor-plan__tile.status-ready {
  background: rgba(46, 125, 50, 0.16);
  border: 2px solid rgba(46, 125, 50, 0.32);
}

.floor-plan__tile.status-seated {
  background: rgba(251, 140, 0, 0.16);
  border: 2px solid rgba(251, 140, 0, 0.32);
}

.floor-plan__tile.occupied-over-hour {
  background: rgba(244, 67, 54, 0.2);
  border: 2px solid rgba(244, 67, 54, 0.4);
}

.floor-plan__tile.status-vacant {
  background: rgba(84, 110, 122, 0.12);
  border: 2px solid rgba(84, 110, 122, 0.26);
}

.floor-plan__tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(15, 25, 35, 0.18);
}

.floor-plan__tile.is-dragged {
  opacity: 0.6;
  transform: scale(0.98);
}

.floor-plan__tile.is-drag-over {
  outline: 2px dashed rgba(33, 150, 243, 0.7);
  outline-offset: 4px;
}

/* Focus indicators for accessibility */
.floor-plan__tile:focus-visible {
  outline: 2px solid rgba(0, 137, 123, 0.8);
  outline-offset: 2px;
  z-index: 1;
}

.floor-plan__tile-header,
.floor-plan__tile-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tile-name {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 16px;
  line-height: 1.4;
}

.tile-drag {
  opacity: 0.5;
  width: 18px;
  height: 18px;
}

.tile-timer {
  font-size: 13px;
  color: rgba(31, 39, 51, 0.8);
  display: inline-flex;
  align-items: center;
  line-height: 1.5;
}

.tile-timer.has-time {
  font-weight: 600;
  color: rgba(31, 39, 51, 0.9);
}

.floor-plan__tile-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tile-counts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: rgba(31, 39, 51, 0.8);
  line-height: 1.5;
}

.tile-counts .count {
  display: inline-flex;
  flex-direction: column;
  min-width: 60px;
}

.tile-counts strong {
  font-size: 16px;
  color: rgba(31, 39, 51, 0.95);
  line-height: 1.4;
}

.tile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
  color: rgba(31, 39, 51, 0.8);
  line-height: 1.5;
}

.meta-item {
  display: inline-flex;
  align-items: center;
}

.meta-item .v-icon {
  width: 16px;
  height: 16px;
}

.tile-total {
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.3px;
  line-height: 1.5;
}
</style>

