import { ref } from 'vue'
import { get } from '../../../shared/api.js'

export function useRegistrationGuard(type = 'apply') {
  const isOpen = ref(false)
  const semester = ref('')
  const loading = ref(true)

  const settingPrefix = type === 'register' ? 'isRegister' : 'isApply'
  const restrictedKey = type === 'register' ? 'isRegisterRestricted' : 'isApplyRestricted'
  const termKey = type === 'register' ? 'registerTerm' : 'applyTerm'

  async function checkOpen() {
    try {
      const [semRes, enabledRes, restrictedRes, termRes] = await Promise.all([
        get('/settings/currentSemester'),
        get(`/settings/${settingPrefix}`),
        get(`/settings/${restrictedKey}`),
        get(`/settings/${termKey}`),
      ])

      semester.value = semRes.data
      const enabled = enabledRes.data === 'TRUE'
      const restricted = restrictedRes.data === 'TRUE'
      const term = termRes.data

      if (!enabled) {
        isOpen.value = false
      } else if (!restricted) {
        isOpen.value = true
      } else {
        const [startStr, endStr] = term.split('~')
        const now = new Date()
        const start = new Date(startStr + 'T00:00:00')
        const end = new Date(endStr + 'T23:59:59')
        isOpen.value = now >= start && now <= end
      }
    } catch {
      isOpen.value = false
    } finally {
      loading.value = false
    }
  }

  return { isOpen, semester, loading, checkOpen }
}
