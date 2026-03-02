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
        'bg-calendar-selected border-primary/30 shadow-[0_2px_8px_rgba(99,102,241,0.15)]': selected,
        'text-calendar-inactive !cursor-default hover:!bg-transparent hover:!shadow-none': cell.isInactive,
        'hover:bg-surface-muted hover:shadow-[0_1px_4px_rgba(0,0,0,0.06)]': !cell.isInactive && !selected,
      }"
      :style="{ backgroundImage: cell.svgBackground }"
    >
      <div :class="{ 'rounded-lg w-6 h-6 leading-[1.3rem] border-2 border-accent text-center': cell.hasMy }">
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
