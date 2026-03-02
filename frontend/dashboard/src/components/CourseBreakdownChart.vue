<template>
  <div>
    <h3 class="text-sm font-semibold mb-3">코스별 인증 분포</h3>
    <div v-if="!data.length" class="text-center py-8 text-text-muted text-sm">데이터가 없습니다.</div>
    <Chart v-else type="doughnut" :data="chartData" :options="chartOptions" class="max-h-64" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Chart from 'primevue/chart'
import { useChartTheme } from '../composables/useChartTheme.js'

const props = defineProps({
  data: { type: Array, default: () => [] },
})

const { textColor, courseColors, courseColorList } = useChartTheme()

const chartData = computed(() => ({
  labels: props.data.map(d => d.course),
  datasets: [{
    data: props.data.map(d => d.count),
    backgroundColor: props.data.map((d, i) => courseColors[d.course] || courseColorList[i % courseColorList.length]),
    borderWidth: 0,
  }],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: textColor.value, padding: 16, usePointStyle: true, pointStyleWidth: 8 },
    },
    tooltip: {
      callbacks: {
        label: (ctx) => {
          const item = props.data[ctx.dataIndex]
          return ` ${item.count}회 (${Number(item.totalScore).toFixed(1)}점)`
        },
      },
    },
  },
}))
</script>
