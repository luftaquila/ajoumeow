import { ref } from 'vue'
import { get } from '../../../shared/api.js'

// Console-wide state shown in the top bar, sidebar badges and the home page.
const semester = ref('')
const apply = ref({ enabled: false, restricted: false, term: '', open: false })
const register = ref({ enabled: false, restricted: false, term: '', open: false })
const pendingApplications = ref(0)

// Same rule as the apply/register pages (useRegistrationGuard)
function isOpen(enabled, restricted, term) {
  if (!enabled) return false
  if (!restricted) return true
  if (!term || !term.includes('~')) return false
  const [startStr, endStr] = term.split('~')
  const now = new Date()
  return now >= new Date(startStr + 'T00:00:00') && now <= new Date(endStr + 'T23:59:59')
}

async function loadWindow(prefix, termKey) {
  const [enabled, restricted, term] = await Promise.all([
    get(`/settings/${prefix}`),
    get(`/settings/${prefix}Restricted`),
    get(`/settings/${termKey}`),
  ])
  const state = {
    enabled: enabled.data === 'TRUE',
    restricted: restricted.data === 'TRUE',
    term: term.data || '',
  }
  return { ...state, open: isOpen(state.enabled, state.restricted, state.term) }
}

async function refreshStatus() {
  const [sem, applyState, registerState, pending] = await Promise.allSettled([
    get('/settings/currentSemester'),
    loadWindow('isApply', 'applyTerm'),
    loadWindow('isRegister', 'registerTerm'),
    get('/applications', { status: 'pending' }),
  ])
  if (sem.status === 'fulfilled') semester.value = sem.value.data
  if (applyState.status === 'fulfilled') apply.value = applyState.value
  if (registerState.status === 'fulfilled') register.value = registerState.value
  if (pending.status === 'fulfilled') pendingApplications.value = pending.value.data.length
}

export function useStatus() {
  return { semester, apply, register, pendingApplications, refreshStatus }
}
