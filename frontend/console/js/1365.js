$(function() {
  $('#content').click();
  $.ajax({
    url: `${api}/semesters`,
    beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt')),
    success: res => {
      let html = '';
      for(let obj of res.data.reverse()) html += `<option value="${obj}">${obj}학기</option>`;
      $('.namelist_select').html(html);
    },
    error: err => alertify.error(`${err.responseJSON.error.message}`)
  });
});

$('#download1365').click(function() {
  if(!$('#1365StartDate').val() || !$('#1365EndDate').val() || !$('#namelist1365').val()) return alertify.error('기간과 명단 데이터를 모두 선택하세요');
  $('#download1365').attr('disabled', true);
  $.ajax({
    url: `${api}/verifications/1365-export?startDate=${$('#1365StartDate').val()}&endDate=${$('#1365EndDate').val()}&semester=${$('#namelist1365').val()}&mask=${$('#mask').prop('checked')}`,
    success: res => {
      if(res.result == 'success') window.location.assign(`https://docs.google.com/spreadsheets/d/1lDmsrTdhIehRCMBMAiQUOZKWqjzqijLAdF_giwdCbyc/export?format=xlsx&gid=1214330815`);
      else alertify.error(res.result.error);
      $('#download1365').attr('disabled', false);
    }
  })
});
