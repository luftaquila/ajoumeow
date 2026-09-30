<template>
  <div class="max-w-2xl">
    <PageHeader
      title="1365 봉사활동 인증서"
      description="급식 인증 기록으로 수원시자원봉사센터 양식의 1365 봉사활동 인증서(xlsx)를 만듭니다. 기타 인증은 들어가지 않습니다."
      icon="i-lucide-hand-helping"
    />

    <div class="card-section flex flex-col gap-5">
      <SelectButton v-model="preset" :options="PRESETS" optionLabel="label" optionValue="value" :allowEmpty="false" size="small" @change="applyPreset" />
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex flex-col gap-1">
          <label class="field-label">시작일</label>
          <DatePicker v-model="startDate" dateFormat="yy-mm-dd" class="w-full" @update:modelValue="preset = 'custom'" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="field-label">종료일</label>
          <DatePicker v-model="endDate" dateFormat="yy-mm-dd" class="w-full" @update:modelValue="preset = 'custom'" />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="field-label">학기</label>
        <Select v-model="selectedSemester" :options="semesters" placeholder="학기 선택" />
      </div>

      <div class="flex items-center gap-2">
        <Checkbox v-model="maskPrivacy" :binary="true" inputId="mask" />
        <label for="mask" class="text-sm cursor-pointer">개인정보 보호 (이름, 생년월일, 연락처 마스킹)</label>
      </div>

      <!-- Preview -->
      <div class="rounded-xl bg-surface-muted border border-surface-border px-4 py-3">
        <div v-if="previewLoading" class="text-sm text-text-muted flex items-center gap-2">
          <span class="i-lucide-loader-circle animate-spin"></span> 확인 중...
        </div>
        <p v-else-if="previewError" class="text-sm text-red-500">{{ previewError }}</p>
        <template v-else-if="data">
          <p v-if="data.rows.length" class="text-sm">
            <b>{{ summary.people }}명</b> · {{ data.rows.length }}건 · 총 {{ summary.hours }}시간
            <span class="text-text-muted">· 담당자 {{ data.chief.name || '없음' }}</span>
          </p>
          <p v-else class="text-sm text-text-muted">이 기간에는 인증서에 넣을 급식 인증이 없습니다.</p>

          <div v-if="data.excluded.length" class="mt-3 text-xs flex flex-col gap-1">
            <p class="font-medium text-amber-600">
              <span class="i-lucide-triangle-alert align-text-bottom mr-0.5"></span>
              제외되는 회원 {{ data.excluded.length }}명
            </p>
            <p v-for="e in data.excluded" :key="e.studentId" class="text-text-secondary">
              {{ e.name }} ({{ e.studentId }}) · {{ e.reason === 'noVolunteerId' ? '1365 ID 없음' : `${selectedSemester} 명단에 없음` }} · 인증 {{ e.count }}건
            </p>
            <router-link to="/console/members" class="text-primary hover:underline self-start">회원 관리에서 1365 ID 채우기</router-link>
          </div>
        </template>
      </div>

      <Button
        label="인증서 문서 생성"
        icon="i-lucide-file-spreadsheet"
        class="self-start"
        :loading="generating"
        :disabled="!data?.rows.length || previewLoading"
        @click="generateCertificate"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { saveAs } from 'file-saver'
import PageHeader from '../components/PageHeader.vue'
import { getCertificateData } from '../api/verifications.js'
import { useSemesters } from '../composables/useSemesters.js'
import { useNotify } from '../composables/useNotify.js'
import { buildCertificateWorkbook } from '../utils/certificate1365.js'
import { formatDate } from '../../../shared/utils/dateFormat.js'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const PRESETS = [
  { label: '이번 달', value: 'thisMonth' },
  { label: '지난 달', value: 'lastMonth' },
  { label: '직접 입력', value: 'custom' },
]

const notify = useNotify()
const { semesters, currentSemester, loadSemesters } = useSemesters()

const preset = ref('thisMonth')
const startDate = ref(null)
const endDate = ref(null)
const selectedSemester = ref('')
const maskPrivacy = ref(false)
const generating = ref(false)
const data = ref(null)
const previewLoading = ref(false)
const previewError = ref('')

const summary = computed(() => ({
  people: new Set(data.value.rows.map(r => r.volID)).size,
  hours: data.value.rows.reduce((sum, r) => sum + r.hour, 0),
}))

function applyPreset() {
  const now = new Date()
  if (preset.value === 'thisMonth') {
    startDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate.value = now
  } else if (preset.value === 'lastMonth') {
    startDate.value = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    endDate.value = new Date(now.getFullYear(), now.getMonth(), 0)
  }
}

function params() {
  if (!startDate.value || !endDate.value || !selectedSemester.value) return null
  return {
    startDate: formatDate(startDate.value, 'yyyy-mm-dd'),
    endDate: formatDate(endDate.value, 'yyyy-mm-dd'),
    semester: selectedSemester.value,
    mask: String(maskPrivacy.value),
  }
}

let seq = 0
async function loadPreview() {
  // Bump first so a response for older inputs never lands, even after an early return
  const mine = ++seq
  const p = params()
  data.value = null
  previewError.value = ''
  previewLoading.value = false
  if (!p) return
  if (p.startDate > p.endDate) {
    previewError.value = '시작일이 종료일보다 늦습니다.'
    return
  }
  previewLoading.value = true
  try {
    const res = await getCertificateData(p)
    if (mine === seq) data.value = res.data
  } catch (e) {
    if (mine === seq) previewError.value = e.error?.message || '확인서 데이터를 불러오지 못했습니다.'
  } finally {
    if (mine === seq) previewLoading.value = false
  }
}

watch([startDate, endDate, selectedSemester, maskPrivacy], loadPreview)

onMounted(async () => {
  applyPreset()
  await loadSemesters()
  selectedSemester.value = currentSemester.value
})

async function fetchBinary(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} 로드 실패`)
  return res.arrayBuffer()
}

async function generateCertificate() {
  const p = params()
  if (!p || !data.value?.rows.length) return

  generating.value = true
  try {
    const [module, seal, logo] = await Promise.all([
      import('exceljs'),
      fetchBinary('/cert/seal.jpg'),
      fetchBinary('/cert/logo.jpg'),
    ])
    const wb = buildCertificateWorkbook(data.value.rows, data.value.chief, { ExcelJS: module.default ?? module, seal, logo })
    const buffer = await wb.xlsx.writeBuffer()
    saveAs(new Blob([buffer], { type: XLSX_MIME }), `자원봉사활동확인서_${p.startDate}_${p.endDate}.xlsx`)
  } catch (e) {
    notify.error(e, e.message || '인증서 생성 실패')
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--c-text-secondary);
}
</style>
