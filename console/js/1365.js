$(function() {
  $('#content').click();
  $.ajax({
    url: "/ajoumeow/api/users/list",
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { semister : 'all' },
    success: res => {
      let html = '';
      for(let obj of res.data.reverse()) html += `<option value="${obj.replace('namelist_', '')}">${obj.replace('namelist_', '')}학기</option>`;
      $('.namelist_select').html(html);
    },
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
});

$('#download1365').click(function() {
  if(!$('#calendar1365').val() || !$('#namelist1365').val()) return alertify.error('기간과 명단 데이터를 모두 선택하세요');
  window.location.assign(`https://luftaquila.io/ajoumeow/api/verify/1365?month=${$('#calendar1365').val()}&namelist=${$('#namelist1365').val()}&private=${$('#private:checked').length}`);
});