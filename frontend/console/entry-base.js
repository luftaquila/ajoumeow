import $ from 'jquery'
window.$ = window.jQuery = $

import 'bootstrap/dist/js/bootstrap.bundle.min'
import 'jquery-easing'
import Cookies from 'js-cookie'
window.Cookies = Cookies

// alertify (legacy v0.x)
await import('../lib/alertify/alertify.min.js')

// Common CSS
import './scss/sb-admin-2.scss'
import './css/console.css'

// SB Admin 2 sidebar/topbar script
await import('./js/sb-admin-2.js')

// Auth (api, dateFormat, Date.prototype settings)
await import('./js/authManager.js')
