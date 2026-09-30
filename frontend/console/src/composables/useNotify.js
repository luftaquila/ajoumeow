import { useToast } from 'primevue/usetoast'

// Success and warnings fade out; errors stay until closed so they aren't missed.
export function useNotify() {
  const toast = useToast()

  function success(summary, detail) {
    toast.add({ severity: 'success', summary, detail, life: 2500 })
  }

  function warn(summary, detail) {
    toast.add({ severity: 'warn', summary, detail, life: 5000 })
  }

  function error(e, fallback) {
    toast.add({ severity: 'error', summary: e?.error?.message || fallback })
  }

  return { success, warn, error }
}
