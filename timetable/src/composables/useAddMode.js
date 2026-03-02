import { ref } from 'vue'

const addModeActive = ref(false)
const addModeMaxCount = ref(99)

export function useAddMode() {
  function enterAddMode(maxCount) {
    addModeMaxCount.value = maxCount || 99
    addModeActive.value = true
  }

  function exitAddMode() {
    addModeActive.value = false
    addModeMaxCount.value = 99
  }

  return {
    addModeActive,
    addModeMaxCount,
    enterAddMode,
    exitAddMode,
  }
}
