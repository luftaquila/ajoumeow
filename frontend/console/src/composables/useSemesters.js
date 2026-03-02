import { ref } from 'vue'
import { get } from '../../../shared/api.js'

const semesters = ref([])
const currentSemester = ref('')

export function useSemesters() {
  async function loadSemesters() {
    const [semRes, curRes] = await Promise.all([
      get('/semesters'),
      get('/settings/currentSemester'),
    ])
    semesters.value = (semRes.data || []).sort((a, b) => b.localeCompare(a))
    currentSemester.value = curRes.data
  }

  return { semesters, currentSemester, loadSemesters }
}
