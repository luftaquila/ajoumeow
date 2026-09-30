<template>
  <div class="max-w-3xl">
    <PageHeader
      title="설정"
      description="회원 등록·신입 모집 기간, 공지, 급식 관련 값을 바꿉니다. 바꾼 내용은 아래 저장 버튼을 눌러야 반영됩니다."
      icon="i-lucide-settings"
    />

    <div v-if="!draft" class="text-center py-12">
      <div class="i-lucide-loader-circle text-3xl text-primary animate-spin mx-auto"></div>
    </div>

    <Tabs v-else v-model:value="tab">
      <TabList>
        <Tab v-for="t in TABS" :key="t.value" :value="t.value">
          {{ t.label }}<span v-if="dirtyTabs.has(t.value)" class="dirty-dot" title="저장하지 않은 변경"></span>
        </Tab>
      </TabList>
      <TabPanels class="px-0!">
        <!-- 운영 -->
        <TabPanel value="ops" class="flex flex-col gap-5">
          <section v-for="w in WINDOWS" :key="w.key" class="card-section">
            <h2 class="section-title mb-4"><span :class="w.icon"></span>{{ w.title }}</h2>
            <div class="flex flex-col gap-3">
              <label class="row-toggle">
                <span>{{ w.enableLabel }}</span>
                <ToggleSwitch v-model="draft[w.key]" />
              </label>
              <label class="row-toggle" :class="{ 'opacity-50': !draft[w.key] }">
                <span>기간 제한</span>
                <ToggleSwitch v-model="draft[w.restrictKey]" :disabled="!draft[w.key]" />
              </label>
              <div v-if="draft[w.key] && draft[w.restrictKey]" class="flex flex-col gap-1">
                <DatePicker
                  v-model="draft[w.termKey]"
                  selectionMode="range"
                  :manualInput="false"
                  dateFormat="yy-mm-dd"
                  placeholder="시작일 - 종료일"
                  showIcon
                  class="w-full sm:w-72"
                  :invalid="!!errors[w.termKey]"
                />
                <small v-if="errors[w.termKey]" class="field-error">{{ errors[w.termKey] }}</small>
              </div>
            </div>
          </section>

          <section class="card-section">
            <h2 class="section-title mb-4"><span class="i-lucide-megaphone"></span>공지사항</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <Textarea v-model="draft.notice.content" rows="7" class="w-full font-mono text-sm" placeholder="공지사항 내용 (HTML 가능)" :invalid="!!errors.notice" />
                <small v-if="errors.notice" class="field-error">{{ errors.notice }}</small>
              </div>
              <div class="rounded-xl border border-dashed border-surface-border p-4 flex items-center justify-center">
                <span v-if="draft.notice.content" class="text-sm text-center leading-[1.1rem]" v-html="noticePreview"></span>
                <span v-else class="text-xs text-text-muted">미리보기</span>
              </div>
            </div>
            <label class="flex items-center gap-2 mt-3 text-sm cursor-pointer select-none">
              <Checkbox v-model="noticeRepost" :binary="true" />
              이미 본 회원에게도 다시 표시
            </label>
          </section>
        </TabPanel>

        <!-- 급식 -->
        <TabPanel value="feeding" class="flex flex-col gap-5">
          <section class="card-section">
            <h2 class="section-title"><span class="i-lucide-utensils"></span>최대 급식 인원</h2>
            <p class="section-hint">하루 한 코스에 신청할 수 있는 인원입니다.</p>
            <div class="flex items-center gap-2">
              <div class="w-24"><InputNumber v-model="draft.maxFeedingUserCount" :min="1" :max="100" :allowEmpty="false" fluid /></div>
              <span class="text-text-secondary">명</span>
            </div>
          </section>

          <section class="card-section">
            <h2 class="section-title mb-4"><span class="i-lucide-hand-helping"></span>1365 봉사시간</h2>
            <div class="flex flex-col gap-2">
              <div v-for="(_, i) in draft.volunteerHours" :key="i" class="flex items-center gap-3">
                <label class="w-24 text-sm text-text-secondary">하루 {{ i + 1 }}개 코스</label>
                <div class="w-24"><InputNumber v-model="draft.volunteerHours[i]" :min="0.5" :max="8" :step="0.5" :maxFractionDigits="2" :allowEmpty="false" fluid /></div>
                <span class="text-text-secondary">시간</span>
              </div>
            </div>
          </section>

          <section class="card-section">
            <h2 class="section-title mb-4"><span class="i-lucide-map-pin"></span>급식소 위치</h2>
            <div v-if="draft.map" class="flex flex-col gap-4">
              <div>
                <h3 class="text-sm font-medium mb-2 text-text-secondary">동아리방</h3>
                <LocationRow :loc="draft.map.home" :error="errors['map.home']" />
              </div>
              <Accordion multiple>
                <AccordionPanel v-for="courseKey in mapCourseKeys" :key="courseKey" :value="courseKey">
                  <AccordionHeader>
                    <div class="flex items-center gap-2">
                      <span class="w-3 h-3 rounded-full inline-block" :style="{ backgroundColor: courseColor(courseKey) }"></span>
                      <span>{{ courseKey }} ({{ draft.map[courseKey].data.length }}곳)</span>
                      <span v-if="Object.keys(errors).some(k => k.startsWith(`map.${courseKey}.`))" class="i-lucide-circle-alert text-red-500"></span>
                    </div>
                  </AccordionHeader>
                  <AccordionContent>
                    <div class="flex flex-col gap-3">
                      <LocationRow
                        v-for="(loc, li) in draft.map[courseKey].data"
                        :key="li"
                        :loc="loc"
                        :error="errors[`map.${courseKey}.${li}`]"
                        removable
                        @remove="draft.map[courseKey].data.splice(li, 1)"
                      />
                      <Button label="위치 추가" icon="i-lucide-plus" severity="secondary" text size="small" class="self-start"
                        @click="draft.map[courseKey].data.push({ name: '', detail: '', lat: '', lon: '' })" />
                    </div>
                  </AccordionContent>
                </AccordionPanel>
              </Accordion>
            </div>
          </section>
        </TabPanel>

        <!-- 데이터 -->
        <TabPanel value="data" class="flex flex-col gap-5">
          <section class="card-section">
            <h2 class="section-title mb-4"><span class="i-lucide-school"></span>단과대 / 학과</h2>
            <Accordion multiple>
              <AccordionPanel v-for="(depts, college) in draft.college" :key="college" :value="college">
                <AccordionHeader>
                  <span>{{ college }} <span class="text-text-muted text-sm">({{ depts.length }})</span></span>
                  <span v-if="errors[`college.${college}`]" class="i-lucide-circle-alert text-red-500 ml-2"></span>
                </AccordionHeader>
                <AccordionContent>
                  <div class="flex flex-col gap-2">
                    <div v-for="(dept, di) in depts" :key="di" class="flex items-center gap-2">
                      <InputText v-model="depts[di]" class="flex-1" size="small" placeholder="학과 이름" />
                      <Button icon="i-lucide-x" severity="danger" text size="small" title="학과 삭제" @click="depts.splice(di, 1)" />
                    </div>
                    <small v-if="errors[`college.${college}`]" class="field-error">{{ errors[`college.${college}`] }}</small>
                    <div class="flex items-center justify-between">
                      <Button label="학과 추가" icon="i-lucide-plus" severity="secondary" text size="small" @click="depts.push('')" />
                      <Button label="단과대 삭제" icon="i-lucide-trash-2" severity="danger" text size="small" @click="confirmDeleteCollege(college)" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionPanel>
            </Accordion>
            <div class="flex items-center gap-2 mt-4">
              <InputText v-model="newCollegeName" placeholder="새 단과대 이름" size="small" class="w-2/3" @keydown.enter.prevent="addCollege" />
              <Button label="추가" icon="i-lucide-plus" size="small" severity="secondary" @click="addCollege" />
            </div>
          </section>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Save bar -->
    <div v-if="dirtyKeys.length" class="save-bar sticky bottom-0 mt-4 pt-3 pb-1">
      <div class="card flex items-center gap-3 px-4 py-3 flex-wrap">
        <span class="text-sm">
          저장하지 않은 변경 {{ dirtyKeys.length }}건
          <span v-if="errorCount" class="text-red-500 ml-1">· 오류 {{ errorCount }}개</span>
        </span>
        <div class="flex-1"></div>
        <Button label="되돌리기" severity="secondary" text size="small" :disabled="saving" @click="revert" />
        <Button label="저장" icon="i-lucide-save" size="small" :loading="saving" :disabled="errorCount > 0" @click="save" />
      </div>
    </div>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import DatePicker from 'primevue/datepicker'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Accordion from 'primevue/accordion'
import AccordionPanel from 'primevue/accordionpanel'
import AccordionHeader from 'primevue/accordionheader'
import AccordionContent from 'primevue/accordioncontent'
import ConfirmDialog from 'primevue/confirmdialog'
import PageHeader from '../components/PageHeader.vue'
import LocationRow from '../components/LocationRow.vue'
import { getSetting, updateSetting } from '../api/settings.js'
import { getData, updateData } from '../api/data.js'
import { COURSES } from '../../../timetable/src/constants.js'
import { formatDate } from '../../../shared/utils/dateFormat.js'
import { useNotify } from '../composables/useNotify.js'
import { useStatus } from '../composables/useStatus.js'

const notify = useNotify()
const confirm = useConfirm()
const { refreshStatus } = useStatus()

const TABS = [
  { value: 'ops', label: '운영' },
  { value: 'feeding', label: '급식' },
  { value: 'data', label: '단과대/학과' },
]

const WINDOWS = [
  {
    key: 'isApply', restrictKey: 'isApplyRestricted', termKey: 'applyTerm',
    title: '회원 등록', icon: 'i-lucide-user-round-check', enableLabel: '등록 활성화',
  },
  {
    key: 'isRegister', restrictKey: 'isRegisterRestricted', termKey: 'registerTerm',
    title: '신입 모집', icon: 'i-lucide-clipboard-list', enableLabel: '모집 활성화',
  },
]

// Where each saved key lives and how it's stored
const bool = v => (v ? 'TRUE' : 'FALSE')
const term = v => (v?.[0] && v?.[1] ? `${formatDate(v[0], 'yyyy-mm-dd')}~${formatDate(v[1], 'yyyy-mm-dd')}` : '')
const KEYS = {
  isApply: { tab: 'ops', serialize: bool },
  isApplyRestricted: { tab: 'ops', serialize: bool },
  applyTerm: { tab: 'ops', serialize: term },
  isRegister: { tab: 'ops', serialize: bool },
  isRegisterRestricted: { tab: 'ops', serialize: bool },
  registerTerm: { tab: 'ops', serialize: term },
  notice: { tab: 'ops', serialize: v => v.content },
  maxFeedingUserCount: { tab: 'feeding', serialize: v => String(v) },
  volunteerHours: { tab: 'feeding', serialize: v => JSON.stringify(v) },
  map: { tab: 'feeding', serialize: v => JSON.stringify(v), data: true },
  college: { tab: 'data', serialize: v => JSON.stringify(v), data: true },
}

const tab = ref('ops')
const original = ref(null)
const draft = ref(null)
const noticeRepost = ref(true)
const newCollegeName = ref('')
const saving = ref(false)

function clone(v) {
  return JSON.parse(JSON.stringify(v))
}
// Dates don't survive a JSON round trip
function cloneTerm(v) {
  return v ? v.map(d => (d ? new Date(d) : null)) : null
}
function cloneState(s) {
  const c = clone(s)
  c.applyTerm = cloneTerm(s.applyTerm)
  c.registerTerm = cloneTerm(s.registerTerm)
  return c
}

// No stored range must be null: the range picker reads [null, null] as a started range and throws
function parseTerm(value) {
  if (!value || !value.includes('~')) return null
  const [s, e] = value.split('~')
  return [new Date(s + 'T00:00:00'), new Date(e + 'T00:00:00')]
}

function parseVolunteerHours(value) {
  try {
    const hours = JSON.parse(value)
    if (Array.isArray(hours) && hours.length && hours.every(h => typeof h === 'number')) return hours
  } catch {}
  return null
}

onMounted(async () => {
  window.addEventListener('beforeunload', onBeforeUnload)
  try {
    const keys = ['isApply', 'isApplyRestricted', 'applyTerm', 'isRegister', 'isRegisterRestricted', 'registerTerm',
      'notice', 'maxFeedingUserCount', 'volunteerHours']
    const [values, college, map] = await Promise.all([
      Promise.all(keys.map(k => getSetting(k).then(r => r.data))),
      getData('college'),
      getData('map'),
    ])
    const v = Object.fromEntries(keys.map((k, i) => [k, values[i]]))

    const [version, ...rest] = (v.notice || '').includes('$') ? v.notice.split('$') : ['0', v.notice || '']
    // volunteerHours[n - 1] = hours for n courses in a day; one entry per course
    const hours = parseVolunteerHours(v.volunteerHours) || [1, 2, 3]
    const state = {
      isApply: v.isApply === 'TRUE',
      isApplyRestricted: v.isApplyRestricted === 'TRUE',
      applyTerm: parseTerm(v.applyTerm),
      isRegister: v.isRegister === 'TRUE',
      isRegisterRestricted: v.isRegisterRestricted === 'TRUE',
      registerTerm: parseTerm(v.registerTerm),
      notice: { version: parseInt(version) || 0, content: rest.join('$') },
      maxFeedingUserCount: parseInt(v.maxFeedingUserCount) || 10,
      volunteerHours: Object.keys(COURSES).map((_, i) => hours[Math.min(i, hours.length - 1)]),
      map,
      college,
    }
    original.value = state
    draft.value = cloneState(state)
  } catch (e) {
    notify.error(e, '설정을 불러오지 못했습니다.')
  }
})

onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

const dirtyKeys = computed(() => {
  if (!draft.value) return []
  return Object.entries(KEYS)
    .filter(([k, { serialize }]) => serialize(draft.value[k]) !== serialize(original.value[k]))
    .map(([k]) => k)
})
const dirtyTabs = computed(() => new Set(dirtyKeys.value.map(k => KEYS[k].tab)))

const LATLNG_RE = /^-?\d{1,3}(\.\d+)?$/

const errors = computed(() => {
  const e = {}
  const d = draft.value
  if (!d) return e
  for (const w of WINDOWS) {
    if (d[w.key] && d[w.restrictKey]) {
      const [s, t] = d[w.termKey] || []
      if (!s || !t) e[w.termKey] = '시작일과 종료일을 모두 고르세요.'
    }
  }
  // The timetable splits the stored value on '$' (version$content)
  if (d.notice.content.includes('$')) e.notice = "'$' 문자는 쓸 수 없습니다. 급식표에서 공지가 그 앞까지만 보입니다."
  const checkLoc = (loc, key) => {
    if (!loc.name?.trim()) e[key] = '이름을 입력하세요.'
    else if (!LATLNG_RE.test(String(loc.lat).trim()) || !LATLNG_RE.test(String(loc.lon).trim())) e[key] = '위도·경도는 숫자로 입력하세요.'
  }
  if (d.map) {
    checkLoc(d.map.home, 'map.home')
    for (const key of mapCourseKeys.value) d.map[key].data.forEach((loc, i) => checkLoc(loc, `map.${key}.${i}`))
  }
  for (const [college, depts] of Object.entries(d.college || {})) {
    const names = depts.map(x => x.trim())
    if (names.some(n => !n)) e[`college.${college}`] = '빈 학과 이름이 있습니다.'
    else if (new Set(names).size !== names.length) e[`college.${college}`] = '같은 학과가 두 번 있습니다.'
  }
  return e
})
const errorCount = computed(() => Object.keys(errors.value).length)

const mapCourseKeys = computed(() => (draft.value?.map ? Object.keys(draft.value.map).filter(k => k !== 'home') : []))

const noticePreview = computed(() => draft.value.notice.content.replace(/\n/g, '<br>'))

function courseColor(courseKey) {
  return COURSES[courseKey.match(/\d+/)?.[0]]?.color || '#888'
}

// Save a copy so edits made while a request is in flight stay marked as unsaved
function snapshot(key) {
  const d = draft.value
  if (key === 'map') {
    // Course colors follow the timetable constants
    for (const k of mapCourseKeys.value) d.map[k].color = courseColor(k)
  }
  return key === 'applyTerm' || key === 'registerTerm' ? cloneTerm(d[key]) : clone(d[key])
}

async function saveKey(key, value) {
  if (key === 'notice') {
    value.version = original.value.notice.version + (noticeRepost.value ? 1 : 0)
    await updateSetting('notice', `${value.version}$${value.content}`)
    draft.value.notice.version = value.version
  } else if (KEYS[key].data) {
    await updateData(key, value)
  } else {
    await updateSetting(key, KEYS[key].serialize(value))
  }
}

async function save() {
  if (errorCount.value) return
  saving.value = true
  const keys = [...dirtyKeys.value]
  let saved = 0
  try {
    for (const key of keys) {
      const value = snapshot(key)
      await saveKey(key, value)
      original.value[key] = value
      saved++
    }
    notify.success(`${saved}건 저장했습니다.`)
  } catch (e) {
    notify.error(e, `저장 실패 (${saved}/${keys.length}건 저장됨)`)
  } finally {
    saving.value = false
    refreshStatus()
  }
}

function revert() {
  draft.value = cloneState(original.value)
}

function addCollege() {
  const name = newCollegeName.value.trim()
  if (!name) return
  if (draft.value.college[name]) {
    notify.warn('이미 있는 단과대입니다.')
    return
  }
  draft.value.college[name] = []
  newCollegeName.value = ''
}

function confirmDeleteCollege(college) {
  confirm.require({
    header: '단과대 삭제',
    message: `${college}와(과) 학과 ${draft.value.college[college].length}개를 선택지에서 뺄까요?\n저장해야 반영됩니다.`,
    acceptLabel: '삭제',
    rejectLabel: '취소',
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', outlined: true },
    accept: () => { delete draft.value.college[college] },
  })
}

function onBeforeUnload(e) {
  if (!dirtyKeys.value.length) return
  e.preventDefault()
  e.returnValue = ''
}

onBeforeRouteLeave(() => {
  if (!dirtyKeys.value.length) return true
  return new Promise(resolve => {
    confirm.require({
      header: '저장하지 않은 변경',
      message: `저장하지 않은 변경 ${dirtyKeys.value.length}건이 있습니다. 버리고 나갈까요?`,
      acceptLabel: '버리고 나가기',
      rejectLabel: '머무르기',
      acceptProps: { severity: 'danger' },
      rejectProps: { severity: 'secondary', outlined: true },
      accept: () => resolve(true),
      reject: () => resolve(false),
      onHide: () => resolve(false),
    })
  })
})
</script>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}
.section-title > span {
  font-size: 1.125rem;
  color: var(--c-text-secondary);
}
.section-hint {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  margin: 0.25rem 0 1rem;
}
.row-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--c-text-secondary);
  cursor: pointer;
}
.field-error {
  font-size: 0.75rem;
  color: #ef4444;
}
.dirty-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: 0.375rem;
  border-radius: 9999px;
  background: #f59e0b;
  vertical-align: middle;
}
.save-bar {
  background: linear-gradient(to top, var(--c-surface-muted) 75%, transparent);
}
</style>
