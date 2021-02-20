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
    }
  });
});