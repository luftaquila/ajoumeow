<template>
  <div>
    <PageHeader
      title="회원 관리"
      description="학기별 회원 목록을 조회하고 관리합니다."
      icon="i-lucide-user-pen"
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
          @change="loadMembers"
        />
        <span v-if="members.length" class="text-xs text-text-muted bg-surface-dim px-2 py-1 rounded-full">
          {{ members.length }}명
        </span>
      </template>
      <template #right>
        <Button label="Excel 다운로드" icon="i-lucide-download" size="small" severity="success" @click="downloadExcel" :disabled="!members.length" />
      </template>
    </ActionBar>

    <div class="card overflow-x-auto">
      <DataTable
        :value="members"
        :loading="loading"
        editMode="cell"
        @cell-edit-complete="onCellEditComplete"
        paginator
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        sortMode="multiple"
        removableSort
        stripedRows
        class="text-sm"
        filterDisplay="row"
        v-model:filters="filters"
      >
        <Column field="college" header="단과대학" sortable :showFilterMenu="false" style="min-width: 10rem">
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" @input="filterCallback()" placeholder="검색" size="small" class="w-full" />
          </template>
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" size="small" class="w-full" />
          </template>
        </Column>
        <Column field="department" header="학과" sortable :showFilterMenu="false" style="min-width: 10rem">
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" @input="filterCallback()" placeholder="검색" size="small" class="w-full" />
          </template>
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" size="small" class="w-full" />
          </template>
        </Column>
        <Column field="studentId" header="학번" sortable :showFilterMenu="false" style="min-width: 7rem">
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" @input="filterCallback()" placeholder="검색" size="small" class="w-full" />
          </template>
        </Column>
        <Column field="name" header="이름" sortable :showFilterMenu="false" style="min-width: 6rem">
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" @input="filterCallback()" placeholder="검색" size="small" class="w-full" />
          </template>
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" size="small" class="w-full" />
          </template>
        </Column>
        <Column field="phone" header="연락처" sortable style="min-width: 9rem">
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" size="small" class="w-full" />
          </template>
        </Column>
        <Column field="birthday" header="생년월일" sortable style="min-width: 7rem">
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" size="small" class="w-full" />
          </template>
        </Column>
        <Column field="volunteerId" header="1365 ID" sortable style="min-width: 7rem">
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" size="small" class="w-full" />
          </template>
        </Column>
        <Column field="googleEmail" header="Google" sortable style="min-width: 7rem">
          <template #body="{ data }">
            <span v-if="data.googleEmail" class="text-xs" :title="data.googleEmail">{{ data.googleEmail.split('@')[0] }}</span>
            <span v-else class="text-xs text-text-muted">미연동</span>
          </template>
        </Column>
        <Column field="enrolledSemester" header="가입학기" sortable style="min-width: 7rem" />
        <Column field="role" header="직책" sortable style="min-width: 6rem">
          <template #editor="{ data, field }">
            <InputText v-model="data[field]" size="small" class="w-full" />
          </template>
        </Column>
        <Column header="" style="min-width: 3rem">
          <template #body="{ data }">
            <button @click="confirmDelete(data)" class="text-text-muted hover:text-red-500 cursor-pointer" title="제명">
              <span class="i-lucide-trash-2 text-base"></span>
            </button>
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
import { FilterMatchMode } from '@primevue/core/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ConfirmDialog from 'primevue/confirmdialog'
import PageHeader from '../components/PageHeader.vue'
import ActionBar from '../components/ActionBar.vue'
import { getMembers, updateMember, deleteMember } from '../api/members.js'
import { useSemesters } from '../composables/useSemesters.js'

const toast = useToast()
const confirm = useConfirm()
const { semesters, currentSemester, loadSemesters } = useSemesters()

const selectedSemester = ref('')
const members = ref([])
const loading = ref(false)

const semesterOptions = ref([])

const filters = ref({
  college: { value: null, matchMode: FilterMatchMode.CONTAINS },
  department: { value: null, matchMode: FilterMatchMode.CONTAINS },
  studentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

onMounted(async () => {
  await loadSemesters()
  semesterOptions.value = semesters.value.map(s => ({ label: s, value: s }))
  selectedSemester.value = currentSemester.value
  await loadMembers()
})

async function loadMembers() {
  if (!selectedSemester.value) return
  loading.value = true
  try {
    const res = await getMembers(selectedSemester.value)
    members.value = res.data
  } catch {
    toast.add({ severity: 'error', summary: '회원 목록 로드 실패', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function onCellEditComplete(event) {
  const { data, newValue, field } = event
  if (data[field] === newValue) return

  data[field] = newValue
  try {
    await updateMember(data.studentId, {
      college: data.college,
      department: data.department,
      name: data.name,
      phone: data.phone,
      birthday: data.birthday,
      volunteerId: data.volunteerId,
      role: data.role,
    })
    toast.add({ severity: 'success', summary: '수정되었습니다.', life: 1500 })
  } catch {
    toast.add({ severity: 'error', summary: '수정 실패', life: 2000 })
  }
}

async function confirmDelete(row) {
  confirm.require({
    message: `${row.name} (${row.studentId}) 회원을 이번 학기에서 제명하시겠습니까?`,
    header: '회원 제명',
    icon: 'i-lucide-triangle-alert',
    acceptClass: 'p-button-danger',
    acceptLabel: '제명',
    rejectLabel: '취소',
    accept: async () => {
      try {
        await deleteMember(row.studentId)
        members.value = members.value.filter(m => m.studentId !== row.studentId)
        toast.add({ severity: 'success', summary: '제명되었습니다.', life: 2000 })
      } catch {
        toast.add({ severity: 'error', summary: '제명 실패', life: 2000 })
      }
    },
  })
}

function downloadExcel() {
  import('xlsx').then(XLSX => {
    const data = members.value.map(m => ({
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
