import { ref } from 'vue'
import { useToast } from 'vue-toastification'
import * as api from '../api/index.js'
import { formatDate, getDateFromCalendarStart } from '../utils/dateFormat.js'
import { generateDotSvg } from '../utils/svgGenerator.js'
import { useCalendar } from './useCalendar.js'
import { useAuth } from './useAuth.js'

const recArr = ref([])
const transmitFlag = ref(false)
const toast = useToast()

export function useRecords() {
  const { cells, selectedDate } = useCalendar()
  const { user } = useAuth()

  async function load() {
    try {
      const record = await api.getRecords(getDateFromCalendarStart(0), getDateFromCalendarStart(35))
      const newRecArr = []

      for (const rec of record.data) {
        const recDate = formatDate(new Date(rec.date), 'yyyy-mm-dd')
        let target = newRecArr.find(o => o.date === recDate)
        if (!target) {
          target = { date: recDate, courses: [{ course: 1, ppl: [] }, { course: 2, ppl: [] }, { course: 3, ppl: [] }] }
          newRecArr.push(target)
        }
        const courseNum = Number(rec.course.replace(/\D/g, ''))
        const course = target.courses.find(o => o.course === courseNum)
        if (course) {
          course.ppl.push({ ID: rec.ID, name: rec.name, timestamp: rec.timestamp })
        }
      }

      recArr.value = newRecArr

      // Update cell data
      for (const cell of cells.value) {
        cell.content = null
        cell.svgBackground = 'none'
        cell.hasMy = false
      }

      for (const date of newRecArr) {
        const cell = cells.value.find(c => c.date === date.date)
        if (!cell) continue

        cell.content = date.courses
        cell.svgBackground = generateDotSvg(date.courses, 54)

        if (user.value) {
          for (const course of date.courses) {
            if (course.ppl.some(p => p.ID == user.value.ID)) {
              cell.hasMy = true
              break
            }
          }
        }
      }
    } catch (e) {
      toast.error(`${e.msg || '오류'}`, { dangerouslyHTMLString: true })
    }
  }

  function getCoursesForDate(date) {
    const entry = recArr.value.find(o => o.date === date)
    return entry ? entry.courses : []
  }

  async function addRecord(target) {
    if (!user.value) return toast.error('로그인을 해 주세요!')
    if (transmitFlag.value) return toast.error('요청이 진행 중입니다.')

    transmitFlag.value = true
    try {
      await api.createRecord({
        date: target.date,
        course: target.course + '코스',
        ID: Number(user.value.ID),
        name: user.value.name,
      })
      await load()
    } catch (e) {
      toast.error(`${e.msg || '오류'}<br>${e.data || ''}`, { dangerouslyHTMLString: true })
    } finally {
      transmitFlag.value = false
    }
  }

  async function deleteRecord(target) {
    if (!user.value) return toast.error('로그인을 해 주세요!')
    if (transmitFlag.value) return toast.error('요청이 진행 중입니다.')

    transmitFlag.value = true
    try {
      await api.deleteRecord({
        date: target.date,
        course: target.course,
        ID: target.id,
        name: target.name,
      })
      await load()
    } catch (e) {
      toast.error(`${e.msg || '오류'}<br>${e.data || ''}`, { dangerouslyHTMLString: true })
    } finally {
      transmitFlag.value = false
    }
  }

  return {
    recArr,
    transmitFlag,
    load,
    getCoursesForDate,
    addRecord,
    deleteRecord,
  }
}
