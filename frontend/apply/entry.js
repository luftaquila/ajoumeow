import $ from 'jquery'
window.$ = window.jQuery = $

// Vendor CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'select2/dist/css/select2.min.css'
import 'animsition/dist/css/animsition.min.css'
import 'daterangepicker/daterangepicker.css'
import '../lib/alertify/alertify.core.css'
import '../lib/alertify/alertify.default.css'
import '../lib/btn.css'

// Vendor JS
import 'bootstrap'
import 'select2'
import 'animsition'
import moment from 'moment'
window.moment = moment
import 'daterangepicker'

// Local fonts CSS
import './fonts/font-awesome-4.7.0/css/font-awesome.min.css'
import './fonts/Linearicons-Free-v1.0.0/icon-font.min.css'

// Page CSS
import './css/util.css'
import './css/main.css'

// alertify (legacy v0.x)
await import('../lib/alertify/alertify.min.js')

// Select2 initialization
$(".js-select2").each(function(){
  $(this).select2({
    minimumResultsForSearch: 20,
    dropdownParent: $(this).next('.dropDownSelect2')
  });
})
$(".js-select2").each(function(){
  $(this).on('select2:open', function (e){
    $(this).parent().next().addClass('eff-focus-selection');
  });
});
$(".js-select2").each(function(){
  $(this).on('select2:close', function (e){
    $(this).parent().next().removeClass('eff-focus-selection');
  });
});

// Legacy JS
await import('./js/main.js')
