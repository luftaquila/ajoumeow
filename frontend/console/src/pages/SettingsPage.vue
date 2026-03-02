<template>
  <div>
    <PageHeader
      title="설정"
      description="서비스 운영 설정을 관리합니다."
      icon="i-lucide-wrench"
    />

    <div v-if="loading" class="text-center py-12">
      <div class="i-lucide-loader-circle text-3xl text-primary animate-spin mx-auto"></div>
    </div>

    <div v-else class="flex flex-col gap-6 max-w-2xl">
      <!-- Current Semester -->
      <div class="card-section">
        <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
          <span class="i-lucide-graduation-cap text-lg text-text-secondary"></span>
          현재 학기
        </h2>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="w-28"><InputNumber v-model="semesterYear" :min="2020" :max="2099" :useGrouping="false" fluid /></div>
          <span class="text-text-secondary">년</span>
          <div class="w-28"><Select
            v-model="semesterTerm"
            :options="[{ label: '1학기', value: '1' }, { label: '2학기', value: '2' }]"
            optionLabel="label"
            optionValue="value"
            fluid
          /></div>
          <Button label="저장" size="small" @click="saveSemester" />
        </div>
      </div>

      <!-- Max feeding -->
      <div class="card-section">
        <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
          <span class="i-lucide-utensils text-lg text-text-secondary"></span>
          최대 급식 인원
        </h2>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="w-28"><InputNumber v-model="maxCount" :min="1" :max="100" fluid /></div>
          <span class="text-text-secondary">명</span>
          <Button label="저장" size="small" @click="saveMaxCount" />
        </div>
      </div>

      <!-- Apply settings -->
      <div class="card-section">
        <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
          <span class="i-lucide-user-check text-lg text-text-secondary"></span>
          회원 등록 (Apply)
        </h2>
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <label class="text-sm text-text-secondary">등록 활성화</label>
            <ToggleSwitch v-model="settings.isApply" @change="saveBool('isApply', settings.isApply)" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm text-text-secondary">기간 제한</label>
            <ToggleSwitch v-model="settings.isApplyRestricted" @change="saveBool('isApplyRestricted', settings.isApplyRestricted)" />
          </div>
          <div v-if="settings.isApplyRestricted" class="border-l-2 border-primary/30 pl-4">
            <div class="flex items-center gap-3 flex-wrap">
              <div class="w-40"><DatePicker v-model="applyStart" dateFormat="yy-mm-dd" fluid /></div>
              <span class="text-text-muted">~</span>
              <div class="w-40"><DatePicker v-model="applyEnd" dateFormat="yy-mm-dd" fluid /></div>
              <Button label="저장" size="small" @click="saveApplyTerm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Register settings -->
      <div class="card-section">
        <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
          <span class="i-lucide-user-plus text-lg text-text-secondary"></span>
          신입 모집 (Register)
        </h2>
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <label class="text-sm text-text-secondary">모집 활성화</label>
            <ToggleSwitch v-model="settings.isRegister" @change="saveBool('isRegister', settings.isRegister)" />
          </div>
          <div class="flex items-center justify-between">
            <label class="text-sm text-text-secondary">기간 제한</label>
            <ToggleSwitch v-model="settings.isRegisterRestricted" @change="saveBool('isRegisterRestricted', settings.isRegisterRestricted)" />
          </div>
          <div v-if="settings.isRegisterRestricted" class="border-l-2 border-primary/30 pl-4">
            <div class="flex items-center gap-3 flex-wrap">
              <div class="w-40"><DatePicker v-model="registerStart" dateFormat="yy-mm-dd" fluid /></div>
              <span class="text-text-muted">~</span>
              <div class="w-40"><DatePicker v-model="registerEnd" dateFormat="yy-mm-dd" fluid /></div>
              <Button label="저장" size="small" @click="saveRegisterTerm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Notice -->
      <div class="card-section">
        <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
          <span class="i-lucide-megaphone text-lg text-text-secondary"></span>
          공지사항
        </h2>
        <Textarea v-model="noticeContent" rows="5" class="w-full" placeholder="공지사항 내용 (HTML 가능)" />
        <Button label="저장" size="small" class="mt-3" @click="saveNotice" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import PageHeader from '../components/PageHeader.vue'
import { getSetting, updateSetting } from '../api/settings.js'
import { formatDate } from '../../../shared/utils/dateFormat.js'

const toast = useToast()
const loading = ref(true)

const semesterYear = ref(2025)
const semesterTerm = ref('1')

const settings = ref({
  isApply: false,
  isApplyRestricted: false,
  isRegister: false,
  isRegisterRestricted: false,
})

const applyStart = ref(null)
const applyEnd = ref(null)
const registerStart = ref(null)
const registerEnd = ref(null)
const noticeContent = ref('')
const noticeVersion = ref(0)
const maxCount = ref(10)

function fmtDate(d) {
  return formatDate(d, 'yyyy-mm-dd')
}

function parseTermDates(term) {
  if (!term || !term.includes('~')) return [null, null]
  const [s, e] = term.split('~')
  return [new Date(s), new Date(e)]
}

onMounted(async () => {
  try {
    const keys = ['currentSemester', 'isApply', 'isApplyRestricted', 'applyTerm',
                   'isRegister', 'isRegisterRestricted', 'registerTerm', 'notice', 'maxFeedingUserCount']
    const results = await Promise.all(keys.map(k => getSetting(k)))
    const vals = {}
    keys.forEach((k, i) => { vals[k] = results[i].data })

    // semester
    const [y, t] = vals.currentSemester.split('-')
    semesterYear.value = parseInt(y)
    semesterTerm.value = t

    // toggles
    settings.value.isApply = vals.isApply === 'TRUE'
    settings.value.isApplyRestricted = vals.isApplyRestricted === 'TRUE'
    settings.value.isRegister = vals.isRegister === 'TRUE'
    settings.value.isRegisterRestricted = vals.isRegisterRestricted === 'TRUE'

    // terms
    const [as, ae] = parseTermDates(vals.applyTerm)
    applyStart.value = as
    applyEnd.value = ae
    const [rs, re] = parseTermDates(vals.registerTerm)
    registerStart.value = rs
    registerEnd.value = re

    // notice
    if (vals.notice && vals.notice.includes('$')) {
      const idx = vals.notice.indexOf('$')
      noticeVersion.value = parseInt(vals.notice.slice(0, idx)) || 0
      noticeContent.value = vals.notice.slice(idx + 1)
    } else {
      noticeContent.value = vals.notice || ''
    }

    // max
    maxCount.value = parseInt(vals.maxFeedingUserCount) || 10
  } catch (e) {
    toast.add({ severity: 'error', summary: '설정 로드 실패', life: 3000 })
  } finally {
    loading.value = false
  }
})

async function saveSemester() {
  try {
    await updateSetting('currentSemester', `${semesterYear.value}-${semesterTerm.value}`)
    toast.add({ severity: 'success', summary: '학기가 변경되었습니다.', life: 2000 })
  } catch { toast.add({ severity: 'error', summary: '저장 실패', life: 2000 }) }
}

async function saveBool(key, val) {
  try {
    await updateSetting(key, val ? 'TRUE' : 'FALSE')
    toast.add({ severity: 'success', summary: '설정이 변경되었습니다.', life: 2000 })
  } catch { toast.add({ severity: 'error', summary: '저장 실패', life: 2000 }) }
}

async function saveApplyTerm() {
  if (!applyStart.value || !applyEnd.value) return
  try {
    await updateSetting('applyTerm', `${fmtDate(applyStart.value)}~${fmtDate(applyEnd.value)}`)
    toast.add({ severity: 'success', summary: '등록 기간이 변경되었습니다.', life: 2000 })
  } catch { toast.add({ severity: 'error', summary: '저장 실패', life: 2000 }) }
}

async function saveRegisterTerm() {
  if (!registerStart.value || !registerEnd.value) return
  try {
    await updateSetting('registerTerm', `${fmtDate(registerStart.value)}~${fmtDate(registerEnd.value)}`)
    toast.add({ severity: 'success', summary: '모집 기간이 변경되었습니다.', life: 2000 })
  } catch { toast.add({ severity: 'error', summary: '저장 실패', life: 2000 }) }
}

async function saveNotice() {
  try {
    const newVersion = noticeVersion.value + 1
    await updateSetting('notice', `${newVersion}$${noticeContent.value}`)
    noticeVersion.value = newVersion
    toast.add({ severity: 'success', summary: '공지사항이 변경되었습니다.', life: 2000 })
  } catch { toast.add({ severity: 'error', summary: '저장 실패', life: 2000 }) }
}

async function saveMaxCount() {
  try {
    await updateSetting('maxFeedingUserCount', String(maxCount.value))
    toast.add({ severity: 'success', summary: '최대 인원이 변경되었습니다.', life: 2000 })
  } catch { toast.add({ severity: 'error', summary: '저장 실패', life: 2000 }) }
}
</script>
