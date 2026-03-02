import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import SlateAura from '../../shared/theme.js'
import ToastService from 'primevue/toastservice'
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
})
app.use(ToastService)

app.mount('#app')
