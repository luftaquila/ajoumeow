import $ from 'jquery'
window.$ = window.jQuery = $

import 'popper.js'
import 'bootstrap'
import 'owl.carousel'
import 'imagesloaded'
import Cookies from 'js-cookie'
window.Cookies = Cookies

// CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'owl.carousel/dist/assets/owl.carousel.min.css'
import 'owl.carousel/dist/assets/owl.theme.default.min.css'
import './css/open-iconic-bootstrap.min.css'
import './css/icomoon.css'
import './css/animate.css'
import './css/magic-check.css'
import './scss/style.scss'
import './css/fjGallery.css'

// Local libs
await import('./js/fjGallery.js')
await import('./js/main.js')
