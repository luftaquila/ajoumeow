<template>
  <div class="card pt-4 pb-5 px-3">
    <div class="flex items-center justify-between mb-3 px-2">
      <span class="text-lg font-bold text-text tracking-tight">{{ displayMonth.year }}년 {{ displayMonth.month }}월</span>
      <span class="text-xs text-text-muted font-medium">오늘 기준 5주</span>
    </div>
    <CalendarHeader />
    <CalendarGrid />
  </div>
</template>

<script setup>
import { useCalendar } from '../composables/useCalendar.js'
import CalendarHeader from './CalendarHeader.vue'
import CalendarGrid from './CalendarGrid.vue'

const { displayMonth } = useCalendar()
</script>
