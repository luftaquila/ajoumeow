<template>
  <div class="min-h-screen p-4 md:p-6">
    <div class="max-w-5xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-xl font-bold">급식 통계</h1>
          <p class="text-text-muted text-sm">급식 활동 통계를 조회합니다.</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text hover:bg-surface-dim transition-colors cursor-pointer"
            @click="toggleTheme"
            :title="isDark ? '라이트 모드' : '다크 모드'"
          >
            <span :class="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="text-xl"></span>
          </button>
          <a href="/timetable" class="text-text-muted hover:text-text text-sm no-underline flex items-center gap-1">
            <span class="i-lucide-arrow-left text-base"></span> 급식표
          </a>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div class="card-section flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span class="i-lucide-clock text-2xl text-primary"></span>
          </div>
          <div>
            <p class="text-text-muted text-xs">이번 달 활동시간</p>
            <p class="text-2xl font-bold">{{ summary.totalHours ?? '-' }}<span class="text-sm text-text-muted font-normal ml-1">시간</span></p>
          </div>
        </div>
        <div class="card-section flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
            <span class="i-lucide-users text-2xl text-[#22C55E]"></span>
          </div>
          <div>
            <p class="text-text-muted text-xs">이번 달 참여인원</p>
            <p class="text-2xl font-bold">{{ summary.uniqueMembers ?? '-' }}<span class="text-sm text-text-muted font-normal ml-1">명</span></p>
          </div>
        </div>
      </div>

      <!-- Stats type selector -->
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <SelectButton v-model="statsType" :options="statsOptions" optionLabel="label" optionValue="value" />
        <template v-if="statsType === 'custom_total'">
          <DatePicker v-model="customStart" dateFormat="yy-mm-dd" class="w-36" />
          <span class="text-text-muted">~</span>
          <DatePicker v-model="customEnd" dateFormat="yy-mm-dd" class="w-36" />
          <Button label="조회" size="small" @click="loadStats" />
        </template>
      </div>

      <div class="card-section mb-6" style="height: 320px">
        <TopMembersChart :data="stats" />
      </div>

      <!-- Stats table -->
      <DataTable
        :value="stats"
        :loading="statsLoading"
        paginator
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50]"
        sortMode="multiple"
        removableSort
        stripedRows
        size="small"
        class="text-sm"
      >
        <Column field="name" header="이름" sortable />
        <Column field="score" header="마일리지" sortable>
          <template #body="{ data }">
            {{ Number(data.score).toFixed(1) }}
          </template>
        </Column>
        <Column field="count" header="횟수" sortable />
      </DataTable>

      <!-- Lottery button -->
      <div class="mt-6">
        <Button label="제비뽑기" icon="i-lucide-sparkles" @click="runLottery" :disabled="!stats.length" />
        <Dialog v-model:visible="lotteryVisible" header="제비뽑기 결과" modal :style="{ width: '400px' }">
          <div class="text-center py-6">
            <p class="text-4xl font-bold text-primary mb-2">{{ lotteryWinner }}</p>
            <p class="text-text-muted text-sm">마일리지 가중치 기반 랜덤 추첨</p>
          </div>
        </Dialog>
      </div>
    </div>
  </div>

  <Toast position="bottom-right" />
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import SelectButton from 'primevue/selectbutton'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import TopMembersChart from './components/TopMembersChart.vue'
import { useTheme } from '../../shared/composables/useTheme.js'
import { get } from '../../shared/api.js'
import { formatDate } from '../../shared/utils/dateFormat.js'

const toast = useToast()
const { isDark, initTheme, toggleTheme } = useTheme()

const summary = ref({})
const stats = ref([])
const statsLoading = ref(false)

const statsType = ref('this_feeding')
const statsOptions = [
  { label: '이번달 급식', value: 'this_feeding' },
  { label: '이번달 전체', value: 'this_total' },
  { label: '저번달 급식', value: 'prev_feeding' },
  { label: '전체 누적', value: 'total_total' },
  { label: '기간 지정', value: 'custom_total' },
]

const customStart = ref(new Date(Date.now() - 30 * 24 * 3600000))
const customEnd = ref(new Date())

const lotteryVisible = ref(false)
const lotteryWinner = ref('')

function getStatistics(type, params = {}) {
  return get('/records/statistics', { type, ...params })
}

onMounted(async () => {
  initTheme()
  try {
    const res = await getStatistics('summary')
    summary.value = res.data
  } catch {}
  await loadStats()
})

watch(statsType, (v) => {
  if (v !== 'custom_total') loadStats()
})

async function loadStats() {
  statsLoading.value = true
  try {
    const params = {}
    if (statsType.value === 'custom_total') {
      params.startDate = formatDate(customStart.value, 'yyyy-mm-dd')
      params.endDate = formatDate(customEnd.value, 'yyyy-mm-dd')
    }
    const res = await getStatistics(statsType.value, params)
    stats.value = Array.isArray(res.data) ? res.data : []
  } catch {
    toast.add({ severity: 'error', summary: '통계 조회 실패', life: 3000 })
  } finally {
    statsLoading.value = false
  }
}

function runLottery() {
  if (!stats.value.length) return
  const totalScore = stats.value.reduce((sum, s) => sum + Number(s.score), 0)
  let random = Math.random() * totalScore
  for (const s of stats.value) {
    random -= Number(s.score)
    if (random <= 0) {
      lotteryWinner.value = s.name
      lotteryVisible.value = true
      return
    }
  }
  lotteryWinner.value = stats.value[stats.value.length - 1].name
  lotteryVisible.value = true
}
</script>
