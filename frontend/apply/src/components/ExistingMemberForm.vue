<template>
  <div class="w-full max-w-lg mx-auto">
    <div class="card-section">
      <button @click="$emit('back')" class="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4 cursor-pointer">
        <span class="i-lucide-arrow-left text-base"></span> 돌아가기
      </button>

      <h1 class="text-xl font-bold text-center mb-1">
        {{ semester }}학기 미유미유 고인물집사 등록
      </h1>
      <p class="text-text-muted text-sm text-center mb-6">기존 회원 재등록 폼입니다</p>

      <!-- Lookup phase -->
      <div v-if="!found" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">학번</label>
          <InputText v-model="lookupId" placeholder="학번 9자리를 알려주세요!" maxlength="9" />
        </div>
        <Button
          label="조회"
          :loading="lookingUp"
          @click="lookup"
          class="w-full"
        />
      </div>

      <!-- Edit + submit phase -->
      <form v-else @submit.prevent="submit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">이름</label>
          <InputText :modelValue="form.name" disabled />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">학번</label>
          <InputText :modelValue="form.studentId" disabled />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">단과대학</label>
          <InputText :modelValue="form.college" disabled />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">학과</label>
          <InputText :modelValue="form.department" disabled />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">연락처</label>
          <InputText
            v-model="form.phone"
            placeholder="010-0000-0000"
            maxlength="13"
            @input="formatPhone"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">생년월일</label>
          <InputText v-model="form.birthday" placeholder="생년월일 6자리 (YYMMDD)" maxlength="6" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">1365 ID</label>
          <InputText v-model="form.volunteerId" placeholder="미입력시 봉사시간 인정이 불가합니다" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">가입 학기</label>
          <InputText :modelValue="form.enrolledSemester" disabled />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">직책</label>
          <InputText :modelValue="form.role" disabled />
        </div>

        <Button
          type="submit"
          label="등록하기!"
          :loading="submitting"
          class="w-full mt-2"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { get, post } from '../../../shared/api.js'

const props = defineProps({
  semester: String,
})

const emit = defineEmits(['success', 'back'])
const toast = useToast()

const lookupId = ref('')
const lookingUp = ref(false)
const found = ref(false)
const submitting = ref(false)

const form = ref({
  name: '',
  studentId: '',
  college: '',
  department: '',
  phone: '',
  birthday: '',
  volunteerId: '',
  enrolledSemester: '',
  role: '',
})

function formatPhone() {
  let val = form.value.phone.replace(/[^0-9]/g, '')
  if (val.length > 3 && val.length <= 7) {
    val = val.slice(0, 3) + '-' + val.slice(3)
  } else if (val.length > 7) {
    val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11)
  }
  form.value.phone = val
}

async function lookup() {
  if (!/^\d{9}$/.test(lookupId.value)) {
    toast.add({ severity: 'warn', summary: '학번 9자리를 입력해주세요.', life: 2000 })
    return
  }

  lookingUp.value = true
  try {
    const res = await get(`/members/lookup/${lookupId.value}`)
    const d = res.data
    form.value = {
      name: d.name,
      studentId: d.studentId,
      college: d.college,
      department: d.department,
      phone: d.phone || '',
      birthday: d.birthday || '',
      volunteerId: d.volunteerId || '',
      enrolledSemester: d.enrolledSemester || '',
      role: d.role || '회원',
    }
    found.value = true
  } catch (e) {
    const code = e.error?.code
    let msg = e.error?.message || '조회에 실패했습니다.'
    if (code === 'ERR_ALREADY_REGISTERED') msg = '이미 이번 학기에 등록된 학번입니다.'
    else if (code === 'ERR_NEVER_REGISTERED') msg = '등록 이력이 없는 학번입니다. 신입 회원으로 등록해주세요.'
    toast.add({ severity: 'error', summary: msg, life: 3000 })
  } finally {
    lookingUp.value = false
  }
}

async function submit() {
  const f = form.value
  if (!/^010-\d{4}-\d{4}$/.test(f.phone)) {
    toast.add({ severity: 'warn', summary: '올바른 전화번호를 입력해주세요.', life: 2000 })
    return
  }
  if (f.birthday && !/^\d{2}(0[1-9]|1[0-2])[0-3]\d$/.test(f.birthday)) {
    toast.add({ severity: 'warn', summary: '올바른 생년월일 6자리를 입력해주세요.', life: 2000 })
    return
  }

  submitting.value = true
  try {
    await post('/members', {
      name: f.name,
      studentId: f.studentId,
      college: f.college,
      department: f.department,
      phone: f.phone,
      birthday: f.birthday,
      volunteerId: f.volunteerId,
      role: f.role,
      isNew: false,
    })
    emit('success')
  } catch (e) {
    const msg = e.error?.message || '오류가 발생했습니다.'
    toast.add({ severity: 'error', summary: msg, life: 3000 })
  } finally {
    submitting.value = false
  }
}
</script>
