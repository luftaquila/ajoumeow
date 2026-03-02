<template>
  <div
    class="cal-body-col"
    :data-date="cell.date"
    @click="$emit('select')"
  >
    <div
      class="cal-item"
      :class="{
        'bg-calendar-today border-transparent shadow-[0_1px_4px_rgba(0,0,0,0.08)]': cell.isToday && !selected,
        'bg-calendar-selected border-primary/50 text-primary shadow-[0_2px_8px_rgba(99,102,241,0.15)]': selected,
        'text-calendar-inactive': cell.isInactive,
        'hover:bg-surface-muted hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]': !selected,
      }"
      :style="{ backgroundImage: cell.svgBackground }"
    >
      <div
        class="rounded-full w-5 h-5 flex items-center justify-center"
        :class="{ 'ring-1.5 ring-accent': cell.hasMy }"
      >
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
