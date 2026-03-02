<template>
  <div class="card pt-4 pb-5 px-2">
    <div class="text-center mb-3">
      <img :src="'/res/image/headline_blue.png'" class="w-28 opacity-80" />
    </div>
    <CalendarHeader />
    <CalendarGrid />
  </div>
</template>

<script setup>
import CalendarHeader from './CalendarHeader.vue'
import CalendarGrid from './CalendarGrid.vue'
</script>
