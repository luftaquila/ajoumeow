$(function () {
  $.when(
    $.ajax("/ajoumeow/api/settings/currentSemister"),
    $.ajax("/ajoumeow/api/settings/isRegister"),
    $.ajax("/ajoumeow/api/settings/isRegisterRestricted"),
    $.ajax("/ajoumeow/api/settings/registerTerm")
  ).done((currentSemister, isRegister, isRegisterRestricted, registerTerm) => {
    let flag = false;
    
    if(isRegister[0].data == 'TRUE') {
      if(isRegisterRestricted[0].data == 'FALSE') flag = true;
      else {
        let term = registerTerm[0].data.split('~');
        if((new Date() > new Date(term[0]) && new Date() < new Date(new Date(term[1]).getTime() + 60 * 60 * 24 * 1000))) flag = true;
        else flag = false;
      }
    }
    else flag = false;
    
    if(flag) {
      $('#semister').text(currentSemister[0].data);
      $('.loading').css('display', 'none');
      $('.container-contact100').css('display', 'block');
      
      $.ajax('/ajoumeow/Resources/collegeList.json').done(collegeDict => {
        let collegeList = '', departmentList = '';
        for (let college in collegeDict) collegeList += `<option value="${college}">${college}</option>`;
        
        $('#college').html(collegeList).on('change', function() {
          let departmentList = '';
          for (let i in collegeDict[$(this).val()]) departmentList += `<option value="${collegeDict[$(this).val()][i]}">${collegeDict[$(this).val()][i]}</option>`;
          $('#department').html(departmentList);
        }).trigger('change');
      });
    }
    else $('.loading').html('<br><br><br><h4>모집 기간이 아닙니다!<br>다음 모집 때 지원해 주세요 ㅠㅠ</h4><br><br><img src="images/failed.jpg" style="width:90%">'); 
  });
});

$('.validate-form').on('submit', function (event) {
  let input = $('.validate-input .input100').not('.not');
  event.preventDefault();
  var check = true;

  for (var i = 0; i < input.length; i++) {
    if (!validate(input[i])) {
      showValidate(input[i]);
      check = false;
    }
  }

  if(check) {
    const payload = {
      이름: $('#name').val(),
      단과대학: $('#college').val(),
      학과: $('#department').val(),
      학번: $('#number').val(),
      연락처: $('#tel').val(),
      학기: $('#semister').text(),
    }
    
    $.ajax({
      url: '/ajoumeow/api/users/register',
      type: 'POST',
      data: payload,
      success: res => { location.href = 'https://luftaquila.io/ajoumeow/register/success.html' },
      error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
    });
  }
});

$('.validate-form .input100').not('.not').each(function () {
  $(this).focus(function () { hideValidate(this); });
});

function validate(input) {
  if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
    if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null)
      return false;
  }
  else if ($(input).attr('type') == 'tel' && $(input).attr('name') == 'tel') {
    if ($(input).val().trim().match(/010-\d{4}-\d{4}/) == null)
      return false;
  }
  else if ($(input).attr('name') == 'number') {
    if ($(input).val().trim().match(/^\d{9}$/) == null)
      return false;
  }
  else if ($(input).attr('type') == 'checkbox') {
    if (!$(input).is(':checked'))
      return false;
  }
  else {
    if ($(input).val().trim() == '') {
      return false;
    }
  }
  return true;
}

function showValidate(input) {
  var thisAlert = $(input).parent();
  $(thisAlert).addClass('alert-validate');
}

function hideValidate(input) {
  var thisAlert = $(input).parent();
  $(thisAlert).removeClass('alert-validate');
}
  
$('#tel').keyup(function (event) {
  event = event || window.event;
  this.value = autoHypen(this.value.trim());

  function autoHypen(str) {
    str = str.replace(/[^0-9]/g, '');
    if (str.length < 4)  return str;
    else if (str.length < 8) return str.substr(0, 3) + '-' + str.substr(3);
    else return str.substr(0, 3) + '-' + str.substr(3, 4) + '-' + str.substr(7);
    return str;
  }
});