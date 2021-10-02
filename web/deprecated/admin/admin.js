$(function() {
    isValid = false;
    onLoad();
    clickEventListener();
});
function onLoad() {
  data = [], datum = [], verifData = [];
  errorCount = 0, addCount = 0, mnAddCount = 0;
  $('#status').css('color', '#ffbf00');
  $('#status').text('Loading Data...');
  alertify.log('로딩 중...');
  $('input, select').attr('disabled', true);
  $('#adminPW, #confirmAdmin').attr('disabled', false);

  if(!isValid) MicroModal.show('admin');
  $('#adminPW').focus();

  function requestVerifyData() {
    return $.ajax({ // Request Receiver Sheet
      url: 'https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec',
      type: "GET",
      dataType: 'text',
      cache: false,
      success: function (response) {
        datum = response.split('\n').map((line) => line.split(','));
      }
    });
  }
  function requestLatestVerify() {
    return $.ajax({
      url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
      data: encodeURI('type=requestLatest'),
      type: "POST",
      dataType: 'text',
      cache: false,
      success: function (response) {
        verifData = response.split('\n').map((line) => line.split(','));
        $('#latestConfirm').text('마지막 인증 날짜 : ' + verifData[verifData.length - 2][0]);
      }
    });
  }
  
  $.when(requestVerifyData(), requestLatestVerify()).done(function(res1, res2) {
    $('#tab-1 input, #tab-1 select').attr('disabled', false);
    $('#status').css('color', '#15be00');
    $('#status').text('Ready.');
    load();
  });
  $.ajax({ // Request settings
    url: "https://luftaquila.io/ajoumeow/api/requestSettings",
    type: "POST",
    dataType: 'json',
    cache: false,
    success: function(settings) {
      $('#currentYear').val(settings['currentSemister'].split('-')[0]);
      $('#currentSemister').val(settings['currentSemister'].split('-')[1]);
      document.getElementById('applyStartDate').valueAsDate = new Date(new Date(settings['applyTerm'].split('~')[0]) - (-1) * 9 * 3600 * 1000);
      document.getElementById('applyEndDate').valueAsDate = new Date(new Date(settings['applyTerm'].split('~')[1]) - (-1) * 9 * 3600 * 1000);
      $('#isAdditionalApplyAllowed').val(settings['isAllowAdditionalApply'].toUpperCase()).attr('selected', 'selected');
      document.getElementById('registerStartDate').valueAsDate = new Date(new Date(settings['registerTerm'].split('~')[0]) - (-1) * 9 * 3600 * 1000);
      document.getElementById('registerEndDate').valueAsDate = new Date(new Date(settings['registerTerm'].split('~')[1]) - (-1) * 9 * 3600 * 1000);
      $('#isAdditionalRegisterAllowed').val(settings['isAllowAdditionalRegister'].toUpperCase()).attr('selected', 'selected');

      //var namelist = settingList[settingList.length - 2][1].split('|'), txt = '';
      //for(var i in namelist) if(namelist[i].includes('NameList') && !namelist[i].includes('Template')) txt += "<option>" + namelist[i] + "</option>";
      //$('#namelist, #namelist-config').html(txt);
      requestMemberList();
      $('#tab-2 input, #tab-2 select').attr('disabled', false);
      $('#tab-3 input, #tab-3 select').attr('disabled', false);
    }
  });
  $.ajax({ // Request Sheet Lists
    url: "https://script.google.com/macros/s/AKfycbwOT83RGEPIgdu1oTM9VvBqyRN6jcEXRkGlpdqG1EUCr1HdaBxX/exec",
    data: encodeURI('type=requestSheetLists'),
    type: "POST",
    dataType: 'text',
    cache: false,
    success: function(response) {
      var sheetList = response.split('|'), str = '';
      sheetList.pop();
      for(var i in sheetList) if(!sheetList[i].includes('template')) str += '<option>' + sheetList[i] + '</option>';
      $('#newMemberList').html(str);
      $('#tab-4 input, #tab-4 select').attr('disabled', false);
    }
  });
}
function requestMemberList() {/*
  $('#memberNameList').html('Loading member list...');
  $.ajax({
    url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
    data: encodeURI('type=requestMemebers&semister=' + $('#namelist-config').val().split(' ')[1]),
    type: "POST",
    success: function(response) { namelistConfig(response.split('\n').map((line) =>line.split(','))); }
  });*/
}
$("#DATA").submit( function(event) {
  $('input, select').attr('disabled', true);
  var request, serializedData = '';
  if (request) { request.abort(); }
  if($("#nonManual").prop('checked')) {
    var flag = true;
    $("input:checkbox[name=add]:checked").each(function() { if(!$.trim($($(this).siblings($('input'))[0]).val())) flag = false; });
    if(!/\d\d\d\d\-\d\d\-\d\d/g.test($("#timestamp").val())) {
      $('#status').css('color', '#da0000');
      $('#status').text('ERR_WRONG_DATE');
      $('input, select').attr('disabled', false);
    }
    else if(!$("input:checkbox[name=namelist]:checked").length && !$("input:checkbox[name=add]:checked").length) {
      $('#status').css('color', '#da0000');
      $('#status').text('ERR_NO_PAYLOAD');
      $('input, select').attr('disabled', false);
    }
    else if(!flag) {
      $('#status').css('color', '#da0000');
      $('#status').text('ERR_INVALID_PAYLOAD');
      $('input, select').attr('disabled', false);
    }
    else {
      var count = 0, dateSlicer = $("#timestamp").val().split('-');
      var date = new Date(dateSlicer[0], dateSlicer[1] - 1, dateSlicer[2]).format('yyyy. m. d');
      $("input:checkbox[name=namelist]:checked").each(function() {
        var nameSlicer = $.trim($(this).val()).split('/');
        data[count] = [];
        data[count][0] = nameSlicer[0];
        data[count][1] = nameSlicer[1];
        count++;
      });
      $("input:checkbox[name=add]:checked").each(function() {
        var obj = $(this).siblings($('input'));
        if(!$.trim($(obj[0]).val())) return;
        data[count] = [];
        data[count][0] = $(obj[0]).val();
        data[count][1] = $(obj[1]).val() + '코스';
        count++;
      });
      for(var i = 1; i < 4; i++) { scoreProvider(data, date, i, $("#boost").prop('checked')); }
      serializedData += 'type=verification&지급 일자=' + date + '&length=' + data.length;
      for(var i = 0; i < data.length; i++) { serializedData += "&이름" + i + "=" + data[i][0] + "&코스" + i + "=" + data[i][1] + "&점수" + i + "=" + data[i][2]; }
      transmitter(serializedData);
    }
  }
  else if($("#Manual").prop('checked')) {
    var flag = true;
    $("input:checkbox[name=mnAdd]:checked").each(function() {
      $($(this).siblings($('input'))).each(function() {
        if(!$.trim($(this).val())) flag = false;
      });
    });
    if(!/\d\d\d\d\-\d\d\-\d\d/g.test($("#timestamp").val())) {
      $('#status').css('color', '#da0000');
      $('#status').text('ERR_WRONG_DATE');
      $('input, select').attr('disabled', false);
    }
    else if(!$("input:checkbox[name=mnAdd]:checked").length) {
      $('#status').css('color', '#da0000');
      $('#status').text('ERR_NO_PAYLOAD');
      $('input, select').attr('disabled', false);
    }
    else if(!flag) {
      $('#status').css('color', '#da0000');
      $('#status').text('ERR_INVALID_PAYLOAD');
      $('input, select').attr('disabled', false);
    }
    else {
      var dateSlicer = $("#timestamp").val().split('-'), cnt = 0;
      var date = new Date(dateSlicer[0], dateSlicer[1] - 1, dateSlicer[2]).format('yyyy. m. d');
      serializedData += 'type=verification&지급 일자=' + date + '&length=' + $("input:checkbox[name=mnAdd]:checked").length;
      $("input:checkbox[name=mnAdd]:checked").each(function() {
        var obj = $(this).siblings($('input'));
        serializedData += "&이름" + cnt + "=" + $.trim($(obj[0]).val()) + "&코스" + cnt + "=" + $.trim($(obj[2]).val()) + "&점수" + cnt + "=" + $(obj[1]).val();
        cnt++;
      });
      transmitter(serializedData);
    }
  }
  else if($('#delete').prop('checked')) {
    if(!/\d\d\d\d\-\d\d\-\d\d/g.test($("#timestamp").val())) {
      $('#status').css('color', '#da0000');
      $('#status').text('ERR_WRONG_DATE');
      $('input, select').attr('disabled', false);
    }
    else if(!$("input:checkbox[name=del]:checked").length) {
      $('#status').css('color', '#da0000');
      $('#status').text('ERR_NO_PAYLOAD');
      $('input, select').attr('disabled', false);
    }
    else {
      var cnt = 0;
      serializedData += 'type=deleteVerification&날짜=' + $("#timestamp").val() + '&length=' + $("input:checkbox[name=del]:checked").length;
      $("input:checkbox[name=del]:checked").each(function() {
        var num = (/_[0-9]+/g).exec($(this).attr('id'))[0].replace('_', '');
        serializedData += "&이름" + cnt + "=" + $('#name_' + num).text() + "&코스" + cnt + "=" + $('#course_' + num).text() + "&점수" + cnt + "=" + $('#score_' + num).text();
        cnt++;
      });
      transmitter(serializedData);
    }
  }
  event.preventDefault();
});
function scoreProvider(data, date, course, check) {
  var low = 1, mid = 1.5, high = 2;
  if(check) { low = 1.5; mid = 2; high = 3; }
  var dateArray = new Date(date.replace(/\s/g, '').replace(/\./g, '-'));
  for(var i = count = 0; i < data.length; i++) { if(data[i][1].includes(course + "코스")) count++; }
  if(count == 1) {
    if(dateArray.getDay() == 0 || dateArray.getDay() == 6) { for(var i = 0; i < data.length; i++) { if(data[i][1].includes(course + "코스")) { data[i][2] = high; } } }
    else { for(var i = 0; i < data.length; i++) { if(data[i][1].includes(course + "코스")) data[i][2] = mid; } }
  }
  else {
    if(dateArray.getDay() == 0 || dateArray.getDay() == 6) { for(var i = 0; i < data.length; i++) { if(data[i][1].includes(course + "코스")) { data[i][2] = mid; } } }
    else { for(var i = 0; i < data.length; i++) { if(data[i][1].includes(course + "코스")) data[i][2] = low; } }
  }
}
function load() {
  data = [], addCount = 0, mnAddCount = 0;
  var currentDate = $("#timestamp").val(), str = "", count = 0;
  $('#delWrapper').html('');
  if(currentDate) {
    $('#add').css('display', 'block');
    $('#mnadd').css('display', 'block');
    var dateSlicer = $("#timestamp").val().split('-'), j = 1;
    currentDate = new Date(dateSlicer[0], dateSlicer[1] - 1, dateSlicer[2]).format('yyyy. m. d');

    for(var i = 0; i < datum.length - 1; i++) { if(currentDate == datum[i][1]) { str += '<label for="namelist_' + j + '">' + '<input type="checkbox" checked="checked" name="namelist" id="namelist_' + j + '" value=' + $.trim(datum[i][0]) + "/" + $.trim(datum[i][2]) + '>' + datum[i][0] + " / " + datum[i][2] + "</input></label><br>"; j++; } }
    $("#list").html(str).prepend("<label for='radio'><input type='checkbox' id='boost' value='test'>마일리지 할증</input></label><hr style='width:130px;border-bottom:0px;text-align:left;margin-left:0px'>");

    $('#delWrapper').append('<table id="delTable" style="text-align:center;"><tr height="30"><td></td><td>날짜</td><td>이름</td><td>코스</td><td>점수</td></tr><tr><td colspan="5"><hr style="width:auto;border-bottom:0px;text-align:left;margin-left:0px"></td></tr>');
    for(var i = 0; i < verifData.length - 1; i++) {
      if(verifData[i][0] == currentDate) {
        $('#delTable').append('<tr><td><input type="checkbox" name="del" id="chk_' + count + '"</input></td><td id="date_' + count + '">' + verifData[i][0] + '</td><td id="name_' + count + '">' + verifData[i][1] + '</td><td id="course_' + count + '">' + verifData[i][2] + '</td><td id="score_' + count + '">' + verifData[i][3] + '</td></tr>');
        count++;
      }
    }
  }
  else {
    $('#add').css('display', 'none');
    $('#mnadd').css('display', 'none');
    $('#list').html('');
    $('#addSection').html('');
    $('#mnAddSection').html('');
    $('#delWrapper').html('');
  }
}
function transmitter(serializedData) {
    console.log("DataSet : " + serializedData);
    $('#status').css('color', '#ffbf00');
    $('#status').text('Sending Data...');
    $.ajax({
        type: 'POST',
        url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
        data: encodeURI(serializedData),
        success: function() { initializer(); },
        error: function(err) {
          $('#status').css('color', '#da0000');
          $('#status').text('Error - ' + err);
        }
    });
}
  function initializer() {
    //if(cfm == serializedData.length) {
      $('input, select').attr('disabled', false);
      $('#timestamp').val('');
      $('#status').css('color', '#15be00');
      $('#status').text('Transmitted.');
      load();

      $.ajax({
        url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
        data: encodeURI('type=requestLatest'),
        type: "POST",
        dataType: 'text',
        cache: false,
        success: function (response) {
          verifData = response.split('\n').map((line) => line.split(','));
          $('#latestConfirm').text('마지막 인증 날짜 : ' + verifData[verifData.length - 2][0]);
          load();
        }
      });
    //}
    //else if(req == serializedData.length) alert('Data loss during transmission!!!\nPlease check sheet data');
}
function clickEventListener() {
  $('ul.tabs li').click(function() {
    var tab_id = $(this).attr('data-tab');
    $('ul.tabs li').removeClass('current');
    $('.tab-content').removeClass('current');
    $(this).addClass('current');
    $("#" + tab_id).addClass('current');
  });
  $('#reload').click(function () { onLoad(); });
  $('#nonManual').click(function() { $("#stdWrapper").show(); $("#mnWrapper").hide(); $('#delWrapper').hide(); });
  $('#Manual').click(function() { $("#stdWrapper").hide(); $("#mnWrapper").show(); $('#delWrapper').hide(); });
  $('#delete').click(function() { $('#delWrapper').show(); $('#stdWrapper').hide(); $('#mnWrapper').hide(); });
  $('#add').click(function() {
    addCount++;
    var div = $('<div id="addDiv_' + addCount + '"></div>');
    $('#addSection').append(div);
    div.append($('<input type="checkbox" checked name="add" id="addlist_' + addCount + '">'));
    div.append($('<input id="addInput_' + addCount + '" style="width: 50" />')).append(' / ');
    div.append($('<select id="addSelect_' + addCount + '"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>')).append(' 코스');
  });
  $('#mnadd').click(function() {
    mnAddCount++;
    if(mnAddCount == 2) {
      $('#mnAddSection').prepend('<span id="autoReason">> 지급 사유 통일하기</span><br><span style="line-height:25%"><br></span>');
      $('#autoReason').click(function() {
        var reason = $('#mnAddReason_1').val();
        $("input:checkbox[name=mnAdd]").each(function() {
          $($(this).siblings($('input'))[2]).val(reason);
        });
      });
    }
    var div = $('<div id="mnAddDiv_' + mnAddCount + '"></div>');
    $('#mnAddSection').append(div);
    div.append($('<input type="checkbox" checked name="mnAdd" id="mnAddlist_' + mnAddCount + '">'));
    div.append('이름 : ').append($('<input id="mnAddName_' + mnAddCount + '" style="width: 50" />')).append('&nbsp;&nbsp;');
    div.append('점수 : ').append($('<input type="number" id="mnAddScore_' + mnAddCount + '" style="width: 30" />')).append('&nbsp;&nbsp;');
    div.append('지급 사유 : ').append($('<input id="mnAddReason_' + mnAddCount + '" style="width: 80" />')).append('&nbsp;&nbsp;');
  });
  $('#confirmAdmin').click(function() {
    if($('#adminPW').val() == '0512') {
      MicroModal.close('admin');
      isValid = true;
    }
    else {
      errorCount++;
      if(errorCount > 4) { alert('Access Denied'); window.location.href = '/ajoumeow'; }
      else {
        $('#modalText').text('비밀번호 오류 ' + errorCount + '회');
        $('#adminPW').focus();
      }
    }
  });
  $('.setting').change(function() {
    var obj = $(this).attr('class'), req;
    if     (obj.includes('settingSemister')) req = ['currentSemister', $('#currentYear').val() + '-' + $('#currentSemister').val()];
    else if(obj.includes('settingApplyCalendar')) req = ['applyTerm', $('#applyStartDate').val() + '~' + $('#applyEndDate').val()];
    else if(obj.includes('settingAdditionalApply')) req = ['isAllowAdditionalApply', $('#isAdditionalApplyAllowed').val()];
    else if(obj.includes('settingRegisterCalendar')) req = ['registerTerm', $('#registerStartDate').val() + '~' + $('#registerEndDate').val()];
    else if(obj.includes('settingAdditionalRegister')) req = ['isAllowAdditionalRegister', $('#isAdditionalRegisterAllowed').val()];
    
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
  $('#download1365').click(function() {
    if($('#calendar1365').val()) {
      var tmp = $('#calendar1365').val().split('-'), check = false;;
      var year = tmp[0], month = parseInt(tmp[1], 10);
      alertify.log('문서 생성을 시작합니다.<br>문서 생성에는 약 3분 정도 소요됩니다.<br><br>다운로드 시작 전까지 이 페이지를 닫지 마세요.');
      $('#calendar1365, #download1365, #quickdownload1365, #namelist').attr('disabled', true);
      chexk = true;
      $.ajax({
        type: 'POST',
        url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
        data: encodeURI('type=volunteerRequest&reqYear=' + year + '&reqMonth=' + month + '&reqNamelist=' + $('#namelist').val()),
        success: function(response) {
          if(response.includes('success')) {
            alertify.success('문서 생성이 완료되었습니다.');
            location.href = 'https://docs.google.com/spreadsheets/d/1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A/export?format=pdf&gid=1723852450';
          }
        },
        error: function(jqXHR, textStatus, errorThrown) { alertify.error('문서 생성 또는 다운로드에 실패하였습니다.<br>다시 시도해 주세요.<br><br>문제가 계속되면 개발자에게 연락하세요.<br>ERR_LOG : ' + errorThrown); },
        complete: function() { $('#calendar1365, #download1365, #quickdownload1365, #namelist').attr('disabled', false); check = false; }
      });
    }
    else alertify.error('년/월을 선택하세요');
    
    $(window).on("beforeunload", function(){
      if(check) return "아직 문서 작성이 완료되지 않았습니다. 나가시겠습니까?";
    });
  });
  $('#quickdownload1365').click(function() {
    location.href = 'https://docs.google.com/spreadsheets/d/1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A/export?format=pdf&gid=1723852450';
  });

  $(document).keypress(function(e) { if( $('#admin').hasClass('is-open') && (e.keyCode == 13 || e.which == 13) ) $('#confirmAdmin').click(); });
  $('#currentYear').keyup(function() {
     if(this.value.length > this.maxLength) this.value = this.value.slice(0, this.maxLength);
     if(Number(this.value) < 20) this.value = this.value.slice(0, 1);
  });
  $('#namelist-config').change(requestMemberList);
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
}

function namelistConfig(list) {
  list.pop();
  var collegeDict = {
        '공과대학' : ['기계공학과', '산업공학과', '화학공학과', '신소재공학과', '응용화학생명공학과', '환경안전공학과', '건설시스템공학과', '교통시스템공학과', '건축학과', '건축공학과', '융합시스템공학과'],
        '정보통신대학' : ['전자공학과', '소프트웨어학과', '사이버보안학과', '미디어학과', '국방디지털융합학과'],
        '자연과학대학' : ['수학과', '물리학과', '화학과', '생명과학과'],
        '경영대학' : ['경영학과', 'e-비즈니스학과', '금융공학과', '글로벌경영학과'],
        '인문대학' : ['국어국문학과', '영어영문학과', '불어불문학과', '사학과', '문화콘텐츠학과'],
        '사회과학대학' : ['경제학과', '행정학과', '심리학과', '사회학과', '정치외교학과', '스포츠레저학과'],
        '의과대학' : ['의학과'],
        '간호대학' : ['간호학과'],
        '약학대학' : ['약학과'],
        '국제학부' : ['국제통상전공', '지역연구전공(일본)', '지역연구전공(중국)'],
        '다산학부대학' : ['다산학부대학'],
        '기타' : ['기타']
  }
  var txt = '', collegeTxt = '';
  for(var college in collegeDict) collegeTxt += '<option value="' + college + '">' + college + '</option>';

  txt += '<table id="memberNameList" style="border-spacing: 0 10; text-align: center">';
  txt += '<tr><td colspan="2">번호</td><td>단과대학</td><td>학과</td><td>학번</td><td>이름</td><td>전화번호</td><td>생년월일</td><td>1365 아이디</td><td>가입 학기</td><td>직책</td></tr>';
  for(var i in list) {
    txt += '<tr id="' + list[i][3] + '">';
    txt += '<td><input type="button" value="&times" /></td>';
    txt += '<td style="font-weight: bold">' + (Number(i) + 1) + '</td>';
    txt += '<td><select class="cell college" style="width: 100">' + collegeTxt + '</select></td>';
    txt += '<td><select class="cell department" style="width: 150"></select></td>';
    txt += '<td><input class="cell studentNumber" style="width: 85" value="' + list[i][2] + '" /></td>';
    txt += '<td><input class="cell memberName" style="width: 60" value="' + list[i][3] + '" /></td>';
    txt += '<td><input class="cell phone" style="width: 110" value="' + list[i][4] + '" /></td>';
    txt += '<td><input class="cell birthday" style="width: 60" value="' + list[i][5] + '" /></td>';
    txt += '<td><input class="cell id1365" style="width: 110" value="' + list[i][6] + '" /></td>';
    txt += '<td><input class="cell registerSemister" style="width: 90" value="' + list[i][7] + '" /></td>';
    txt += '<td><input class="cell role" style="width: 60" value="' + list[i][8] + '" /></td>';
    txt += '</tr>';
  }
  txt += '</table>';
  $('#namelistWrap').html(txt);
  for(var i in list) {
    var obj = $('#memberNameList tr#' + list[i][3] + ' select.college option:contains(' + list[i][0] + ')');
    if(obj.length == 12) obj = obj.parent().children('option:contains("기타")');
    obj.attr('selected', true); 

    var departmentTxt = '';
    for(var j in collegeDict[obj.val()]) departmentTxt += '<option value="' + collegeDict[obj.val()][j] + '" ' + (collegeDict[obj.val()][j] == list[i][1] ? 'selected' : '') + '>' + collegeDict[obj.val()][j] + '</option>';
    $('#memberNameList tr#' + list[i][3] + ' select.department').html(departmentTxt);
  }
  $('.cell').change(function() {
    console.log($(this).parent().parent().attr('id'));
    
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
        m:    m + 1,
        yyyy: y,
      };
    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}();
Date.prototype.format = function (mask, utc) { return dateFormat(this, mask, utc); };
