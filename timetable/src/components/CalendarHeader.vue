<template>
  <div class="border-b border-surface-border mb-2 mx-1">
    <div class="flex justify-center">
      <div
        v-for="(label, i) in DAY_LABELS"
        :key="i"
        class="cal-col"
        :class="{
          '!text-[#F87171]': i === 0,
          '!text-[#60A5FA]': i === 6,
        }"
      >
        {{ label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { DAY_LABELS } from '../constants.js'
</script>
