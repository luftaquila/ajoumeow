<template>
  <div class="mb-6">
    <div class="flex items-center gap-3 mb-1">
      <span v-if="icon" :class="icon" class="text-xl text-primary"></span>
      <h1 class="text-xl font-bold">{{ title }}</h1>
    </div>
    <p class="text-text-muted text-sm">{{ description }}</p>
    <slot name="subtitle" />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
})
</script>
