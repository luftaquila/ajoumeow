<template>
  <div v-if="authState === 'loading'" class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <div class="i-lucide-loader-circle text-4xl text-primary animate-spin mx-auto mb-4"></div>
      <p class="text-text-secondary">로그인 확인 중...</p>
    </div>
  </div>

  <div v-else-if="authState === 'denied'" class="min-h-screen flex items-center justify-center p-6">
    <div class="card-section text-center max-w-sm">
      <div class="i-lucide-lock text-3xl text-text-muted mx-auto mb-3"></div>
      <p class="font-semibold mb-1">{{ isLoggedIn ? '관리자 계정이 아닙니다' : '로그인이 필요합니다' }}</p>
      <p class="text-sm text-text-muted mb-5">
        {{ isLoggedIn ? '임원진 직책이 있는 계정만 콘솔을 쓸 수 있습니다.' : '급식표에서 로그인한 뒤 다시 들어와 주세요.' }}
      </p>
      <a href="/timetable" class="btn-blue">급식표로 이동</a>
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
import { useStatus } from './composables/useStatus.js'
import AppLayout from './components/layout/AppLayout.vue'

const { initTheme } = useTheme()
const { doAutoLogin, isAdmin, isLoggedIn } = useAuth()
const { refreshStatus } = useStatus()

const authState = ref('loading')

onMounted(async () => {
  initTheme()

  const loggedIn = await doAutoLogin()
  if (!loggedIn || !isAdmin.value) {
    authState.value = 'denied'
    return
  }

  authState.value = 'ok'
  refreshStatus()
})
</script>
