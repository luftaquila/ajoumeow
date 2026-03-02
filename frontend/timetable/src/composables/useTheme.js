import { ref } from 'vue'
import Cookies from 'js-cookie'

const isDark = ref(false)

export function useTheme() {
  function initTheme() {
    const saved = Cookies.get('theme')
    if (saved === 'dark') {
      setDark(true)
    } else if (saved === 'light') {
      setDark(false)
    } else {
      setDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }

  function toggleTheme() {
    setDark(!isDark.value)
    Cookies.set('theme', isDark.value ? 'dark' : 'light', { expires: 365 })
  }

  function setDark(value) {
    isDark.value = value
    document.documentElement.classList.toggle('p-dark', value)
  }

  return { isDark, initTheme, toggleTheme }
}
