<template>
  <header>
    <span class="header__btn header__btn--left" style="font-size: 1.7rem; left: 0rem;">
      <a href="/" style="text-decoration: none; color: black;"><i class="fas fa-home"></i></a>
    </span>
    <span class="header__btn header__btn--left" style="font-size: 1.7rem; left: 2.7rem;" @click="$emit('open-notice')">
      <i class="far fa-exclamation-circle"></i>
    </span>
    <span class="header__btn header__btn--left" style="font-size: 1.7rem; left: 5.1rem;" @click="$emit('open-help')">
      <i class="far fa-question-circle"></i>
    </span>
    <span class="header__btn header__btn--right" style="font-size: 1.7rem; right: 7.8rem;">
      <a href="/gallery" style="text-decoration: none; color: black;"><i class="far fa-camera-retro"></i></a>
    </span>
    <span class="header__btn header__btn--right" style="font-size: 1.7rem; right: 5.0rem;">
      <a href="/console/dashboard.html" style="text-decoration: none; color: black;"><i class="far fa-trophy-alt"></i></a>
    </span>
    <span class="header__btn header__btn--right" style="font-size: 1.7rem; right: 2.5rem;" @click="$emit('open-map')">
      <i class="fas fa-street-view"></i>
    </span>
    <span class="header__btn header__btn--right" style="font-size: 1.7rem; right: 0rem;" @click="$emit('open-sidebar')">
      <i class="fas fa-bars"></i>
    </span>
  </header>
</template>

<script setup>
defineEmits(['open-notice', 'open-help', 'open-map', 'open-sidebar'])
</script>
