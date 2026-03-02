<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
        <div class="modal__container" :class="{ 'modal__container--wide': wide }">
          <header class="modal__header">
            <h2 class="modal__title">{{ title }}</h2>
            <button class="modal__close" @click="$emit('close')">&times;</button>
          </header>
          <main class="modal__content">
            <slot />
          </main>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: Boolean,
  title: String,
  wide: Boolean,
})
defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal__container {
  z-index: 31;
  background: #fff;
  border-radius: 8px;
  max-width: 500px;
  max-height: 90vh;
  width: 90vw;
  padding: 20px;
  overflow-y: auto;
  font-family: 'Nanum Gothic', sans-serif;
}

.modal__container--wide {
  width: 96vw;
  padding: 15px;
}

.modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.modal__title {
  font-size: 1.2rem;
  margin: 0;
  font-family: 'Nanum Gothic', sans-serif;
}

.modal__close {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #666;
  line-height: 1;
}

.modal__content {
  margin: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .modal__container,
.modal-leave-active .modal__container {
  transition: transform 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal__container {
  transform: translateY(20px);
}
</style>
