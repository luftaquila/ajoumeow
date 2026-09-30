<template>
  <div>
    <PageHeader
      title="웹사이트 가입 승인"
      description="구글 계정으로 들어온 회원 등록 신청입니다. 승인하면 해당 학기 회원 명단에 추가됩니다."
      icon="i-lucide-user-round-check"
    />

    <ActionBar>
      <template #left>
        <Select
          v-model="selectedSemester"
          :options="semesterOptions"
          placeholder="학기 선택"
          class="w-36"
          @change="loadApplications"
        />
        <SelectButton
          v-model="selectedStatus"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false"
          size="small"
          @change="loadApplications"
        />
        <span class="text-xs text-text-muted">{{ applications.length }}건</span>
      </template>
      <template #right>
        <template v-if="selected.length">
          <Button :label="`선택 ${selected.length}건 승인`" icon="i-lucide-check" severity="success" size="small" :loading="busy" @click="confirmBulk('approve')" />
          <Button :label="`거절`" severity="danger" size="small" outlined :disabled="busy" @click="confirmBulk('reject')" />
        </template>
      </template>
    </ActionBar>

    <div class="card overflow-x-auto">
      <DataTable
        v-model:selection="selected"
        :value="applications"
        :loading="loading"
        dataKey="id"
        paginator
        :rows="20"
        :rowsPerPageOptions="[20, 50, 100]"
        :alwaysShowPaginator="false"
        removableSort
        class="text-sm"
      >
        <template #empty>
          <p class="text-center text-text-muted py-6">
            {{ selectedStatus === 'pending' ? '승인을 기다리는 신청이 없습니다.' : '신청이 없습니다.' }}
          </p>
        </template>

        <Column v-if="selectedStatus === 'pending'" selectionMode="multiple" style="width: 3rem" />
        <Column field="createdAt" header="신청일" sortable style="min-width: 6rem">
          <template #body="{ data }">
            <span class="text-xs whitespace-nowrap" :title="formatLocal(data.createdAt)">{{ formatLocal(data.createdAt, 'mm-dd HH:MM') }}</span>
          </template>
        </Column>
        <Column field="name" header="신청자" sortable style="min-width: 9rem">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ data.name }}</span>
              <Tag :value="data.isNew ? '신규' : '기존'" :severity="data.isNew ? 'info' : 'secondary'" class="text-[11px]!" />
            </div>
            <div class="text-xs text-text-muted">{{ data.studentId }}</div>
          </template>
        </Column>
        <Column field="department" header="소속" sortable style="min-width: 9rem">
          <template #body="{ data }">
            <div>{{ data.department }}</div>
            <div class="text-xs text-text-muted">{{ data.college }}</div>
          </template>
        </Column>
        <Column header="연락처" style="min-width: 9rem">
          <template #body="{ data }">
            <div class="whitespace-nowrap">{{ data.phone }}</div>
            <div class="text-xs text-text-muted whitespace-nowrap">
              {{ data.birthday || '생년월일 없음' }} ·
              <span v-if="data.volunteerId">{{ data.volunteerId }}</span>
              <span v-else class="text-amber-600" title="1365 ID가 없으면 활동확인서에서 빠집니다">1365 없음</span>
            </div>
          </template>
        </Column>
        <Column header="승인하면" style="min-width: 12rem">
          <template #body="{ data }">
            <span v-if="data.isNew" class="text-xs text-text-muted">새 회원으로 등록</span>
            <span v-else-if="!data.current" class="text-xs text-red-500">기존 회원 기록 없음 (승인 불가)</span>
            <div v-else-if="changes(data).length" class="text-xs flex flex-col gap-0.5">
              <p v-for="c in changes(data)" :key="c.label">
                <span class="text-text-muted">{{ c.label }}</span>
                <span class="line-through text-text-muted mx-1 whitespace-nowrap">{{ c.from || '없음' }}</span>
                <span class="whitespace-nowrap">→ <span class="font-medium">{{ c.to || '없음' }}</span></span>
              </p>
            </div>
            <span v-else class="text-xs text-text-muted">정보 변경 없음</span>
          </template>
        </Column>
        <Column v-if="selectedStatus !== 'pending'" field="status" header="상태" sortable style="min-width: 5rem">
          <template #body="{ data }">
            <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
          </template>
        </Column>
        <Column header="" style="width: 7rem">
          <template #body="{ data }">
            <div v-if="data.status === 'pending'" class="flex gap-0.5 justify-end whitespace-nowrap">
              <Button label="승인" severity="success" size="small" :disabled="busy" @click="confirmOne(data, 'approve')" />
              <Button label="거절" severity="secondary" size="small" text :disabled="busy" @click="confirmOne(data, 'reject')" />
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
import { useConfirm } from 'primevue/useconfirm'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ConfirmDialog from 'primevue/confirmdialog'
import PageHeader from '../components/PageHeader.vue'
import ActionBar from '../components/ActionBar.vue'
import { getApplications, getApplicationSemesters, approveApplication, rejectApplication } from '../api/applications.js'
import { useSemesters } from '../composables/useSemesters.js'
import { useNotify } from '../composables/useNotify.js'
import { useStatus } from '../composables/useStatus.js'
import { formatLocal } from '../../../shared/utils/dateFormat.js'

const notify = useNotify()
const confirm = useConfirm()
const { currentSemester, loadSemesters } = useSemesters()
const { refreshStatus } = useStatus()

const selectedSemester = ref('')
const selectedStatus = ref('pending')
const semesterOptions = ref([])
const applications = ref([])
const selected = ref([])
const loading = ref(false)
const busy = ref(false)

const statusOptions = [
  { label: '대기', value: 'pending' },
  { label: '승인', value: 'approved' },
  { label: '거절', value: 'rejected' },
  { label: '전체', value: 'all' },
]

const STATUS = {
  pending: ['대기', 'warn'],
  approved: ['승인', 'success'],
  rejected: ['거절', 'danger'],
}
const statusLabel = s => STATUS[s]?.[0] || s
const statusSeverity = s => STATUS[s]?.[1] || 'secondary'

// Approving an existing member's application overwrites these fields (server: PUT /applications/:id/approve)
const OVERWRITTEN = [
  ['phone', '연락처'],
  ['birthday', '생년월일'],
  ['volunteerId', '1365 ID'],
  ['googleEmail', 'Google'],
]

function changes(app) {
  if (!app.current) return []
  return OVERWRITTEN
    .filter(([key]) => (app[key] || '') !== (app.current[key] || ''))
    .map(([key, label]) => ({ label, from: app.current[key], to: app[key] }))
}

onMounted(async () => {
  try {
    const [semRes] = await Promise.all([getApplicationSemesters(), loadSemesters()])
    const names = new Set(semRes.data || [])
    if (currentSemester.value) names.add(currentSemester.value)
    semesterOptions.value = [...names].sort((a, b) => b.localeCompare(a))
    selectedSemester.value = currentSemester.value || semesterOptions.value[0]
    await loadApplications()
  } catch (e) {
    notify.error(e, '학기 목록 로드 실패')
  }
})

async function loadApplications() {
  if (!selectedSemester.value) return
  loading.value = true
  selected.value = []
  try {
    const res = await getApplications(selectedSemester.value, selectedStatus.value)
    applications.value = res.data
  } catch (e) {
    notify.error(e, '신청 목록 로드 실패')
  } finally {
    loading.value = false
  }
}

const ACTIONS = {
  approve: { label: '승인', run: approveApplication },
  reject: { label: '거절', run: rejectApplication },
}

function confirmOne(app, action) {
  const { label } = ACTIONS[action]
  const diff = action === 'approve' ? changes(app) : []
  confirm.require({
    header: `웹사이트 가입 ${label}`,
    message: `${app.name} (${app.studentId})의 신청을 ${label}할까요?`
      + (diff.length ? `\n승인하면 ${diff.map(c => c.label).join(', ')}이(가) 신청서 내용으로 바뀝니다.` : ''),
    acceptLabel: label,
    rejectLabel: '취소',
    acceptProps: { severity: action === 'approve' ? 'success' : 'danger' },
    rejectProps: { severity: 'secondary', outlined: true },
    accept: () => run(action, [app]),
  })
}

function confirmBulk(action) {
  const { label } = ACTIONS[action]
  const list = [...selected.value]
  confirm.require({
    header: `선택한 신청 ${label}`,
    message: `${list.length}건(${list.map(a => a.name).join(', ')})을 ${label}할까요?`,
    acceptLabel: `${list.length}건 ${label}`,
    rejectLabel: '취소',
    acceptProps: { severity: action === 'approve' ? 'success' : 'danger' },
    rejectProps: { severity: 'secondary', outlined: true },
    accept: () => run(action, list),
  })
}

async function run(action, list) {
  const { label, run: call } = ACTIONS[action]
  busy.value = true
  const failed = []
  for (const app of list) {
    try {
      await call(app.id)
    } catch (e) {
      failed.push(`${app.name}: ${e.error?.message || '실패'}`)
    }
  }
  busy.value = false

  const done = list.length - failed.length
  if (done) notify.success(`${done}건 ${label}했습니다.`)
  if (failed.length) notify.error({ error: { message: `${failed.length}건 ${label} 실패 — ${failed.join(', ')}` } })
  await loadApplications()
  refreshStatus()
}
</script>
