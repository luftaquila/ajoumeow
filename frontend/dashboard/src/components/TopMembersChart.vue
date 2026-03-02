<template>
  <div>
    <h3 class="text-sm font-semibold mb-3">마일리지 상위 10명</h3>
    <div v-if="!data.length" class="text-center py-8 text-text-muted text-sm">데이터가 없습니다.</div>
    <Chart v-else type="bar" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Chart from 'primevue/chart'
import { useChartTheme } from '../composables/useChartTheme.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const { textColor, gridColor } = useChartTheme()

const top10 = computed(() =>
  [...props.data]
    .sort((a, b) => Number(b.score) - Number(a.score))
    .slice(0, 10)
)

const chartData = computed(() => ({
  labels: top10.value.map(d => d.name),
  datasets: [{
    label: '마일리지',
    data: top10.value.map(d => Number(d.score).toFixed(1)),
    backgroundColor: '#3B82F680',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 4,
  }],
}))

const chartOptions = computed(() => ({
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      beginAtZero: true,
      ticks: { color: textColor.value, font: { size: 11 } },
      grid: { color: gridColor.value },
    },
    y: {
      ticks: { color: textColor.value, font: { size: 11 } },
      grid: { display: false },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.parsed.x}점`,
      },
    },
  },
}))
</script>
