<template>
  <header class="bg-surface flex h-[52px] items-center justify-between px-5 border-b border-surface-border">
    <div class="flex items-center gap-4">
      <a href="/" class="no-underline text-text-secondary text-xl hover:text-text transition-colors duration-200"><i class="fas fa-home"></i></a>
      <span class="text-xl text-text-secondary cursor-pointer hover:text-text transition-colors duration-200" @click="$emit('open-notice')">
        <i class="far fa-exclamation-circle"></i>
      </span>
      <span class="text-xl text-text-secondary cursor-pointer hover:text-text transition-colors duration-200" @click="$emit('open-help')">
        <i class="far fa-question-circle"></i>
      </span>
    </div>
    <div class="flex items-center gap-4">
      <a href="/gallery" class="no-underline text-text-secondary text-xl hover:text-text transition-colors duration-200"><i class="far fa-camera-retro"></i></a>
      <a href="/console/dashboard.html" class="no-underline text-text-secondary text-xl hover:text-text transition-colors duration-200"><i class="far fa-trophy-alt"></i></a>
      <span class="text-xl text-text-secondary cursor-pointer hover:text-text transition-colors duration-200" @click="$emit('open-map')">
        <i class="fas fa-street-view"></i>
      </span>
      <span class="text-xl text-text-secondary cursor-pointer hover:text-text transition-colors duration-200" @click="$emit('open-sidebar')">
        <i class="fas fa-bars"></i>
      </span>
    </div>
  </header>
</template>

<script setup>
defineEmits(['open-notice', 'open-help', 'open-map', 'open-sidebar'])
</script>
