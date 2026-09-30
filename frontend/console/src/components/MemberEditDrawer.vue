<template>
  <Drawer
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    position="right"
    class="w-full! sm:w-[26rem]!"
    :header="member ? `${member.name} · ${member.studentId}` : ''"
  >
    <form v-if="form" class="flex flex-col gap-4" @submit.prevent="save">
      <div class="field">
        <label for="m-name">이름</label>
        <InputText id="m-name" v-model="form.name" :invalid="!!errors.name" />
        <small v-if="errors.name">{{ errors.name }}</small>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="field">
          <label for="m-college">단과대학</label>
          <Select id="m-college" v-model="form.college" :options="collegeOptions" placeholder="선택" @change="form.department = null" fluid />
        </div>
        <div class="field">
          <label for="m-dept">학과</label>
          <Select id="m-dept" v-model="form.department" :options="departmentOptions" placeholder="선택" :invalid="!!errors.department" fluid />
          <small v-if="errors.department">{{ errors.department }}</small>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="field">
          <label for="m-phone">연락처</label>
          <InputText id="m-phone" v-model="form.phone" placeholder="010-0000-0000" :invalid="!!errors.phone" />
          <small v-if="errors.phone">{{ errors.phone }}</small>
        </div>
        <div class="field">
          <label for="m-birthday">생년월일</label>
          <InputText id="m-birthday" v-model="form.birthday" placeholder="YYMMDD" maxlength="6" :invalid="!!errors.birthday" />
          <small v-if="errors.birthday">{{ errors.birthday }}</small>
        </div>
      </div>

      <div class="field">
        <label for="m-vol">1365 아이디</label>
        <InputText id="m-vol" v-model="form.volunteerId" placeholder="없으면 활동확인서에서 빠집니다" />
      </div>

      <div class="field">
        <label for="m-role">{{ semester }} 직책</label>
        <Select id="m-role" v-model="roleChoice" :options="roleChoices" optionLabel="label" optionValue="value" fluid>
          <template #option="{ option }">
            <span>{{ option.label }}</span>
            <span v-if="option.admin" class="ml-2 text-xs text-text-muted">관리자 권한</span>
          </template>
        </Select>
        <InputText v-if="roleChoice === CUSTOM" v-model="customRole" placeholder="새 직책 이름" :invalid="!!errors.role" class="mt-2" />
        <small v-if="errors.role">{{ errors.role }}</small>
        <p class="hint">'회원'이 아닌 직책은 모두 콘솔에 들어올 수 있는 관리자 권한입니다. 바꾸면 바로 적용됩니다.</p>
      </div>

      <div class="field">
        <label>Google 계정</label>
        <p class="text-sm">{{ member.googleEmail || '연동 안 됨' }}</p>
      </div>

      <div class="flex gap-2 pt-2">
        <Button type="submit" label="저장" :loading="saving" :disabled="!dirty || hasErrors" class="flex-1" />
        <Button type="button" label="닫기" severity="secondary" outlined @click="$emit('update:visible', false)" />
      </div>
    </form>
  </Drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { updateMember } from '../api/members.js'
import { useNotify } from '../composables/useNotify.js'

const props = defineProps({
  visible: Boolean,
  member: { type: Object, default: null },
  semester: { type: String, required: true },
  roles: { type: Array, default: () => [] },
  colleges: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:visible', 'saved'])

const CUSTOM = '__custom__'
// Same formats as the apply form (apply/src/components/*MemberForm.vue)
const PHONE_RE = /^010-\d{4}-\d{4}$/
const BIRTHDAY_RE = /^\d{2}(0[1-9]|1[0-2])[0-3]\d$/

const notify = useNotify()
const form = ref(null)
const roleChoice = ref('회원')
const customRole = ref('')
const saving = ref(false)

watch(() => [props.visible, props.member], () => {
  if (!props.visible || !props.member) return
  const m = props.member
  form.value = {
    name: m.name, college: m.college, department: m.department,
    phone: m.phone, birthday: m.birthday || '', volunteerId: m.volunteerId || '',
  }
  roleChoice.value = m.role
  customRole.value = ''
}, { immediate: true })

// Keep the member's current value selectable even if it's not in the college list any more
function withCurrent(list, current) {
  return current && !list.includes(current) ? [current, ...list] : list
}
const collegeOptions = computed(() => withCurrent(Object.keys(props.colleges), props.member?.college))
const departmentOptions = computed(() => {
  const list = props.colleges[form.value?.college] || []
  return form.value?.college === props.member?.college ? withCurrent(list, props.member?.department) : list
})

const roleChoices = computed(() => {
  const names = ['회원', ...props.roles.filter(r => r !== '회원')]
  if (props.member && !names.includes(props.member.role)) names.push(props.member.role)
  return [
    ...names.map(r => ({ label: r, value: r, admin: r !== '회원' })),
    { label: '직접 입력…', value: CUSTOM, admin: true },
  ]
})
const role = computed(() => (roleChoice.value === CUSTOM ? customRole.value : roleChoice.value).trim())

const errors = computed(() => {
  const e = {}
  if (!form.value) return e
  const f = form.value
  const m = props.member
  if (!f.name.trim()) e.name = '이름을 입력해 주세요.'
  if (!f.department) e.department = '학과를 선택해 주세요.'
  // Legacy rows may not match the format, so only check fields that were edited
  if (f.phone !== m.phone && !PHONE_RE.test(f.phone)) e.phone = '010-0000-0000 형식'
  if (f.birthday !== (m.birthday || '') && f.birthday && !BIRTHDAY_RE.test(f.birthday)) e.birthday = 'YYMMDD 6자리'
  if (!role.value) e.role = '직책을 입력해 주세요.'
  return e
})

const hasErrors = computed(() => Object.keys(errors.value).length > 0)

const dirty = computed(() => {
  if (!form.value || !props.member) return false
  const f = form.value
  const m = props.member
  return f.name !== m.name || f.college !== m.college || f.department !== m.department || f.phone !== m.phone
    || f.birthday !== (m.birthday || '') || f.volunteerId !== (m.volunteerId || '') || role.value !== m.role
})

async function save() {
  if (hasErrors.value) return
  saving.value = true
  const f = form.value
  const data = {
    semester: props.semester,
    name: f.name.trim(),
    college: f.college,
    department: f.department,
    phone: f.phone.trim(),
    birthday: f.birthday.trim() || null,
    volunteerId: f.volunteerId.trim() || null,
    role: role.value,
  }
  try {
    await updateMember(props.member.studentId, data)
    notify.success(`${data.name} 정보를 저장했습니다.`)
    emit('saved', data)
    emit('update:visible', false)
  } catch (e) {
    notify.error(e, '저장 실패')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.field label {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-text-secondary);
}
.field small {
  font-size: 0.75rem;
  color: #ef4444;
}
.hint {
  font-size: 0.75rem;
  color: var(--c-text-muted);
  margin-top: 0.25rem;
}
</style>
