<template>
  <div style="font-size: 0.8rem; text-align: center; min-width: 150px">
    <span style="font-size: 0.9rem; line-height: 1.1rem;" v-html="noticeHtml"></span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as apiClient from '../../api/index.js'

const noticeHtml = ref('')

onMounted(async () => {
  // Check if already loaded via App.vue
  if (window.__noticeContent) {
    noticeHtml.value = window.__noticeContent.replace(/\n/g, '<br>')
    return
  }
  try {
    const res = await apiClient.getSetting('notice')
    const notice = res.data.split('$')
    noticeHtml.value = notice[1].replace(/\n/g, '<br>')
    window.__noticeContent = notice[1]
  } catch (e) { /* ignore */ }
})
</script>
