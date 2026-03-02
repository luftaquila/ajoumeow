import { ref } from 'vue'

const notice = ref(false)
const help = ref(false)
const map = ref(false)
const recruit = ref(false)

const modals = { notice, help, map, recruit }

export function useModal() {
  function openModal(name) {
    if (modals[name]) modals[name].value = true
  }

  function closeModal(name) {
    if (modals[name]) modals[name].value = false
  }

  return {
    modals,
    openModal,
    closeModal,
  }
}
