$(function() {
  $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/isAllowedAdminConsole',
    type: 'POST',
    success: function(res) {
      if(!res.result) window.location.href = 'https://luftaquila.io/ajoumeow/403.html';
      $.ajax({
        url:"https://luftaquila.io/ajoumeow/api/loginCheck",
        type: "POST",
        dataType: 'json',
        success: function(response) { if(response.name) $('#welcomeMSG').text(response.name + '(관리자)님 안녕하세요.'); }
      });
    },
    error: function(res) { window.location.href = 'https://luftaquila.io/ajoumeow/403.html'; }
  });
  init();
  clickEventListener();
});

function init() {
  $.when(
    $.ajax({ // Request settings
      url: "https://luftaquila.io/ajoumeow/api/requestSettings",
      type: "POST",
      dataType: 'json',
      success: function(res) {
        settings = res;
        $('#currentYear').val(settings['currentSemister'].split('-')[0]);
        $('#currentSemister').val(settings['currentSemister'].split('-')[1]);
        $('#isAdditionalApplyAllowed').val(settings['isAllowAdditionalApply'].toUpperCase()).attr('selected', 'selected');
        $('#isAdditionalRegisterAllowed').val(settings['isAllowAdditionalRegister'].toUpperCase()).attr('selected', 'selected');
        $('#notice').val(settings['notice'].split('$')[1].replace('<br>', '\n'));
        try {
          document.getElementById('applyStartDate').valueAsDate = new Date(new Date(settings['applyTerm'].split('~')[0]) - (-1) * 9 * 3600 * 1000);
          document.getElementById('applyEndDate').valueAsDate = new Date(new Date(settings['applyTerm'].split('~')[1]) - (-1) * 9 * 3600 * 1000);
          document.getElementById('registerStartDate').valueAsDate = new Date(new Date(settings['registerTerm'].split('~')[0]) - (-1) * 9 * 3600 * 1000);
          document.getElementById('registerEndDate').valueAsDate = new Date(new Date(settings['registerTerm'].split('~')[1]) - (-1) * 9 * 3600 * 1000); 
        }
        catch(e) { }
        $('#settingsContent input, #settingsContent select').attr('disabled', false);
        $('#1365Content input, #1365Content select').attr('disabled', false);
      }
    }),
    $.ajax({
      url: 'https://luftaquila.io/ajoumeow/api/requestNameList',
      type: 'POST',
      dataType: 'json',
      data: { 'semister' : 'this' },
      success: function(res) { namelist = res; }
    })
  ).done(function() {
    let datatable = $('#dataTable').DataTable({
      pagingType: "numbers",
      ajax: {
        url: "https://luftaquila.io/ajoumeow/api/requestNameList",
        type: 'POST',
        data: { 'semister' : settings['currentSemister'] },
        dataSrc: ''
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
      dataTable : datatable,
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
       onEdited : function(prev, changed, index, cell) {
         $.ajax({
           url: 'https://luftaquila.io/ajoumeow/api/modifyMember',
           type: 'POST',
           dataType: 'json',
           data: cell.row(index.row).data(),
           success: function(res) {
             if(res.result) alertify.success('수정되었습니다.');
             else alertify.error('수정에 실패했습니다.');
             datatable.ajax.reload();
           },
           error: function() { alertify.error('수정에 실패했습니다.'); }
         });
       }
    });
    
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
      url: 'https://luftaquila.io/ajoumeow/api/requestStat',
      type: 'POST',
      success: function(res) {
        var percent = (res.people / res.total * 100).toFixed(1) + '%';
        $('#activityTime').text(res.time + '시간');
        $('#activeMember').text(res.people + '명 / ' + percent);
        $('#activePercentGraph').css('width', percent);
      }
    });
      
    serverlog = $('#serverlog').DataTable({
      pagingType: "numbers",
      order: [[ 0, 'desc' ]],
      ajax: {
        url: "https://luftaquila.io/ajoumeow/api/requestLogs",
        type: 'POST',
        data: function(d) {
          var str = '', types = {
            pageload: '^loginCheck$|^requestSettings$|^records$|^requestNamelist$|^isAllowedAdminConsole$|^requestNamelistTables$|^requestLatestVerify$|^requestVerifyList$|^requestNotice$|^requestStatistics$|^requestStat$|',
            loginout: '^login$|^logout$|',
            insdelTable: '^insertIntoTable$|^deleteFromTable$|',
            verify: '^verify$|^deleteVerify$|',
            settingchange: '^modifySettings$|',
            memberchange: '^modifyMember$|^deleteMember$|',
            '1365' : '^request1365$|',
            others : '^apply$|^requestApply$|^requestRegister$|^server$|'
          };
          for(var obj of $('input[name=logtype]:checked')) str += types[$(obj).val()];
          if(!str) str = '^love$|';
          d.error = ($('input[name=iserror]:checked').length ? true : false);
          d.type = str.substring(0, str.length - 1);
        },
        dataSrc: ''
      },
      columns: [
        { data: "timestamp" },
        { data: "ip" },
        { data: "identity" },
        { data: "description" },
        { data: "query" },
        { data: "type" },
        { data: "result" }
      ]
    });
    
    statistics = $('#statistics').DataTable({
      paging: false,
      lengthChange: false,
      order: [[ 1, 'desc' ]],
      ajax: {
        url: "https://luftaquila.io/ajoumeow/api/requestStatistics",
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
    
    $.ajax({ // Request Namelist DBs
      url: 'https://luftaquila.io/ajoumeow/api/requestNamelistTables',
      type: "POST",
      dataType: 'json',
      success: function(res) {
        var data = [], str = '';
        for(var obj of res) data.push(obj['Tables_in_ajoumeow']);
        for(var obj of data) str += '<option value="' + obj + '">' + obj + '</option>';
        $('#namelist').html(str);
        $('#calendar1365').val(new Date().format('yyyy-mm'));
      }
    });
    
    $('#timestamp').val(new Date().format('yyyy-mm-dd'));
    load();
  });
}

async function load() {
  var record, verify;
  $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/requestLatestVerify',
    type: 'POST',
    success: function(res) { $('#latestConfirm').text('마지막 인증 기록 : ' + new Date(res[0].date).format('yyyy-mm-dd')); }
  });
  
  await $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/requestVerifyList',
    type: 'POST',
    dataType: 'json',
    data: { date: $('#timestamp').val() },
    success: function(res) { record = res.record; verify = res.verify }
  });
  
  $("#autolist").html('').prepend("<div style='margin-top: 5px; margin-bottom: -10px'><label><input type='checkbox' id='boost' value='test'>&nbsp;마일리지 상향 지급하기<br><li style='font-size: 0.8rem'>시험 기간, 연휴 등 급식이 어려울 때 체크합니다.</li></input></label></div><hr style='width: 100%'>");
  for(var obj of record) $('#autolist').append("<div><label><input type='checkbox' name='recordList' checked='checked' value='" + obj.ID + '/' + obj.name + '/' + obj.course + "'>&nbsp;" + obj.ID + ' ' + obj.name + ' / ' + obj.course + "</input></label></div>");
  
  $('#deletelist').html('<br>');
  for(var obj of verify) $('#deletelist').append("<div><label><input type='checkbox' name='deleteList' value='" + obj.ID + '/' + obj.name + '/' + obj.course + "'>&nbsp;" + obj.ID + ' ' + obj.name + ' / ' + obj.course + "</input></label></div>");
}

$("#DATA a#submit").click( function(event) {
  $('.container-fluid input, .container-fluid select, .container-fluid a').attr('disabled', true);
  var operation = $('input[name=verifyType]:checked').val();
  
  if(operation == 'auto') {
    var payload = [];
    var autolist = $('input[name=recordList]:checked');
    for(var obj of autolist) {
      var tmp = $(obj).val().split('/');
      payload.push({
        'ID' : tmp[0],
        'date' : $('#timestamp').val(),
        'name' : tmp[1],
        'course' : tmp[2],
        'score' : null
      });
    }
    var customlist = $('input[name=customRecordList]:checked');
    for(var obj of customlist) {
      payload.push({
        'ID' : $(obj).next().val(),
        'date' : $('#timestamp').val(),
        'name' : $(obj).next().next().val(),
        'course' : $(obj).next().next().next().val() + '코스',
        'score' : null
      });
    }
    if(validator(payload)) scoreProvider(payload);
    else $('.container-fluid input, .container-fluid select, .container-fluid a').attr('disabled', false);
  }
  
  else if(operation == 'manual') {
    var payload = [];
    var manuallist = $('input[name=manualrecord]:checked');
    for(var obj of manuallist) {
      payload.push({
        'ID' : $(obj).next().val(),
        'date' : $('#timestamp').val(),
        'name' : $(obj).next().next().val(),
        'course' : $(obj).next().next().next().next().next().val(),
        'score' : $(obj).next().next().next().next().val()
      });
    }
    if(validator(payload)) transmitter(payload);
    else $('.container-fluid input, .container-fluid select, .container-fluid a').attr('disabled', false);
  }
  
  else if(operation == 'delete') {
    var payload = [];
    var deletelist = $('input[name=deleteList]:checked');
    for(var obj of deletelist) {
      var tmp = $(obj).val().split('/');
      payload.push({
        'ID' : tmp[0],
        'date' : $('#timestamp').val(),
        'name' : tmp[1],
        'course' : tmp[2]
      });
    }
    if(validator(payload)) {
      $.ajax({
        url: 'https://luftaquila.io/ajoumeow/api/deleteVerify',
        type: 'POST',
        data: { data : JSON.stringify(payload) },
        success: function() {
          $('.container-fluid input, .container-fluid select, .container-fluid a').attr('disabled', false);
          alertify.error('삭제되었습니다.');
          $('#deletelist').val('');
          load();
        }
      });
    }
    else $('.container-fluid input, .container-fluid select, .container-fluid a').attr('disabled', false);
  }
  event.preventDefault();
});
  
function validator(payload) {
  if(!payload.length) {
    alertify.error('ERR_NO_PAYLOAD');
    return false;
  }
  for(var obj of payload) {
    if(!obj.ID || !obj.date || !obj.name || !obj.course) {
      alertify.error('ERR_INVALID_PAYLOAD');
      return false;
    }
  }
  return true;
}

function scoreProvider(payload) {
  var boost = $('#boost:checked').length;
  var score = {
    weekday : {
      solo : (boost ? 2 : 1.5),
      dual : (boost ? 1.5 : 1)
    },
    weekend : {
      solo : (boost ? 3 : 2),
      dual : (boost ? 2 : 1.5)
    }
  }
  var isWeekEnd = new Date($('#timestamp').val()).getDayNum() > 5;
  for(var i = 1; i <= 3; i++) {
    var counter = 0;
    for(var obj of payload) if(obj.course == i + '코스') counter++;
    for(var obj of payload) {
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
    url: 'https://luftaquila.io/ajoumeow/api/verify',
    type: 'POST',
    dataType: 'json',
    data: { data: JSON.stringify(payload) },
    success: function() {
      $('.container-fluid input, .container-fluid select, .container-fluid a').attr('disabled', false);
      alertify.success('인증되었습니다.');
      $('#autolist').html('');
      $('#manuallist').html('');
      load();
    }
  });
}

function clickEventListener() {
  $('.nav-item').click(function() {
    $('.nav-item').removeClass('active');
    $(this).addClass('active');
    $('.container-fluid').css('display', 'none');
    $('.container-fluid#' + $(this).attr('id') + 'Content').css('display', 'block');
  });
  $('input[name=verifyType]').click(function() {
    $('#auto, #manual, #delete').css('display', 'none');
    $('#' + $(this).val()).css('display', 'block');
    if($(this).val() == 'delete') $('#submit').removeClass('btn-success').addClass('btn-danger').children('span').text('삭제');
    else $('#submit').removeClass('btn-danger').addClass('btn-success').children('span').text('인증');
  });
  $('#autoadd').click(function() {
    var div = $('<div></div>');
    $('#autolist').append(div);
    div.append($('<input type="checkbox" class="autoadd" name="customRecordList" checked>')).append('&nbsp;');
    div.append($('<input type="number" placeholder="학번" class="autoadd form-control border-5 small" style="display: inline; width: 110px; height: 30px"/>')).append('&nbsp;');
    div.append($('<input type="text" class="autoadd form-control border-5 small" style="display: inline; width: 70px; height:30px" disabled/>')).append(' / ');
    div.append($('<select><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>')).append(' 코스');
    $('input.autoadd[type=number]').keyup(function() {
      var target = namelist.find(o => o.ID == $(this).val());
      if(target) $(this).next().val(target.name);
      else $(this).next().val('');
    });
  });
  $('#manualadd').click(function() {
    if($('input[name=manualrecord]').length == 1) {
      $('#manuallist').prepend('<span id="autoReason">> 지급 사유 통일하기</span><br><br>');
      $('#autoReason').click(function() {
        var reason = $($($('input:checkbox[name=manualrecord]')[0]).siblings($('input'))[4]).val();
        $("input:checkbox[name=manualrecord]").each(function() {
          $($(this).siblings($('input'))[4]).val(reason);
        });
      });
    }
    var div = $('<div></div>');
    $('#manuallist').append(div);
    div.append($('<input type="checkbox" name="manualrecord" checked>')).append('&nbsp;');
    div.append($('<input type="number" placeholder="학번" class="manualadd form-control border-5 small" style="display: inline; width: 110px; height: 30px"/>')).append('&nbsp;');
    div.append($('<input type="text" class="manualadd form-control border-5 small" style="display: inline; width: 70px; height:30px" disabled/>')).append('<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
    div.append($('<input type="number" placeholder="점수" class="form-control border-5 small" style="display: inline; width: 60px; height: 30px"/>')).append('&nbsp;&nbsp;');
    div.append($('<input type="text" placeholder="지급 사유(20자 이내)" maxlength=19 class="manualadd form-control border-5 small" style="display: inline; width: 250px; height: 30px"/>')).append('<br><br>');
    $('input.manualadd[type=number]').keyup(function() {
      var target = namelist.find(o => o.ID == $(this).val());
      if(target) $(this).next().val(target.name);
      else $(this).next().val('');
    });
  });
  $('.setting').change(function() {
    var obj = $(this).attr('class'), req;
    if     (obj.includes('settingSemister')) req = ['currentSemister', $('#currentYear').val() + '-' + $('#currentSemister').val()];
    else if(obj.includes('settingApplyCalendar')) req = ['applyTerm', $('#applyStartDate').val() + '~' + $('#applyEndDate').val()];
    else if(obj.includes('settingAdditionalApply')) req = ['isAllowAdditionalApply', $('#isAdditionalApplyAllowed').val()];
    else if(obj.includes('settingRegisterCalendar')) req = ['registerTerm', $('#registerStartDate').val() + '~' + $('#registerEndDate').val()];
    else if(obj.includes('settingAdditionalRegister')) req = ['isAllowAdditionalRegister', $('#isAdditionalRegisterAllowed').val()];
    else if(obj.includes('notice')) req = ['notice', $('#notice').val()];
    
    $.ajax({
      type: 'POST',
      url: 'https://luftaquila.io/ajoumeow/api/modifySettings',
      data: { 'editParam' : req[0], 'editData' : req[1] },
      success: function(res) { 
        if(res.result) alertify.success('설정이 변경되었습니다');
        else alertify.error('설정 변경에 실패하였습니다')},
      error: function() { alertify.error('설정 변경에 실패하였습니다.<br>다시 시도해 주세요'); }
    });
  });
  $('#timestamp').change(load);
  $('#download1365').click(function() {
    if($('#calendar1365').val()) {
      $('#calendar1365, #download1365, #namelist').attr('disabled', true);
      $.ajax({
        url: "https://luftaquila.io/ajoumeow/api/request1365",
        type: 'POST',
        data: { month: $('#calendar1365').val(), namelist: $('#namelist').val() },
        success: function(res) {
          if(res.result) {
            alertify.success('문서 생성이 완료되었습니다.');
            window.open('https://luftaquila.io/ajoumeow/api/download1365');
          }
        },
        error: function(req) { alertify.error(req.responseJSON.error.code); },
        complete: function() { $('#calendar1365, #download1365, #namelist').attr('disabled', false); }
      });
    }
    else alertify.error('년/월을 선택하세요');
  });
  $(document).keypress(function(e) { if( $('#admin').hasClass('is-open') && (e.keyCode == 13 || e.which == 13) ) $('#confirmAdmin').click(); });
  $('#currentYear').keyup(function() {
     if(this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);
     if(Number(this.value) < 20) this.value = this.value.slice(0, 1);
  });
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
  $('input[name=iserror], input[name=logtype]').click(function() { serverlog.ajax.reload(); });
  $('input[name=statisticsType]').click(function() { statistics.ajax.reload(); });
  $('#memberDeleteConfirm').click(function() {
    $.ajax({
      url: 'https://luftaquila.io/ajoumeow/api/deleteMember',
      type: 'POST',
      data: { delete: $('#deletemember').val() },
      success: function(res) {
        if(res.result) alertify.error('회원이 제명되었습니다.');
        else alertify.error('등록되지 않은 학번입니다.');
      }
    });
  });
}

function dataSize(s, b, i, c) { for(b = i = 0; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1); return b; }
var dateFormat = function () {
  var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
      pad = function (val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) val = "0" + val;
        return val;
      };
  return function (date, mask, utc) {
    var dF = dateFormat;
    if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }
    date = date ? new Date(date) : new Date;
    var	_ = utc ? "getUTC" : "get",
      d = date[_ + "Date"](),
      m = date[_ + "Month"](),
      y = date[_ + "FullYear"](),
      flags = {
        d:    d,
        dd:   pad(d),
        m:    m + 1,
        mm:   pad(m + 1),
        yyyy: y,
      };
    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}();
Date.prototype.format = function (mask, utc) { return dateFormat(this, mask, utc); };
Date.prototype.getDayNum = function() {
  return this.getDay() ? this.getDay() : 7;
}
  