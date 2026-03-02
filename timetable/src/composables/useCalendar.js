import { ref, computed } from 'vue'
import { formatDate, getDayNum, getDateFromCalendarStart } from '../utils/dateFormat.js'

const cells = ref([])
const selectedDate = ref(null)

export function useCalendar() {
  function initCalendar() {
    const today = new Date(formatDate(new Date(), 'yyyy-mm-dd'))
    const startDate = new Date(getDateFromCalendarStart(0))
    const indexOfToday = Math.round((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    const newCells = []
    for (let i = 0; i < 35; i++) {
      const thisDate = new Date(getDateFromCalendarStart(i))
      const dateStr = formatDate(thisDate, 'yyyy-mm-dd')
      const isToday = i === indexOfToday
      const isInactive = i < indexOfToday || i > indexOfToday + 21
      const isAddButton = i === 34

      let label
      if (i === 0 || thisDate.getDate() === 1) {
        label = formatDate(thisDate, 'm/d')
      } else {
        label = formatDate(thisDate, 'd')
      }

      newCells.push({
        index: i,
        date: dateStr,
        label,
        isToday,
        isActive: !isInactive && !isAddButton,
        isInactive: isInactive && !isAddButton,
        isAddButton,
        content: null,
        svgBackground: 'none',
        hasMy: false,
      })
    }
    cells.value = newCells

    // Select today by default
    const todayCell = newCells.find(c => c.isToday)
    if (todayCell) selectedDate.value = todayCell.date
  }

  function selectDate(date) {
    selectedDate.value = date
  }

  const selectedCell = computed(() => {
    return cells.value.find(c => c.date === selectedDate.value) || null
  })

  const isSelectedActive = computed(() => {
    const cell = selectedCell.value
    return cell && cell.isActive
  })

  const displayMonth = computed(() => {
    if (cells.value.length < 16) return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
    const midCell = cells.value[15]
    const date = new Date(midCell.date)
    return { year: date.getFullYear(), month: date.getMonth() + 1 }
  })

  return {
    cells,
    selectedDate,
    selectedCell,
    isSelectedActive,
    displayMonth,
    initCalendar,
    selectDate,
  }
}
