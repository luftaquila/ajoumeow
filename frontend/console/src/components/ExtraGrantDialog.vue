<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="기타 인증"
    modal
    :closable="!submitting"
    :closeOnEscape="!submitting"
    :style="{ width: '30rem' }"
    :breakpoints="{ '640px': '94vw' }"
  >
    <div class="flex flex-col gap-4">
      <p class="text-xs text-text-muted">
        {{ date }} 기록으로 인증합니다. 기타 인증 활동은 1365 봉사활동 확인서 및 급식 마일리지 종합에서 제외됩니다.
      </p>

      <div class="flex flex-col gap-1">
        <label for="extra-reason" class="text-sm font-medium text-text-secondary">지급 사유</label>
        <InputText id="extra-reason" v-model="reason" :invalid="!!reasonError" />
        <p v-if="reasonError" class="text-xs text-red-500">{{ reasonError }}</p>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-text-secondary">점수</label>
        <div class="flex items-center gap-2 flex-wrap">
          <SelectButton v-model="score" :options="SCORE_PRESETS" :allowEmpty="false" size="small" />
          <InputNumber v-model="score" :min="0.5" :max="10" :step="0.5" :minFractionDigits="1" :maxFractionDigits="1" inputClass="w-16" size="small" />
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label for="extra-members" class="text-sm font-medium text-text-secondary">회원</label>
        <AutoComplete
          inputId="extra-members"
          v-model="selected"
          multiple
          :suggestions="suggestions"
          @complete="search"
          optionLabel="display"
          placeholder="회원 검색"
          fluid
        />
      </div>
    </div>

    <template #footer>
      <Button label="취소" severity="secondary" size="small" :disabled="submitting" @click="$emit('update:visible', false)" />
      <Button
        :label="selected.length ? `${selected.length}명 인증` : '인증'"
        size="small"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import SelectButton from 'primevue/selectbutton'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import { searchMembers } from '../api/members.js'
import { createVerifications } from '../api/verifications.js'
import { useNotify } from '../composables/useNotify.js'

const props = defineProps({
  visible: Boolean,
  date: { type: String, required: true },
})
const emit = defineEmits(['update:visible', 'granted'])

const SCORE_PRESETS = [0.5, 1, 1.5, 2]

const notify = useNotify()
const reason = ref('')
const score = ref(1)
const selected = ref([])
const suggestions = ref([])
const submitting = ref(false)

// 급식 통계와 1365는 '…코스'로 끝나는 기록을 급식으로 센다
const reasonError = computed(() => reason.value.trim().endsWith('코스') ? "사유가 '코스'로 끝나면 급식으로 집계됩니다." : '')
const canSubmit = computed(() => reason.value.trim() && !reasonError.value && score.value > 0 && selected.value.length)

watch(() => props.visible, v => {
  if (v) {
    reason.value = ''
    score.value = 1
    selected.value = []
  }
})

async function search(event) {
  const q = event.query.trim()
  if (!q) {
    suggestions.value = []
    return
  }
  try {
    const res = await searchMembers(q)
    const chosen = new Set(selected.value.map(m => m.studentId))
    suggestions.value = (res.data || [])
      .filter(m => !chosen.has(m.studentId))
      .map(m => ({ ...m, display: `${m.name} (${m.studentId})` }))
  } catch {
    suggestions.value = []
  }
}

async function submit() {
  submitting.value = true
  try {
    const items = selected.value.map(m => ({
      studentId: m.studentId,
      date: props.date,
      course: reason.value.trim(),
      score: score.value,
    }))
    const res = await createVerifications(items)
    emit('granted', res.data)
    emit('update:visible', false)
  } catch (e) {
    notify.error(e, '인증 실패')
  } finally {
    submitting.value = false
  }
}
</script>
