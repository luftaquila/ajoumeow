<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    header="급식 인원 추가"
    modal
    :style="{ width: '30rem' }"
    :breakpoints="{ '640px': '94vw' }"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-text-secondary">코스</label>
        <SelectButton v-model="course" :options="COURSE_OPTIONS" :allowEmpty="false" size="small" />
      </div>

      <div class="flex flex-col gap-1">
        <label for="feeder-members" class="text-sm font-medium text-text-secondary">회원</label>
        <AutoComplete
          inputId="feeder-members"
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
      <Button label="취소" severity="secondary" size="small" @click="$emit('update:visible', false)" />
      <Button
        :label="selected.length ? `${selected.length}명 추가` : '추가'"
        size="small"
        :disabled="!course || !selected.length"
        @click="add"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import SelectButton from 'primevue/selectbutton'
import AutoComplete from 'primevue/autocomplete'
import Button from 'primevue/button'
import { searchMembers } from '../api/members.js'
import { COURSES } from '../../../timetable/src/constants.js'

const props = defineProps({
  visible: Boolean,
  // Rows already on the verify page; members verified or checked in the chosen course aren't suggested
  rows: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:visible', 'add'])

const COURSE_OPTIONS = Object.values(COURSES).map(c => c.label)

const course = ref(null)
const selected = ref([])
const suggestions = ref([])

watch(() => props.visible, v => {
  if (v) {
    course.value = null
    selected.value = []
  }
})

// A slower earlier response must not replace the list for what is typed now
let searchSeq = 0
async function search(event) {
  const mine = ++searchSeq
  const q = event.query.trim()
  if (!q) {
    suggestions.value = []
    return
  }
  try {
    const res = await searchMembers(q)
    if (mine !== searchSeq) return
    const chosen = new Set(selected.value.map(m => m.studentId))
    const included = new Set(props.rows.filter(r => r.course === course.value && (r.verified || r.checked)).map(r => r.studentId))
    suggestions.value = (res.data || [])
      .filter(m => !chosen.has(m.studentId) && !included.has(m.studentId))
      .map(m => ({ ...m, display: `${m.name} (${m.studentId})` }))
  } catch {
    if (mine === searchSeq) suggestions.value = []
  }
}

function add() {
  // A second click can land while the dialog fades out
  if (!props.visible) return
  emit('add', { course: course.value, members: selected.value })
  emit('update:visible', false)
}
</script>
