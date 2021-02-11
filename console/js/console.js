$(function() {
  //(function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
  $.ajax({
    url:"api/loginCheck",
    type: "POST",
    dataType: 'json',
    success: function(response) {
      if(!response.role || response.role == '회원') window.location.href = "403.html";
      else $('#welcomeMSG').text(response.name + '(관리자)님 안녕하세요.');
    }
  });
  init();
  clickEventListener();
});

function init() {
  $('#sidebarToggleTop').click();
  $('#timestamp').datepicker({
    format: "yyyy-mm-dd",
    todayBtn: "linked",
    language: "ko",
    todayHighlight: true
  });
  
  $.when(
    $.ajax({ // Request settings
      url: "api/requestSettings",
      type: "POST",
      dataType: 'json',
      success: function(res) {
        settings = res;
        
        // load semister settings
        $('#currentYear').val(settings['currentSemister'].split('-')[0]);
        $('#currentSemister').val(settings['currentSemister'].split('-')[1]);
        
        // load apply settings
        if(settings['isApply'] == 'TRUE') { // setting is ON
          $('#isApply').attr('checked', false);
          $('#isApplyRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
          
          if(settings['isApplyRestricted'] == 'TRUE') {
            $('#isApplyRestricted').attr('checked', false);
            $('#isApplyRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
          }
          else {
            $('#isApplyRestricted').attr('checked', true);
            $('#isApplyRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
          }
        }
        else { // setting is OFF
          $('#isApply').attr('checked', true);
          $('#isApplyRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);

        }
          
        
        // load register settings
        if(settings['isRegister'] == 'TRUE') {
          $('#isRegister').attr('checked', false);
          $('#isRegisterRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
          
          if(settings['isRegisterRestricted'] == 'TRUE') {
            $('#isRegisterRestricted').attr('checked', false);
            $('#isRegisterRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
          }
          else {
            $('#isRegisterRestricted').attr('checked', true);
            $('#isRegisterRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
          }
        }
        else {
          $('#isRegister').attr('checked', true);
          $('#isRegisterRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);
        }
        
        // load notice
        $('#notice').val(settings['notice'].split('$')[1].replace('<br>', '\n'));
        
        // load calendars
        document.getElementById('applyStartDate').valueAsDate = new Date(new Date(settings['applyTerm'].split('~')[0]) - (-1) * 9 * 3600 * 1000);
        document.getElementById('applyEndDate').valueAsDate = new Date(new Date(settings['applyTerm'].split('~')[1]) - (-1) * 9 * 3600 * 1000);
        document.getElementById('registerStartDate').valueAsDate = new Date(new Date(settings['registerTerm'].split('~')[0]) - (-1) * 9 * 3600 * 1000);
        document.getElementById('registerEndDate').valueAsDate = new Date(new Date(settings['registerTerm'].split('~')[1]) - (-1) * 9 * 3600 * 1000);

        
      }
    }),
    $.ajax({
      url: 'api/requestNameList',
      type: 'POST',
      dataType: 'json',
      data: { 'semister' : 'this' },
      success: function(res) { namelist = res; }
    })
  ).done(function() {
    membertable = $('#dataTable').DataTable({
      pagingType: "numbers",
      ajax: {
        url: "api/requestNameList",
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
      dataTable : membertable,
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
           url: 'api/modifyMember',
           type: 'POST',
           dataType: 'json',
           data: cell.row(index.row).data(),
           success: function(res) {
             if(res.result) alertify.success('수정되었습니다.');
             else alertify.error('수정에 실패했습니다.');
             membertable.ajax.reload();
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
    
    past_namelist_table = $('#dataTable_2').DataTable({
      pagingType: "numbers",
      ajax: {
        url: "api/requestNameList",
        type: 'POST',
        data: function(d) {
          let val = $('#namelist').val();
          d.semister = val ? val.replace('namelist_', '') : settings['currentSemister'];
        },
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
    
    $.ajax({ // Request Namelist DBs
      url: 'api/requestNamelistTables',
      type: "POST",
      dataType: 'json',
      success: function(res) {
        var data = [], str = '';
        for(var obj of res) data.push(obj['Tables_in_ajoumeow']);
        for(var obj of data.reverse()) str += '<option value="' + obj + '">' + obj.replace('namelist_', '') + '학기</option>';
        $('.namelist_select').html(str);
        $('#calendar1365').val(new Date().format('yyyy-mm'));
      }
    });
    
    $('#timestamp').datepicker('update', new Date().format('yyyy-mm-dd'));
    load();
  });
}

async function load() {
  var record, verify;
  $.ajax({
    url: 'api/requestLatestVerify',
    type: 'POST',
    success: function(res) { $('#latestConfirm').text('마지막 인증 기록 : ' + new Date(res[0].date).format('yyyy-mm-dd')); }
  });
  
  await $.ajax({
    url: 'api/requestVerifyList',
    type: 'POST',
    dataType: 'json',
    data: { date: $('#timestamp').datepicker('getDate').format('yyyy-mm-dd') },
    success: function(res) { record = res.record; verify = res.verify }
  });
  
  $("#autolist").html('').prepend("<div style='margin-top: 5px; margin-bottom: -10px'><label><input type='checkbox' id='boost' value='test'>&nbsp;마일리지 상향 지급하기</input></label></div><hr style='width: 100%'>");
  for(var obj of record) $('#autolist').append("<div><label><input type='checkbox' name='recordList' checked='checked' value='" + obj.ID + '/' + obj.name + '/' + obj.course + "'>&nbsp;" + obj.ID + ' ' + obj.name + ' / ' + obj.course + "</input></label></div>");
  
  $('#deletelist').html('<br>');
  for(var obj of verify) $('#deletelist').append("<div><label><input type='checkbox' name='deleteList' value='" + obj.ID + '/' + obj.name + '/' + obj.course + "'>&nbsp;" + obj.ID + ' ' + obj.name + ' / ' + obj.course + "</input></label></div>");
}

$("#DATA a#submit").click( function(event) {
  var operation = $('input[name=verifyType]:checked').val();
  
  if(operation == 'auto') {
    var payload = [];
    var autolist = $('input[name=recordList]:checked');
    for(var obj of autolist) {
      var tmp = $(obj).val().split('/');
      payload.push({
        'ID' : tmp[0],
        'date' : $('#timestamp').datepicker('getDate').format('yyyy-mm-dd'),
        'name' : tmp[1],
        'course' : tmp[2],
        'score' : null
      });
    }
    var customlist = $('input[name=customRecordList]:checked');
    for(var obj of customlist) {
      payload.push({
        'ID' : $(obj).next().val(),
        'date' : $('#timestamp').datepicker('getDate').format('yyyy-mm-dd'),
        'name' : $(obj).next().next().val(),
        'course' : $(obj).next().next().next().val() + '코스',
        'score' : null
      });
    }
    if(validator(payload)) scoreProvider(payload);
  }
  
  else if(operation == 'manual') {
    var payload = [];
    var manuallist = $('input[name=manualrecord]:checked');
    for(var obj of manuallist) {
      payload.push({
        'ID' : $(obj).next().val(),
        'date' : $('#timestamp').datepicker('getDate').format('yyyy-mm-dd'),
        'name' : $(obj).next().next().val(),
        'course' : $(obj).next().next().next().next().next().val(),
        'score' : $(obj).next().next().next().next().val()
      });
    }
    if(validator(payload)) transmitter(payload);
  }
  
  else if(operation == 'delete') {
    var payload = [];
    var deletelist = $('input[name=deleteList]:checked');
    for(var obj of deletelist) {
      var tmp = $(obj).val().split('/');
      payload.push({
        'ID' : tmp[0],
        'date' : $('#timestamp').datepicker('getDate').format('yyyy-mm-dd'),
        'name' : tmp[1],
        'course' : tmp[2]
      });
    }
    if(validator(payload)) {
      $.ajax({
        url: 'api/deleteVerify',
        type: 'POST',
        data: { data : JSON.stringify(payload) },
        success: function() {
          alertify.error('삭제되었습니다.');
          $('#deletelist').val('');
          load();
        }
      });
    }
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
  var isWeekEnd = new Date($('#timestamp').datepicker('getDate').format('yyyy-mm-dd')).getDayNum() > 5;
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
    url: 'api/verify',
    type: 'POST',
    dataType: 'json',
    data: { data: JSON.stringify(payload) },
    success: function() {
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
    var obj = $(this).attr('class').split(' '), req = {};
    console.log(obj)
    if (obj.includes('settingSemister')) { // 학기 설정
      req.param = 'currentSemister';
      req.data = $('#currentYear').val() + '-' + $('#currentSemister').val();
    }
    else if(obj.includes('settingApply')) { // 회원 등록 허용 여부
      req.param = 'isApply';
      req.data = !$('#isApply').is(':checked');
      req.data = req.data.toString().toUpperCase();
      
      if(!$('#isApply').is(':checked')) $('#isApplyRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
      else $('#isApplyRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);
      if(!$('#isApplyRestricted').is(':checked')) $('#isApplyRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
      else $('#isApplyRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
    }
    else if(obj.includes('settingApplyRestricted')) { // 회원등록 기간 제한 여부
      req.param = 'isApplyRestricted';
      req.data = !$('#isApplyRestricted').is(':checked');
      req.data = req.data.toString().toUpperCase();
      
      if(!$('#isApplyRestricted').is(':checked')) $('#isApplyRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
      else $('#isApplyRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
    }
    else if(obj.includes('settingApplyCalendar')) { // 회원등록 기간 설정
      req.param = 'applyTerm';
      req.data = $('#applyStartDate').val() + '~' + $('#applyEndDate').val();
    }
    else if(obj.includes('settingRegister')) { // 신입 모집 허용 여부
      req.param = 'isRegister';
      req.data = !$('#isRegister').is(':checked');
      req.data = req.data.toString().toUpperCase();
      
      if(!$('#isRegister').is(':checked')) $('#isRegisterRestricted_container').css('opacity', '1').find('input').attr('disabled', false);
      else $('#isRegisterRestricted_container').css('opacity', '0.2').find('input').attr('disabled', true);      
      if(!$('#isRegisterRestricted').is(':checked')) $('#isRegisterRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
      else $('#isRegisterRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
    }
    else if(obj.includes('settingRegisterRestricted')) { // 신입 모집 기간 제한 여부
      req.param = 'isRegisterRestricted';
      req.data = !$('#isRegisterRestricted').is(':checked');
      req.data = req.data.toString().toUpperCase();
      
      if(!$('#isRegisterRestricted').is(':checked')) $('#isRegisterRestrictedCalendar_container').css('opacity', '1').find('input').attr('disabled', false);
      else $('#isRegisterRestrictedCalendar_container').css('opacity', '0.2').find('input').attr('disabled', true);
    }
    else if(obj.includes('settingRegisterCalendar')) { // 신입 모집 기간 설정
      req.param = 'registerTerm';
      req.data = $('#registerStartDate').val() + '~' + $('#registerEndDate').val();
    }
    else if(obj.includes('notice')) {
      req.param = 'notice';
      req.data = $('#notice').val();
    }
    
    $.ajax({
      type: 'POST',
      url: 'api/modifySettings',
      data: { 'editParam' : req.param, 'editData' : req.data },
      success: function(res) { 
        if(res.result) alertify.success('설정이 변경되었습니다');
        else alertify.error('설정 변경에 실패하였습니다')},
      error: function() { alertify.error('설정 변경에 실패하였습니다.<br>다시 시도해 주세요'); }
    });
  });
  $('#timestamp').datepicker().on('changeDate', function(e) {
    console.log(e);
    load();
  });
  $('#download1365').click(function() {
    if($('#calendar1365').val()) {
      $('#calendar1365, #download1365, #namelist_1365').attr('disabled', true);
      $.ajax({
        url: "api/request1365",
        type: 'POST',
        data: { month: $('#calendar1365').val(), namelist: $('#namelist_1365').val() },
        success: function(res) {
          if(res.result) {
            alertify.success('문서 생성이 완료되었습니다.');
            window.open('api/download1365');
          }
        },
        error: function(req) { alertify.error(req.responseJSON.error.code); },
        complete: function() { $('#calendar1365, #download1365, #namelist_1365').attr('disabled', false); }
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
  $('#memberDeleteConfirm').click(function() {
    $.ajax({
      url: 'api/deleteMember',
      type: 'POST',
      data: { delete: $('#deletemember').val() },
      success: function(res) {
        if(res.result) {
          alertify.error('회원이 제명되었습니다.');
          membertable.ajax.reload();
        }
        else alertify.error('등록되지 않은 학번입니다.');
      }
    });
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
  $('select#namelist').change(function() {
    let val = $(this).val().replace('namelist_', '');
    if(val == settings['currentSemister']) {
      $('#current_namelist').css('display', 'block');
      $('#past_namelist').css('display', 'none');
    }
    else {
      $('#current_namelist').css('display', 'none');
      $('#past_namelist').css('display', 'block');
      past_namelist_table.ajax.reload();
    }
  });
  $('#download_namelist').click(function() {
    let val = $('#namelist').val().replace('namelist_', '');
    $.ajax({
      url: "api/requestNameList",
      type: 'POST',
      data: 'semister=' + val,
      success: function(res) {
        function s2ab(s) {
 	        var buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
          var view = new Uint8Array(buf);  //create uint8array as viewer
          for (var i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF; //convert to octet
          return buf;
        }
        var excelHandler = {
          getExcelFileName : function() { return val + '학기 명단.xlsx'; },
          getSheetName : function() { return val + '학기'; },
          getExcelData : function() { return res; },
          getWorksheet : function() { return XLSX.utils.json_to_sheet(this.getExcelData()); }
        }
        var wb = XLSX.utils.book_new();
        var newWorksheet = excelHandler.getWorksheet();
        XLSX.utils.book_append_sheet(wb, newWorksheet, excelHandler.getSheetName());
        var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
        saveAs(new Blob([s2ab(wbout)], { type: "application/octet-stream" }), excelHandler.getExcelFileName());
      }
    });
  });
}
/*
testcase = [], exec = 100000;
function test() {
  for(let i = 0; i < exec; i++) $('#pick').trigger('click');
  for(let i in testcase) testcase[i].ep = Math.round(testcase[i].case / exec * 1000) / 10 + '%';
  testcase.sort((a, b) => parseFloat(b.case) - parseFloat(a.case));
  console.log('runtime: ' + exec);
  console.log(testcase);
}
*/
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
  