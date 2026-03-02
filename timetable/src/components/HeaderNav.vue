<template>
  <header class="bg-white flex h-[45px] justify-between overflow-hidden relative">
    <div class="flex items-center ml-4 gap-3">
      <a href="/" class="no-underline text-black text-[1.7rem]"><i class="fas fa-home"></i></a>
      <span class="text-[1.7rem] cursor-pointer" @click="$emit('open-notice')">
        <i class="far fa-exclamation-circle"></i>
      </span>
      <span class="text-[1.7rem] cursor-pointer" @click="$emit('open-help')">
        <i class="far fa-question-circle"></i>
      </span>
    </div>
    <div class="flex items-center mr-4 gap-3">
      <a href="/gallery" class="no-underline text-black text-[1.7rem]"><i class="far fa-camera-retro"></i></a>
      <a href="/console/dashboard.html" class="no-underline text-black text-[1.7rem]"><i class="far fa-trophy-alt"></i></a>
      <span class="text-[1.7rem] cursor-pointer" @click="$emit('open-map')">
        <i class="fas fa-street-view"></i>
      </span>
      <span class="text-[1.7rem] cursor-pointer" @click="$emit('open-sidebar')">
        <i class="fas fa-bars"></i>
      </span>
    </div>
  </header>
</template>

<script setup>
defineEmits(['open-notice', 'open-help', 'open-map', 'open-sidebar'])
</script>
