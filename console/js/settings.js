$(function() {
  $('#content').click();
  
  // current semister settings
  $.ajax({
    url: "/ajoumeow/api/settings/currentSemister",
    success: res => {
      $('#currentYear').val(res.data.split('-')[0]);
      $('#currentSemister').val(res.data.split('-')[1]);
    },
    error: err => settingLoadError(err)
  });
  
  // apply settings
  $.when(
    $.ajax("/ajoumeow/api/settings/isApply"),
    $.ajax("/ajoumeow/api/settings/isApplyRestricted"),
    $.ajax("/ajoumeow/api/settings/applyTerm")
  ).done((isApply, isApplyRestricted, applyTerm) => {
    if(isApply[0].data == 'TRUE') {
      $('#isApply').attr('checked', false);
      $('#isApplyRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
      if(isApplyRestricted[0].data == 'TRUE') {
        $('#isApplyRestricted').attr('checked', false);
        $('#isApplyRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
      }
      else {
        $('#isApplyRestricted').attr('checked', true);
        $('#isApplyRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
      }
    }
    else {
      $('#isApply').attr('checked', true);
      $('#isApplyRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);
    }
    document.getElementById('applyStartDate').valueAsDate = new Date(new Date(applyTerm[0].data.split('~')[0]) - (-1) * 9 * 3600 * 1000);
    document.getElementById('applyEndDate').valueAsDate = new Date(new Date(applyTerm[0].data.split('~')[1]) - (-1) * 9 * 3600 * 1000);
  }).fail(err => settingLoadError(err));
  
  // register settings
  $.when(
    $.ajax({
      url: "/ajoumeow/api/settings/isRegister",
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt'))
    }),
    $.ajax({
      url: "/ajoumeow/api/settings/isRegisterRestricted",
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt'))
    }),
    $.ajax({
      url: "/ajoumeow/api/settings/registerTerm",
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt'))
    })
  ).done((isRegister, isRegisterRestricted, registerTerm) => {
    if(isRegister[0].data == 'TRUE') {
      $('#isRegister').attr('checked', false);
      $('#isRegisterRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
      if(isRegisterRestricted[0].data == 'TRUE') {
        $('#isRegisterRestricted').attr('checked', false);
        $('#isRegisterRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
      }
      else {
        $('#isRegisterRestricted').attr('checked', true);
        $('#isRegisterRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
      }
    }
    else {
      $('#isRegister').attr('checked', true);
      $('#isRegisterRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);
    }
    document.getElementById('registerStartDate').valueAsDate = new Date(new Date(registerTerm[0].data.split('~')[0]) - (-1) * 9 * 3600 * 1000);
    document.getElementById('registerEndDate').valueAsDate = new Date(new Date(registerTerm[0].data.split('~')[1]) - (-1) * 9 * 3600 * 1000);
  }).fail(err => settingLoadError(err));
  
  // notice settings
  $.ajax({
    url: "/ajoumeow/api/settings/notice",
    cached: false,
    success: res => {
      $('#noticeVersion').text(res.data.split('$')[0]);
      $('#notice').val(res.data.split('$')[1].replace('<br>', '\n'))
    },
    error: err => settingLoadError(err)
  });
  
  // maxFeedingUserCount settings
  $.ajax({
    url: '/ajoumeow/api/settings/maxFeedingUserCount',
    cached: false,
    success: res => {
      $('#maxFeedingUserCount').val(res.data);
    },
    error: err => settingLoadError(err)
  });
});

$('.setting').change(function() {
  var obj = $(this).attr('class').split(' '), req = {};
  if (obj.includes('settingSemister')) { // 학기 설정
    req.param = 'currentSemister';
    req.data = $('#currentYear').val() + '-' + $('#currentSemister').val();
  }
  else if(obj.includes('settingApply')) { // 회원 등록 허용 여부
    req.param = 'isApply';
    req.data = !$('#isApply').is(':checked');
    req.data = req.data.toString().toUpperCase();

    if(!$('#isApply').is(':checked')) $('#isApplyRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isApplyRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);
    if(!$('#isApplyRestricted').is(':checked')) $('#isApplyRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isApplyRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
  }
  else if(obj.includes('settingApplyRestricted')) { // 회원등록 기간 제한 여부
    req.param = 'isApplyRestricted';
    req.data = !$('#isApplyRestricted').is(':checked');
    req.data = req.data.toString().toUpperCase();

    if(!$('#isApplyRestricted').is(':checked')) $('#isApplyRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isApplyRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
  }
  else if(obj.includes('settingApplyCalendar')) { // 회원등록 기간 설정
    req.param = 'applyTerm';
    req.data = $('#applyStartDate').val() + '~' + $('#applyEndDate').val();
  }
  else if(obj.includes('settingRegister')) { // 신입 모집 허용 여부
    req.param = 'isRegister';
    req.data = !$('#isRegister').is(':checked');
    req.data = req.data.toString().toUpperCase();

    if(!$('#isRegister').is(':checked')) $('#isRegisterRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isRegisterRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);      
    if(!$('#isRegisterRestricted').is(':checked')) $('#isRegisterRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isRegisterRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
  }
  else if(obj.includes('settingRegisterRestricted')) { // 신입 모집 기간 제한 여부
    req.param = 'isRegisterRestricted';
    req.data = !$('#isRegisterRestricted').is(':checked');
    req.data = req.data.toString().toUpperCase();

    if(!$('#isRegisterRestricted').is(':checked')) $('#isRegisterRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isRegisterRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
  }
  else if(obj.includes('settingRegisterCalendar')) { // 신입 모집 기간 설정
    req.param = 'registerTerm';
    req.data = $('#registerStartDate').val() + '~' + $('#registerEndDate').val();
  }
  else if(obj.includes('notice')) {
    $('#noticeVersion').text(Number($('#noticeVersion').text()) + 1);
    req.param = 'notice';
    req.data = `${$('#noticeVersion').text()}$${$('#notice').val()}`;
  }
  else if(obj.includes('maxFeedingUserCount')) {
    req.param = 'maxFeedingUserCount';
    req.data = $('#maxFeedingUserCount').val();
  }

  $.ajax({
    url: '/ajoumeow/api/settings/' + req.param,
    type: 'PUT',
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { data : req.data },
    success: res => alertify.success('설정을 변경했습니다.'),
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
});

function settingLoadError(err) {
  $('input, select, textarea').attr('disabled', true);
  alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`);
}

// current year formatting
$('#currentYear').keyup(function() {
  if(this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);
  if(Number(this.value) < 20) this.value = this.value.slice(0, 1);
});