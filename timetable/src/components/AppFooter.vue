<template>
  <div class="py-6 text-center text-[11px] text-text-muted">
    이 사이트가 마음에 들지 않는 분은 <a class="animate-rainbow cursor-pointer font-medium" @click="openModal('recruit')">여기</a>를 누르세요
  </div>
</template>

<script setup>
import { useModal } from '../composables/useModal.js'

const { openModal } = useModal()
</script>
