<template>
  <div>
    <PageHeader
      title="급식 인증"
      description="급식 신청자 중 실제로 급식한 회원을 인증해 마일리지를 지급합니다. 인증한 급식만 마일리지와 1365 봉사활동 인증서에 반영됩니다."
      icon="i-lucide-calendar-check"
    />

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Calendar + dates still to verify (sticky on desktop) -->
      <div class="lg:sticky lg:top-0 lg:self-start flex-shrink-0 flex flex-col gap-3 lg:w-80">
        <DatePicker
          :key="pickerKey"
          v-model="selectedDate"
          inline
          dateFormat="yy-mm-dd"
          @date-select="loadDate"
          @month-change="onMonthChange"
        >
          <template #date="{ date }">
            <span class="cal-cell">
              {{ date.day }}
              <span v-if="marker(date)" class="cal-dot" :class="`cal-dot-${marker(date)}`"></span>
            </span>
          </template>
        </DatePicker>
        <div class="flex items-center gap-3 text-[11px] text-text-muted px-1">
          <span class="flex items-center gap-1"><span class="legend-dot cal-dot-none"></span>미인증</span>
          <span class="flex items-center gap-1"><span class="legend-dot cal-dot-partial"></span>일부만 인증</span>
          <span class="flex items-center gap-1"><span class="legend-dot cal-dot-done"></span>완료</span>
        </div>

        <div v-if="unverifiedDates.length" class="card p-4">
          <p class="text-xs font-semibold text-text-secondary mb-2">미인증 급식일 (최근 {{ UNVERIFIED_DAYS }}일)</p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="d in unverifiedDates"
              :key="d.date"
              class="date-chip"
              :class="{ active: d.date === dateKey }"
              @click="jumpTo(d.date)"
            >{{ shortDate(d.date) }} · {{ d.records }}건</button>
          </div>
        </div>
      </div>

      <!-- Selected date -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-3 flex-wrap mb-4">
          <h2 class="text-lg font-bold">{{ dateLabel }}</h2>
          <span v-if="rows.length" class="text-xs text-text-muted">
            신청 {{ rows.length }}건 · 인증 {{ verifiedCount }}건
          </span>
          <div class="flex-1"></div>
          <div class="flex items-center gap-2" title="시험기간/연휴/악천후 등">
            <Checkbox v-model="boost" :binary="true" inputId="boost" />
            <label for="boost" class="text-sm cursor-pointer">상향 지급</label>
          </div>
        </div>

        <div v-if="loading" class="text-center py-10">
          <div class="i-lucide-loader-circle text-2xl text-primary animate-spin mx-auto"></div>
        </div>

        <div v-else-if="!rows.length && !extras.length" class="card p-8 text-center text-sm text-text-muted">
          이 날은 급식 신청이 없습니다.
        </div>

        <div v-else class="flex flex-col gap-4">
          <button v-if="pendingRows.length" class="text-xs text-text-muted hover:text-text cursor-pointer self-start -mb-2" @click="toggleAll">
            {{ selectedRows.length }}/{{ pendingRows.length }}명 선택
          </button>
          <!-- One card per course -->
          <div v-for="g in groups" :key="g.course" class="card overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-surface-muted/60">
              <span class="w-2.5 h-2.5 rounded-full" :style="{ background: courseColor(g.course) }"></span>
              <span class="font-semibold text-sm">{{ g.course }}</span>
              <span class="text-xs text-text-muted">{{ g.summary }}</span>
            </div>
            <p v-if="g.scoreMismatch" class="px-4 py-2 text-xs text-yellow-600 border-b border-surface-border/60">
              이미 인증된 회원과 점수가 다릅니다. 같은 점수로 맞추려면 기존 인증을 삭제하고 함께 다시 인증하세요.
            </p>

            <div
              v-for="row in g.rows"
              :key="row.key"
              class="flex items-center gap-3 px-4 py-2.5 border-b border-surface-border/60 last:border-b-0"
            >
              <Checkbox v-if="!row.verified" v-model="row.checked" :binary="true" :inputId="`row-${row.key}`" :disabled="row.saving" />
              <span v-else class="i-lucide-circle-check text-lg text-emerald-500 flex-shrink-0" title="인증됨"></span>

              <div v-if="row.editing" class="flex-1 min-w-0">
                <AutoComplete
                  v-model="row.replacement"
                  :inputId="`feeder-${row.key}`"
                  :suggestions="memberSuggestions"
                  @complete="searchMember"
                  @option-select="changeFeeder(row, $event.value)"
                  optionLabel="display"
                  :placeholder="`${row.name} 대신 급식한 회원`"
                  :disabled="row.saving"
                  size="small"
                  fluid
                />
              </div>
              <label v-else :for="`row-${row.key}`" class="flex-1 min-w-0 truncate" :class="{ 'cursor-pointer': !row.verified }">
                <span class="font-medium">{{ row.name }}</span>
                <span class="text-text-muted text-xs ml-2">{{ row.studentId }}</span>
              </label>

              <span v-if="row.verified" class="text-sm font-semibold text-emerald-600 tabular-nums">{{ row.score }}점</span>
              <span v-else-if="row.checked" class="text-sm font-semibold text-primary tabular-nums">{{ previewScore(row) }}점</span>
              <span v-else class="text-sm text-text-muted">—</span>

              <button
                v-if="row.recordId"
                class="row-action hover:text-primary"
                :title="row.editing ? '취소' : '급식자 변경'"
                :disabled="row.saving"
                @click="toggleFeederEdit(row)"
              ><span :class="row.editing ? 'i-lucide-x' : 'i-lucide-user-pen'"></span></button>
              <button
                v-if="row.verified && !row.editing"
                class="row-action hover:text-red-500"
                title="인증 삭제"
                :disabled="row.saving"
                @click="cancelVerification(row)"
              ><span class="i-lucide-undo-2"></span></button>
            </div>
          </div>

          <!-- Non-feeding grants on this date -->
          <div v-if="extras.length" class="card overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-surface-muted/60">
              <span class="i-lucide-sparkles text-sm text-text-muted"></span>
              <span class="font-semibold text-sm">기타 인증</span>
            </div>
            <div
              v-for="ex in extras"
              :key="ex.key"
              class="flex items-center gap-3 px-4 py-2.5 border-b border-surface-border/60 last:border-b-0"
            >
              <span class="flex-1 min-w-0 truncate">
                <span class="font-medium">{{ ex.name }}</span>
                <span class="text-text-muted text-xs ml-2">{{ ex.course }}</span>
              </span>
              <span class="text-sm font-semibold text-emerald-600 tabular-nums">{{ ex.score }}점</span>
              <button class="row-action hover:text-red-500" title="인증 삭제" :disabled="ex.saving" @click="cancelVerification(ex)">
                <span class="i-lucide-undo-2"></span>
              </button>
            </div>
          </div>

        </div>

        <!-- Action bar -->
        <div class="action-bar sticky bottom-0 mt-4 -mx-1 px-1 pb-1 pt-3">
          <div class="card flex items-center gap-3 px-4 py-3 flex-wrap">
            <Button label="기타 인증" icon="i-lucide-plus" severity="secondary" size="small" text @click="showExtra = true" />
            <div class="flex-1"></div>
            <span v-if="selectedRows.length" class="text-sm text-text-secondary tabular-nums">{{ selectedRows.length }}명 · 합계 {{ selectedTotal }}점</span>
            <Button
              label="인증"
              icon="i-lucide-check"
              :loading="submitting"
              :disabled="!selectedRows.length || loading"
              @click="submit"
            />
          </div>
        </div>
      </div>
    </div>

    <ExtraGrantDialog v-model:visible="showExtra" :date="dateKey" @granted="onExtraGranted" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import DatePicker from 'primevue/datepicker'
import Checkbox from 'primevue/checkbox'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import PageHeader from '../components/PageHeader.vue'
import ExtraGrantDialog from '../components/ExtraGrantDialog.vue'
import {
  getVerifications, createVerifications, deleteVerifications, getMonthSummary,
} from '../api/verifications.js'
import { searchMembers } from '../api/members.js'
import { changeRecordMember } from '../api/records.js'
import { calculateScore } from '../utils/scoreCalculator.js'
import { formatDate } from '../../../shared/utils/dateFormat.js'
import { COURSES } from '../../../timetable/src/constants.js'
import { useNotify } from '../composables/useNotify.js'
import { useStatus, UNVERIFIED_DAYS } from '../composables/useStatus.js'

const notify = useNotify()
const { unverifiedDates, refreshStatus } = useStatus()

const selectedDate = ref(new Date())
const viewMonth = ref(formatDate(new Date(), 'yyyy-mm'))
const summary = ref({})

const rows = ref([])
const extras = ref([])
const loading = ref(false)
const submitting = ref(false)
const boost = ref(false)
const showExtra = ref(false)
const memberSuggestions = ref([])

const dateKey = computed(() => formatDate(selectedDate.value, 'yyyy-mm-dd'))
const loadedDate = ref('')
const pickerKey = ref(0)
const dateLabel = computed(() => formatDate(selectedDate.value, 'm월 d일 (ddd)'))
const verifiedCount = computed(() => rows.value.filter(r => r.verified).length)

// 통계·1365와 같은 기준: '…코스'로 끝나면 급식
function isFeeding(course) {
  return course.endsWith('코스')
}

function courseColor(course) {
  return COURSES[parseInt(course)]?.color || '#94A3B8'
}

function shortDate(date) {
  return formatDate(new Date(date + 'T00:00:00'), 'm/d (ddd)')
}

// Everyone verified in the course counts toward "2인 이상", plus the ones checked now
function courseHeadcount(course) {
  return rows.value.filter(r => r.course === course && (r.verified || r.checked)).length
}

function previewScore(row) {
  return calculateScore(loadedDate.value, row.course, courseHeadcount(row.course), boost.value)
}

const groups = computed(() => {
  const byCourse = new Map()
  for (const row of rows.value) {
    if (!byCourse.has(row.course)) byCourse.set(row.course, [])
    byCourse.get(row.course).push(row)
  }
  return [...byCourse.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'ko', { numeric: true }))
    .map(([course, list]) => {
      const verifiedRows = list.filter(r => r.verified)
      const parts = [`신청 ${list.length}명`]
      if (verifiedRows.length) parts.push(`인증 ${verifiedRows.length}명`)
      // Verifying a course in two passes leaves the earlier ones at the rate they got then
      const adding = list.find(r => !r.verified && r.checked)
      const scoreMismatch = !!adding && verifiedRows.some(v => v.score !== previewScore(adding))
      return { course, rows: list, summary: parts.join(' · '), scoreMismatch }
    })
})

const pendingRows = computed(() => rows.value.filter(r => !r.verified))
const selectedRows = computed(() => pendingRows.value.filter(r => r.checked))
const selectedTotal = computed(() => selectedRows.value.reduce((sum, r) => sum + previewScore(r), 0))

const todayKey = formatDate(new Date(), 'yyyy-mm-dd')

function marker(date) {
  const key = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`
  const s = summary.value[key]
  // Applications for days still ahead are not waiting for verification
  if (!s || key > todayKey) return null
  if (s.verified >= s.records) return 'done'
  return s.pendingCourses > 0 ? 'none' : 'partial'
}

let summarySeq = 0
async function loadSummary() {
  const mine = ++summarySeq
  try {
    const res = await getMonthSummary(viewMonth.value)
    if (mine === summarySeq) summary.value = Object.fromEntries(res.data.map(d => [d.date, d]))
  } catch {
    if (mine === summarySeq) summary.value = {}
  }
}

function onMonthChange({ month, year }) {
  viewMonth.value = `${year}-${String(month).padStart(2, '0')}`
  loadSummary()
}

async function jumpTo(date) {
  selectedDate.value = new Date(date + 'T00:00:00')
  const month = date.slice(0, 7)
  if (month !== viewMonth.value) {
    viewMonth.value = month
    pickerKey.value++
    loadSummary()
  }
  await loadDate()
}

// rows belong to loadedDate, which lags dateKey while a request is in flight
let loadSeq = 0
async function loadDate() {
  const mine = ++loadSeq
  const date = dateKey.value
  loading.value = true
  try {
    const res = await getVerifications(date)
    if (mine !== loadSeq) return
    const records = res.data.records || []
    const verified = res.data.verifications || []
    const feeding = verified.filter(v => isFeeding(v.course))
    const matches = (a, b) => a.studentId === b.studentId && a.course === b.course

    // In a course that was already verified, the rest were left out on purpose (or their verification was
    // deleted), so they start unchecked; a course nobody verified yet starts all checked as before
    const verifiedCourses = new Set(feeding.map(v => v.course))
    const list = records.map(r => {
      const ver = feeding.find(v => matches(v, r))
      return {
        key: `r${r.id}`, recordId: r.id, studentId: r.studentId, name: r.name, course: r.course,
        verified: !!ver, score: ver?.score, checked: !ver && !verifiedCourses.has(r.course),
        editing: false, replacement: null, saving: false,
      }
    })
    // Verified without a matching application (e.g. the application was deleted later)
    for (const v of feeding) {
      if (!records.some(r => matches(v, r))) {
        list.push({ key: `v${v.id}`, recordId: null, studentId: v.studentId, name: v.name, course: v.course, verified: true, score: v.score, checked: false, saving: false })
      }
    }
    rows.value = list
    extras.value = verified.filter(v => !isFeeding(v.course)).map(v => ({ ...v, key: `v${v.id}`, saving: false }))
    loadedDate.value = date
  } catch (e) {
    if (mine !== loadSeq) return
    rows.value = []
    extras.value = []
    loadedDate.value = date
    notify.error(e, '인증 기록을 불러오지 못했습니다.')
  } finally {
    if (mine === loadSeq) loading.value = false
  }
}

async function refreshAll() {
  await Promise.all([loadDate(), loadSummary(), refreshStatus()])
}

onMounted(refreshAll)

function toggleAll() {
  const all = pendingRows.value.every(r => r.checked)
  pendingRows.value.forEach(r => { r.checked = !all })
}

async function submit() {
  const items = selectedRows.value.map(r => ({
    studentId: r.studentId,
    date: loadedDate.value,
    course: r.course,
    score: previewScore(r),
  }))
  if (!items.length) return

  submitting.value = true
  try {
    const res = await createVerifications(items)
    notifyCreated(res.data)
    await refreshAll()
  } catch (e) {
    notify.error(e, '인증 실패')
  } finally {
    submitting.value = false
  }
}

function notifyCreated({ inserted, skipped }) {
  notify.success(`${inserted}건 인증 완료`)
  if (skipped.length) {
    notify.warn(`${skipped.length}건은 이미 인증되어 건너뜀`, skipped.map(s => `${s.name} ${s.course}`).join(', '))
  }
}

function onExtraGranted(result) {
  notifyCreated(result)
  refreshAll()
}

async function cancelVerification(row) {
  row.saving = true
  try {
    await deleteVerifications([{ studentId: row.studentId, date: loadedDate.value, course: row.course }])
    notify.success(`${row.name} ${row.course} 인증을 삭제했습니다.`)
    await refreshAll()
  } catch (e) {
    row.saving = false
    notify.error(e, '삭제 실패')
  }
}

async function searchMember(event) {
  if (!event.query) {
    memberSuggestions.value = []
    return
  }
  try {
    const res = await searchMembers(event.query)
    memberSuggestions.value = (res.data || []).map(m => ({ ...m, display: `${m.name} (${m.studentId})` }))
  } catch {
    memberSuggestions.value = []
  }
}

async function toggleFeederEdit(row) {
  row.editing = !row.editing
  row.replacement = null
  if (row.editing) {
    await nextTick()
    document.getElementById(`feeder-${row.key}`)?.focus()
  }
}

async function changeFeeder(row, member) {
  if (member.studentId === row.studentId) {
    row.editing = false
    return
  }
  row.saving = true
  try {
    const res = await changeRecordMember(row.recordId, member.studentId)
    const prev = row.name
    row.name = res.data.name
    row.studentId = res.data.studentId
    row.editing = false
    notify.success(`급식자 변경: ${prev} → ${row.name}`, res.data.verifications ? '기존 인증 기록도 함께 변경되었습니다.' : undefined)
    if (res.data.verifications) await loadDate()
  } catch (e) {
    row.replacement = null
    notify.error(e, '급식자 변경 실패')
  } finally {
    row.saving = false
  }
}
</script>

<style scoped>
.cal-cell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.cal-dot {
  position: absolute;
  bottom: 1px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  border-radius: 9999px;
}
.legend-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
}
.cal-dot-none { background: #ef4444; }
.cal-dot-partial { background: #f59e0b; }
.cal-dot-done { background: #10b981; }
.date-chip {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  color: #dc2626;
  background: rgba(239, 68, 68, 0.1);
  cursor: pointer;
}
.date-chip:hover {
  background: rgba(239, 68, 68, 0.2);
}
.date-chip.active {
  box-shadow: inset 0 0 0 1px #ef4444;
}
.p-dark .date-chip {
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.18);
}
.action-bar {
  background: linear-gradient(to top, var(--c-surface-muted) 75%, transparent);
}
.row-action {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  color: var(--c-text-muted);
  cursor: pointer;
  flex-shrink: 0;
}
.row-action:hover {
  background: var(--c-surface-dim);
}
.row-action:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
