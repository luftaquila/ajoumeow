import { ref, computed } from 'vue'
import Cookies from 'js-cookie'
import * as api from '../api/index.js'
import { formatDate } from '../utils/dateFormat.js'

const user = ref(null)
const statistics = ref([])
let _toast = null

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

export function useAuth(toast) {
  if (toast) _toast = toast

  function getJwt() {
    return Cookies.get('jwt')
  }

  async function doLogin(id) {
    try {
      const res = await api.login(id)
      Cookies.set('jwt', res.msg, { expires: 365 })
      loginProcess(res)
    } catch (e) {
      _toast?.add({ severity: 'error', summary: e.msg || '오류', detail: e.data || '', life: 1500 })
    }
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
    Cookies.set('currentSemister', res.data.semister, { expires: 365 })
  }

  function logout() {
    Cookies.remove('jwt')
    user.value = null
    statistics.value = []
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
    doLogin,
    doAutoLogin,
    loginProcess,
    logout,
  }
}
