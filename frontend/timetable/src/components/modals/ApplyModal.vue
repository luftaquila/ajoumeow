<template>
  <div class="text-sm">
    <!-- Admin: link or console -->
    <div v-if="step === 'admin'" class="text-center py-4">
      <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
        <i class="i-lucide-shield-check text-2xl text-blue-600"></i>
      </div>
      <p class="text-lg font-semibold text-text mb-2">관리자 계정</p>
      <p class="text-text-secondary mb-6">회원 정보를 연동하거나,<br>관리자 콘솔에 바로 접속할 수 있습니다.</p>
      <div class="flex flex-col items-center gap-3">
        <Button label="회원 계정 연동" icon="i-lucide-link" severity="info" class="w-full max-w-[240px]" @click="step = 'lookup'" />
        <a href="/console" class="w-full max-w-[240px]">
          <Button label="관리자 콘솔 접속" icon="i-lucide-settings" severity="secondary" class="w-full" @click="loginAsAdmin" />
        </a>
      </div>
    </div>

    <!-- Pending status -->
    <div v-else-if="step === 'pending'" class="text-center py-6">
      <div class="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
        <i class="i-lucide-clock text-2xl text-yellow-600"></i>
      </div>
      <p class="text-lg font-semibold text-text mb-2">승인 대기 중</p>
      <p class="text-text-secondary">가입 신청이 접수되었습니다.<br>관리자 승인을 기다려주세요.</p>
    </div>

    <!-- Rejected status -->
    <div v-else-if="step === 'rejected'" class="text-center py-6">
      <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <i class="i-lucide-x-circle text-2xl text-red-500"></i>
      </div>
      <p class="text-lg font-semibold text-text mb-2">신청이 거절되었습니다</p>
      <p class="text-text-secondary mb-4">정보를 확인 후 다시 신청해 주세요.</p>
      <Button label="재신청" severity="info" @click="step = 'choose'" />
    </div>

    <!-- Submitted -->
    <div v-else-if="step === 'submitted'" class="text-center py-6">
      <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <i class="i-lucide-check-circle text-2xl text-green-600"></i>
      </div>
      <template v-if="autoApproved">
        <p class="text-lg font-semibold text-text mb-2">등록이 완료되었습니다</p>
        <p class="text-text-secondary">다시 로그인하면 바로 이용할 수 있습니다.</p>
      </template>
      <template v-else>
        <p class="text-lg font-semibold text-text mb-2">신청이 완료되었습니다</p>
        <p class="text-text-secondary">관리자 승인을 기다려주세요.</p>
      </template>
    </div>

    <!-- Choose type (new only) -->
    <div v-else-if="step === 'choose'" class="text-center py-4">
      <p class="text-text-secondary mb-6">회원 유형을 선택해 주세요.</p>
      <div class="flex flex-col items-center gap-3">
        <Button label="신규 회원" icon="i-lucide-user-plus" severity="info" class="w-full max-w-[240px]" @click="startNew" />
        <Button label="기존 회원 (재등록)" icon="i-lucide-user-check" severity="secondary" class="w-full max-w-[240px]" @click="step = 'lookup'" />
      </div>
    </div>

    <!-- Lookup existing member -->
    <div v-else-if="step === 'lookup'" class="py-2">
      <p class="text-text-secondary mb-4">이전에 가입한 적이 있다면, 학번을 입력해 주세요.</p>
      <div class="flex gap-2 mb-2">
        <InputText v-model="lookupStudentId" placeholder="학번" class="flex-1" @keyup.enter="doLookup" />
        <Button label="조회" severity="info" :loading="lookupLoading" @click="doLookup" />
      </div>
      <p v-if="lookupError" class="text-red-500 text-xs mt-1" v-html="lookupError"></p>
      <div class="mt-3">
        <Button label="뒤로" severity="secondary" size="small" text @click="step = 'choose'" />
      </div>
    </div>

    <!-- New member form -->
    <div v-else-if="step === 'new-form'" class="py-2">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-xs text-text-muted mb-1">학번 <span class="text-red-500">*</span></label>
          <InputText v-model="form.studentId" placeholder="학번" class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">이름 <span class="text-red-500">*</span></label>
          <InputText v-model="form.name" placeholder="이름" class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">단과대학 <span class="text-red-500">*</span></label>
          <Select v-model="form.college" :options="collegeOptions" optionLabel="label" optionValue="value" placeholder="단과대학 선택" class="w-full" @change="form.department = ''" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">학과 <span class="text-red-500">*</span></label>
          <Select v-model="form.department" :options="departmentOptions" optionLabel="label" optionValue="value" placeholder="학과 선택" class="w-full" :disabled="!form.college" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">연락처 <span class="text-red-500">*</span></label>
          <InputText v-model="form.phone" placeholder="010-0000-0000" class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">생년월일</label>
          <InputText v-model="form.birthday" placeholder="YYMMDD" maxlength="6" class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">1365 ID</label>
          <InputText v-model="form.volunteerId" placeholder="1365 자원봉사 ID" class="w-full" />
        </div>

        <div class="border-t border-surface-border pt-3 mt-1">
          <div class="flex items-start gap-2 mb-2">
            <Checkbox v-model="agreeRules" :binary="true" inputId="agreeRules" />
            <label for="agreeRules" class="text-xs text-text-secondary cursor-pointer">동아리 회칙을 읽었으며, 이에 동의합니다.</label>
          </div>
          <div class="flex items-start gap-2">
            <Checkbox v-model="agreePrivacy" :binary="true" inputId="agreePrivacy" />
            <label for="agreePrivacy" class="text-xs text-text-secondary cursor-pointer">개인정보 수집 및 이용에 동의합니다.</label>
          </div>
        </div>

        <p v-if="submitError" class="text-red-500 text-xs">{{ submitError }}</p>

        <div class="flex gap-2 justify-end mt-2">
          <Button label="뒤로" severity="secondary" size="small" text @click="step = 'choose'" />
          <Button label="신청" severity="info" :loading="submitting" @click="submitNew" />
        </div>
      </div>
    </div>

    <!-- Existing member form (inactive or after lookup) -->
    <div v-else-if="step === 'existing-form'" class="py-2">
      <div class="flex flex-col gap-3">
        <div>
          <label class="block text-xs text-text-muted mb-1">학번</label>
          <InputText :modelValue="form.studentId" disabled class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">이름</label>
          <InputText :modelValue="form.name" disabled class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">단과대학</label>
          <InputText :modelValue="form.college" disabled class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">학과</label>
          <InputText :modelValue="form.department" disabled class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">연락처</label>
          <InputText v-model="form.phone" placeholder="010-0000-0000" class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">생년월일</label>
          <InputText v-model="form.birthday" placeholder="YYMMDD" maxlength="6" class="w-full" />
        </div>
        <div>
          <label class="block text-xs text-text-muted mb-1">1365 ID</label>
          <InputText v-model="form.volunteerId" placeholder="1365 자원봉사 ID" class="w-full" />
        </div>

        <p v-if="submitError" class="text-red-500 text-xs">{{ submitError }}</p>

        <div class="flex gap-2 justify-end mt-2">
          <Button v-if="authStatus === 'new'" label="뒤로" severity="secondary" size="small" text @click="step = 'choose'" />
          <Button label="신청" severity="info" :loading="submitting" @click="submitExisting" />
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="step === 'error'" class="text-center py-6">
      <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <i class="i-lucide-alert-triangle text-2xl text-red-500"></i>
      </div>
      <p class="text-text-secondary">오류가 발생했습니다. 다시 시도해 주세요.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Cookies from 'js-cookie'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import { useGoogleAuth } from '../../composables/useGoogleAuth.js'
import { useAuth } from '../../composables/useAuth.js'
import { useRecords } from '../../composables/useRecords.js'
import { useModal } from '../../composables/useModal.js'
import * as api from '../../api/index.js'

const toast = useToast()
const { authResult, googleCredential } = useGoogleAuth()
const { doGoogleLogin } = useAuth()
const { load: loadRecords } = useRecords()
const { modals, closeModal } = useModal()

const step = ref('choose')
const authStatus = ref('new')

const form = ref({
  studentId: '',
  name: '',
  college: '',
  department: '',
  phone: '',
  birthday: '',
  volunteerId: '',
})

const agreeRules = ref(false)
const agreePrivacy = ref(false)
const submitting = ref(false)
const submitError = ref('')
const autoApproved = ref(false)
const lookupStudentId = ref('')
const lookupLoading = ref(false)
const lookupError = ref('')

// College data
const collegeMap = ref({})
const collegeLoaded = ref(false)

const collegeOptions = computed(() =>
  Object.keys(collegeMap.value).map(name => ({ label: name, value: name }))
)

const departmentOptions = computed(() => {
  if (!form.value.college || !collegeMap.value[form.value.college]) return []
  return collegeMap.value[form.value.college].map(name => ({ label: name, value: name }))
})

async function loadColleges() {
  if (collegeLoaded.value) return
  try {
    const res = await fetch('/api/data/college')
    collegeMap.value = await res.json()
    collegeLoaded.value = true
  } catch {}
}

// Watch for modal open to set initial state from authResult
watch(() => modals.apply.value, (visible) => {
  if (visible && authResult.value) {
    const result = authResult.value
    authStatus.value = result.status

    if (result.status === 'admin') {
      step.value = 'admin'
    } else if (result.status === 'pending') {
      step.value = 'pending'
    } else if (result.status === 'rejected') {
      step.value = 'rejected'
    } else if (result.status === 'inactive') {
      // Pre-fill with existing member data
      const m = result.member
      form.value = {
        studentId: m.studentId,
        name: m.name,
        college: m.college,
        department: m.department,
        phone: m.phone,
        birthday: m.birthday || '',
        volunteerId: m.volunteerId || '',
      }
      step.value = 'existing-form'
    } else if (result.status === 'new') {
      step.value = 'choose'
    } else if (result.status === 'error') {
      step.value = 'error'
    }

    loadColleges()
  }

  if (!visible) {
    // Reset on close
    step.value = 'choose'
    submitError.value = ''
    lookupError.value = ''
    agreeRules.value = false
    agreePrivacy.value = false
    autoApproved.value = false
  }
}, { immediate: true })

function loginAsAdmin() {
  const result = authResult.value
  if (result?.adminToken) {
    Cookies.set('jwt', result.adminToken, { expires: 365 })
    if (result.semester) Cookies.set('currentSemester', result.semester, { expires: 365 })
  }
}

function startNew() {
  form.value = { studentId: '', name: '', college: '', department: '', phone: '', birthday: '', volunteerId: '' }
  step.value = 'new-form'
}

async function doLookup() {
  if (!lookupStudentId.value) return
  lookupLoading.value = true
  lookupError.value = ''
  try {
    const res = await api.lookupMember(lookupStudentId.value)
    const m = res.data

    if (m.alreadyRegistered) {
      // Already registered this semester — link Google account and login directly
      const linkRes = await api.linkGoogleAccount(googleCredential.value, m.studentId)
      if (linkRes.data.status === 'authenticated') {
        doGoogleLogin(linkRes.data)
        await loadRecords()
        closeModal('apply')
        toast.add({ severity: 'success', summary: 'Google 계정이 연동되었습니다.', life: 3000 })
        return
      }
    }

    form.value = {
      studentId: m.studentId,
      name: m.name,
      college: m.college,
      department: m.department,
      phone: m.phone,
      birthday: m.birthday || '',
      volunteerId: m.volunteerId || '',
    }
    step.value = 'existing-form'
  } catch (e) {
    lookupError.value = e.error?.message || '조회에 실패했습니다.'
  } finally {
    lookupLoading.value = false
  }
}

async function submitNew() {
  submitError.value = ''
  if (!form.value.studentId || !form.value.name || !form.value.college || !form.value.department || !form.value.phone) {
    submitError.value = '필수 항목을 모두 입력해 주세요.'
    return
  }
  if (!agreeRules.value || !agreePrivacy.value) {
    submitError.value = '회칙 및 개인정보 수집에 동의해 주세요.'
    return
  }
  submitting.value = true
  try {
    const res = await api.submitApplication({
      credential: googleCredential.value,
      ...form.value,
      isNew: true,
    })
    autoApproved.value = !!res.data.autoApproved
    step.value = 'submitted'
  } catch (e) {
    submitError.value = e.error?.message || '신청에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}

async function submitExisting() {
  submitError.value = ''
  if (!form.value.phone) {
    submitError.value = '연락처를 입력해 주세요.'
    return
  }
  submitting.value = true
  try {
    const res = await api.submitApplication({
      credential: googleCredential.value,
      ...form.value,
      isNew: false,
    })
    autoApproved.value = !!res.data.autoApproved
    step.value = 'submitted'
  } catch (e) {
    submitError.value = e.error?.message || '신청에 실패했습니다.'
  } finally {
    submitting.value = false
  }
}
</script>
