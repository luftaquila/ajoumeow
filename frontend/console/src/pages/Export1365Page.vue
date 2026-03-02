<template>
  <div>
    <PageHeader
      title="1365 봉사활동 인증서"
      description="봉사활동 인증서 Google Sheets를 생성합니다."
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
          <label for="mask" class="text-sm cursor-pointer">개인정보 숨기기 (이름 마스킹)</label>
        </div>

        <Button
          label="Google Sheets 생성"
          icon="i-lucide-file-spreadsheet"
          @click="doExport"
          :loading="exporting"
        />

        <!-- Result URL panel -->
        <div v-if="resultUrl" class="flex items-center gap-2 p-3 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20">
          <span class="i-lucide-check-circle text-lg text-[#22C55E]"></span>
          <a :href="resultUrl" target="_blank" rel="noopener" class="text-sm text-primary hover:underline break-all">
            {{ resultUrl }}
          </a>
        </div>
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
import PageHeader from '../components/PageHeader.vue'
import { export1365 } from '../api/verifications.js'
import { useSemesters } from '../composables/useSemesters.js'
import { formatDate } from '../../../shared/utils/dateFormat.js'

const toast = useToast()
const { semesters, currentSemester, loadSemesters } = useSemesters()

const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const endDate = ref(new Date())
const selectedSemester = ref('')
const maskPrivacy = ref(false)
const exporting = ref(false)
const resultUrl = ref('')

const semesterOptions = ref([])

onMounted(async () => {
  await loadSemesters()
  semesterOptions.value = semesters.value.map(s => ({ label: s, value: s }))
  selectedSemester.value = currentSemester.value
})

async function doExport() {
  if (!startDate.value || !endDate.value || !selectedSemester.value) {
    toast.add({ severity: 'warn', summary: '모든 항목을 입력해주세요.', life: 2000 })
    return
  }

  exporting.value = true
  resultUrl.value = ''
  try {
    const res = await export1365({
      startDate: formatDate(startDate.value, 'yyyy-mm-dd'),
      endDate: formatDate(endDate.value, 'yyyy-mm-dd'),
      semester: selectedSemester.value,
      mask: String(maskPrivacy.value),
    })

    if (res.result === 'error') {
      throw { error: { message: res.error || '인증서 생성 중 오류가 발생했습니다.' } }
    }

    if (res.url) {
      resultUrl.value = res.url
      window.open(res.url, '_blank')
    }
    toast.add({ severity: 'success', summary: '인증서가 생성되었습니다.', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: e.error?.message || '생성 실패', life: 3000 })
  } finally {
    exporting.value = false
  }
}
</script>
