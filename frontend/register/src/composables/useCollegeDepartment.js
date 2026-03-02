import { ref, computed } from 'vue'

const collegeMap = ref({})
const loaded = ref(false)

export function useCollegeDepartment() {
  async function loadColleges() {
    if (loaded.value) return
    const res = await fetch('/api/data/college')
    collegeMap.value = await res.json()
    loaded.value = true
  }

  const collegeOptions = computed(() =>
    Object.keys(collegeMap.value).map(name => ({ label: name, value: name }))
  )

  function getDepartments(college) {
    if (!college || !collegeMap.value[college]) return []
    return collegeMap.value[college].map(name => ({ label: name, value: name }))
  }

  return { loadColleges, collegeOptions, getDepartments }
}
