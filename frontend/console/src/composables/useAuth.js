import { ref, computed } from 'vue'
import Cookies from 'js-cookie'
import { post } from '../../../shared/api.js'

const user = ref(null)

const isLoggedIn = computed(() => !!user.value)
const isAdmin = computed(() => user.value && user.value.role !== '회원')

export function useAuth() {
  async function doAutoLogin() {
    const jwt = Cookies.get('jwt')
    if (!jwt) return false
    try {
      const res = await post('/auth/refresh')
      user.value = res.data.user
      Cookies.set('currentSemester', res.data.semester, { expires: 365 })
      return true
    } catch {
      return false
    }
  }

  function logout() {
    Cookies.remove('jwt')
    user.value = null
    window.location.href = '/timetable'
  }

  return { user, isLoggedIn, isAdmin, doAutoLogin, logout }
}
