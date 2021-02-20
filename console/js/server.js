$(function() {
  $('#content').click();
  $.ajax({
    url: "/ajoumeow/api/settings/logs",
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: { semister : 'all' },
    success: res => {
      let html = '';
      for(let obj of res.data.reverse()) html += `<option value="${obj.replace('namelist_', '')}">${obj.replace('namelist_', '')}학기</option>`;
      $('.namelist_select').html(html);
    }
  });
});

    
    $.ajax({
      url: "api/requestLogs",
      type: 'POST',
      success: function(res) { logData = res; }
    }).done(function() {
      serverlog = $('#serverlog').DataTable({
        pagingType: "numbers",
        data: logData,
        order: [[ 0, 'desc' ]],
        columns: [
          { data: "timestamp" },
          { data: "level" },
          { data: "ip" },
          { data: "message" },
          { data: "query" },
          { data: "url" },
          { data: "result" }
        ]
      });
    });
    
  });
}
function clickEventListener() {
  

  $('input[name=iserror], input[name=logtype]').click(function() {
    var isError = $('input[name=iserror]:checked').length;
    var logdata = [], logtype = [];
    $('input[name=logtype]:checked').each(function() { logtype.push($(this).val()) });
    var types = {
      pageload: ['loginCheck', 'requestSettings', 'records', 'requestNamelist', 'isAllowedAdminConsole', 'requestNamelistTables', 'requestLatestVerify', 'requestVerifyList', 'requestNotice', 'requestStatistics', 'requestStat'],
      loginout: ['login', 'logout'],
      insdelTable: ['insertIntoTable', 'deleteFromTable'],
      verify: ['verify', 'deleteVerify'],
      settingchange: ['modifySettings'],
      memberchange: ['apply', 'modifyMember', 'deleteMember'],
      '1365' : ['request1365'],
      others : ['requestApply', 'requestRegister', 'SERVER', 'BOT']
    };
    for(var obj of logData) {
      for(var type of logtype) {
        if(types[type].indexOf(obj.url) > -1) {
          if(isError) {
            if(obj.level != 'info') logdata.push(obj);
          }
          else logdata.push(obj);
        }
      }
    }
    if(!logdata.length) logdata = [{ timestamp: null, ip: null, query: null, result: null, url: null, message: null, level: null }];
    $('#serverlog').dataTable().fnClearTable(); 
    $('#serverlog').dataTable().fnAddData(logdata);
  });
  
  
}
*/
