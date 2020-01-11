$(function() {
  lazyload();
  contextLoader();
  eventListener();
  howsTheWeather();
  load();
  //military();
});
function load() {
  stat = [false, false];
  $('input').attr('disabled', true);
  $("#latestUpdate").html("Loading...");
  $('svg').addClass('rotating');
  $('#recentUpdate').text($('#version').text() + ' : ' + $('#release').text().substr(0, 10));
  $('#info').attr('href', '/ajoumeow/about.html?' + $('#version').html() + '!' + $('#release').html());
  $.ajax({
    url: 'https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec',
    type: "GET",
    dataType: 'text',
    cache: false,
    success: newYourNameIs
  });
  $.ajax({
    url: 'https://docs.google.com/spreadsheet/pub?key=1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A&single=true&gid=1034362398&sheet=Statistics&range=A4:E6&output=csv',
    type: "GET",
    dataType: 'text',
    cache: false,
    success: function (response) {
      var rankArray = response.split('\n').map((line) => line.split(','));
      rankArray.forEach(function(value) { value.splice(2, 1); });
      for(var i = 1; i <= 3; i++) {
        $("#this_" + i).html(rankArray[i - 1][0]);
        $("#past_" + i).html(rankArray[i - 1][2]);
        $("#this_t_" + i).html(parseFloat(rankArray[i - 1][1]));
        $("#past_t_" + i).html(parseFloat(rankArray[i - 1][3]));
      }
    }
  });
  $.ajax({
    url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
    data: encodeURI('타입=일정'),
    type: "POST",
    dataType: 'text',
    cache: false,
    success: function(response) {
      scheduleList = response.split('\n').map((line) => line.split(','));
      stat[0] = true;
      setCalendar();
    }
  });
}
function newYourNameIs(response) {
  var startIndex, errCount = 0;
  var datum = response.split('\n').map((line) => line.split(','))
  var table = Array(14).fill('').map(x => Array(6).fill(''));
  for(var i = 0; i < 14; i++) {
    var day = new Date(year, 0, 1 + (i % 7) + ((week + Math.floor(i / 7) - 1) * 7) - new Date(year, 0, week * 7).getDay());
    if(!i) { for(var index in datum) { if(day.format("yyyy. m. d") == datum[index][1]) { startIndex = index; break; } } }
    if(!startIndex) {
      while(!startIndex && errCount < 14) {
        day.setDate(day.getDate() + 1);
        for(var index in datum) { if(day.format("yyyy. m. d") == datum[index][1]) { startIndex = index; break; } }
        i++; errCount++;
      }
    }
    if(startIndex) {
      while(datum[startIndex][1] == day.format("yyyy. m. d")) {
        for(var j = 1; j <= 3; j++) {
          if(datum[startIndex][2].includes(String(j))) {
            if(!table[i][2 * (j - 1)]) table[i][2 * (j - 1)] = datum[startIndex][0];
            else if(!table[i][2 * (j - 1) + 1] && !(datum[startIndex][0] == table[i][2 * (j - 1)])) table[i][2 * (j - 1) + 1] = datum[startIndex][0];
          }
        } startIndex++;
      }
    }
  }
  setData(table);
  console.log('Ready. ' + (dataSize(response) / 1000).toFixed(1) + 'KB Loaded');
}
function setData(table) {
  $("#latestUpdate").html("Latest Update : " + new Date().format("TT hh시 MM분 ss초"));
  $('#confirmAdmin').click(function() {
    if($('#adminPW').val() == '0512') {
      for(var i = 0; i < 14; i++) {
        for(var j = 0; j < 6; j++) {
          if(table[i][j]) $('#nameCell_' + i + '_' + j).addClass('reserved');
          else $('#nameCell_' + i + '_' + j).addClass('notReserved');
        }
      }
      $('#date').text('관리자 모드');
    }
    MicroModal.close('admin');
  });
  for(var i = 0; i < 14; i++) {
    var day = new Date(year, 0, 1 + (i % 7) + ((week + Math.floor(i / 7) - 1) * 7) - new Date(year, 0, week * 7).getDay());
    $('#dateCell_' + i).text(day.format('m/d(ddd)'));
    for(var j = 0; j < 6; j++) {
      $('#nameCell_' + i + '_' + j).removeClass('reserved notReserved').text(table[i][j]);
      if(i > (today.getDay() || 7) - 2) {
        if(table[i][j]) $('#nameCell_' + i + '_' + j).addClass('reserved');
        else $('#nameCell_' + i + '_' + j).addClass('notReserved');
      }
    }
  }
  if(!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) {
    $('.reserved, .notReserved').addClass('ios');
    $('.reload, .popup, #icon, ul.tabs.li').addClass('ios');
  }
  $('td:contains(' + today.format('m/d(ddd)') + ')').css('backgroundColor', 'greenyellow');
  for(var i = 0; i < 7; i++) $("#dateCell_" + i).css("color", "#000000");
  if(Cookies.get('versionInfo') != $('#version').text()) {
    Cookies.set('versionInfo', $('#version').text(), {expires : 30});
    MicroModal.show('noticeModal');
  }
  if(!Cookies.get('fillName')) {
    MicroModal.show('askName');
    $('#nameSubmit').click( function() {
      Cookies.set('fillName', $.trim($('#name').val()), {expires : 365});
      MicroModal.close('askName');
    });
  }

  stat[1] = true;
  setCalendar();

  $('svg').removeClass('rotating');
  $('input').attr('disabled', false);
  $('td:contains(' + Cookies.get('fillName') + ')').css('font-weight', 'bold');
}
function validator(operationType, targetID, targetName, originalName) {
  var tomorrow = new Date();
  tomorrow.setDate(new Date().getDate() + 1);
  var locatorReturn = locator(targetID), serializedData;
  var targetDate = locatorReturn[0], targetCourse = locatorReturn[1];
  if($('#date').text() == '관리자 모드') { transmitter(operationType, targetName, targetDate, targetCourse, originalName); return; }
  if(!targetName) alertify.error('이름을 입력하세요.');
  else if(!originalName && originalName != undefined) alertify.error('이름을 입력하세요.');
  else if(targetName.indexOf(',') + 1) alertify.error('이름에 콤마(,)는 사용할 수 없습니다.');
  else if(operationType == '삭제' && targetDate == today.format('yyyy-mm-dd'))
    alertify.error('당일 삭제는 불가능합니다. 대타를 구해 수정해주세요.');
  /*else if(operationType == '삭제' && targetDate == tomorrow.format('yyyy-mm-dd') && new Date().getHours() > 17)
      alertify.error('급식 전일 오후 6시 이후 취소는 불가능합니다.');*/
  else transmitter(operationType, targetName, targetDate, targetCourse, originalName);
}
function transmitter(operationType, targetName, targetDate, targetCourse, originalName) {
  $('input').attr('disabled', true);
  if(originalName) serializedData = "타입=수정&이름=" + originalName + "&날짜=" + targetDate + "&코스=" + targetCourse + "코스&수정 이름=" + $.trim(targetName);
  else serializedData = "타입=" + operationType + "&이름=" + $.trim(targetName) + "&날짜=" + targetDate + "&코스=" + targetCourse + '코스';
  alertify.log(operationType + ' 요청 중...');
  console.log(dataSize(encodeURI(serializedData)) + "B DataSet : " + serializedData);
  request = $.ajax({
      type: 'POST',
      url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
      data: encodeURI(serializedData)
  });
  request.done(function() {
    load();
    alertify.success('Data Transmitted.');
    if(operationType == '신청') Cookies.set('fillName', $.trim(targetName), {expires : 365});
  });
  request.fail(function(jqXHR, textStatus, errorThrown) { alertify.error('Error - ' + textStatus + errorThrown); });
  request.always(function() { $('input').attr('disabled', false); });
}
function locator(targetID) {
  var targetDate = new RegExp( /\d+/ ).exec(targetID);
  var targetCourse = Math.floor(Number(targetID.substr(targetID.length - 1)) / 2) + 1;
  targetDate = new Date(year, 0, 1 + (targetDate % 7) + ((week + Math.floor(targetDate / 7) - 1) * 7) - new Date(year, 0, week * 7).getDay()).format('yyyy-mm-dd');
  return [targetDate, targetCourse];
}
function setCalendar() {
  if(stat[0] && stat[1]) {
    calendarCount = 0;
    for(i in scheduleList) {
      if(!scheduleList[i][1]) break;
      try {
        targetDayNum = scheduleList[i][1].substring(scheduleList[i][1].indexOf('/') + 1, scheduleList[i][1].indexOf('('));
        var cel = new Date(Number(scheduleList[i][0]), Number(scheduleList[i][1].substring(0, scheduleList[i][1].indexOf('/'))) - 1, Number(targetDayNum) ? targetDayNum : targetDayNum.substr(0, 1));
        if(cel >= new Date(new Date(today.format('yyyy-mm-dd')) - 9 * 3600 * 1000) && cel < new Date(year, 0, 8 + ((week + 1) * 7) - new Date(year, 0, week * 7).getDay())) {
          if(scheduleList[i][3] == 'true') {
            $('#rainbowBlockBox').css('display', 'block');
            $('td:contains(' + scheduleList[i][1] + ')').addClass('dogriver').addClass('rainbow');
          }
          $('td:contains(' + scheduleList[i][1] + ')').addClass('cal' + calendarCount);
          $('.cal' + calendarCount).html(scheduleList[i][2]);
        }
      }
      catch (e) { }
      finally { }
      calendarCount += 1;
    }

    if(Cookies.get('rainbowBlock')) {
      $('#rainbowBlock').prop('checked', true);
      $('.dogriver').removeClass('dogriver');
    }
    else {
      $('#rainbowBlock').prop('checked', false);
      $('.rainbow').addClass('dogriver');
    }
  }
}
function dataSize(s, b, i, c) { for(b = i = 0; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1); return b; }
function mileageDisplayer() { MicroModal.close('rankModal'); MicroModal.show('mileModal'); }
function updateLogDisplayer() {
  if($('#toggle').html() == '▼ 업데이트 로그 보기') {
    $('#more').css('display', 'block');
    $('#toggle').html('▲ 업데이트 로그 접기');
  }
  else {
    $('#more').css('display', 'none');
    $('#toggle').html('▼ 업데이트 로그 보기');
  }
}
function eventListener() {
  if(today.getDay() == 0 || today.getDay() == 6) {
    $('ul.tabs li').removeClass('current');
    $('#tab-1').removeClass('current');
    $('#tab-2').addClass('current');
    $('li[data-tab="tab-2"]').addClass('current');
  }
  $('#icon').click(function() {
    $('#adminPW').val('');
    MicroModal.show('admin');
    $('#adminPW').focus();
  });
  $('.reload').click(function() { load(); });
  $('#onNoticeClick').click(function() { MicroModal.show('noticeModal'); });
  $('#onRankClick').click(function() { MicroModal.show('rankModal'); });
  $('#onMapClick').click(function() { $('img[usemap]').rwdImageMaps(); MicroModal.show('mapModal'); });
  $('#randCat').click(function() {
    function randomizeCat() {
      var randNum = Math.floor(Math.random() * 404) + 1;
      $('#randCatGif').attr('src', 'https://rand.cat/gifs/cat-' + randNum + '.gif');
    }
    MicroModal.show('randCatModal', { onClose : randomizeCat });
    randomizeCat();
  });
  $('ul.tabs li').click(function() {
    var tab_id = $(this).attr('data-tab');
    $('ul.tabs li').removeClass('current');
    $('.tab-content').removeClass('current');
    $(this).addClass('current');
    $("#" + tab_id).addClass('current');
  });
  $('#rainbowBlock').click(function() {
    if($('#rainbowBlock').prop('checked')) {
      $('.dogriver').removeClass('dogriver');
      Cookies.set('rainbowBlock', 'true', {expires : 14});
    }
    else {
      $('.rainbow').addClass('dogriver');
      Cookies.remove('rainbowBlock');
    }
  });
  $('#delete').click( function() {
    validator('삭제', deleteData[0], deleteData[1]);
    MicroModal.close('deleteConfirm');
  });
}
function howsTheWeather() {
  $.ajax({
    url: 'https://api.openweathermap.org/data/2.5/weather?id=1835553&APPID=714bbbb9ad184e11c835635e025e301d',
    type: "GET",
    dataType: 'json',
    cache: false,
    success: function (response) {
      $('#temp').html('&nbsp;' + (response.main.temp - 273.15).toFixed(1) + '°C');
      $('#date').html('&nbsp;&nbsp;' + today.format('m월 d일 dddd'));
    }
  });
  $.ajax({
    url:'https://script.google.com/macros/s/AKfycbw3ppeWlO0ZRUEyxptRmM5QQb_-nvLtLZDQ-C13bKXFwwKKl9M/exec?url=' + encodeURIComponent('http://www.kma.go.kr/wid/queryDFSRSS.jsp?zone=4111755000') + '&callback=?',
    type: "GET",
    dataType: 'json',
    cache: false,
    success: function (response) {
      $('#weather').html('&nbsp;' + $($.parseXML(response.result)).find('wfKor').first().text());
      $('#icon').html('<image src="https://ssl.pstatic.net/static/weather/images/w_icon/w_' + weather[$($.parseXML(response.result)).find('wfKor').first().text()] + '.gif" style=""></image>');
    }
  });
  $.ajax({
    url:'https://script.google.com/macros/s/AKfycbw3ppeWlO0ZRUEyxptRmM5QQb_-nvLtLZDQ-C13bKXFwwKKl9M/exec?url=' + encodeURIComponent('http://openapi.airkorea.or.kr/openapi/services/rest/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?stationName=%EC%9D%B8%EA%B3%84%EB%8F%99&dataTerm=daily&pageNo=1&numOfRows=1&ServiceKey=2O%2BuM6vSRCF6GmbRLmsCMl38w0g%2F40UY5Vtd57XSnbhwJHPuasjf58ZnVHSSPul0o8aixY7Zkvpg42TtOzQqeQ%3D%3D&ver=1.3') + '&callback=?',
    type: "GET",
    dataType: 'json',
    cache: false,
    success: function (response) {
      var pm10 = $($.parseXML(response.result)).find('pm10Value').text(), pm25 = $($.parseXML(response.result)).find('pm25Value').text();
      $('#pm10').css('color', '#000');
      $('#pm10').html('PM10 : ' + '<span id="pm10val">' + pm10 + '</span>' + '㎍/㎥');
      $('#pm25').html('PM2.5 : ' + '<span id="pm25val">' + pm25 + '</span>' + '㎍/㎥');
      $('#pm10val').css('color', pm10 > 30 ? pm10 > 80 ? pm10 > 150 ? '#ff5959' : '#fd9b5a' : '#00c73c' : '#32a1ff');
      $('#pm25val').css('color', pm25 > 15 ? pm25 > 35 ? pm25 > 75 ? '#ff5959' : '#fd9b5a' : '#00c73c' : '#32a1ff');
    }
  });
}
function contextLoader() {
  $.contextMenu({
    selector: '.notReserved',
    trigger: 'left',
    items: {
      addName: {
        name: '이름',
        type: 'text',
      },
      add: {
        name: '신청',
        icon: 'check',
        callback: function(itemKey, opt, e) {
          var targetID = $('.focusing').attr('id'), targetName = $.contextMenu.getInputValues(opt, this.data()).addName;
          validator('신청', targetID, targetName);
          $(this).removeClass('focusing');
        }
      }
    },
    events: {
      show: function() {
        $(this).addClass('focusing');
        setTimeout(function() { $('input[name=context-menu-input-addName]').val(Cookies.get('fillName')); }, 1);
      },
      hide: function() { $(this).removeClass('focusing'); }
    }
  });
  $.contextMenu({
    selector: '.reserved',
    trigger: 'left',
    items: {
      modName: {
        name: '이름',
        type: 'text',
      },
      mod: {
        name: '수정',
        icon: 'mod',
        callback: function(itemKey, opt, e) {
          var targetID = $('.focusing').attr('id'), targetName = $.contextMenu.getInputValues(opt, this.data()).modName;
          var originalName =  $('.focusing').text();
          validator('수정', targetID, targetName, originalName);
          $(this).removeClass('focusing');
        }
      },
      sep: '-----',
      del: {
        name: '삭제',
        icon: 'del',
        callback: function(itemKey, opt, e) {
          var targetID = $('.focusing').attr('id'), targetName =  $('.focusing').text();
          $('#deleteInfo').html('다음 신청 내역을 삭제합니다.<br><br>' + new Date(locator(targetID)[0]).format('m월 d일 dddd ') + locator(targetID)[1] + '코스<br>' + targetName + ' 회원님');
          MicroModal.show('deleteConfirm');
          deleteData = [targetID, targetName];
        }
      }
    },
    events: {
      show: function() {
        $(this).addClass('focusing');
        //setTimeout(function() { $('input[name=context-menu-input-modName]').focus(); }, 1);
      },
      hide: function() { $(this).removeClass('focusing'); }
    }
  });
}
function military() {
  if(new Date() > new Date(2019, 10, 4, 9) && new Date() < new Date(2019, 10, 20)) {
    $('#disabler').click(function() {
      if($('#disabler').is(':checked')) MicroModal.show('confirmClose');
      else Cookies.remove('getOut');
    });
    $('#shut').click(function() {
      MicroModal.close('confirmClose');
      Cookies.set('getOut', true, {expires: 3});
    });
    if(!Cookies.get('getOut')) MicroModal.show('saveme');
  }
  if(new Date() > new Date(2019, 9, 21)) $('#infotext').text('D - ' + Math.round(Math.abs((new Date(2021, 7, 1) - new Date()) / (24 * 60 * 60 * 1000)) + 1));
}
var dateFormat = function () {
  var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
    timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    timezoneClip = /[^-+\dA-Z]/g,
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
    if (isNaN(date)) throw SyntaxError("invalid date");
    mask = String(dF.masks[mask] || mask || dF.masks["default"]);
    if (mask.slice(0, 4) == "UTC:") {
      mask = mask.slice(4);
      utc = true;
    }
    var	_ = utc ? "getUTC" : "get",
      d = date[_ + "Date"](),
      D = date[_ + "Day"](),
      m = date[_ + "Month"](),
      y = date[_ + "FullYear"](),
      H = date[_ + "Hours"](),
      M = date[_ + "Minutes"](),
      s = date[_ + "Seconds"](),
      L = date[_ + "Milliseconds"](),
      o = utc ? 0 : date.getTimezoneOffset(),
      flags = {
        d:    d,
        dd:   pad(d),
        ddd:  dF.i18n.dayNames[D],
        dddd: dF.i18n.dayNames[D + 7],
        m:    m + 1,
        mm:   pad(m + 1),
        mmm:  dF.i18n.monthNames[m],
        mmmm: dF.i18n.monthNames[m + 12],
        yy:   String(y).slice(2),
        yyyy: y,
        h:    H % 12 || 12,
        hh:   pad(H % 12 || 12),
        H:    H,
        HH:   pad(H),
        M:    M,
        MM:   pad(M),
        s:    s,
        ss:   pad(s),
        l:    pad(L, 3),
        L:    pad(L > 99 ? Math.round(L / 10) : L),
        t:    H < 12 ? "a"  : "p",
        tt:   H < 12 ? "am" : "pm",
        T:    H < 12 ? "A"  : "P",
        TT:   H < 12 ? "오전" : "오후",
        Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
        o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
        S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
      };
    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}();
dateFormat.masks = {"default":"ddd mmm dd yyyy HH:MM:ss"};
dateFormat.i18n = {
  dayNames: [
    "일", "월", "화", "수", "목", "금", "토",
    "일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"
  ],
  monthNames: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ]
};
Date.prototype.format = function (mask, utc) { return dateFormat(this, mask, utc); };
Date.prototype.getWeek = function() {
  var calc = new Date(this.getFullYear(), 0, 1);
  return Math.ceil((((this - calc) / 86400000) + calc.getDay() - 1) / 7);
}
var today = new Date(), week = new Date().getWeek(), year = new Date().getFullYear();
var weather = {
  맑음 : 'l1',
  '구름 많음' : 'l3',
  눈 : 'l5',
  비 : 'l7',
  소나기 : 'l7',
  흐림 : 'l9',
  '눈/비' : 'l10',
  '구름 조금' : 'l21',
  Error : 'Error'
}
