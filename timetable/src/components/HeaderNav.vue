<template>
  <header class="relative">
    <div class="h-1 bg-gradient-to-r from-primary via-primary-light to-[#A78BFA]"></div>
    <div class="bg-surface/80 backdrop-blur-sm flex h-[48px] items-center justify-between px-5 border-b border-surface-border/60">
      <div class="flex items-center gap-4">
        <a href="/" class="no-underline flex items-center"><img :src="'/res/image/headline_blue.png'" class="h-5 opacity-80" /></a>
        <span class="text-lg text-text-muted cursor-pointer hover:text-primary transition-colors duration-200" @click="$emit('open-notice')">
          <i class="far fa-exclamation-circle"></i>
        </span>
        <span class="text-lg text-text-muted cursor-pointer hover:text-primary transition-colors duration-200" @click="$emit('open-help')">
          <i class="far fa-question-circle"></i>
        </span>
      </div>
      <div class="flex items-center gap-4">
        <a href="/gallery" class="no-underline text-text-muted text-lg hover:text-primary transition-colors duration-200"><i class="far fa-camera-retro"></i></a>
        <a href="/console/dashboard.html" class="no-underline text-text-muted text-lg hover:text-primary transition-colors duration-200"><i class="far fa-trophy-alt"></i></a>
        <span class="text-lg text-text-muted cursor-pointer hover:text-primary transition-colors duration-200" @click="$emit('open-map')">
          <i class="far fa-street-view"></i>
        </span>
        <span class="text-lg text-text-muted cursor-pointer hover:text-primary transition-colors duration-200" @click="$emit('open-sidebar')">
          <i class="far fa-bars"></i>
        </span>
      </div>
    </div>
  </header>
</template>

<script setup>
defineEmits(['open-notice', 'open-help', 'open-map', 'open-sidebar'])
</script>
