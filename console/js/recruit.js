$(function() {
  $('#content').click();
  $.ajax({
    url: "/ajoumeow/api/users/register",
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { semister : 'all' },
    success: res => {
      let html = '';
      for(let obj of res.data.reverse()) html += `<option value="${obj.replace('register_', '')}">${obj.replace('register_', '')}학기</option>`;
      $('.newMemberList').html(html);
      
      $('#newMemberList').DataTable({
        pagingType: "numbers",
        pageLength: 10,
        ajax: {
          url: '/ajoumeow/api/users/register',
          beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
          data: d => { d.semister = $('#tableName').val() },
          dataSrc: 'data',
          error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
        },
        order: [[ 0, 'desc' ]],
        columns: [
          { data: "timestamp" },
          { data: "ID" },
          { data: "name" },
          { data: "college" },
          { data: "department" },
          { data: "phone" }
        ],
        columnDefs: [{
          targets: 0,
          render: (data, type, row, meta) => { return new Date(data).format('yyyy-mm-dd HH:MM:ss') } 
        }]
      });
    },
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
});

$('#tableName').change(function() {
  $('#newMemberList').DataTable().ajax.reload();
});

$('#newMemberListDownload').click(function() {
  $.ajax({
    url: "/ajoumeow/api/users/register",
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { semister: $('#tableName').val() },
    success: res => {
      function s2ab(s) {
        let buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
        let view = new Uint8Array(buf);  //create uint8array as viewer
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
        return buf;
      }
      let excelHandler = {
        getExcelFileName : () => { return $('#tableName').val() + '학기 가입신청자 명단.xlsx'; },
        getSheetName : () => { return $('#tableName').val() + '학기'; },
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

$('#contactDownload').click(function() {
  $.ajax({
    url: "/ajoumeow/api/users/register",
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { semister: $('#tableName').val() },
    success: res => {
      let csv = '';
      if($('#contactType').val() == 'google') {
        csv += 'Name,Given Name,Additional Name,Family Name,Yomi Name,Given Name Yomi,Additional Name Yomi,Family Name Yomi,Name Prefix,Name Suffix,Initials,Nickname,Short Name,Maiden Name,Birthday,Gender,Location,Billing Information,Directory Server,Mileage,Occupation,Hobby,Sensitivity,Priority,Subject,Notes,Language,Photo,Group Membership,Phone 1 - Type,Phone 1 - Value\n';
        for(let obj of res.data)
          csv += obj.ID + ' ' + obj.name + ',' + obj.ID + ' ' + obj.name + ',,,,,,,,,,,,,,,,,,,,,,,,,,,' + $('#contactTable').val() + '학기 미유미유 ::: * myContacts, ::: * myContacts,' + obj.phone + '\n';
      }
      else if($('#contactType').val() == 'naver') {
        csv += "First Name,Middle Name,Last Name,Title,Suffix,Initials,Web Page,Gender,Birthday,Anniversary,Location,Language,Internet Free Busy,Notes,E-mail Address,E-mail 2 Address,E-mail 3 Address,Primary Phone,Home Phone,Home Phone 2,Mobile Phone,Pager,Home Fax,Home Address,Home Street,Home Street 2,Home Street 3,Home Address PO Box,Home City,Home State,Home Postal Code,Home Country,Spouse,Children,Manager's Name,Assistant's Name,Referred By,Company Main Phone,Business Phone,Business Phone 2,Business Fax,Assistant's Phone,Company,Job Title,Department,Office Location,Organizational ID Number,Profession,Account,Business Address,Business Street,Business Street 2,Business Street 3,Business Address PO Box,Business City,Business State,Business Postal Code,Business Country,Other Phone,Other Fax,Other Address,Other Street,Other Street 2,Other Street 3,Other Address PO Box,Other City,Other State,Other Postal Code,Other Country,Callback,Car Phone,ISDN,Radio Phone,TTY/TDD Phone,Telex,User 1,User 2,User 3,User 4,Keywords,Mileage,Hobby,Billing Information,Directory Server,Sensitivity,Priority,Private,Categories\n";
        for(let obj of res.data)
          csv += obj.ID + ' ' + obj.name + ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,' + obj.phone + ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,' + $('#contactTable').val() + '학기 미유미유,\n';
      }
      let blob = new Blob(["\ufeff", csv], { type: 'text/plain' });
      let a = document.createElement('a');
      a.download = `${$('#contactTable').val()}학기 미유미유 가입신청자 ${$('#contactType').val()[0].toUpperCase() + $('#contactType').val().substring(1)} 연락처.csv`;
      a.href = (window.webkitURL || window.URL).createObjectURL(blob);
      a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
      a.click();
    },
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
});