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
  
  $.ajax({
    url: "/ajoumeow/api/settings/currentSemister",
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    success: res => {
      $('#currentMembersList').DataTable({
        pagingType: "numbers",
        pageLength: 100,
        ajax: {
          url: '/ajoumeow/api/users/list',
          beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
          data: { semister : res.data },
          dataSrc: 'data',
          error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
        },
        columns: [
          { data: "college" },
          { data: "department" },
          { data: "ID" },
          { data: "name" },
          { data: "phone" },
          { data: "birthday" },
          { data: "1365ID" },
          { data: "register" },
          { data: "role" }
        ]
      });
      datatableEdit({
        dataTable : $('#currentMembersList').DataTable(),
        columnDefs : [
          { targets : 0 },
          { targets : 1 },
          { targets : 3 },
          { targets : 4 },
          { targets : 5 },
          { targets : 6 },
          { targets : 7 },
          { targets : 8 }
         ],
         onEdited : (prev, changed, index, cell) => {
           $.ajax({
             url: '/ajoumeow/api/users/id',
             type: 'PUT',
             beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
             data: cell.row(index.row).data(),
             success: res => {
               alertify.success('수정되었습니다.');
               $('#dataTable').DataTable().ajax.reload();
             },
             error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
           });
         }
      });
      
      $('#pastMembersList').DataTable({
        pagingType: "numbers",
        pageLength: 100,
        ajax: {
          url: '/ajoumeow/api/users/list',
          beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
          data: d => { d.semister = $('#namelist').val() },
          dataSrc: 'data',
          error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
        },
        columns: [
          { data: "college" },
          { data: "department" },
          { data: "ID" },
          { data: "name" },
          { data: "phone" },
          { data: "birthday" },
          { data: "1365ID" },
          { data: "register" },
          { data: "role" }
        ]
      });
    
      $('#namelist').change(function() {
        if($(this).val() == res.data) {
          $('#current_namelist').css('display', 'block');
          $('#past_namelist').css('display', 'none');
        }
        else {
          $('#current_namelist').css('display', 'none');
          $('#past_namelist').css('display', 'block');
          $('#pastMembersList').DataTable().ajax.reload();
        }
      });      
    },
    error: err => alertify.error('설정값을 불러오는 중에 오류가 발생했습니다.')
  });
});

$('#deleteMember').click(function() {
  $.ajax({
    url: '/ajoumeow/api/users/id',
    type: 'DELETE',
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { ID: $('#deleteMemberID').val() },
    success: res => {
      alertify.error('회원이 제명되었습니다.');
      $('#currentMembersList').DataTable().ajax.reload();
    },
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
});

$('#namelistDownload').click(function() {
  let semister = $('#namelist').val();
  $.ajax({
    url: "/ajoumeow/api/users/list",
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { semister : semister },
    success: res => {
      function s2ab(s) {
        let buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
        let view = new Uint8Array(buf);  //create uint8array as viewer
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
        return buf;
      }
      let excelHandler = {
        getExcelFileName : () => { return semister + '학기 명단.xlsx'; },
        getSheetName : () => { return semister + '학기'; },
        getWorksheet : () => { return XLSX.utils.json_to_sheet(res.data); }
      }
      let wb = XLSX.utils.book_new();
      let newWorksheet = excelHandler.getWorksheet();
      XLSX.utils.book_append_sheet(wb, newWorksheet, excelHandler.getSheetName());
      let wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), excelHandler.getExcelFileName());
    },
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
});