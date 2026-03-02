<template>
  <div>
    <div class="flex justify-center" v-for="(row, ri) in rows" :key="ri">
      <template v-for="cell in row" :key="cell.index">
        <!-- Add button (last cell) -->
        <div v-if="cell.isAddButton" class="cal-body-col" @click="onAddClick">
          <div class="h-full p-[7px]">
            <div
              class="ripple cal-item"
              :class="[isSelectedActive ? 'bg-primary' : 'bg-[darkgray]']"
              :style="{ lineHeight: '50px', fontSize: '1.2rem', color: 'white' }"
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
import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useCalendar } from '../composables/useCalendar.js'
import { useAuth } from '../composables/useAuth.js'
import { useAddMode } from '../composables/useAddMode.js'
import * as apiClient from '../api/index.js'
import CalendarCell from './CalendarCell.vue'

const emit = defineEmits(['add-record'])
const toast = useToast()
const { cells, selectedDate, isSelectedActive, selectDate } = useCalendar()
const { user } = useAuth()
const { enterAddMode } = useAddMode()

const rows = computed(() => {
  const result = []
  for (let i = 0; i < cells.value.length; i += 7) {
    result.push(cells.value.slice(i, i + 7))
  }
  return result
})

async function onAddClick() {
  if (!isSelectedActive.value) return
  if (!user.value) return toast.add({ severity: 'error', summary: '로그인을 해 주세요!', life: 1500 })

  // Fetch max count
  let max = 99
  try {
    const res = await apiClient.getSetting('maxFeedingUserCount')
    max = Number(res.data)
  } catch (_) {}

  enterAddMode(max)
}
</script>
