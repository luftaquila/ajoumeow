<template>
  <div>
    <PageHeader
      title="급식 인증"
      description="관리자의 급식 인증이 완료된 활동만 시스템에서 인정됩니다."
      icon="i-lucide-calendar-check"
    >
      <template #subtitle>
        <p class="text-text-muted text-xs mt-1">
          마지막 인증 기록: <span class="font-medium">{{ latestDate || '없음' }}</span>
        </p>
      </template>
    </PageHeader>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- Calendar (sticky on desktop) -->
      <div class="lg:sticky lg:top-0 lg:self-start flex-shrink-0">
        <DatePicker
          v-model="selectedDate"
          :inline="true"
          dateFormat="yy-mm-dd"
          @date-select="onDateSelect"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <!-- Action bar -->
        <div class="card-section flex items-center gap-3 mb-4 flex-wrap">
          <SelectButton v-model="mode" :options="modeOptions" optionLabel="label" optionValue="value" />
          <div v-if="mode === 'auto'" class="flex items-center gap-2">
            <Checkbox v-model="boost" :binary="true" inputId="boost" />
            <label for="boost" class="text-sm cursor-pointer">상향 지급</label>
          </div>
          <div class="flex-1"></div>
          <Button
            :label="mode === 'delete' ? '삭제' : '인증'"
            :severity="mode === 'delete' ? 'danger' : 'success'"
            @click="submit"
            :loading="submitting"
            :disabled="!checkedItems.length"
          />
        </div>

        <!-- Auto mode: records list -->
        <div v-if="mode === 'auto'">
          <div v-if="recordsLoading" class="text-center py-8">
            <div class="i-lucide-loader-circle text-2xl text-primary animate-spin mx-auto"></div>
          </div>
          <div v-else-if="!records.length" class="text-center py-8 text-text-muted">
            해당 날짜에 급식 신청이 없습니다.
          </div>
          <div v-else>
            <!-- Select all -->
            <button class="text-xs text-text-muted hover:text-text mb-2 cursor-pointer" @click="toggleAllRecords">
              {{ checkedRecordCount }}/{{ records.length }}명 선택
            </button>
            <div class="flex flex-col gap-2">
              <div
                v-for="(rec, idx) in records"
                :key="idx"
                class="card flex items-center gap-3 p-3"
              >
                <Checkbox v-model="rec.checked" :binary="true" />
                <div class="flex-1">
                  <span class="font-medium">{{ rec.name }}</span>
                  <span class="text-text-muted text-sm ml-2 hidden sm:inline">{{ rec.studentId }}</span>
                </div>
                <span class="text-sm text-text-secondary">{{ rec.course }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Manual mode -->
        <div v-if="mode === 'manual'">
          <div class="flex flex-col gap-2 mb-3">
            <div
              v-for="(item, idx) in manualItems"
              :key="idx"
              class="card flex items-center gap-2 p-3"
            >
              <Checkbox v-model="item.checked" :binary="true" />
              <AutoComplete
                v-model="item.member"
                :suggestions="memberSuggestions"
                @complete="searchMember"
                optionLabel="display"
                placeholder="회원 검색"
                class="flex-1"
              />
              <InputText v-model="item.reason" placeholder="지급 사유" class="flex-1" />
              <InputNumber v-model="item.score" :min="0" :max="10" :minFractionDigits="1" :maxFractionDigits="1" class="w-20" placeholder="점수" />
              <button @click="manualItems.splice(idx, 1)" class="text-text-muted hover:text-red-500 cursor-pointer">
                <span class="i-lucide-x text-base"></span>
              </button>
            </div>
          </div>
          <div class="flex gap-2">
            <Button label="추가" icon="i-lucide-plus" size="small" @click="addManualItem" severity="secondary" />
            <Button v-if="manualItems.length > 1" label="사유 통일" size="small" @click="unifyReasons" severity="secondary" />
          </div>

          <div class="mt-4 text-xs text-text-muted">
            <p>동아리박람회나 봉사활동 등 급식 외 활동에 대한 마일리지를 지급합니다.</p>
            <p>기타 인증 활동은 1365 봉사활동 확인서 및 급식 마일리지 종합에서 제외됩니다.</p>
          </div>
        </div>

        <!-- Delete mode: verifications list -->
        <div v-if="mode === 'delete'">
          <div v-if="recordsLoading" class="text-center py-8">
            <div class="i-lucide-loader-circle text-2xl text-primary animate-spin mx-auto"></div>
          </div>
          <div v-else-if="!verifications.length" class="text-center py-8 text-text-muted">
            해당 날짜에 인증 기록이 없습니다.
          </div>
          <div v-else>
            <!-- Select all -->
            <button class="text-xs text-text-muted hover:text-text mb-2 cursor-pointer" @click="toggleAllVerifications">
              {{ checkedVerificationCount }}/{{ verifications.length }}명 선택
            </button>
            <div class="flex flex-col gap-2">
              <div
                v-for="(ver, idx) in verifications"
                :key="idx"
                class="card flex items-center gap-3 p-3"
              >
                <Checkbox v-model="ver.checked" :binary="true" />
                <div class="flex-1">
                  <span class="font-medium">{{ ver.name }}</span>
                  <span class="text-text-muted text-sm ml-2 hidden sm:inline">{{ ver.studentId }}</span>
                </div>
                <span class="text-sm text-text-secondary">{{ ver.course }}</span>
                <span class="text-sm font-medium text-primary">{{ ver.score }}점</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Auto mode instructions (collapsible) -->
        <details v-if="mode === 'auto'" class="mt-6">
          <summary class="text-xs text-text-muted cursor-pointer hover:text-text select-none">
            <span class="i-lucide-circle-help text-sm align-text-bottom mr-1"></span>사용 안내
          </summary>
          <ol class="list-decimal pl-4 flex flex-col gap-1 mt-2 text-xs text-text-muted">
            <li>날짜를 선택하면 해당일의 급식 신청자가 모두 표시됩니다.</li>
            <li>인증할 회원만 좌측 체크박스에 체크합니다. 기본값은 전체 체크입니다.</li>
            <li>시험기간/연휴/악천후 등에는 상향 지급 체크박스를 선택합니다.</li>
            <li><b>인증</b>을 탭해 서버로 인증 기록을 전송합니다.</li>
          </ol>
          <div class="mt-2 text-xs text-yellow-600">
            <p>같은 날 같은 코스 급식자는 한 번에 인증해야 합니다. 따로 인증하면 1인 급식으로 처리됩니다.</p>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DatePicker from 'primevue/datepicker'
import SelectButton from 'primevue/selectbutton'
import Checkbox from 'primevue/checkbox'
import AutoComplete from 'primevue/autocomplete'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import PageHeader from '../components/PageHeader.vue'
import { getVerifications, createVerifications, deleteVerifications, getLatestVerification } from '../api/verifications.js'
import { searchMembers } from '../api/members.js'
import { calculateScore } from '../utils/scoreCalculator.js'
import { formatDate } from '../../../shared/utils/dateFormat.js'

const toast = useToast()

const selectedDate = ref(new Date())
const latestDate = ref('')
const mode = ref('auto')
const modeOptions = [
  { label: '급식 인증', value: 'auto' },
  { label: '기타 인증', value: 'manual' },
  { label: '인증 삭제', value: 'delete' },
]

const boost = ref(false)
const records = ref([])
const verifications = ref([])
const recordsLoading = ref(false)
const submitting = ref(false)

// Manual mode
const manualItems = ref([])
const memberSuggestions = ref([])

const checkedItems = computed(() => {
  if (mode.value === 'auto') return records.value.filter(r => r.checked)
  if (mode.value === 'manual') return manualItems.value.filter(m => m.checked && m.member && m.score > 0)
  if (mode.value === 'delete') return verifications.value.filter(v => v.checked)
  return []
})

const checkedRecordCount = computed(() => records.value.filter(r => r.checked).length)
const checkedVerificationCount = computed(() => verifications.value.filter(v => v.checked).length)

function toggleAllRecords() {
  const allChecked = records.value.every(r => r.checked)
  records.value.forEach(r => { r.checked = !allChecked })
}

function toggleAllVerifications() {
  const allChecked = verifications.value.every(v => v.checked)
  verifications.value.forEach(v => { v.checked = !allChecked })
}

function dateStr(d) {
  return formatDate(d, 'yyyy-mm-dd')
}

onMounted(async () => {
  try {
    const res = await getLatestVerification()
    if (res.data) latestDate.value = res.data.date
  } catch {}
  await loadDate()
})

watch(mode, () => {
  if (mode.value === 'manual' && !manualItems.value.length) {
    addManualItem()
  }
})

async function onDateSelect() {
  await loadDate()
}

async function loadDate() {
  const d = dateStr(selectedDate.value)
  recordsLoading.value = true
  try {
    const res = await getVerifications(d)
    records.value = (res.data.records || []).map(r => ({ ...r, checked: true }))
    verifications.value = (res.data.verifications || []).map(v => ({ ...v, checked: false }))
  } catch {
    records.value = []
    verifications.value = []
  } finally {
    recordsLoading.value = false
  }
}

function addManualItem() {
  manualItems.value.push({ checked: true, member: null, reason: '', score: 1 })
}

function unifyReasons() {
  if (!manualItems.value.length) return
  const reason = manualItems.value[0].reason
  manualItems.value.forEach(m => { m.reason = reason })
}

async function searchMember(event) {
  if (!event.query || event.query.length < 1) {
    memberSuggestions.value = []
    return
  }
  try {
    const res = await searchMembers(event.query)
    memberSuggestions.value = (res.data || []).map(m => ({
      ...m,
      display: `${m.name} (${m.studentId})`,
    }))
  } catch {
    memberSuggestions.value = []
  }
}

async function submit() {
  const d = dateStr(selectedDate.value)

  if (mode.value === 'auto') {
    const checked = records.value.filter(r => r.checked)
    if (!checked.length) return

    // Group by course to calculate dual/solo
    const courseGroups = {}
    checked.forEach(r => {
      if (!courseGroups[r.course]) courseGroups[r.course] = []
      courseGroups[r.course].push(r)
    })

    const items = checked.map(r => ({
      studentId: r.studentId,
      date: d,
      course: r.course,
      score: calculateScore(d, r.course, courseGroups[r.course].length, boost.value),
    }))

    submitting.value = true
    try {
      await createVerifications(items)
      toast.add({ severity: 'success', summary: `${items.length}건 인증 완료`, life: 2000 })
      latestDate.value = d
      await loadDate()
    } catch (e) {
      toast.add({ severity: 'error', summary: e.error?.message || '인증 실패', life: 3000 })
    } finally {
      submitting.value = false
    }
  } else if (mode.value === 'manual') {
    const valid = manualItems.value.filter(m => m.checked && m.member && m.score > 0)
    if (!valid.length) return

    const items = valid.map(m => ({
      studentId: m.member.studentId,
      date: d,
      course: m.reason || '기타',
      score: m.score,
    }))

    submitting.value = true
    try {
      await createVerifications(items)
      toast.add({ severity: 'success', summary: `${items.length}건 인증 완료`, life: 2000 })
      manualItems.value = [{ checked: true, member: null, reason: '', score: 1 }]
    } catch (e) {
      toast.add({ severity: 'error', summary: e.error?.message || '인증 실패', life: 3000 })
    } finally {
      submitting.value = false
    }
  } else if (mode.value === 'delete') {
    const checked = verifications.value.filter(v => v.checked)
    if (!checked.length) return

    const items = checked.map(v => ({
      studentId: v.studentId,
      date: d,
      course: v.course,
    }))

    submitting.value = true
    try {
      await deleteVerifications(items)
      toast.add({ severity: 'success', summary: `${items.length}건 삭제 완료`, life: 2000 })
      await loadDate()
    } catch (e) {
      toast.add({ severity: 'error', summary: e.error?.message || '삭제 실패', life: 3000 })
    } finally {
      submitting.value = false
    }
  }
}
</script>
