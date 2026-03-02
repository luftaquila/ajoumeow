import { ref } from 'vue'
import * as apiClient from '../api/index.js'

const noticeContent = ref(null)
const noticeVersion = ref(null)

export function useNotice() {
  async function loadNotice() {
    try {
      const res = await apiClient.getSetting('notice')
      const parts = res.data.split('$')
      noticeVersion.value = parts[0]
      noticeContent.value = parts[1]
    } catch (e) { /* ignore */ }
  }

  return {
    noticeContent,
    noticeVersion,
    loadNotice,
  }
}
