<template>
  <div v-if="selectedDate" id="contentArea" style="margin-top: -20px; background-color: #fff;">
    <div id="dateInfo" style="margin-bottom: -10px;">
      <h4 style="display: inline-block; vertical-align: middle; height: 1.8rem; line-height: 1.8rem; margin: 0.8rem 0 0.8rem 1rem" v-html="dateInfoHtml"></h4>
    </div>
    <div id="contents" style="padding: 0 1rem 1rem">
      <!-- No records -->
      <div v-if="!hasContent" style="height: 9.5rem">
        <div style="text-align: center"><br><i class="fas fa-calendar-check" style="font-size: 2rem; color: #aaa"></i></div>
        <div style="text-align: center; color: #bbb; margin: 1rem 0">급식 신청자가 없습니다!</div>
      </div>
      <!-- Has records -->
      <table v-else>
        <tr v-for="courseData in displayCourses" :key="courseData.course" style="height: 3rem">
          <td style="padding-right: .5rem;"><b>{{ courseData.course }}코스</b></td>
          <td class="courseContent" :data-course="courseData.course">
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
              class="addToCourse"
              style="margin: 0 0.3rem;"
              @click="$emit('add-record', courseData.course)"
            >
              <span class="ripple" style="display: inline-block; width: 4rem; height: 2rem; line-height: 1.5rem; text-align: center; border-radius: 3px; border: dashed 1px gray; color: gray; padding: 0.2rem;">+</span>
            </span>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useCalendar } from '../composables/useCalendar.js'
import { useAuth } from '../composables/useAuth.js'
import { useWeather } from '../composables/useWeather.js'
import { formatDate } from '../utils/dateFormat.js'
import NameCard from './NameCard.vue'

const emit = defineEmits(['add-record', 'delete-record'])

const { selectedDate, selectedCell, isSelectedActive } = useCalendar()
const { user, isAdmin } = useAuth()
const { weather, getWeatherForDate } = useWeather()

const bgColor = { 1: 'lightcoral', 2: 'gold', 3: 'forestgreen' }

const addModeActive = ref(false)
const addModeMaxCount = ref(99)

function onAddModeChanged() {
  const mode = window.__addMode
  if (mode?.active) {
    addModeActive.value = true
    addModeMaxCount.value = mode.maxCount || 99
  }
}

onMounted(() => window.addEventListener('addModeChanged', onAddModeChanged))
onUnmounted(() => window.removeEventListener('addModeChanged', onAddModeChanged))

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

const dateInfoHtml = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  let str = formatDate(d, 'm월 d일 ddd요일')

  if (!weather.value) return str

  if (selectedCell.value?.isToday) {
    const c = weather.value.current
    const pm10 = c.dust.pm10
    const pm25 = c.dust.pm25
    const pm10color = pm10 > 30 ? (pm10 > 80 ? (pm10 > 150 ? '#ff5959' : '#fd9b5a') : '#00c73c') : '#32a1ff'
    const pm25color = pm25 > 15 ? (pm25 > 35 ? (pm25 > 75 ? '#ff5959' : '#fd9b5a') : '#00c73c') : '#32a1ff'
    str += `&ensp;<span style="font-weight: normal">${c.temp}℃ ${c.weather}</span>&nbsp;<img src="/res/image/weather/icon${c.icon}.png" style="width: 1rem; height: 1rem;">&ensp;<div style="line-height: 0.9rem; vertical-align: middle; display: inline-block; font-weight: normal; font-size: 0.7rem">pm10 : <span style="color: ${pm10color}">${pm10}</span>㎍/㎥<br>pm2.5: <span style="color: ${pm25color}">${pm25}</span>㎍/㎥</div>`
  } else {
    const tgt = getWeatherForDate(selectedDate.value)
    if (tgt) {
      str += `&ensp;<span style="font-weight: normal">${tgt.temp}℃ ${tgt.weather}</span>&nbsp;<img src="/res/image/weather/icon${tgt.icon}.png" style="width: 1rem; height: 1rem;">`
    }
  }
  return str
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
