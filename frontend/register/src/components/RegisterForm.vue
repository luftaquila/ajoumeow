<template>
  <div class="w-full max-w-lg mx-auto">
    <div class="card-section">
      <h1 class="text-xl font-bold text-center mb-1">
        {{ semester }}학기 미유미유 신입집사 모집
      </h1>
      <p class="text-text-muted text-sm text-center mb-6">가입 신청서를 작성해주세요</p>

      <form @submit.prevent="submit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">이름</label>
          <InputText v-model="form.name" placeholder="이름을 알려주세요!" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">단과대학</label>
          <Select
            v-model="form.college"
            :options="collegeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="단과대학 선택"
            @change="form.department = ''"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">학과</label>
          <Select
            v-model="form.department"
            :options="departmentOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="학과 선택"
            :disabled="!form.college"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">연락처</label>
          <InputText
            v-model="form.phone"
            placeholder="010-0000-0000"
            maxlength="13"
            inputmode="tel"
            @input="formatPhone"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">학번</label>
          <InputText v-model="form.studentId" placeholder="학번 9자리를 알려주세요!" maxlength="9" inputmode="numeric" />
        </div>

        <div class="flex flex-col gap-2 mt-2">
          <label class="text-sm font-medium text-text-secondary">개인정보 수집 및 이용 동의</label>
          <Textarea
            :modelValue="privacyText"
            disabled
            autoResize
            class="text-xs! opacity-70"
          />
          <div class="flex items-center gap-2">
            <Checkbox v-model="form.agree" :binary="true" inputId="agree" />
            <label for="agree" class="text-sm cursor-pointer">동의합니다</label>
          </div>
        </div>

        <Button
          type="submit"
          label="신청하기!"
          :loading="submitting"
          class="w-full mt-2"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { post } from '../../../shared/api.js'
import { useCollegeDepartment } from '../composables/useCollegeDepartment.js'

const props = defineProps({
  semester: String,
})

const emit = defineEmits(['success'])
const toast = useToast()
const { collegeOptions, getDepartments } = useCollegeDepartment()

const form = ref({
  name: '',
  college: '',
  department: '',
  phone: '',
  studentId: '',
  agree: false,
})

const submitting = ref(false)

const departmentOptions = computed(() => getDepartments(form.value.college))

const privacyText = `아주대학교 동아리 미유미유에서는 다음과 같이 개인정보를 수집 및 이용하고 있습니다.

- 수집 및 이용 목적: 가입 신청 처리 및 신청자 개별 연락
- 항목: 이름, 학번, 소속, 휴대폰번호`

function formatPhone() {
  let val = form.value.phone.replace(/[^0-9]/g, '')
  if (val.length > 3 && val.length <= 7) {
    val = val.slice(0, 3) + '-' + val.slice(3)
  } else if (val.length > 7) {
    val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11)
  }
  form.value.phone = val
}

function validate() {
  const f = form.value
  if (!f.name.trim()) return '이름을 입력해주세요.'
  if (!f.college) return '단과대학을 선택해주세요.'
  if (!f.department) return '학과를 선택해주세요.'
  if (!/^010-\d{4}-\d{4}$/.test(f.phone)) return '올바른 전화번호를 입력해주세요.'
  if (!/^\d{9}$/.test(f.studentId)) return '학번 9자리를 입력해주세요.'
  if (!f.agree) return '개인정보 수집 및 이용에 동의해주세요.'
  return null
}

async function submit() {
  const err = validate()
  if (err) {
    toast.add({ severity: 'warn', summary: err, life: 2000 })
    return
  }

  submitting.value = true
  try {
    await post('/registrations', {
      name: form.value.name.trim(),
      college: form.value.college,
      department: form.value.department,
      phone: form.value.phone,
      studentId: form.value.studentId,
    })
    emit('success')
  } catch (e) {
    const msg = e.error?.code === 'ERR_ALREADY_REGISTERED'
      ? '이미 신청한 학번입니다.'
      : (e.error?.message || '오류가 발생했습니다.')
    toast.add({ severity: 'error', summary: msg, life: 3000 })
  } finally {
    submitting.value = false
  }
}
</script>
