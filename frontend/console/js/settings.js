$(function() {
  $('#content').click();

  // current semester settings
  $.ajax({
    url: `${api}/settings/currentSemester`,
    success: res => {
      $('#currentYear').val(res.data.split('-')[0]);
      $('#currentSemester').val(res.data.split('-')[1]);
    },
    error: err => settingLoadError(err)
  });

  // apply settings
  $.when(
    $.ajax(`${api}/settings/isApply`),
    $.ajax(`${api}/settings/isApplyRestricted`),
    $.ajax(`${api}/settings/applyTerm`)
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
      url: `${api}/settings/isRegister`,
      beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt'))
    }),
    $.ajax({
      url: `${api}/settings/isRegisterRestricted`,
      beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt'))
    }),
    $.ajax({
      url: `${api}/settings/registerTerm`,
      beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt'))
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
    url: `${api}/settings/notice`,
    cached: false,
    success: res => {
      $('#noticeVersion').text(res.data.split('$')[0]);
      $('#notice').val(res.data.split('$')[1].replace('<br>', '\n'))
    },
    error: err => settingLoadError(err)
  });

  // maxFeedingUserCount settings
  $.ajax({
    url: `${api}/settings/maxFeedingUserCount`,
    cached: false,
    success: res => {
      $('#maxFeedingUserCount').val(res.data);
    },
    error: err => settingLoadError(err)
  });
});

$('.setting').change(function() {
  var obj = $(this).attr('class').split(' '), req = {};
  if (obj.includes('settingSemester')) { // 학기 설정
    req.param = 'currentSemester';
    req.value = $('#currentYear').val() + '-' + $('#currentSemester').val();
  }
  else if(obj.includes('settingApply')) { // 회원 등록 허용 여부
    req.param = 'isApply';
    req.value = !$('#isApply').is(':checked');
    req.value = req.value.toString().toUpperCase();

    if(!$('#isApply').is(':checked')) $('#isApplyRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isApplyRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);
    if(!$('#isApplyRestricted').is(':checked')) $('#isApplyRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isApplyRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
  }
  else if(obj.includes('settingApplyRestricted')) { // 회원등록 기간 제한 여부
    req.param = 'isApplyRestricted';
    req.value = !$('#isApplyRestricted').is(':checked');
    req.value = req.value.toString().toUpperCase();

    if(!$('#isApplyRestricted').is(':checked')) $('#isApplyRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isApplyRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
  }
  else if(obj.includes('settingApplyCalendar')) { // 회원등록 기간 설정
    req.param = 'applyTerm';
    req.value = $('#applyStartDate').val() + '~' + $('#applyEndDate').val();
  }
  else if(obj.includes('settingRegister')) { // 신입 모집 허용 여부
    req.param = 'isRegister';
    req.value = !$('#isRegister').is(':checked');
    req.value = req.value.toString().toUpperCase();

    if(!$('#isRegister').is(':checked')) $('#isRegisterRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isRegisterRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);
    if(!$('#isRegisterRestricted').is(':checked')) $('#isRegisterRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isRegisterRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
  }
  else if(obj.includes('settingRegisterRestricted')) { // 신입 모집 기간 제한 여부
    req.param = 'isRegisterRestricted';
    req.value = !$('#isRegisterRestricted').is(':checked');
    req.value = req.value.toString().toUpperCase();

    if(!$('#isRegisterRestricted').is(':checked')) $('#isRegisterRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
    else $('#isRegisterRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
  }
  else if(obj.includes('settingRegisterCalendar')) { // 신입 모집 기간 설정
    req.param = 'registerTerm';
    req.value = $('#registerStartDate').val() + '~' + $('#registerEndDate').val();
  }
  else if(obj.includes('notice')) {
    $('#noticeVersion').text(Number($('#noticeVersion').text()) + 1);
    req.param = 'notice';
    req.value = `${$('#noticeVersion').text()}$${$('#notice').val()}`;
  }
  else if(obj.includes('maxFeedingUserCount')) {
    req.param = 'maxFeedingUserCount';
    req.value = $('#maxFeedingUserCount').val();
  }

  $.ajax({
    url: `${api}/settings/${req.param}`,
    type: 'PUT',
    beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt')),
    data: { value : req.value },
    success: res => alertify.success('설정을 변경했습니다.'),
    error: err => alertify.error(`${err.responseJSON.error.message}`)
  });
});

function settingLoadError(err) {
  $('input, select, textarea').attr('disabled', true);
  alertify.error(`${err.responseJSON.error.message}`);
}

// current year formatting
$('#currentYear').keyup(function() {
  if(this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);
  if(Number(this.value) < 20) this.value = this.value.slice(0, 1);
});
