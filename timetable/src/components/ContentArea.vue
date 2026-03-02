<template>
  <div v-if="selectedDate" class="card-section">
    <div class="flex items-center gap-2 mb-4">
      <h4 class="text-base font-bold text-text m-0">{{ dateLabel }}</h4>
      <WeatherInfo
        v-if="weather"
        :current="selectedCell?.isToday ? weather.current : null"
        :forecast="!selectedCell?.isToday ? getWeatherForDate(selectedDate) : null"
      />
    </div>
    <!-- No records -->
    <div v-if="displayCourses.length === 0" class="py-10 flex flex-col items-center justify-center gap-4">
      <div class="w-18 h-18 rounded-2xl bg-surface-dim flex items-center justify-center">
        <i class="i-lucide-cat text-3xl text-text-muted"></i>
      </div>
      <div class="text-text-muted text-sm">급식 신청자가 없습니다!</div>
    </div>
    <!-- Has records -->
    <div v-else class="flex flex-col gap-3">
      <div v-for="courseData in displayCourses" :key="courseData.course" class="flex items-center gap-3">
        <span
          class="shrink-0 inline-flex items-center justify-center w-14 h-8 rounded-xl text-xs font-bold tracking-wide"
          :class="[`bg-course${courseData.course}-bg`, `text-course${courseData.course}-text`, `border border-course${courseData.course}/20`]"
        >
          {{ COURSES[courseData.course].label }}
        </span>
        <div class="flex flex-wrap items-center gap-1.5">
          <NameCard
            v-for="(ppl, pi) in courseData.ppl"
            :key="pi"
            :name="ppl.name"
            :id="ppl.ID"
            :course="courseData.course"
            :can-delete="canDelete(ppl.ID)"
            @delete="onDelete(courseData.course, ppl)"
          />
          <span
            v-if="addModeActive && isSelectedActive && courseData.ppl.length < addModeMaxCount"
            @click="$emit('add-record', courseData.course)"
          >
            <span class="ripple inline-flex items-center justify-center w-14 h-8 rounded-xl border-2 border-dashed border-surface-border text-text-muted text-sm cursor-pointer hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors duration-200">+</span>
          </span>
        </div>
      </div>
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
import { COURSES } from '../constants.js'
import NameCard from './NameCard.vue'
import WeatherInfo from './WeatherInfo.vue'

const emit = defineEmits(['add-record', 'delete-record'])

const { selectedDate, selectedCell, isSelectedActive } = useCalendar()
const { user, isAdmin } = useAuth()
const { weather, getWeatherForDate } = useWeather()
const { addModeActive, addModeMaxCount } = useAddMode()

const content = computed(() => selectedCell.value?.content || null)
const hasContent = computed(() => {
  if (!content.value) return false
  return content.value.some(c => c.ppl.length > 0)
})

const displayCourses = computed(() => {
  if (hasContent.value) return content.value
  if (addModeActive.value && isSelectedActive.value) {
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
