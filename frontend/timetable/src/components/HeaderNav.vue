<template>
  <header class="relative">
    <div class="h-1 bg-gradient-to-r from-primary via-primary-light to-[#A78BFA]"></div>
    <div class="bg-surface/80 backdrop-blur-sm flex h-[48px] items-center justify-between px-5 border-b border-surface-border/60">
      <div class="flex items-center gap-4">
        <a href="/" class="no-underline flex items-center"><img :src="'/res/image/headline_blue.png'" class="h-5" :class="{ 'brightness-0 invert': isDark }" /></a>
        <span class="text-lg text-text-muted cursor-pointer hover:text-primary transition-colors duration-200" @click="$emit('open-notice')">
          <i class="i-lucide-circle-alert"></i>
        </span>
        <span class="text-lg text-text-muted cursor-pointer hover:text-primary transition-colors duration-200" @click="$emit('open-help')">
          <i class="i-lucide-circle-help"></i>
        </span>
      </div>
      <div class="flex items-center gap-4">
        <a href="/gallery" class="no-underline text-text-muted text-lg hover:text-primary transition-colors duration-200"><i class="i-lucide-camera"></i></a>
        <a href="/dashboard" class="no-underline text-text-muted text-lg hover:text-primary transition-colors duration-200"><i class="i-lucide-trophy"></i></a>
        <span class="text-lg text-text-muted cursor-pointer hover:text-primary transition-colors duration-200" @click="$emit('open-map')">
          <i class="i-lucide-map-pin"></i>
        </span>
        <span class="text-lg text-text-muted cursor-pointer hover:text-primary transition-colors duration-200" @click="$emit('open-sidebar')">
          <i class="i-lucide-menu"></i>
        </span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useTheme } from '../composables/useTheme.js'

defineEmits(['open-notice', 'open-help', 'open-map', 'open-sidebar'])

const { isDark } = useTheme()
</script>
