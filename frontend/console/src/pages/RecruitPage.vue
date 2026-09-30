<template>
  <div>
    <PageHeader
      title="신입 모집 설문"
      description="/register 설문으로 받은 신입 연락처입니다. 계정은 만들어지지 않으며, 회원 등록은 가입 신청으로 따로 받습니다."
      icon="i-lucide-clipboard-list"
    />

    <!-- Survey state and link -->
    <div class="card p-4 mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="flex items-center gap-3">
        <ToggleSwitch :modelValue="register.enabled" :disabled="toggling" aria-label="신입 모집 설문 받기" @update:modelValue="toggleSurvey" />
        <div>
          <p class="font-medium">{{ register.open ? '설문 받는 중' : '설문 닫힘' }}</p>
          <p class="text-xs text-text-muted">
            {{ !register.enabled ? '꺼져 있음' : register.restricted ? `기간 ${register.term.replace('~', ' ~ ')}` : '기간 제한 없음' }}
            · <router-link to="/console/settings" class="text-primary hover:underline">기간은 설정에서</router-link>
          </p>
        </div>
      </div>
      <div class="flex-1"></div>
      <div class="flex items-center gap-1 text-sm min-w-0">
        <a :href="registerUrl" target="_blank" class="text-primary hover:underline truncate">{{ registerUrl }}</a>
        <button class="icon-btn" title="주소 복사" @click="copyRegisterUrl"><span class="i-lucide-copy text-sm"></span></button>
      </div>
    </div>
    <p v-if="register.enabled && semester" class="-mt-3 mb-5 text-xs text-text-muted">
      응답은 현재 학기({{ semester }})로 모입니다. 새 학기 모집 전에는 설정에서 학기를 먼저 전환하세요.
    </p>

    <ActionBar>
      <template #left>
        <Select
          v-model="selectedSemester"
          :options="semesterOptions"
          placeholder="학기 선택"
          class="w-36"
          @change="loadRegistrations"
        />
        <button class="filter-chip" :class="{ active: onlyNotJoined }" @click="onlyNotJoined = !onlyNotJoined">
          아직 가입 안 함 <span class="opacity-60">{{ notJoinedCount }}</span>
        </button>
        <span class="text-xs text-text-muted">{{ shown.length }}명</span>
      </template>
      <template #right>
        <Button label="내보내기" icon="i-lucide-download" iconPos="left" size="small" severity="secondary" :disabled="!shown.length" @click="exportMenu.toggle($event)" />
        <Menu ref="exportMenu" :model="exportItems" popup />
      </template>
    </ActionBar>

    <div class="card overflow-x-auto">
      <DataTable
        :value="shown"
        :loading="loading"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        :alwaysShowPaginator="false"
        removableSort
        class="text-sm"
      >
        <template #empty>
          <p class="text-center text-text-muted py-6">응답이 없습니다.</p>
        </template>
        <Column field="createdAt" header="응답일" sortable style="min-width: 8rem">
          <template #body="{ data }">
            <span class="text-xs whitespace-nowrap">{{ formatLocal(data.createdAt, 'yyyy-mm-dd HH:MM') }}</span>
          </template>
        </Column>
        <Column field="name" header="이름" sortable style="min-width: 7rem">
          <template #body="{ data }">
            <div class="font-medium">{{ data.name }}</div>
            <div class="text-xs text-text-muted">{{ data.studentId }}</div>
          </template>
        </Column>
        <Column field="department" header="소속" sortable style="min-width: 9rem">
          <template #body="{ data }">
            <div>{{ data.department }}</div>
            <div class="text-xs text-text-muted">{{ data.college }}</div>
          </template>
        </Column>
        <Column field="phone" header="연락처" style="min-width: 8.5rem" />
        <Column field="joinStatus" header="가입" sortable style="min-width: 6rem">
          <template #body="{ data }">
            <Tag v-if="data.joinStatus === 'member'" value="회원" severity="success" />
            <Tag v-else-if="data.joinStatus === 'applied'" value="승인 대기" severity="warn" />
            <span v-else class="text-xs text-text-muted">아직</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import PageHeader from '../components/PageHeader.vue'
import ActionBar from '../components/ActionBar.vue'
import { getRegistrations, getRegistrationSemesters } from '../api/registrations.js'
import { updateSetting } from '../api/settings.js'
import { toGoogleContactsCsv, toNaverContactsCsv } from '../utils/contactExport.js'
import { useSemesters } from '../composables/useSemesters.js'
import { useStatus } from '../composables/useStatus.js'
import { useNotify } from '../composables/useNotify.js'
import { formatLocal } from '../../../shared/utils/dateFormat.js'

const notify = useNotify()
const { currentSemester, loadSemesters } = useSemesters()
const { semester, register, refreshStatus } = useStatus()

const selectedSemester = ref('')
const semesterOptions = ref([])
const registrations = ref([])
const loading = ref(false)
const toggling = ref(false)
const onlyNotJoined = ref(false)
const exportMenu = ref()

const registerUrl = `${location.origin}/register/`

const notJoinedCount = computed(() => registrations.value.filter(r => !r.joinStatus).length)
const shown = computed(() => onlyNotJoined.value ? registrations.value.filter(r => !r.joinStatus) : registrations.value)

const exportItems = [
  { label: 'Excel', icon: 'i-lucide-file-spreadsheet', command: downloadExcel },
  { label: 'Google 연락처 (CSV)', icon: 'i-lucide-contact', command: () => downloadCsvFile(toGoogleContactsCsv(shown.value), `연락처_Google_${selectedSemester.value}.csv`) },
  { label: 'Naver 연락처 (CSV)', icon: 'i-lucide-contact', command: () => downloadCsvFile(toNaverContactsCsv(shown.value), `연락처_Naver_${selectedSemester.value}.csv`) },
]

function copyRegisterUrl() {
  navigator.clipboard.writeText(registerUrl).then(() => notify.success('주소를 복사했습니다.'))
}

async function toggleSurvey(value) {
  toggling.value = true
  try {
    await updateSetting('isRegister', value ? 'TRUE' : 'FALSE')
    await refreshStatus()
    notify.success(value ? '신입 모집 설문을 켰습니다.' : '신입 모집 설문을 껐습니다.')
  } catch (e) {
    notify.error(e, '설정 변경 실패')
  } finally {
    toggling.value = false
  }
}

onMounted(async () => {
  refreshStatus()
  try {
    const [semRes] = await Promise.all([getRegistrationSemesters(), loadSemesters()])
    semesterOptions.value = (semRes.data || []).sort((a, b) => b.localeCompare(a))
    if (semesterOptions.value.length) {
      selectedSemester.value = currentSemester.value || semesterOptions.value[0]
      await loadRegistrations()
    }
  } catch (e) {
    notify.error(e, '학기 목록 로드 실패')
  }
})

async function loadRegistrations() {
  if (!selectedSemester.value) return
  loading.value = true
  try {
    const res = await getRegistrations(selectedSemester.value)
    registrations.value = res.data
  } catch (e) {
    notify.error(e, '응답 목록 로드 실패')
  } finally {
    loading.value = false
  }
}

function downloadExcel() {
  import('xlsx').then(XLSX => {
    const data = shown.value.map(r => ({
      '응답일': formatLocal(r.createdAt),
      '학번': r.studentId,
      '이름': r.name,
      '단과대학': r.college,
      '학과': r.department,
      '연락처': r.phone,
      '가입': r.joinStatus === 'member' ? '회원' : r.joinStatus === 'applied' ? '승인 대기' : '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '신입모집')
    XLSX.writeFile(wb, `신입모집_${selectedSemester.value}.xlsx`)
  })
}

function downloadCsvFile(content, filename) {
  const BOM = '﻿'
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.icon-btn {
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
.icon-btn:hover {
  background: var(--c-surface-dim);
  color: var(--c-text);
}
</style>
