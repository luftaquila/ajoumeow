<template>
  <div>
    <h3 class="text-sm font-semibold mb-3">일별 인증 추이</h3>
    <div v-if="!data.length" class="text-center py-8 text-text-muted text-sm">데이터가 없습니다.</div>
    <Chart v-else type="line" :data="chartData" :options="chartOptions" class="max-h-64" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Chart from 'primevue/chart'
import { useChartTheme } from '../composables/useChartTheme.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const { textColor, gridColor, courseColors, courseColorList } = useChartTheme()

const chartData = computed(() => {
  const dates = [...new Set(props.data.map(d => d.date))].sort()
  const courses = [...new Set(props.data.map(d => d.course))]

  const datasets = courses.map((course, i) => {
    const color = courseColors[course] || courseColorList[i % courseColorList.length]
    return {
      label: course,
      data: dates.map(date => {
        const row = props.data.find(d => d.date === date && d.course === course)
        return row ? row.count : 0
      }),
      borderColor: color,
      backgroundColor: color + '20',
      fill: true,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    }
  })

  return {
    labels: dates.map(d => d.slice(5)),
    datasets,
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {
      ticks: { color: textColor.value, maxRotation: 45, font: { size: 11 } },
      grid: { color: gridColor.value },
    },
    y: {
      beginAtZero: true,
      ticks: { color: textColor.value, stepSize: 1, font: { size: 11 } },
      grid: { color: gridColor.value },
    },
  },
  plugins: {
    legend: {
      labels: { color: textColor.value, usePointStyle: true, pointStyleWidth: 8 },
    },
  },
}))
</script>
