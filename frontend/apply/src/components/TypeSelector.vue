<template>
  <div class="w-full max-w-md mx-auto text-center">
    <div class="card-section py-12">
      <p class="text-lg text-text-secondary mb-8">빨간 회원 드릴까요... 파란 회원 드릴까요?</p>
      <div class="flex items-center justify-center gap-4">
        <Button
          label="신입 회원"
          severity="danger"
          class="px-8! py-3!"
          @click="$emit('select', 'new')"
        />
        <Button
          label="기존 회원"
          severity="info"
          class="px-8! py-3!"
          @click="$emit('select', 'existing')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'

defineEmits(['select'])
</script>
