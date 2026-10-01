import { useToast } from 'primevue/usetoast'

// Errors stay until closed so they aren't missed.
export function useNotify() {
  const toast = useToast()

  function success(summary, detail) {
    toast.add({ severity: 'success', summary, detail, life: 2000 })
  }

  function warn(summary, detail) {
    toast.add({ severity: 'warn', summary, detail, life: 3000 })
  }

  function error(e, fallback) {
    const message = e?.error?.message
    toast.add({ severity: 'error', summary: message && message !== 'Network error' ? message : fallback })
  }

  return { success, warn, error }
}
