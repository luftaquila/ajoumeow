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
          <Button label="학기 전환" size="small" severity="warn" :loading="transitioning" @click="onTransition" />
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
          회원 등록
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
          신입 모집
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

      <!-- College / Department Editor -->
      <div class="card-section">
        <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
          <span class="i-lucide-school text-lg text-text-secondary"></span>
          단과대 / 학과
        </h2>
        <div v-if="dataLoading.college" class="text-center py-4">
          <div class="i-lucide-loader-circle text-xl text-primary animate-spin mx-auto"></div>
        </div>
        <div v-else>
          <Accordion :multiple="true">
            <AccordionPanel v-for="(depts, college) in collegeData" :key="college" :value="college">
              <AccordionHeader>
                <div class="flex items-center justify-between w-full pr-2">
                  <span>{{ college }} ({{ depts.length }})</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="flex flex-col gap-2">
                  <div v-for="(dept, di) in depts" :key="di" class="flex items-center gap-2">
                    <InputText v-model="depts[di]" class="flex-1" size="small" />
                    <Button icon="i-lucide-x" severity="danger" text size="small" @click="depts.splice(di, 1)" />
                  </div>
                  <Button label="학과 추가" icon="i-lucide-plus" severity="secondary" text size="small" @click="depts.push('')" />
                  <div class="border-t border-surface-border mt-2 pt-2">
                    <Button label="단과대 삭제" icon="i-lucide-trash-2" severity="danger" text size="small" @click="deleteCollege(college)" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
          <div class="flex items-center gap-2 mt-4">
            <InputText v-model="newCollegeName" placeholder="새 단과대 이름" size="small" />
            <Button label="단과대 추가" icon="i-lucide-plus" size="small" severity="secondary" @click="addCollege" />
          </div>
          <Button label="저장" size="small" class="mt-3" :loading="dataSaving.college" @click="saveCollege" />
        </div>
      </div>

      <!-- Map Location Editor -->
      <div class="card-section">
        <h2 class="text-base font-semibold mb-4 flex items-center gap-2">
          <span class="i-lucide-map-pin text-lg text-text-secondary"></span>
          급식소 위치
        </h2>
        <div v-if="dataLoading.map" class="text-center py-4">
          <div class="i-lucide-loader-circle text-xl text-primary animate-spin mx-auto"></div>
        </div>
        <div v-else-if="mapData">
          <!-- Home -->
          <div class="mb-4">
            <h3 class="text-sm font-medium mb-2 text-text-secondary">동아리방</h3>
            <div class="grid grid-cols-2 gap-2">
              <InputText v-model="mapData.home.name" placeholder="이름" size="small" />
              <InputText v-model="mapData.home.detail" placeholder="상세" size="small" />
              <InputText v-model="mapData.home.lat" placeholder="위도" size="small" />
              <InputText v-model="mapData.home.lon" placeholder="경도" size="small" />
            </div>
          </div>
          <!-- Courses -->
          <Accordion :multiple="true">
            <AccordionPanel v-for="courseKey in mapCourseKeys" :key="courseKey" :value="courseKey">
              <AccordionHeader>
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: courseColor(courseKey) }"></span>
                  <span>{{ courseKey }} ({{ mapData[courseKey].data.length }})</span>
                </div>
              </AccordionHeader>
              <AccordionContent>
                <div class="flex flex-col gap-2">
                  <div v-for="(loc, li) in mapData[courseKey].data" :key="li" class="flex items-center gap-2 flex-wrap">
                    <InputText v-model="loc.name" placeholder="이름" size="small" class="flex-1 min-w-24" />
                    <InputText v-model="loc.detail" placeholder="상세" size="small" class="flex-1 min-w-24" />
                    <InputText v-model="loc.lat" placeholder="위도" size="small" class="w-28" />
                    <InputText v-model="loc.lon" placeholder="경도" size="small" class="w-28" />
                    <Button icon="i-lucide-x" severity="danger" text size="small" @click="mapData[courseKey].data.splice(li, 1)" />
                  </div>
                  <Button label="위치 추가" icon="i-lucide-plus" severity="secondary" text size="small"
                    @click="mapData[courseKey].data.push({ name: '', detail: '', lat: '', lon: '' })" />
                </div>
              </AccordionContent>
            </AccordionPanel>
          </Accordion>
          <Button label="저장" size="small" class="mt-3" :loading="dataSaving.map" @click="saveMap" />
        </div>
      </div>

    </div>

    <!-- Semester transition dialog -->
    <Dialog v-model:visible="showTransitionDialog" header="학기 전환" :modal="true" :closable="!executing" :style="{ width: '28rem' }">
      <div v-if="previewLoading" class="text-center py-6">
        <div class="i-lucide-loader-circle text-2xl text-primary animate-spin mx-auto"></div>
      </div>
      <div v-else-if="transitionPreview" class="flex flex-col gap-4">
        <div class="text-sm">
          <span class="font-semibold">{{ transitionPreview.currentSemester }}</span>
          <span class="mx-2 text-text-muted">&rarr;</span>
          <span class="font-semibold text-primary">{{ transitionPreview.targetSemester }}</span>
          <span v-if="transitionPreview.targetExists" class="ml-2 text-xs text-text-muted">(기존 학기)</span>
        </div>

        <div>
          <p class="text-sm font-medium mb-2">이전될 임원 ({{ transitionPreview.executives.length }}명)</p>
          <div v-if="transitionPreview.executives.length" class="border border-surface rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-surface-ground">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">이름</th>
                  <th class="px-3 py-2 text-left font-medium">학번</th>
                  <th class="px-3 py-2 text-left font-medium">역할</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="exec in transitionPreview.executives" :key="exec.studentId" class="border-t border-surface">
                  <td class="px-3 py-2">{{ exec.name }}</td>
                  <td class="px-3 py-2 text-text-secondary">{{ exec.studentId }}</td>
                  <td class="px-3 py-2">{{ exec.role }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-sm text-text-muted">이전 학기에 임원이 없습니다.</p>
        </div>

        <p class="text-xs text-text-muted">학기 전환 후 일반 회원은 새 학기에 다시 등록해야 합니다.</p>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button label="취소" severity="secondary" size="small" :disabled="executing" @click="showTransitionDialog = false" />
          <Button label="전환" severity="warn" size="small" :loading="executing" @click="confirmTransition" />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Dialog from 'primevue/dialog'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import PageHeader from '../components/PageHeader.vue'
import { getSetting, updateSetting } from '../api/settings.js'
import { previewTransition, executeTransition } from '../api/semesters.js'
import { getData, updateData } from '../api/data.js'
import { COURSES } from '../../../timetable/src/constants.js'
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

// Transition state
const transitioning = ref(false)
const showTransitionDialog = ref(false)
const previewLoading = ref(false)
const transitionPreview = ref(null)
const executing = ref(false)

// Data editor state
const dataLoading = reactive({ college: true, map: true })
const dataSaving = reactive({ college: false, map: false })
const collegeData = ref({})
const newCollegeName = ref('')
const mapData = ref(null)

const mapCourseKeys = computed(() => {
  if (!mapData.value) return []
  return Object.keys(mapData.value).filter(k => k !== 'home')
})

function courseColor(courseKey) {
  const num = courseKey.match(/\d+/)?.[0]
  return COURSES[num]?.color || '#888'
}

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

  // Load data editors in parallel
  loadData('college', d => { collegeData.value = d })
  loadData('map', d => { mapData.value = d })
})

async function loadData(key, setter) {
  try {
    const d = await getData(key)
    setter(d)
  } catch {
    toast.add({ severity: 'error', summary: `${key} 데이터 로드 실패`, life: 3000 })
  } finally {
    dataLoading[key] = false
  }
}

// --- Existing settings save functions ---

async function onTransition() {
  const name = `${semesterYear.value}-${semesterTerm.value}`
  transitioning.value = true
  previewLoading.value = true
  transitionPreview.value = null
  showTransitionDialog.value = true

  try {
    const res = await previewTransition(name)
    transitionPreview.value = res.data
  } catch (e) {
    showTransitionDialog.value = false
    const msg = e?.error?.message || '미리보기 조회 실패'
    toast.add({ severity: 'error', summary: msg, life: 3000 })
  } finally {
    transitioning.value = false
    previewLoading.value = false
  }
}

async function confirmTransition() {
  executing.value = true
  try {
    const res = await executeTransition(transitionPreview.value.targetSemester)
    const { semester, carryOverMembers } = res.data
    showTransitionDialog.value = false
    toast.add({
      severity: 'success',
      summary: `${semester} 학기로 전환 완료`,
      detail: carryOverMembers.length ? `임원 ${carryOverMembers.length}명 이전됨` : undefined,
      life: 4000,
    })
  } catch (e) {
    const msg = e?.error?.message || '학기 전환 실패'
    toast.add({ severity: 'error', summary: msg, life: 3000 })
  } finally {
    executing.value = false
  }
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

// --- Data editor functions ---

function addCollege() {
  const name = newCollegeName.value.trim()
  if (!name) return
  if (collegeData.value[name]) {
    toast.add({ severity: 'warn', summary: '이미 존재하는 단과대입니다.', life: 2000 })
    return
  }
  collegeData.value[name] = []
  newCollegeName.value = ''
}

function deleteCollege(college) {
  delete collegeData.value[college]
}

async function saveCollege() {
  dataSaving.college = true
  try {
    await updateData('college', collegeData.value)
    toast.add({ severity: 'success', summary: '단과대/학과가 저장되었습니다.', life: 2000 })
  } catch { toast.add({ severity: 'error', summary: '저장 실패', life: 2000 }) }
  finally { dataSaving.college = false }
}

async function saveMap() {
  dataSaving.map = true
  try {
    // Sync course colors from timetable constants
    for (const key of mapCourseKeys.value) {
      mapData.value[key].color = courseColor(key)
    }
    await updateData('map', mapData.value)
    toast.add({ severity: 'success', summary: '급식소 위치가 저장되었습니다.', life: 2000 })
  } catch { toast.add({ severity: 'error', summary: '저장 실패', life: 2000 }) }
  finally { dataSaving.map = false }
}
</script>
