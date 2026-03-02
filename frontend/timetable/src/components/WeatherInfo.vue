<template>
  <span v-if="current" class="inline-flex items-center gap-1">
    <span class="font-normal text-text-secondary text-sm">{{ current.temp }}℃ {{ current.weather }}</span>
    <img :src="`/res/image/weather/icon${current.icon}.png`" class="w-4 h-4">
    <div class="inline-block align-middle font-normal text-[0.65rem] leading-[0.85rem] text-text-secondary">
      pm10 : <span :class="pm10Class">{{ current.dust.pm10 }}</span>㎍/㎥<br>
      pm2.5: <span :class="pm25Class">{{ current.dust.pm25 }}</span>㎍/㎥
    </div>
  </span>
  <span v-else-if="forecast" class="inline-flex items-center gap-1">
    <span class="font-normal text-text-secondary text-sm">{{ forecast.temp }}℃ {{ forecast.weather }}</span>
    <img :src="`/res/image/weather/icon${forecast.icon}.png`" class="w-4 h-4">
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { DUST_THRESHOLDS } from '../constants.js'

const props = defineProps({
  current: { type: Object, default: null },
  forecast: { type: Object, default: null },
})

function dustClass(value, thresholds) {
  const [low, mid, high] = thresholds
  if (value > high) return 'text-dust-worst'
  if (value > mid) return 'text-dust-bad'
  if (value > low) return 'text-dust-normal'
  return 'text-dust-good'
}

const pm10Class = computed(() => props.current ? dustClass(props.current.dust.pm10, DUST_THRESHOLDS.pm10) : '')
const pm25Class = computed(() => props.current ? dustClass(props.current.dust.pm25, DUST_THRESHOLDS.pm25) : '')
</script>
