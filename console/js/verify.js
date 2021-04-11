$(function() {
  $('#content').click();
  $('#timestamp').datepicker('update', new Date().format('yyyy-mm-dd'));
  init();
});

async function init() {
  let record, verify;
  $.ajax({
    url: '/ajoumeow/api/verify/latest',
    type: 'GET',
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    success: res => $('#latestConfirm').text(new Date(res.data.date).format('yyyy년 m월 d일')),
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
  
  await $.ajax({
    url: '/ajoumeow/api/verify',
    type: 'GET',
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { date: $('#timestamp').datepicker('getDate').format('yyyy-mm-dd') },
    success: res => { record = res.msg; verify = res.data },
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
  
  $("#autolist").html('').prepend(`<div style='margin-top: 5px; margin-bottom: -10px'><label><input type='checkbox' id='boost' value='test'>&nbsp;마일리지 상향 지급하기</input></label></div><hr style='width: 100%'>`);
  $("#manuallist").html('').prepend(`<a id="autocomplete_reason" class="btn btn-warning" style="padding: .1rem .4rem; color: #fff;">지급 사유 통일하기</a><hr style='width: 100%'>`);
  for(let obj of record) $('#autolist').append("<div><label><input type='checkbox' name='recordList' checked='checked' value='" + obj.ID + '/' + obj.name + '/' + obj.course + "'>&nbsp;" + obj.ID + ' ' + obj.name + ' / ' + obj.course + "</input></label></div>");
  $('#deletelist').html('<br>');
  for(let obj of verify) $('#deletelist').append("<div><label><input type='checkbox' name='deleteList' value='" + obj.ID + '/' + obj.name + '/' + obj.course + "'>&nbsp;" + obj.ID + ' ' + obj.name + ' / ' + obj.course + ' ' + obj.score + "점</input></label></div>");
}

/* Event Listeners */

$('#timestamp').datepicker().on('changeDate', init);

$('input[name=verifyType]').click(function() {
  $('.controlContent').css('display', 'none')
  $('#' + $(this).val()).css('display', 'block');
  if($(this).val() == 'delete') $('#submit').removeClass('btn-success').addClass('btn-danger').children('span').text('삭제');
  else $('#submit').removeClass('btn-danger').addClass('btn-success').children('span').text('인증');
});

$('#autoadd').click(function() {
  $('#autolist').append(`<div>
    <input type="checkbox" name="recordList" checked>
    <span class='autoadd-data'>
      <div style='display: inline-block; width: 14ch'></div>
    </span> / 
    <select class='autoadd-course-data'><option value="1코스">1</option><option value="2코스">2</option><option value="3코스">3</option></select> 코스&emsp;
    <input type="text" class='autoCompleteName form-control' placeholder='이름' style="display: inline; width: 3.5rem; padding: 0; height: 1.5rem;"/>
  </div>`);
  $('input.autoCompleteName').typeahead('destroy');
  autoadd_typeahead();
});

$('#manualadd').click(function() {
  $('#manuallist').append(`<div style='margin-bottom: 0.5rem; line-height: 1.75rem;'>
    <input type="checkbox" name="manualrecord" checked>
    <span class='autoadd-data'>
      <div style='display: inline-block; width: 15ch'></div>
    </span>
    <input type="text"   placeholder='이름' class='autoCompleteName form-control' style="display: inline; width: 3.5rem; padding: 0; height: 1.5rem;"/><br>&emsp;
    <input type="number" name='manual_score'  placeholder="점수" class='manualadd form-control' style="display: inline; width: 5ch; padding: 0; height: 1.5rem;"/>
    <input type="text"   name='manual_reason' placeholder="지급 사유 (20자 이내)" maxlength=19 class='manualadd form-control' style="display: inline; width: 10rem; padding: 0; height: 1.5rem;"/>
  </div>`);
  $('input.autoCompleteName').typeahead('destroy');
  autoadd_typeahead();
});
$(document).on('click', '#autocomplete_reason', function() {
  let target = $('input[name=manual_reason]');
  if(target.length) {
    let reason = target[0].value;
    for(let obj of target) $(obj).val(reason);
  }
});

function autoadd_typeahead() {
  $('input.autoCompleteName').typeahead({
    hint: true
  }, {
    displayKey: 'name',
    templates: {
      suggestion: data => {
        return `<p>${data.ID} <strong>${data._query}</strong>${data.name.replace(data._query, '')}</p>`;
      }
    },
    source: (query, syncResults, asyncResults) => {
      return $.ajax({
        url: '/ajoumeow/api/users/name',
        type: 'GET',
        beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
        data: { query: query },
        success: res => { return asyncResults(res.data) },
      })
    }
  })
  .bind('typeahead:select', (e, suggestion) => {
    $(e.target).parent().siblings('span').text(`${suggestion.ID} ${suggestion.name}`)
    $(e.target).parent().siblings('input[name=recordList]').val(`${suggestion.ID}/${suggestion.name}/${$(e.target).parent().siblings('select').val()}`)
  });
  $('select.autoadd-course-data').on('change', function() {
    let target = $(this).siblings('input[name=recordList]');
    target.val(target.val().replace(/\d코스/, $(this).val()));
  });
}

/* Submit button click event */
$("#submit").click(function() {
  let operation = $('input[name=verifyType]:checked').val();

  if(operation == 'auto') {
    let payload = [];
    for(let obj of $('input[name=recordList]:checked')) {
      let tmp = $(obj).val().split('/');
      payload.push({
        'ID' : tmp[0],
        'date' : $('#timestamp').datepicker('getDate').format('yyyy-mm-dd'),
        'name' : tmp[1],
        'course' : tmp[2],
        'score' : null
      });
    }
    if(validator(payload)) scoreProvider(payload);
  }
  
  else if(operation == 'manual') {
    let payload = [];
    for(let obj of $('input[name=manualrecord]:checked')) {
      let tmp = $(obj).next().text().match(/(.*?) (.*)/);
      payload.push({
        'ID' : tmp[1],
        'date' : $('#timestamp').datepicker('getDate').format('yyyy-mm-dd'),
        'name' : tmp[2],
        'course' : $(obj).siblings('input[name=manual_reason]').val(),
        'score' : $(obj).siblings('input[name=manual_score]').val()
      });
    }
    if(validator(payload)) transmitter(payload);
  }
  
  else if(operation == 'delete') {
    let payload = [];
    for(let obj of $('input[name=deleteList]:checked')) {
      let tmp = $(obj).val().split('/');
      payload.push({
        'ID' : tmp[0],
        'date' : $('#timestamp').datepicker('getDate').format('yyyy-mm-dd'),
        'name' : tmp[1],
        'course' : tmp[2]
      });
    }
    if(validator(payload)) {
      $.ajax({
        url: '/ajoumeow/api/verify',
        type: 'DELETE',
        beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
        data: { data : JSON.stringify(payload) },
        success: function() {
          alertify.error('삭제되었습니다.');
          $('#deletelist').val('');
          init();
        },
        error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
      });
    }
  }
});
  
function validator(payload) {
  if(!payload.length) {
    alertify.error('보낼 데이터가 없습니다!');
    return false;
  }
  for(let obj of payload) {
    if(!obj.ID || !obj.date || !obj.name || !obj.course) {
      alertify.error('유효하지 않은 인증 데이터입니다!');
      return false;
    }
  }
  return true;
}

function scoreProvider(payload) {
  let boost = $('#boost:checked').length;
  let score = {
    weekday : {
      solo : (boost ? 2 : 1.5),
      dual : (boost ? 1.5 : 1)
    },
    weekend : {
      solo : (boost ? 3 : 2),
      dual : (boost ? 2 : 1.5)
    }
  }
  let isWeekEnd = new Date($('#timestamp').datepicker('getDate').format('yyyy-mm-dd')).getDayNum() > 5;
  for(let i = 1; i <= 3; i++) {
    let counter = 0;
    for(let obj of payload) if(obj.course == i + '코스') counter++;
    for(let obj of payload) {
      if(obj.course == i + '코스') {
        if(counter >= 2) obj.score = isWeekEnd ? score.weekend.dual : score.weekday.dual;
        else obj.score = isWeekEnd ? score.weekend.solo : score.weekday.solo;
      }
    }
  }
  transmitter(payload);
}

function transmitter(payload) {
  $.ajax({
    url: '/ajoumeow/api/verify',
    type: 'POST',
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { data: JSON.stringify(payload) },
    success: function() {
      alertify.success('인증되었습니다.');
      $('#autolist').html('');
      $('#manuallist').html('');
      init();
    },
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
}
