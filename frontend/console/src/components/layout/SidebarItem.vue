<template>
  <router-link
    :to="to"
    class="flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg text-sm transition-colors"
    :class="isActive
      ? 'bg-primary/10 text-primary font-medium'
      : 'text-text-secondary hover:bg-surface-dim hover:text-text'"
  >
    <span :class="icon" class="text-lg flex-shrink-0"></span>
    <span>{{ label }}</span>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  to: String,
  icon: String,
  label: String,
})

const route = useRoute()
const isActive = computed(() => route.path === props.to)
</script>
