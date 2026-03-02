<template>
  <div v-if="selectedDate" class="-mt-5 bg-white">
    <div class="-mb-2.5">
      <h4 class="inline-block align-middle h-[1.8rem] leading-[1.8rem] my-3 ml-4">
        {{ dateLabel }}
        <WeatherInfo
          v-if="weather"
          :current="selectedCell?.isToday ? weather.current : null"
          :forecast="!selectedCell?.isToday ? getWeatherForDate(selectedDate) : null"
        />
      </h4>
    </div>
    <div class="px-4 pb-4">
      <!-- No records -->
      <div v-if="!hasContent" class="h-[9.5rem]">
        <div class="text-center"><br><i class="fas fa-calendar-check text-[2rem] text-[#aaa]"></i></div>
        <div class="text-center text-[#bbb] my-4">급식 신청자가 없습니다!</div>
      </div>
      <!-- Has records -->
      <table v-else>
        <tr v-for="courseData in displayCourses" :key="courseData.course" class="h-12">
          <td class="pr-2"><b>{{ courseData.course }}코스</b></td>
          <td>
            <NameCard
              v-for="(ppl, pi) in courseData.ppl"
              :key="pi"
              :name="ppl.name"
              :id="ppl.ID"
              :course="courseData.course"
              :bg-color="bgColor[courseData.course]"
              :can-delete="canDelete(ppl.ID)"
              @delete="onDelete(courseData.course, ppl)"
            />
            <span
              v-if="addModeActive && courseData.ppl.length < addModeMaxCount"
              class="mx-1"
              @click="$emit('add-record', courseData.course)"
            >
              <span class="ripple inline-block w-16 h-8 leading-6 text-center rounded border border-dashed border-gray text-gray p-0.5">+</span>
            </span>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCalendar } from '../composables/useCalendar.js'
import { useAuth } from '../composables/useAuth.js'
import { useWeather } from '../composables/useWeather.js'
import { useAddMode } from '../composables/useAddMode.js'
import { formatDate } from '../utils/dateFormat.js'
import NameCard from './NameCard.vue'
import WeatherInfo from './WeatherInfo.vue'

const emit = defineEmits(['add-record', 'delete-record'])

const { selectedDate, selectedCell, isSelectedActive } = useCalendar()
const { user, isAdmin } = useAuth()
const { weather, getWeatherForDate } = useWeather()
const { addModeActive, addModeMaxCount } = useAddMode()

const bgColor = { 1: 'lightcoral', 2: 'gold', 3: 'forestgreen' }

const content = computed(() => selectedCell.value?.content || null)
const hasContent = computed(() => {
  if (!content.value) return false
  return content.value.some(c => c.ppl.length > 0)
})

const displayCourses = computed(() => {
  if (hasContent.value) return content.value
  if (addModeActive.value) {
    return [
      { course: 1, ppl: [] },
      { course: 2, ppl: [] },
      { course: 3, ppl: [] },
    ]
  }
  return []
})

const dateLabel = computed(() => {
  if (!selectedDate.value) return ''
  return formatDate(new Date(selectedDate.value), 'm월 d일 ddd요일')
})

function canDelete(pplId) {
  if (!user.value) return false
  if (isAdmin.value) return true
  if (isSelectedActive.value && user.value.ID == pplId) return true
  return false
}

function onDelete(course, ppl) {
  emit('delete-record', {
    date: selectedDate.value,
    course: course + '코스',
    id: ppl.ID,
    name: ppl.name,
  })
}
</script>
