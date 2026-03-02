<template>
  <div v-if="authLoading" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="i-lucide-loader-circle text-4xl text-primary animate-spin mx-auto mb-4"></div>
      <p class="text-text-secondary">로그인 확인 중...</p>
    </div>
  </div>

  <AppLayout v-else>
    <router-view />
  </AppLayout>

  <Toast position="bottom-right" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Toast from 'primevue/toast'
import { useTheme } from '../../shared/composables/useTheme.js'
import { useAuth } from './composables/useAuth.js'
import AppLayout from './components/layout/AppLayout.vue'

const { initTheme } = useTheme()
const { doAutoLogin, isAdmin } = useAuth()

const authLoading = ref(true)

onMounted(async () => {
  initTheme()

  const loggedIn = await doAutoLogin()
  if (!loggedIn || !isAdmin.value) {
    window.location.href = '/timetable'
    return
  }

  authLoading.value = false
})
</script>
