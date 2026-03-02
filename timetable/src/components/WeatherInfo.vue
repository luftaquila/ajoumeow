<template>
  <span v-if="current">
    &ensp;<span class="font-normal">{{ current.temp }}℃ {{ current.weather }}</span>&nbsp;<img :src="`/res/image/weather/icon${current.icon}.png`" class="w-4 h-4">&ensp;<div class="inline-block align-middle font-normal text-[0.7rem] leading-[0.9rem]">pm10 : <span :style="{ color: pm10Color }">{{ current.dust.pm10 }}</span>㎍/㎥<br>pm2.5: <span :style="{ color: pm25Color }">{{ current.dust.pm25 }}</span>㎍/㎥</div>
  </span>
  <span v-else-if="forecast">
    &ensp;<span class="font-normal">{{ forecast.temp }}℃ {{ forecast.weather }}</span>&nbsp;<img :src="`/res/image/weather/icon${forecast.icon}.png`" class="w-4 h-4">
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  current: { type: Object, default: null },
  forecast: { type: Object, default: null },
})

function dustColor(value, thresholds) {
  const [low, mid, high] = thresholds
  if (value > high) return '#ff5959'
  if (value > mid) return '#fd9b5a'
  if (value > low) return '#00c73c'
  return '#32a1ff'
}

const pm10Color = computed(() => props.current ? dustColor(props.current.dust.pm10, [30, 80, 150]) : '')
const pm25Color = computed(() => props.current ? dustColor(props.current.dust.pm25, [15, 35, 75]) : '')
</script>
