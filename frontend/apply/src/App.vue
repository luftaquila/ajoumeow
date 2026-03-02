<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div v-if="loading" class="text-center">
      <div class="i-lucide-loader-circle text-4xl text-primary animate-spin mx-auto mb-4"></div>
      <p class="text-text-secondary">불러오는 중...</p>
    </div>

    <ClosedView v-else-if="!isOpen" />

    <TypeSelector
      v-else-if="state === 'select'"
      @select="onTypeSelect"
    />

    <NewMemberForm
      v-else-if="state === 'new-form'"
      :semester="semester"
      @success="state = 'success'"
      @back="state = 'select'"
    />

    <ExistingMemberForm
      v-else-if="state === 'existing-form'"
      :semester="semester"
      @success="state = 'success'"
      @back="state = 'select'"
    />

    <SuccessView v-else-if="state === 'success'" />
  </div>

  <Toast position="bottom-right" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Toast from 'primevue/toast'
import { useTheme } from '../../shared/composables/useTheme.js'
import { useRegistrationGuard } from './composables/useRegistrationGuard.js'
import { useCollegeDepartment } from './composables/useCollegeDepartment.js'

import TypeSelector from './components/TypeSelector.vue'
import NewMemberForm from './components/NewMemberForm.vue'
import ExistingMemberForm from './components/ExistingMemberForm.vue'
import SuccessView from './components/SuccessView.vue'
import ClosedView from './components/ClosedView.vue'

const { initTheme } = useTheme()
const { isOpen, semester, loading, checkOpen } = useRegistrationGuard('apply')
const { loadColleges } = useCollegeDepartment()

const state = ref('select')

function onTypeSelect(type) {
  state.value = type === 'new' ? 'new-form' : 'existing-form'
}

onMounted(async () => {
  initTheme()
  await Promise.all([checkOpen(), loadColleges()])
})
</script>
