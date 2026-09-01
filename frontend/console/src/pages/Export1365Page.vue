<template>
  <div>
    <PageHeader
      title="1365 봉사활동 인증서"
      description="봉사활동 인증서를 생성합니다."
      icon="i-lucide-hand-helping"
    />

    <div class="card-section max-w-lg">
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-text-secondary">시작일</label>
            <DatePicker v-model="startDate" dateFormat="yy-mm-dd" class="w-full" />
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-text-secondary">종료일</label>
            <DatePicker v-model="endDate" dateFormat="yy-mm-dd" class="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">학기</label>
          <Select
            v-model="selectedSemester"
            :options="semesterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="학기 선택"
          />
        </div>

        <div class="flex items-center gap-2">
          <Checkbox v-model="maskPrivacy" :binary="true" inputId="mask" />
          <label for="mask" class="text-sm cursor-pointer">개인정보 보호 (이름, 생년월일, 연락처 마스킹)</label>
        </div>

        <Button
          label="인증서 문서 생성"
          icon="i-lucide-file-spreadsheet"
          @click="generateCertificate"
          :loading="generating"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { saveAs } from 'file-saver'
import PageHeader from '../components/PageHeader.vue'
import { getCertificateData } from '../api/verifications.js'
import { useSemesters } from '../composables/useSemesters.js'
import { buildCertificateWorkbook } from '../utils/certificate1365.js'
import { formatDate } from '../../../shared/utils/dateFormat.js'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const toast = useToast()
const { semesters, currentSemester, loadSemesters } = useSemesters()

const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const endDate = ref(new Date())
const selectedSemester = ref('')
const maskPrivacy = ref(false)
const generating = ref(false)

const semesterOptions = ref([])

onMounted(async () => {
  await loadSemesters()
  semesterOptions.value = semesters.value.map(s => ({ label: s, value: s }))
  selectedSemester.value = currentSemester.value
})

function getParams() {
  if (!startDate.value || !endDate.value || !selectedSemester.value) {
    toast.add({ severity: 'warn', summary: '모든 항목을 입력해주세요.', life: 2000 })
    return null
  }
  return {
    startDate: formatDate(startDate.value, 'yyyy-mm-dd'),
    endDate: formatDate(endDate.value, 'yyyy-mm-dd'),
    semester: selectedSemester.value,
    mask: String(maskPrivacy.value),
  }
}

async function fetchBinary(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} 로드 실패`)
  return res.arrayBuffer()
}

async function generateCertificate() {
  const params = getParams()
  if (!params) return

  generating.value = true
  try {
    const res = await getCertificateData(params)
    const { rows, chief } = res.data

    if (!rows.length) {
      toast.add({ severity: 'warn', summary: '해당 기간에 인증 데이터가 없습니다.', life: 3000 })
      return
    }

    const [module, seal, logo] = await Promise.all([
      import('exceljs'),
      fetchBinary('/cert/seal.jpg'),
      fetchBinary('/cert/logo.jpg'),
    ])

    const wb = buildCertificateWorkbook(rows, chief, { ExcelJS: module.default ?? module, seal, logo })
    const buffer = await wb.xlsx.writeBuffer()
    saveAs(new Blob([buffer], { type: XLSX_MIME }), `자원봉사활동확인서_${params.startDate}_${params.endDate}.xlsx`)
  } catch (e) {
    toast.add({ severity: 'error', summary: e.error?.message || e.message || '인증서 생성 실패', life: 3000 })
  } finally {
    generating.value = false
  }
}
</script>
