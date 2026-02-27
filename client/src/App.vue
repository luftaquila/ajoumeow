<script setup lang="ts">
import { onMounted } from 'vue';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

onMounted(() => {
  auth.autologin();
});
</script>

<template>
  <DefaultLayout />
</template>
