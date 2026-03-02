<template>
  <header class="flex items-center justify-between h-14 px-4 bg-surface border-b border-surface-border flex-shrink-0">
    <button
      class="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text hover:bg-surface-dim transition-colors cursor-pointer"
      @click="$emit('toggle-sidebar')"
    >
      <span class="i-lucide-menu text-xl"></span>
    </button>

    <div class="flex-1"></div>

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

defineEmits(['toggle-sidebar'])

const { isDark, toggleTheme } = useTheme()
</script>
