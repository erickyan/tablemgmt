<template>
  <span class="status-chip" :class="status.appearance">
    <v-icon size="12" :icon="status.icon" class="me-1"></v-icon>
    {{ status.label }}
  </span>
</template>

<script>
export default {
  name: 'TableStatusChip',
  props: {
    status: {
      type: Object,
      required: true,
      validator: (value) => {
        return value && typeof value.label === 'string' && 
               typeof value.appearance === 'string' && 
               typeof value.icon === 'string'
      }
    }
  }
}
</script>

<style scoped>
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.status-chip.status-ready {
  background: rgba(46, 125, 50, 0.18);
  color: #2e7d32;
}

.status-chip.status-seated {
  background: rgba(251, 140, 0, 0.18);
  color: #fb8c00;
}

.status-chip.status-vacant {
  background: rgba(84, 110, 122, 0.15);
  color: #546e7a;
}
</style>

