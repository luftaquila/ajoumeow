import { ref, computed } from 'vue'
import Cookies from 'js-cookie'
import * as api from '../api/index.js'
import { formatDate } from '../utils/dateFormat.js'

const user = ref(null)
const statistics = ref([])

const isLoggedIn = computed(() => !!user.value)
const isAdmin = computed(() => user.value && user.value.role !== '회원')

const mileageTotal = computed(() => {
  return statistics.value.reduce((sum, obj) => sum + Number(obj.score), 0)
})

const mileageThis = computed(() => {
  const thisMonth = formatDate(new Date(), 'yyyy-mm')
  return statistics.value
    .filter(obj => formatDate(new Date(obj.date), 'yyyy-mm') === thisMonth)
    .reduce((sum, obj) => sum + Number(obj.score), 0)
})

const timeTotal = computed(() => {
  return statistics.value.filter(obj => obj.course.slice(-2) === '코스').length
})

const timeThis = computed(() => {
  const thisMonth = formatDate(new Date(), 'yyyy-mm')
  return statistics.value
    .filter(obj => formatDate(new Date(obj.date), 'yyyy-mm') === thisMonth && obj.course.slice(-2) === '코스')
    .length
})

export function useAuth() {
  function getJwt() {
    return Cookies.get('jwt')
  }

  async function doAutoLogin() {
    const jwt = Cookies.get('jwt')
    if (jwt) {
      try {
        const res = await api.autoLogin()
        loginProcess(res)
        return true
      } catch (e) {
        return false
      }
    }
    return false
  }

  function loginProcess(res) {
    user.value = res.data.user
    statistics.value = res.data.statistics || []
    Cookies.set('currentSemester', res.data.semester, { expires: 365 })
  }

  function logout() {
    Cookies.remove('jwt')
    user.value = null
    statistics.value = []
  }

  function doGoogleLogin(authData) {
    Cookies.set('jwt', authData.token, { expires: 365 })
    loginProcess({ data: authData })
  }

  return {
    user,
    statistics,
    isLoggedIn,
    isAdmin,
    mileageTotal,
    mileageThis,
    timeTotal,
    timeThis,
    getJwt,
    doAutoLogin,
    doGoogleLogin,
    loginProcess,
    logout,
  }
}
