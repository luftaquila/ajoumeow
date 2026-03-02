import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import SlateAura from '../../shared/theme.js'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import './assets/style.css'
import 'virtual:uno.css'
import App from './App.vue'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: SlateAura,
    options: {
      darkModeSelector: '.p-dark',
    },
  },
  pt: {
    Dialog: {
      root: { class: 'rounded-2xl overflow-hidden shadow-elevated' },
      header: { class: 'px-6 pt-5 pb-4 bg-surface border-b border-surface-border/50' },
      title: { class: 'text-base font-bold text-text tracking-tight' },
      content: { class: 'px-6 py-6' },
    },
    Drawer: {
      root: { class: 'rounded-l-2xl shadow-elevated' },
    },
    Button: {
      root: { class: 'rounded-xl' },
    },
    InputText: {
      root: { class: 'rounded-xl' },
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')
