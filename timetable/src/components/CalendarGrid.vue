<template>
  <div class="calendar-table__body">
    <div class="calendar-table__row" v-for="(row, ri) in rows" :key="ri">
      <template v-for="cell in row" :key="cell.index">
        <!-- Add button (last cell) -->
        <div v-if="cell.isAddButton" id="addRecord" class="calendar-table__col" @click="onAddClick">
          <div style="height: 100%; padding: 7px">
            <div
              class="ripple calendar-table__item"
              :class="{ addRecord_active: isSelectedActive }"
              :style="{
                zIndex: 0, lineHeight: '50px', textAlign: 'center', fontSize: '1.2rem',
                borderRadius: '50%', color: 'white',
                backgroundColor: isSelectedActive ? '#2196f3' : 'darkgray'
              }"
            >
              <i class="fas fa-plus"></i>
            </div>
          </div>
        </div>
        <!-- Regular cell -->
        <CalendarCell
          v-else
          :cell="cell"
          :selected="cell.date === selectedDate"
          @select="selectDate(cell.date)"
        />
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useCalendar } from '../composables/useCalendar.js'
import { useAuth } from '../composables/useAuth.js'
import * as apiClient from '../api/index.js'
import CalendarCell from './CalendarCell.vue'

const emit = defineEmits(['add-record'])
const toast = useToast()
const { cells, selectedDate, isSelectedActive, selectDate } = useCalendar()
const { user } = useAuth()

const addMode = ref(false)
const maxCount = ref(99)

const rows = computed(() => {
  const result = []
  for (let i = 0; i < cells.value.length; i += 7) {
    result.push(cells.value.slice(i, i + 7))
  }
  return result
})

async function onAddClick() {
  if (!isSelectedActive.value) return
  if (!user.value) return toast.error('로그인을 해 주세요!')

  // Fetch max count
  try {
    const res = await apiClient.getSetting('maxFeedingUserCount')
    maxCount.value = Number(res.data)
  } catch (_) {}

  addMode.value = true

  // Get current courses for date
  const cell = cells.value.find(c => c.date === selectedDate.value)
  const content = cell?.content || [
    { course: 1, ppl: [] },
    { course: 2, ppl: [] },
    { course: 3, ppl: [] },
  ]

  // Emit to parent which will show add buttons
  window.__addMode = { active: true, maxCount: maxCount.value, content }
  window.dispatchEvent(new CustomEvent('addModeChanged'))
}
</script>
