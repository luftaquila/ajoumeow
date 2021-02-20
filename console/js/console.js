function init() {
    $.ajax({
      url: 'api/requestStat',
      type: 'POST',
      success: function(res) {
        var percent = (res.people / res.total * 100).toFixed(1) + '%';
        $('#activityTime').text(res.time + '시간');
        $('#activeMember').text(res.people + '명 / ' + percent);
        $('#activePercentGraph').css('width', percent);
      }
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
    
    statistics = $('#statistics').DataTable({
      paging: false,
      lengthChange: false,
      order: [[ 1, 'desc' ]],
      ajax: {
        url: "api/requestStatistics",
        type: 'POST',
        data: function(d) {
          d.type = $('input[name=statisticsType]:checked').val();
        },
        dataSrc: ''
      },
      columns: [
        { data: "name" },
        { data: "score" }
      ]
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
  $('input[name=statisticsType]').click(function() { statistics.ajax.reload(); });
  $('.statisticsDate').change(function() {
    let start = $('#statisticsStartDate').val(), end = $('#statisticsEndDate').val();
    if(start && end) {
      $('#customStatistics').val(start + '|' + end);
      statistics.ajax.reload();
    }
    else $('#customStatistics').val('');
  });
  
  $('#pick').click(function() {
    let list = statistics.ajax.json(), sum = 0; // 표 값 저장
    list.sort((a, b) => a.score - b.score); // 마일리지 오름차순 정렬
    /*
    for(let i = 0; i < 3; i++) { // 상위 1, 2, 3등 제거
      let top = list[list.length - 1].score;
      list = list.filter(function( obj ) { return obj.score !== top; });
    }
    */
    for(let i in list) { // 누적확률값 acc 및 마일리지 총합 sum 계산
      sum += list[i].score;
      list[i].acc = sum;
    }
    let key = Math.random() * sum; // 랜덤 key값 추출
    for(let obj of list) { // 누적확률 일치 값 추출
      if(obj.acc > key) {
        key = obj;
        break;
      }
    }
    /*
    let tgt = testcase.find(o => o.name == key.name);
    if(tgt) tgt.case++;
    else testcase.push({ name: key.name, case: 1, tp: Math.round(key.score / sum * 1000) / 10 + '%' });
    */
    if(key.name) {
      MicroModal.show('pop');
      $('#popgif').attr('src', '/ajoumeow/Resources/Images/loading.gif');
      $('#poptext').text('기지개 켜는 중...');
      setTimeout(function() {
        $('#poptext').text('캔 따는 중...');
        setTimeout(function() {
          $('#poptext').text('레이저포인터 쫓는 중...');
          setTimeout(function() {
            $('#popgif').attr('src', '/ajoumeow/Resources/Images/thinking.gif');
            $('#poptext').html('생각하는 척 하는 중...<br><span style="color: transparent">당첨 확률 : 0%</span>');
            setTimeout(function() {
              $('#poptext').html('당첨자는 ' + key.name + ' 님 이니라<br>당첨 확률 : ' + Math.round(key.score / sum * 1000) / 10 + '%');
            }, 5000);
          }, 1500);
        }, 2000);
      }, 1000);
    }
    
  });
  
}
