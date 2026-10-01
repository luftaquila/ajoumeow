<template>
  <div>
    <PageHeader
      title="회원 명단"
      description="학기별 회원 명단입니다. 칸을 눌러 바로 고칠 수 있고, '회원' 외의 직책은 모두 관리자 권한입니다."
      icon="i-lucide-users"
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
            <Select v-model="data[field]" :options="roleOptions" size="small" class="w-full">
              <template #option="{ option }">
                <span>{{ option }}</span>
                <span v-if="option !== '회원'" class="ml-2 text-xs text-text-muted">관리자 권한</span>
              </template>
            </Select>
          </template>
        </Column>
        <Column header="" style="min-width: 3rem">
          <template #body="{ data }">
            <button @click="confirmDelete(data)" class="text-text-muted hover:text-red-500 cursor-pointer" title="명단에서 제외">
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
import { ref, computed, onMounted } from 'vue'
import { useNotify } from '../composables/useNotify.js'
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
import { getMembers, getRoles, updateMember, deleteMember } from '../api/members.js'
import { useSemesters } from '../composables/useSemesters.js'

const notify = useNotify()
const confirm = useConfirm()
const { semesters, currentSemester, loadSemesters } = useSemesters()

const selectedSemester = ref('')
const members = ref([])
const loading = ref(false)

const semesterOptions = ref([])
const roles = ref([])
// '회원' 이외의 직책은 모두 관리자 권한이라 새 직책을 자유 입력으로 만들지 않는다
const roleOptions = computed(() => ['회원', ...roles.value.filter(r => r !== '회원')])

const filters = ref({
  college: { value: null, matchMode: FilterMatchMode.CONTAINS },
  department: { value: null, matchMode: FilterMatchMode.CONTAINS },
  studentId: { value: null, matchMode: FilterMatchMode.CONTAINS },
  name: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

onMounted(async () => {
  getRoles().then(res => { roles.value = res.data || [] }).catch(() => {})
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
  } catch (e) {
    notify.error(e, '회원 목록 로드 실패')
  } finally {
    loading.value = false
  }
}

async function onCellEditComplete(event) {
  const { data, field } = event
  const newValue = typeof event.newValue === 'string' ? event.newValue.trim() : event.newValue
  if (data[field] === newValue) return

  const prev = data[field]
  data[field] = newValue
  try {
    await updateMember(data.studentId, {
      semester: selectedSemester.value,
      college: data.college,
      department: data.department,
      name: data.name,
      phone: data.phone,
      birthday: data.birthday,
      volunteerId: data.volunteerId,
      role: data.role,
    })
    notify.success('수정되었습니다.')
  } catch (e) {
    data[field] = prev
    notify.error(e, '수정 실패')
  }
}

async function confirmDelete(row) {
  confirm.require({
    message: `${row.name} (${row.studentId}) 회원을 ${selectedSemester.value} 명단에서 제외할까요? 계정과 급식 기록은 남습니다.`,
    header: '명단에서 제외',
    icon: 'i-lucide-triangle-alert',
    acceptClass: 'p-button-danger',
    acceptLabel: '제외',
    rejectLabel: '취소',
    accept: async () => {
      try {
        await deleteMember(row.studentId, selectedSemester.value)
        members.value = members.value.filter(m => m.studentId !== row.studentId)
        notify.success('명단에서 제외했습니다.')
      } catch (e) {
        notify.error(e, '제외 실패')
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
