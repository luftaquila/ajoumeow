import { reactive } from 'vue'

const activeModals = reactive({})

export function useModal() {
  function openModal(name) {
    activeModals[name] = true
  }

  function closeModal(name) {
    activeModals[name] = false
  }

  function isOpen(name) {
    return !!activeModals[name]
  }

  return {
    activeModals,
    openModal,
    closeModal,
    isOpen,
  }
}
