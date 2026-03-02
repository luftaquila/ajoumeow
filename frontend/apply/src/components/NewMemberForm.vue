<template>
  <div class="w-full max-w-lg mx-auto">
    <div class="card-section">
      <button @click="$emit('back')" class="flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4 cursor-pointer">
        <span class="i-lucide-arrow-left text-base"></span> 돌아가기
      </button>

      <h1 class="text-xl font-bold text-center mb-1">
        {{ semester }}학기 미유미유 신입집사 등록
      </h1>
      <p class="text-text-muted text-sm text-center mb-6">새로 가입하는 회원 등록 폼입니다</p>

      <form @submit.prevent="submit" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">이름</label>
          <InputText v-model="form.name" placeholder="이름을 알려주세요!" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium text-text-secondary">학번</label>
          <InputText v-model="form.studentId" placeholder="학번 9자리를 알려주세요!" maxlength="9" />
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

        <div class="flex flex-col gap-2 mt-2">
          <label class="text-sm font-medium text-text-secondary">동아리 회칙</label>
          <div class="flex gap-2 text-xs text-primary mb-1">
            <a href="https://docs.google.com/document/d/1e-uCWwqVILTvVV75Q7DXrNPCna7QiCi6AjC2aykG0VE/" target="_blank" class="hover:underline">새 창에서 열기</a>
            <a href="https://docs.google.com/document/d/1e-uCWwqVILTvVV75Q7DXrNPCna7QiCi6AjC2aykG0VE/export?format=pdf" target="_blank" class="hover:underline">PDF 다운로드</a>
          </div>
          <iframe
            src="https://docs.google.com/document/d/e/2PACX-1vS0-meI5O8H6hWSHpsS5j3f4dch7ZfqtbaTBsMXxa9oaVJLh6dGixJnRYv5uyuQmR-2wnFkcWDN9ws8/pub?embedded=true"
            class="w-full h-60 border border-surface-border rounded-lg"
          ></iframe>
          <div class="flex items-center gap-2">
            <Checkbox v-model="form.ruleAgree" :binary="true" inputId="rule" />
            <label for="rule" class="text-sm cursor-pointer">동의합니다</label>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-text-secondary">개인정보 수집 및 이용 동의</label>
          <Textarea
            :modelValue="privacyText"
            disabled
            autoResize
            class="text-xs! opacity-70"
          />
          <div class="flex items-center gap-2">
            <Checkbox v-model="form.privacyAgree" :binary="true" inputId="privacy" />
            <label for="privacy" class="text-sm cursor-pointer">동의합니다</label>
          </div>
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

const emit = defineEmits(['success', 'back'])
const toast = useToast()
const { collegeOptions, getDepartments } = useCollegeDepartment()

const form = ref({
  name: '',
  studentId: '',
  college: '',
  department: '',
  phone: '',
  birthday: '',
  volunteerId: '',
  ruleAgree: false,
  privacyAgree: false,
})

const submitting = ref(false)

const departmentOptions = computed(() => getDepartments(form.value.college))

const privacyText = `아주대학교 동아리 미유미유에서는 다음과 같이 개인정보를 수집 및 이용하고 있습니다.

- 수집 및 이용 목적: 급식표 서비스 제공, 봉사시간 지급, 공지사항 전달
- 항목: 이름, 생년월일, 학번, 소속, 휴대폰 번호, 1365 아이디`

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
  if (!/^\d{9}$/.test(f.studentId)) return '학번 9자리를 입력해주세요.'
  if (!f.college) return '단과대학을 선택해주세요.'
  if (!f.department) return '학과를 선택해주세요.'
  if (!/^010-\d{4}-\d{4}$/.test(f.phone)) return '올바른 전화번호를 입력해주세요.'
  if (!/^\d{2}(0[1-9]|1[0-2])[0-3]\d$/.test(f.birthday)) return '올바른 생년월일 6자리를 입력해주세요.'
  if (!f.ruleAgree) return '동아리 회칙에 동의해주세요.'
  if (!f.privacyAgree) return '개인정보 수집 및 이용에 동의해주세요.'
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
    const f = form.value
    await post('/members', {
      name: f.name.trim(),
      studentId: f.studentId,
      college: f.college,
      department: f.department,
      phone: f.phone,
      birthday: f.birthday,
      volunteerId: f.volunteerId,
      role: '회원',
      isNew: true,
    })
    emit('success')
  } catch (e) {
    const code = e.error?.code
    let msg = e.error?.message || '오류가 발생했습니다.'
    if (code === 'ERR_ALREADY_REGISTERED') msg = '이미 등록된 학번입니다.'
    else if (code === 'ERR_REGISTERED_BEFORE') msg = '이전에 등록한 적이 있습니다. 기존 회원으로 등록해주세요.'
    toast.add({ severity: 'error', summary: msg, life: 3000 })
  } finally {
    submitting.value = false
  }
}
</script>
