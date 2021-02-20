function init() {

    
    $.ajax({ // Request New Member Recruit Sheet Lists
      url: "https://script.google.com/macros/s/AKfycbwOT83RGEPIgdu1oTM9VvBqyRN6jcEXRkGlpdqG1EUCr1HdaBxX/exec",
      data: encodeURI('type=requestSheetLists'),
      type: "POST",
      dataType: 'text',
      success: function(response) {
        var sheetList = response.split('|'), str = '';
        sheetList.pop();
        for(var i in sheetList) if(!sheetList[i].includes('template')) str += '<option>' + sheetList[i] + '</option>';
        $('#newMemberList').html(str);
      }
    });
    
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
  

  $('#contactDownload').click(function() {
      var fileType = $('input:radio[name=contactfile]:checked');
      if(!fileType.length) {
          alertify.error('다운로드 형식을 지정해 주십시오.');
          return;
      }
      $.ajax({
        url: "https://script.google.com/macros/s/AKfycbwOT83RGEPIgdu1oTM9VvBqyRN6jcEXRkGlpdqG1EUCr1HdaBxX/exec",
        data: encodeURI('type=requestSheetContent&semister=' + $('#newMemberList').val()),
        type: "POST",
        dataType: 'text',
        cache: false,
        success: function(response) {
            newMember = response.split('\n').map((line) => line.split(','));
            newMember.pop();
            var csv = '';
            if(fileType.val() == 'google') {
                csv += 'Name,Given Name,Additional Name,Family Name,Yomi Name,Given Name Yomi,Additional Name Yomi,Family Name Yomi,Name Prefix,Name Suffix,Initials,Nickname,Short Name,Maiden Name,Birthday,Gender,Location,Billing Information,Directory Server,Mileage,Occupation,Hobby,Sensitivity,Priority,Subject,Notes,Language,Photo,Group Membership,Phone 1 - Type,Phone 1 - Value\n';
                for(var i in newMember) csv += newMember[i][1] + newMember[i][0] + ',' + newMember[i][1] + newMember[i][0] + ',,,,,,,,,,,,,,,,,,,,,,,,,,,' + $('#newMemberList').val() + ' 미유미유 ::: * myContacts, ::: * myContacts,' + newMember[i][2] + '\n';
            }
            else if(fileType.val() == 'outlook') {
                csv += "First Name,Middle Name,Last Name,Title,Suffix,Initials,Web Page,Gender,Birthday,Anniversary,Location,Language,Internet Free Busy,Notes,E-mail Address,E-mail 2 Address,E-mail 3 Address,Primary Phone,Home Phone,Home Phone 2,Mobile Phone,Pager,Home Fax,Home Address,Home Street,Home Street 2,Home Street 3,Home Address PO Box,Home City,Home State,Home Postal Code,Home Country,Spouse,Children,Manager's Name,Assistant's Name,Referred By,Company Main Phone,Business Phone,Business Phone 2,Business Fax,Assistant's Phone,Company,Job Title,Department,Office Location,Organizational ID Number,Profession,Account,Business Address,Business Street,Business Street 2,Business Street 3,Business Address PO Box,Business City,Business State,Business Postal Code,Business Country,Other Phone,Other Fax,Other Address,Other Street,Other Street 2,Other Street 3,Other Address PO Box,Other City,Other State,Other Postal Code,Other Country,Callback,Car Phone,ISDN,Radio Phone,TTY/TDD Phone,Telex,User 1,User 2,User 3,User 4,Keywords,Mileage,Hobby,Billing Information,Directory Server,Sensitivity,Priority,Private,Categories\n";
                for(var i in newMember) csv += newMember[i][1] + newMember[i][0] + ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,' + newMember[i][2] + ',,,,,,,,,,,,,,,,,,,,,,,,,,,,,' + $('#newMemberList').val() + ' 미유미유;myContacts,\n';
            }
            var blob = new Blob(["\ufeff", csv], { type: 'text/plain' });
            var anchor = document.createElement('a');

            anchor.download = "신입회원 연락처_" + fileType.val() + '.csv';
            anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
            anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');
            anchor.click();
        }
      });
  });
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
