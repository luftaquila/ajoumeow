<template>
  <div>
    <PageHeader
      title="가입 신청"
      description="회원 가입 신청을 관리합니다."
      icon="i-lucide-user-round-check"
    />

    <ActionBar>
      <template #left>
        <Select
          v-model="selectedSemester"
          :options="semesterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="학기 선택"
          class="w-40"
          @change="loadApplications"
        />
        <Select
          v-model="selectedStatus"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          class="w-28"
          @change="loadApplications"
        />
        <span v-if="applications.length" class="text-xs text-text-muted bg-surface-dim px-2 py-1 rounded-full">
          {{ applications.length }}건
        </span>
      </template>
    </ActionBar>

    <div class="card overflow-x-auto">
      <DataTable
        :value="applications"
        :loading="loading"
        paginator
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        sortMode="multiple"
        removableSort
        stripedRows
        class="text-sm row-normal"
      >
        <Column field="createdAt" header="신청일" sortable style="min-width: 11rem">
          <template #body="{ data }">
            <span class="text-xs">{{ formatLocal(data.createdAt) }}</span>
          </template>
        </Column>
        <Column field="isNew" header="유형" sortable style="min-width: 5rem">
          <template #body="{ data }">
            <Tag :value="data.isNew ? '신규' : '기존'" :severity="data.isNew ? 'info' : 'secondary'" />
          </template>
        </Column>
        <Column field="studentId" header="학번" sortable style="min-width: 7rem" />
        <Column field="name" header="이름" sortable style="min-width: 5rem" />
        <Column field="college" header="단과대학" sortable style="min-width: 7rem" />
        <Column field="department" header="학과" sortable style="min-width: 8rem" />
        <Column field="phone" header="연락처" sortable style="min-width: 9rem" />
        <Column field="googleEmail" header="Google" sortable style="min-width: 10rem">
          <template #body="{ data }">
            <span class="text-xs text-text-muted">{{ data.googleEmail }}</span>
          </template>
        </Column>
        <Column field="status" header="상태" sortable style="min-width: 6rem">
          <template #body="{ data }">
            <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
          </template>
        </Column>
        <Column header="" style="min-width: 10rem">
          <template #body="{ data }">
            <div v-if="data.status === 'pending'" class="flex gap-1">
              <Button label="승인" severity="success" size="small" @click="confirmApprove(data)" />
              <Button label="거절" severity="danger" size="small" outlined @click="confirmReject(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ConfirmDialog from 'primevue/confirmdialog'
import PageHeader from '../components/PageHeader.vue'
import ActionBar from '../components/ActionBar.vue'
import { getApplications, getApplicationSemesters, approveApplication, rejectApplication } from '../api/applications.js'
import { useSemesters } from '../composables/useSemesters.js'
import { formatLocal } from '../../../shared/utils/dateFormat.js'

const toast = useToast()
const confirm = useConfirm()
const { currentSemester, loadSemesters } = useSemesters()

const selectedSemester = ref('')
const selectedStatus = ref('all')
const semesterOptions = ref([])
const applications = ref([])
const loading = ref(false)

const statusOptions = [
  { label: '전체', value: 'all' },
  { label: '대기', value: 'pending' },
  { label: '승인', value: 'approved' },
  { label: '거절', value: 'rejected' },
]

function statusLabel(status) {
  if (status === 'pending') return '대기'
  if (status === 'approved') return '승인'
  if (status === 'rejected') return '거절'
  return status
}

function statusSeverity(status) {
  if (status === 'pending') return 'warn'
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  return 'secondary'
}

onMounted(async () => {
  try {
    const [semRes] = await Promise.all([
      getApplicationSemesters(),
      loadSemesters(),
    ])
    const sorted = (semRes.data || []).sort((a, b) => b.localeCompare(a))
    semesterOptions.value = sorted.map(s => ({ label: s, value: s }))

    // Add current semester if not in list
    if (currentSemester.value && !sorted.includes(currentSemester.value)) {
      semesterOptions.value.unshift({ label: currentSemester.value, value: currentSemester.value })
    }

    if (semesterOptions.value.length) {
      selectedSemester.value = currentSemester.value || semesterOptions.value[0].value
      await loadApplications()
    }
  } catch {
    toast.add({ severity: 'error', summary: '학기 목록 로드 실패', life: 3000 })
  }
})

async function loadApplications() {
  if (!selectedSemester.value) return
  loading.value = true
  try {
    const res = await getApplications(selectedSemester.value, selectedStatus.value)
    applications.value = res.data
  } catch {
    toast.add({ severity: 'error', summary: '신청 목록 로드 실패', life: 3000 })
  } finally {
    loading.value = false
  }
}

function confirmApprove(app) {
  confirm.require({
    message: `${app.name} (${app.studentId})의 가입 신청을 승인하시겠습니까?`,
    header: '가입 승인',
    acceptLabel: '승인',
    rejectLabel: '취소',
    rejectProps: { severity: 'secondary' },
    accept: () => doApprove(app),
  })
}

function confirmReject(app) {
  confirm.require({
    message: `${app.name} (${app.studentId})의 가입 신청을 거절하시겠습니까?`,
    header: '가입 거절',
    acceptLabel: '거절',
    rejectLabel: '취소',
    acceptClass: 'p-button-danger',
    accept: () => doReject(app),
  })
}

async function doApprove(app) {
  try {
    await approveApplication(app.id)
    toast.add({ severity: 'success', summary: `${app.name}의 가입을 승인했습니다.`, life: 3000 })
    await loadApplications()
  } catch (e) {
    toast.add({ severity: 'error', summary: e.error?.message || '승인 실패', life: 3000 })
  }
}

async function doReject(app) {
  try {
    await rejectApplication(app.id)
    toast.add({ severity: 'warn', summary: `${app.name}의 가입을 거절했습니다.`, life: 3000 })
    await loadApplications()
  } catch (e) {
    toast.add({ severity: 'error', summary: e.error?.message || '거절 실패', life: 3000 })
  }
}
</script>

<style scoped>
:deep(.row-normal .p-datatable-tbody > tr > td) {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
</style>
