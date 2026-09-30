<template>
  <div class="max-w-2xl">
    <PageHeader
      title="학기 전환"
      description="새 학기를 시작합니다. 임원은 새 학기 명단으로 넘어가고, 일반 회원은 새 학기에 웹사이트 가입 신청을 다시 해야 합니다."
      icon="i-lucide-calendar-range"
    />

    <!-- Done: what to do next -->
    <div v-if="done" class="card-section flex flex-col gap-4">
      <div class="flex items-center gap-2 font-semibold">
        <span class="i-lucide-circle-check text-xl text-emerald-500"></span>
        {{ done.semester }} 학기로 전환했습니다
      </div>
      <p class="text-sm text-text-secondary">
        임원 {{ done.carryOverMembers.length }}명이 새 학기 명단으로 넘어갔습니다. 새 학기를 시작하려면 아래 항목을 확인하세요.
      </p>
      <div class="flex flex-col divide-y divide-surface-border border border-surface-border rounded-xl">
        <router-link v-for="step in nextSteps" :key="step.label" :to="step.to" class="flex items-center gap-3 px-4 py-3 hover:bg-surface-dim">
          <span :class="step.ok ? 'i-lucide-circle-check text-emerald-500' : 'i-lucide-circle text-text-muted'" class="text-lg"></span>
          <span class="flex-1 text-sm">
            <span class="font-medium">{{ step.label }}</span>
            <span class="block text-xs text-text-muted">{{ step.detail }}</span>
          </span>
          <span class="i-lucide-chevron-right text-text-muted"></span>
        </router-link>
      </div>
    </div>

    <div v-else class="flex flex-col gap-4">
      <div class="card-section flex flex-col gap-4">
        <div class="flex items-center gap-3 flex-wrap">
          <div>
            <p class="text-xs text-text-muted">현재 학기</p>
            <p class="text-lg font-bold">{{ current || '—' }}</p>
          </div>
          <span class="i-lucide-arrow-right text-xl text-text-muted mx-2"></span>
          <div>
            <p class="text-xs text-text-muted">전환할 학기</p>
            <div class="flex items-center gap-2">
              <div class="w-24"><InputNumber v-model="year" :useGrouping="false" :min="0" :max="99" :allowEmpty="false" fluid /></div>
              <div class="w-28"><Select v-model="term" :options="TERMS" optionLabel="label" optionValue="value" fluid /></div>
            </div>
          </div>
        </div>
        <p v-if="target === current" class="text-xs text-text-muted">현재 학기와 같습니다. 전환할 학기를 고르세요.</p>
        <p v-else-if="target < current" class="text-xs text-amber-600">현재보다 이전 학기로 되돌립니다.</p>
      </div>

      <div v-if="target !== current" class="card-section flex flex-col gap-4">
        <div v-if="previewLoading" class="text-center py-4">
          <div class="i-lucide-loader-circle text-2xl text-primary animate-spin mx-auto"></div>
        </div>
        <template v-else-if="preview">
          <div>
            <p class="text-sm font-semibold mb-2">
              새 학기 명단으로 넘어가는 임원 {{ preview.executives.length }}명
              <span v-if="preview.targetExists" class="ml-1 text-xs font-normal text-text-muted">({{ preview.targetSemester }} 학기는 이미 있어서 그 명단에 더합니다)</span>
            </p>
            <div v-if="preview.executives.length" class="flex flex-wrap gap-1.5">
              <span v-for="e in preview.executives" :key="e.studentId" class="text-xs px-2 py-1 rounded-md bg-surface-dim">
                {{ e.name }} <span class="text-text-muted">{{ e.role }}</span>
              </span>
            </div>
            <p v-else class="text-sm text-text-muted">임원이 없습니다. 전환 후 콘솔에 들어올 수 있는 회원이 없게 됩니다.</p>
          </div>

          <div class="rounded-xl px-4 py-3 bg-amber-500/10 text-sm flex gap-2">
            <span class="i-lucide-triangle-alert text-amber-600 text-lg flex-shrink-0"></span>
            <span>일반 회원 <b>{{ preview.regularCount }}명</b>은 {{ preview.targetSemester }} 명단에 없습니다. 웹사이트 가입 신청을 다시 받아 승인해야 급식을 신청할 수 있습니다.</span>
          </div>

          <label class="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox v-model="acknowledged" :binary="true" />
            확인했습니다
          </label>
          <div>
            <Button
              :label="`${preview.targetSemester} 학기로 전환`"
              severity="warn"
              :disabled="!acknowledged"
              :loading="executing"
              @click="execute"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import PageHeader from '../components/PageHeader.vue'
import { previewTransition, executeTransition } from '../api/semesters.js'
import { getSetting } from '../api/settings.js'
import { useStatus } from '../composables/useStatus.js'
import { useNotify } from '../composables/useNotify.js'

const TERMS = [{ label: '1학기', value: '1' }, { label: '2학기', value: '2' }]

const notify = useNotify()
const { apply, register, refreshStatus } = useStatus()

const current = ref('')
// Semester names use two-digit years, e.g. 26-2
const year = ref(new Date().getFullYear() % 100)
const term = ref('1')
const preview = ref(null)
const previewLoading = ref(false)
const acknowledged = ref(false)
const executing = ref(false)
const done = ref(null)

const target = computed(() => `${year.value}-${term.value}`)

const nextSteps = computed(() => [
  {
    label: '웹사이트 가입 신청',
    detail: apply.value.open ? '받는 중 — 들어온 신청은 웹사이트 가입 승인에서 승인하세요' : '닫혀 있음 — 설정에서 켜세요',
    ok: apply.value.open,
    to: apply.value.open ? '/console/applications' : '/console/settings',
  },
  {
    label: '신입 모집 설문',
    detail: register.value.open ? '지금 받는 중' : '닫혀 있음 — 모집할 때 켜세요',
    ok: register.value.open,
    to: '/console/recruit',
  },
  { label: '공지사항 바꾸기', detail: '새 학기 안내로 고치기', ok: false, to: '/console/settings' },
])

onMounted(async () => {
  try {
    const res = await getSetting('currentSemester')
    current.value = res.data
    // Suggest the semester after the current one
    const [y, t] = (res.data || '').split('-')
    if (y) {
      year.value = t === '1' ? Number(y) : Number(y) + 1
      term.value = t === '1' ? '2' : '1'
    }
  } catch (e) {
    notify.error(e, '현재 학기를 불러오지 못했습니다.')
  }
  loadPreview()
})

let seq = 0
async function loadPreview() {
  const name = target.value
  preview.value = null
  acknowledged.value = false
  if (!current.value || name === current.value) return
  const mine = ++seq
  previewLoading.value = true
  try {
    const res = await previewTransition(name)
    if (mine === seq) preview.value = res.data
  } catch (e) {
    if (mine === seq) notify.error(e, '미리보기 실패')
  } finally {
    if (mine === seq) previewLoading.value = false
  }
}
watch(target, loadPreview)

async function execute() {
  executing.value = true
  try {
    const res = await executeTransition(preview.value.targetSemester)
    done.value = res.data
    await refreshStatus()
  } catch (e) {
    notify.error(e, '학기 전환 실패')
  } finally {
    executing.value = false
  }
}
</script>
