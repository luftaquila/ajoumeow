<template>
  <header class="flex items-center gap-2 h-14 px-4 bg-surface border-b border-surface-border flex-shrink-0">
    <button
      class="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text hover:bg-surface-dim transition-colors cursor-pointer"
      @click="$emit('toggle-sidebar')"
      title="메뉴"
    >
      <span class="i-lucide-menu text-xl"></span>
    </button>

    <div class="flex-1"></div>

    <!-- Most console actions act on the current semester, so keep it in view -->
    <router-link
      v-if="semester"
      to="/console/settings"
      class="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-dim text-text-secondary hover:text-text"
      title="현재 학기 (설정에서 전환)"
    >{{ semester }}학기</router-link>
    <span v-if="apply.open" class="status-pill" title="가입 신청을 받는 중">
      <span class="dot"></span>가입 신청
    </span>
    <span v-if="register.open" class="status-pill" title="신입 모집 설문을 받는 중">
      <span class="dot"></span>신입 모집
    </span>

    <button
      class="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text hover:bg-surface-dim transition-colors cursor-pointer"
      @click="toggleTheme"
      :title="isDark ? '라이트 모드' : '다크 모드'"
    >
      <span :class="isDark ? 'i-lucide-sun' : 'i-lucide-moon'" class="text-xl"></span>
    </button>
  </header>
</template>

<script setup>
import { useTheme } from '../../../../shared/composables/useTheme.js'
import { useStatus } from '../../composables/useStatus.js'

defineEmits(['toggle-sidebar'])

const { isDark, toggleTheme } = useTheme()
const { semester, apply, register } = useStatus()
</script>

<style scoped>
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  color: #15803d;
  background: rgba(34, 197, 94, 0.12);
}
.p-dark .status-pill {
  color: #86efac;
}
.dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background: #22c55e;
}
</style>
