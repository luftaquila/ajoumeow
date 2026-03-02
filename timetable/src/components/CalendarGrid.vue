<template>
  <div>
    <div class="flex justify-center" v-for="(row, ri) in rows" :key="ri">
      <template v-for="cell in row" :key="cell.index">
        <!-- Add button (last cell) -->
        <div v-if="cell.isAddButton" class="cal-body-col" @click="onAddClick">
          <div class="h-full p-[7px]">
            <div
              class="ripple cal-item text-white text-base"
              :class="[isSelectedActive ? 'bg-primary shadow-[0_2px_8px_rgba(33,150,243,0.3)]' : 'bg-[#CBD5E1]']"
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
import { useCalendar } from '../composables/useCalendar.js'
import { useAddMode } from '../composables/useAddMode.js'
import CalendarCell from './CalendarCell.vue'

const { cells, selectedDate, isSelectedActive, selectDate } = useCalendar()
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
  await enterAddMode()
}
</script>
