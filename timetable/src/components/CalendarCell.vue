<template>
  <div
    class="calendar-table__col"
    :class="{
      'calendar-table__today': cell.isToday,
      'calendar-table__event': selected,
      'calendar-table__inactive': cell.isInactive,
    }"
    :data-date="cell.date"
    @click="$emit('select')"
  >
    <div
      class="calendar-table__item"
      :style="{ backgroundImage: cell.svgBackground }"
    >
      <div :class="{ my: cell.hasMy }">
        {{ cell.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  cell: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})
defineEmits(['select'])
</script>
