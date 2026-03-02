<template>
  <div>
    <PageHeader
      title="신입 모집"
      description="가입 신청 목록을 조회하고 내보냅니다."
      icon="i-lucide-user-plus"
    />

    <!-- Register link -->
    <div class="card-section mb-6 text-sm flex flex-col gap-2">
      <div class="flex items-center gap-2 text-text-muted">
        <span class="i-lucide-link text-base"></span>
        모집 설문지:
        <a href="/register/" target="_blank" class="text-primary hover:underline">/register/</a>
        <button
          class="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-dim transition-colors cursor-pointer"
          title="URL 복사"
          @click="copyRegisterUrl"
        >
          <span class="i-lucide-copy text-sm"></span>
        </button>
      </div>
      <p class="text-xs text-yellow-600">
        <span class="i-lucide-triangle-alert text-xs align-text-bottom mr-0.5"></span>
        설문지 배포 전에 반드시 <b>설정</b> 탭에서 현재 학기 및 신입 모집 관련 설정을 업데이트하세요.
      </p>
    </div>

    <ActionBar>
      <template #left>
        <Select
          v-model="selectedSemester"
          :options="semesterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="학기 선택"
          class="w-40"
          @change="loadRegistrations"
        />
        <span v-if="registrations.length" class="text-xs text-text-muted bg-surface-dim px-2 py-1 rounded-full">
          {{ registrations.length }}명
        </span>
      </template>
      <template #right>
        <Button label="Excel" icon="i-lucide-download" size="small" severity="success" @click="downloadExcel" :disabled="!registrations.length" />
        <Button label="Google 연락처" icon="i-lucide-contact" size="small" severity="secondary" @click="downloadGoogleCsv" :disabled="!registrations.length" />
        <Button label="Naver 연락처" icon="i-lucide-contact" size="small" severity="secondary" @click="downloadNaverCsv" :disabled="!registrations.length" />
      </template>
    </ActionBar>

    <div class="card overflow-hidden">
      <DataTable
        :value="registrations"
        :loading="loading"
        paginator
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        sortMode="multiple"
        removableSort
        stripedRows
        class="text-sm"
      >
        <Column field="createdAt" header="신청일" sortable style="width: 11rem">
          <template #body="{ data }">
            <span class="text-xs">{{ data.createdAt }}</span>
          </template>
        </Column>
        <Column field="studentId" header="학번" sortable style="width: 7rem" />
        <Column field="name" header="이름" sortable style="width: 5rem" />
        <Column field="college" header="단과대학" sortable />
        <Column field="department" header="학과" sortable />
        <Column field="phone" header="연락처" sortable style="width: 9rem" />
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import Button from 'primevue/button'
import PageHeader from '../components/PageHeader.vue'
import ActionBar from '../components/ActionBar.vue'
import { getRegistrations, getRegistrationSemesters } from '../api/registrations.js'
import { toGoogleContactsCsv, toNaverContactsCsv } from '../utils/contactExport.js'
import { useSemesters } from '../composables/useSemesters.js'

const toast = useToast()
const { currentSemester, loadSemesters } = useSemesters()

const selectedSemester = ref('')
const semesterOptions = ref([])
const registrations = ref([])
const loading = ref(false)

function copyRegisterUrl() {
  const url = `${location.origin}/register/`
  navigator.clipboard.writeText(url).then(() => {
    toast.add({ severity: 'success', summary: 'URL이 복사되었습니다.', life: 1500 })
  })
}

onMounted(async () => {
  try {
    const [semRes] = await Promise.all([
      getRegistrationSemesters(),
      loadSemesters(),
    ])
    const sorted = (semRes.data || []).sort((a, b) => b.localeCompare(a))
    semesterOptions.value = sorted.map(s => ({ label: s, value: s }))
    if (semesterOptions.value.length) {
      selectedSemester.value = currentSemester.value || semesterOptions.value[0].value
      await loadRegistrations()
    }
  } catch {
    toast.add({ severity: 'error', summary: '학기 목록 로드 실패', life: 3000 })
  }
})

async function loadRegistrations() {
  if (!selectedSemester.value) return
  loading.value = true
  try {
    const res = await getRegistrations(selectedSemester.value)
    registrations.value = res.data
  } catch {
    toast.add({ severity: 'error', summary: '신청 목록 로드 실패', life: 3000 })
  } finally {
    loading.value = false
  }
}

function downloadExcel() {
  import('xlsx').then(XLSX => {
    const data = registrations.value.map(r => ({
      '신청일': r.createdAt,
      '학번': r.studentId,
      '이름': r.name,
      '단과대학': r.college,
      '학과': r.department,
      '연락처': r.phone,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '신입모집')
    XLSX.writeFile(wb, `신입모집_${selectedSemester.value}.xlsx`)
  })
}

function downloadCsvFile(content, filename) {
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadGoogleCsv() {
  const csv = toGoogleContactsCsv(registrations.value)
  downloadCsvFile(csv, `연락처_Google_${selectedSemester.value}.csv`)
}

function downloadNaverCsv() {
  const csv = toNaverContactsCsv(registrations.value)
  downloadCsvFile(csv, `연락처_Naver_${selectedSemester.value}.csv`)
}
</script>
