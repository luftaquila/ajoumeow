import { ref } from 'vue'
import * as api from '../api/index.js'

const authResult = ref(null)
const googleCredential = ref(null)
const clientId = ref(null)
const gisReady = ref(false)

function waitForGis() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve()
      return
    }
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval)
        resolve()
      }
    }, 100)
  })
}

export function useGoogleAuth() {
  async function init() {
    if (gisReady.value) return
    const [id] = await Promise.all([loadClientId(), waitForGis()])
    gisReady.value = true
    return id
  }

  async function loadClientId() {
    if (clientId.value) return clientId.value
    const res = await api.getSetting('googleClientId')
    clientId.value = res.data
    return clientId.value
  }

  function renderButton(element, callback) {
    if (!clientId.value || !window.google?.accounts?.id) return

    google.accounts.id.initialize({
      client_id: clientId.value,
      callback: async (response) => {
        googleCredential.value = response.credential
        try {
          const res = await api.googleLogin(response.credential)
          authResult.value = res.data
          if (callback) callback(res.data)
        } catch (e) {
          authResult.value = { status: 'error', error: e }
          if (callback) callback(authResult.value)
        }
      },
    })

    google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      width: 200,
      text: 'signin_with',
      locale: 'ko',
    })
  }

  return {
    authResult,
    googleCredential,
    clientId,
    gisReady,
    init,
    loadClientId,
    renderButton,
  }
}
