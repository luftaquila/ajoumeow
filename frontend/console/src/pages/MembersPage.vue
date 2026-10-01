<template>
  <div>
    <PageHeader
      title="회원 명단"
      description="학기별 회원 명단입니다. 회원을 누르면 정보와 직책을 고칠 수 있고, '회원' 외의 직책은 모두 관리자 권한입니다."
      icon="i-lucide-users"
    />

    <ActionBar>
      <template #left>
        <Select
          v-model="selectedSemester"
          :options="semesters"
          placeholder="학기 선택"
          class="w-36"
          @change="loadMembers"
        />
        <IconField class="w-full sm:w-64">
          <InputIcon class="i-lucide-search" />
          <InputText v-model="query" placeholder="이름, 학번, 학과, 연락처" fluid />
        </IconField>
        <div class="flex gap-1.5 flex-wrap">
          <button
            v-for="f in FILTERS"
            :key="f.key"
            class="filter-chip"
            :class="{ active: activeFilters.includes(f.key) }"
            @click="toggleFilter(f.key)"
          >{{ f.label }} <span class="opacity-60">{{ counts[f.key] }}</span></button>
        </div>
      </template>
      <template #right>
        <span class="text-xs text-text-muted">{{ filtered.length === members.length ? `${members.length}명` : `${filtered.length} / ${members.length}명` }}</span>
        <Button label="Excel" icon="i-lucide-download" size="small" severity="secondary" @click="downloadExcel" :disabled="!filtered.length" title="지금 보이는 목록을 내려받습니다" />
      </template>
    </ActionBar>

    <p v-if="selectedSemester && currentSemester && selectedSemester !== currentSemester" class="mb-3 text-xs text-amber-600 flex items-center gap-1">
      <span class="i-lucide-history"></span>
      지난 학기({{ selectedSemester }}) 명단입니다. 직책 변경과 명단 제외는 이 학기에만 적용되고, 이름·연락처 등 개인 정보는 모든 학기에 공통입니다.
    </p>

    <div class="card overflow-x-auto">
      <DataTable
        :value="filtered"
        :loading="loading"
        dataKey="studentId"
        paginator
        :rows="50"
        :rowsPerPageOptions="[20, 50, 100]"
        :alwaysShowPaginator="false"
        removableSort
        rowHover
        class="text-sm member-table"
        @row-click="openEditor($event.data)"
      >
        <template #empty>
          <p class="text-center text-text-muted py-6">{{ members.length ? '조건에 맞는 회원이 없습니다.' : '명단이 비어 있습니다.' }}</p>
        </template>
        <Column field="name" header="이름" sortable style="min-width: 8rem">
          <template #body="{ data }">
            <div class="font-medium">{{ data.name }}</div>
            <div class="text-xs text-text-muted">{{ data.studentId }}</div>
          </template>
        </Column>
        <Column field="role" header="직책" sortable style="min-width: 5rem">
          <template #body="{ data }">
            <Tag v-if="data.role !== '회원'" :value="data.role" severity="info" class="whitespace-nowrap" />
            <span v-else class="text-text-muted">회원</span>
          </template>
        </Column>
        <Column field="department" header="소속" sortable style="min-width: 9rem">
          <template #body="{ data }">
            <div>{{ data.department }}</div>
            <div class="text-xs text-text-muted">{{ data.college }}</div>
          </template>
        </Column>
        <Column field="phone" header="연락처" style="min-width: 8.5rem">
          <template #body="{ data }"><span class="whitespace-nowrap">{{ data.phone }}</span></template>
        </Column>
        <Column field="birthday" header="생년월일" headerClass="hidden md:table-cell" bodyClass="hidden md:table-cell" />
        <Column field="volunteerId" header="1365 ID" style="min-width: 6rem">
          <template #body="{ data }">
            <span v-if="data.volunteerId">{{ data.volunteerId }}</span>
            <span v-else class="text-xs text-amber-600">없음</span>
          </template>
        </Column>
        <Column field="googleEmail" header="Google" headerClass="hidden lg:table-cell" bodyClass="hidden lg:table-cell">
          <template #body="{ data }">
            <span v-if="data.googleEmail" class="text-xs" :title="data.googleEmail">{{ data.googleEmail.split('@')[0] }}</span>
            <span v-else class="text-xs text-text-muted">미연동</span>
          </template>
        </Column>
        <Column field="enrolledSemester" header="가입학기" sortable headerClass="hidden lg:table-cell" bodyClass="hidden lg:table-cell" />
        <Column style="width: 2.5rem">
          <template #body><span class="i-lucide-chevron-right text-text-muted"></span></template>
        </Column>
      </DataTable>
    </div>

    <MemberEditDrawer
      v-model:visible="editorVisible"
      :member="editing"
      :semester="selectedSemester"
      :roles="roles"
      :colleges="colleges"
      @saved="onSaved"
      @remove="confirmRemove"
    />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ConfirmDialog from 'primevue/confirmdialog'
import PageHeader from '../components/PageHeader.vue'
import ActionBar from '../components/ActionBar.vue'
import MemberEditDrawer from '../components/MemberEditDrawer.vue'
import { getMembers, getRoles, deleteMember } from '../api/members.js'
import { getData } from '../api/data.js'
import { useSemesters } from '../composables/useSemesters.js'
import { useNotify } from '../composables/useNotify.js'

const notify = useNotify()
const confirm = useConfirm()
const { semesters, currentSemester, loadSemesters } = useSemesters()

const selectedSemester = ref('')
const members = ref([])
const loading = ref(false)
const roles = ref([])
const colleges = ref({})
const query = ref('')
const activeFilters = ref([])
const editing = ref(null)
const editorVisible = ref(false)

const FILTERS = [
  { key: 'officer', label: '임원', test: m => m.role !== '회원' },
  { key: 'noVolunteerId', label: '1365 ID 없음', test: m => !m.volunteerId },
  { key: 'noGoogle', label: '구글 미연동', test: m => !m.googleEmail },
]

const counts = computed(() => Object.fromEntries(FILTERS.map(f => [f.key, members.value.filter(f.test).length])))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const tests = FILTERS.filter(f => activeFilters.value.includes(f.key)).map(f => f.test)
  return members.value.filter(m => {
    if (!tests.every(t => t(m))) return false
    if (!q) return true
    return [m.name, m.studentId, m.department, m.college, m.phone, m.role]
      .some(v => v && String(v).toLowerCase().includes(q))
  })
})

function toggleFilter(key) {
  const i = activeFilters.value.indexOf(key)
  if (i >= 0) activeFilters.value.splice(i, 1)
  else activeFilters.value.push(key)
}

onMounted(async () => {
  getRoles().then(res => { roles.value = res.data || [] }).catch(() => {})
  getData('college').then(d => { colleges.value = d || {} }).catch(() => {})
  await loadSemesters()
  selectedSemester.value = currentSemester.value
  await loadMembers()
})

async function loadMembers() {
  if (!selectedSemester.value) return
  loading.value = true
  try {
    const res = await getMembers(selectedSemester.value)
    members.value = res.data
  } catch (e) {
    notify.error(e, '회원 목록 로드 실패')
  } finally {
    loading.value = false
  }
}

function openEditor(member) {
  editing.value = member
  editorVisible.value = true
}

function onSaved(data) {
  Object.assign(editing.value, {
    name: data.name, college: data.college, department: data.department, phone: data.phone,
    birthday: data.birthday, volunteerId: data.volunteerId, role: data.role,
  })
  if (!roles.value.includes(data.role)) roles.value.push(data.role)
}

function confirmRemove(row) {
  confirm.require({
    header: '명단에서 제외',
    message: `${row.name} (${row.studentId}) 회원을 ${selectedSemester.value} 명단에서 제외할까요?\n계정과 급식 기록은 남습니다.`,
    icon: 'i-lucide-triangle-alert',
    acceptLabel: '제외',
    rejectLabel: '취소',
    acceptProps: { severity: 'danger' },
    rejectProps: { severity: 'secondary', outlined: true },
    accept: async () => {
      try {
        await deleteMember(row.studentId, selectedSemester.value)
        members.value = members.value.filter(m => m.studentId !== row.studentId)
        editorVisible.value = false
        notify.success(`${row.name}을(를) 명단에서 제외했습니다.`)
      } catch (e) {
        notify.error(e, '제외 실패')
      }
    },
  })
}

function downloadExcel() {
  import('xlsx').then(XLSX => {
    const data = filtered.value.map(m => ({
      '단과대학': m.college,
      '학과': m.department,
      '학번': m.studentId,
      '이름': m.name,
      '연락처': m.phone,
      '생년월일': m.birthday,
      '1365 ID': m.volunteerId,
      '가입학기': m.enrolledSemester,
      '직책': m.role,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '회원목록')
    XLSX.writeFile(wb, `회원목록_${selectedSemester.value}.xlsx`)
  })
}
</script>

<style scoped>
:deep(.member-table .p-datatable-tbody > tr) {
  cursor: pointer;
}
</style>
