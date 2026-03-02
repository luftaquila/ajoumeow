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

  $.ajax({
    url: `${api}/settings/currentSemester`,
    beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt')),
    success: res => {
      $('#currentMembersList').DataTable({
        pagingType: "numbers",
        pageLength: 100,
        ajax: {
          url: `${api}/members`,
          beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt')),
          data: { semester : res.data },
          dataSrc: 'data',
          error: err => alertify.error(`${err.responseJSON.error.message}`)
        },
        columns: [
          { data: "college" },
          { data: "department" },
          { data: "studentId" },
          { data: "name" },
          { data: "phone" },
          { data: "birthday" },
          { data: "volunteerId" },
          { data: "registeredAt" },
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
           const rowData = cell.row(index.row).data();
           $.ajax({
             url: `${api}/members/${rowData.studentId}`,
             type: 'PUT',
             beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt')),
             data: rowData,
             success: res => {
               alertify.success('수정되었습니다.');
               $('#dataTable').DataTable().ajax.reload();
             },
             error: err => alertify.error(`${err.responseJSON.error.message}`)
           });
         }
      });

      $('#namelist').change(function() {
        if($(this).val() == res.data) {
          $('#current_namelist').css('display', 'block');
          $('#past_namelist').css('display', 'none');
        }
        else {
          $('#current_namelist').css('display', 'none');
          $('#past_namelist').css('display', 'block');
          if ($.fn.DataTable.isDataTable('#pastMembersList')) {
            $('#pastMembersList').DataTable().ajax.reload();
          } else {
            $('#pastMembersList').DataTable({
              pagingType: "numbers",
              pageLength: 100,
              ajax: {
                url: `${api}/members`,
                beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt')),
                data: d => { d.semester = $('#namelist').val() },
                dataSrc: 'data',
                error: err => alertify.error(`${err.responseJSON.error.message}`)
              },
              columns: [
                { data: "college" },
                { data: "department" },
                { data: "studentId" },
                { data: "name" },
                { data: "phone" },
                { data: "birthday" },
                { data: "volunteerId" },
                { data: "registeredAt" },
                { data: "role" }
              ]
            });
          }
        }
      });
    },
    error: err => alertify.error('설정값을 불러오는 중에 오류가 발생했습니다.')
  });
});

$('#deleteMember').click(function() {
  $.ajax({
    url: `${api}/members/${$('#deleteMemberID').val()}`,
    type: 'DELETE',
    beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt')),
    success: res => {
      alertify.error('회원이 제명되었습니다.');
      $('#currentMembersList').DataTable().ajax.reload();
    },
    error: err => alertify.error(`${err.responseJSON.error.message}`)
  });
});

$('#namelistDownload').click(function() {
  let semester = $('#namelist').val();
  $.ajax({
    url: `${api}/members`,
    beforeSend: xhr => xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('jwt')),
    data: { semester : semester },
    success: res => {
      function s2ab(s) {
        let buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
        let view = new Uint8Array(buf);  //create uint8array as viewer
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
        return buf;
      }
      let excelHandler = {
        getExcelFileName : () => { return semester + '학기 명단.xlsx'; },
        getSheetName : () => { return semester + '학기'; },
        getWorksheet : () => { return XLSX.utils.json_to_sheet(res.data); }
      }
      let wb = XLSX.utils.book_new();
      let newWorksheet = excelHandler.getWorksheet();
      XLSX.utils.book_append_sheet(wb, newWorksheet, excelHandler.getSheetName());
      let wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
      saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), excelHandler.getExcelFileName());
    },
    error: err => alertify.error(`${err.responseJSON.error.message}`)
  });
});
