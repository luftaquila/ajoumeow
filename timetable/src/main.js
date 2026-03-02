import { createApp } from 'vue'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/style.css'
import App from './App.vue'

const app = createApp(App)

app.use(Toast, {
  position: 'bottom-right',
  timeout: 1500,
  closeOnClick: true,
  pauseOnFocusLoss: false,
  pauseOnHover: false,
  draggable: true,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: false,
  newestOnTop: false,
  maxToasts: 3,
})

app.mount('#app')
