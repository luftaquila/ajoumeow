<template>
  <div class="border-b border-surface-border mb-2">
    <div class="grid grid-cols-7">
      <div
        v-for="(label, i) in DAY_LABELS"
        :key="i"
        class="cal-col"
        :class="{
          '!text-sunday': i === 0,
          '!text-saturday': i === 6,
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
