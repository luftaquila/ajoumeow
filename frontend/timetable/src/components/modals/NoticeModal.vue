<template>
  <div class="text-sm text-center min-w-[150px]">
    <span class="text-[0.9rem] leading-[1.1rem]" v-html="noticeHtml"></span>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useNotice } from '../../composables/useNotice.js'

const { noticeContent, loadNotice } = useNotice()

const noticeHtml = computed(() => {
  if (!noticeContent.value) return ''
  return noticeContent.value.replace(/\n/g, '<br>')
})

onMounted(async () => {
  if (!noticeContent.value) await loadNotice()
})
</script>
