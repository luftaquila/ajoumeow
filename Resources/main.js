$(function() {
  lazyload();
  contextLoader();
  clickEventListener();
  loadWeather();
  load();
});
function load() {
  $('input').attr('disabled', true);
  $("#latestUpdate").html("Loading...");
  $('svg').addClass('rotating');
  $('#recentUpdate').text($('#version').text() + ' : ' + $('#release').text().substr(0, 10));
  $('#info').attr('href', '/ajoumeyoumeow/about.html?' + $('#version').html() + '!' + $('#release').html());
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
}
function transmitter(operationType, targetID, targetName) {
  var locatorReturn = locator(targetID);
  var targetDay = locatorReturn[0], targetCourse = locatorReturn[1];
  var serializedData =
  //if(operationType == '신청')
}
function locator(targetID) {
  var targetDay = targetID.substr(9, 1), targetCourse = targetID.substr(11, 1);
  targetDay = new Date(year, 0, 1 + (targetDay % 7) + ((week + Math.floor(targetDay / 7) - 1) * 7) - new Date(year, 0, week * 7).getDay()).format('yyyy. mm. dd');
  return [targetDay, targetCourse];
}
function newYourNameIs(response) {
  var datum = response.split('\n').map((line) => line.split(','))
  var table = Array(21).fill('').map(x => Array(6).fill(''));
  var startIndex, week = new Date().getWeek(), year = new Date().getFullYear();
  for(var i = 0; i < 21; i++) {
    var day = new Date(year, 0, 1 + (i % 7) + ((week + Math.floor(i / 7) - 1) * 7) - new Date(year, 0, week * 7).getDay()).format("yyyy. m. d");
    if(!i) {
      for(var index in datum) {
        if(day == datum[index][1]) {
          startIndex = index; break;
        }
      }
    }
    while(datum[startIndex][1] == day) {
      for(var j = 1; j <= 3; j++) {
        if(datum[startIndex][2].includes(String(j))) {
          if(!table[i][2 * (j - 1)]) table[i][2 * (j - 1)] = datum[startIndex][0];
          else if(!table[i][2 * (j - 1) + 1] && !(datum[startIndex][0] == table[i][2 * (j - 1)])) table[i][2 * (j - 1) + 1] = datum[startIndex][0];
        }
      }
      startIndex++;
    }
  }
  setData(table);
  console.log('Ready. ' + (dataSize(response) / 1000).toFixed(1) + 'KB Loaded');
}
function setData(table) {
  $("#latestUpdate").html("Latest Update : " + new Date().format("TT hh시 MM분 ss초"));
  var week = new Date().getWeek(), year = new Date().getFullYear();
  for(var i = 0; i < 21; i++) {
    var day = new Date(year, 0, 1 + (i % 7) + ((week + Math.floor(i / 7) - 1) * 7) - new Date(year, 0, week * 7).getDay());
    $('#dateCell_' + i).text(day.format('m/d(ddd)'));
    for(var j = 0; j < 6; j++) {
      if(table[i][j]) $('#nameCell_' + i + '_' + j).addClass('reserved');
      else $('#nameCell_' + i + '_' + j).addClass('notReserved');
      $('#nameCell_' + i + '_' + j).text(table[i][j]);
    }
  }
  $('td:contains(' + new Date().format('m/d(ddd)') + ')').css('backgroundColor', 'greenyellow');
  for(var i = 0; i < 7; i++) $("#dateCell_" + i).css("color", "#000000");
  if(Cookies.get('versionInfo') != $('#version').text()) {
    Cookies.set('versionInfo', $('#version').text(), {expires : 30});
    MicroModal.show('noticeModal');
  }
  if(Cookies.get('fillName')) $('#submitName').val(Cookies.get('fillName'));
  else {
    MicroModal.show('askName');
    $('#nameSubmit').click( function() {
      Cookies.set('fillName', $.trim($('#name').val()), {expires : 365});
      $('#submitName').val(Cookies.get('fillName'));
      MicroModal.close('askName');
    });
  }
  calendarCount = 0;
  setCalendar('5/6(월)', '총무생일', true);
  setCalendar('5/12(일)', '회장생일', true);
  $('svg').removeClass('rotating');
  $('input').attr('disabled', false);
}
function setCalendar(targetDate, targetText, isRainbow) {
  calendarCount += 1;
  try {
    if(new Date(new Date().getFullYear(), targetDate.substr(0, 1) - 1, targetDate.substr(2, 1)) > new Date()) {
      if(isRainbow) {
        $('#rainbowBlockBox').css('display', 'block');
        $('td:contains(' + targetDate + ')').addClass('dogriver');
      }
      $('td:contains(' + targetDate + ')').addClass('cal' + calendarCount);
      $('.cal' + calendarCount).html(targetText);
    }
  }
  catch (e) { }
  finally { }
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
function clickEventListener() {
  $('#icon').click(function() {
    if($('#adminActive').css('display') == 'inline') $('#adminActive').css('display', 'none');
    else $('#adminActive').css('display', 'inline');
  });
  if(new Date().format('m-d') == '4-1') {
    addCSS('/ajoumeyoumeow/Resources/April Fools Day/april fools day.css');
    addScript('/ajoumeyoumeow/Resources/April Fools Day/april fools day.js');
  }
  if(new Date().getDay() == 0 || new Date().getDay() == 6) {
    $('ul.tabs li').removeClass('current');
    $('#tab-1').removeClass('current');
    $('#tab-2').addClass('current');
    $('li[data-tab="tab-2"]').addClass('current');
  }
  $('.reload').click(function() { load(); });
  $('#onNoticeClick').click(function() { MicroModal.show('noticeModal'); });
  $('#onRankClick').click(function() { MicroModal.show('rankModal'); });
  $('#onMapClick').click(function() { $('img[usemap]').rwdImageMaps(); MicroModal.show('mapModal'); });
  $('ul.tabs li').click(function() {
    var tab_id = $(this).attr('data-tab');
    $('ul.tabs li').removeClass('current');
    $('.tab-content').removeClass('current');
    $(this).addClass('current');
    $("#"+tab_id).addClass('current');
  });
  $('#modeAdd').click(function() {
    $('#editBox').css('display', 'none');
    $('#submit').val('신청하기');
  });
  $('#modeEdit').click(function() {
    $('#editBox').css('display', 'block');
    $('#submit').val('수정하기');
  });
  $('#modeDelete').click(function() {
    $('#editBox').css('display', 'none');
    $('#submit').val('삭제하기');
  });
  $('#rainbowBlock').click(function() {
    if($('#rainbowBlock').prop('checked')) {
      $('.dogriver').removeClass('dogriver');
    }
    else {
      for(var i = 0; i <= calendarCount; i++ ) {
        $('.cal' + i).addClass('dogriver');
      }
    }
  });
}
function loadWeather() {
  $.ajax({
    url: 'https://api.openweathermap.org/data/2.5/weather?id=1835553&APPID=714bbbb9ad184e11c835635e025e301d',
    type: "GET",
    dataType: 'json',
    cache: false,
    success: function (response) {
      $('#temp').html('&nbsp;' + (response.main.temp - 273.15).toFixed(1) + '°C');
      $('#date').html('&nbsp;&nbsp;' + new Date().format('m월 d일 dddd'));
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
          var targetID = $('.focusing').attr('id');
          var targetName = $.contextMenu.getInputValues(opt, this.data()).addName;
          transmitter('신청', targetID, targetName);
          $(this).removeClass('focusing');
        }
      }
    },
    events: {
      show: function() {
        $(this).addClass('focusing');
        setTimeout(function() { $('input[name=context-menu-input-addName]').focus(); }, 1);
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
          var targetID = $('.focusing').attr('id');
          var targetName = $.contextMenu.getInputValues(opt, this.data()).modName;
          transmitter('수정', targetID, targetName);
          $(this).removeClass('focusing');
        }
      },
      sep: '-----',
      del: {
        name: '삭제',
        icon: 'del',
        callback: function(itemKey, opt, e) {
          var targetID = $('.focusing').attr('id');
          transmitter('삭제', targetID);
          $(this).removeClass('focusing');
        }
      }
    },
    events: {
      show: function() {
        $(this).addClass('focusing');
        setTimeout(function() { $('input[name=context-menu-input-modName]').focus(); }, 1);
      },
      hide: function() { $(this).removeClass('focusing'); }
    }
  });
}
function addCSS(href){
 var head = document.getElementsByTagName('head')[0];
 var style = document.createElement('link');
 style.href = href;
 style.type = 'text/css';
 style.rel = 'stylesheet';
 head.append(style);
}
function addScript(src){
 var head = document.getElementsByTagName('head')[0];
 var script = document.createElement('script');
 script.src = src;
 script.type = 'text/javascript';
 head.append(script);
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
weather = {
  맑음 : 'l1',
  '구름 많음' : 'l3',
  눈 : 'l5',
  비 : 'l7',
  흐림 : 'l9',
  '눈/비' : 'l10',
  '구름 조금' : 'l21',
  Error : 'Error'
}
