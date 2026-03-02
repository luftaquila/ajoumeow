<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Desktop sidebar -->
    <aside class="hidden lg:flex w-64 flex-shrink-0 flex-col bg-surface border-r border-surface-border">
      <AppSidebar />
    </aside>

    <!-- Mobile drawer -->
    <Drawer v-model:visible="drawerVisible" class="w-72!">
      <template #header>
        <div class="flex items-center gap-3">
          <img :src="'/res/image/logo-blue-square-without-desc.png'" class="w-8 h-8 rounded-lg" alt="logo">
          <span class="font-bold text-text">미유미유 콘솔</span>
        </div>
      </template>
      <AppSidebar @navigate="drawerVisible = false" />
    </Drawer>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppTopbar @toggle-sidebar="drawerVisible = true" />
      <main class="flex-1 overflow-y-auto p-4 md:p-6 pb-16 md:pb-20">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Drawer from 'primevue/drawer'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'

const drawerVisible = ref(false)
</script>
