import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuth } from './useAuth.js'
import * as apiClient from '../api/index.js'
import { DEFAULT_MAX_FEEDING_COUNT } from '../constants.js'

const addModeActive = ref(false)
const addModeMaxCount = ref(DEFAULT_MAX_FEEDING_COUNT)
let cachedMaxCount = null

export function useAddMode() {
  const toast = useToast()
  const { user } = useAuth()

  async function enterAddMode() {
    if (!user.value) {
      toast.add({ severity: 'error', summary: '로그인을 해 주세요!', life: 1500 })
      return
    }

    if (cachedMaxCount === null) {
      try {
        const res = await apiClient.getSetting('maxFeedingUserCount')
        cachedMaxCount = Number(res.data)
      } catch (_) {
        cachedMaxCount = DEFAULT_MAX_FEEDING_COUNT
      }
    }

    addModeMaxCount.value = cachedMaxCount
    addModeActive.value = true
  }

  function exitAddMode() {
    addModeActive.value = false
    addModeMaxCount.value = DEFAULT_MAX_FEEDING_COUNT
  }

  return {
    addModeActive,
    addModeMaxCount,
    enterAddMode,
    exitAddMode,
  }
}
