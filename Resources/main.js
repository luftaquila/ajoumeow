$(function() {
  $('#courseImages').load('/ajoumeyoumeow/Resources/Htmls/courseImages.html');
  $('#modals').load('/ajoumeyoumeow/Resources/Htmls/modals.html');
  $("img.lazyload").lazyload();
  clickEventListener();
  if(new Date().getDay() == 0 || new Date().getDay() == 6) {
    $('ul.tabs li').removeClass('current');
    $('#tab-1').removeClass('current');
    $('#tab-2').addClass('current');
    $('li[data-tab="tab-2"]').addClass('current');
  }
  loadWeather();
  load();
});
function load() {
  datum = [], rankArray = [], download = 0;
  $('input').attr('disabled', true);
  $("#latestUpdate").html("Loading...");
  $('svg').addClass('rotating');
  $('#info').attr('href', '/ajoumeyoumeow/about.html?' + $('#version').html() + '!' + $('#release').html());
  $.ajax({
    url: 'https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec',
    type: "GET",
    dataType: 'text',
    cache: false,
    success: function (response) {
      datum = response.split('\n').map((line) => line.split(','));
      datum.push(['11', '11', '11']);
      download += dataSize(response);
      $.ajax({
        url: 'https://docs.google.com/spreadsheet/pub?key=1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A&single=true&gid=1034362398&sheet=Statistics&range=A3:E5&output=csv',
        type: "GET",
        dataType: 'text',
        cache: false,
        success: function (response) {
          rankArray = response.split('\n').map((line) => line.split(','));
          rankArray.forEach(function(value) { value.splice(2, 1); });
          setData();
          $('svg').removeClass('rotating');
          $('input').attr('disabled', false);
          download += dataSize(response);
          console.log('Ready. ' + (download / 1000).toFixed(1) + 'KB Loaded');
        }
      });
    }
  });
}
$("#DATA").submit( function(event) {
  $('input').attr('disabled', true);
  var request, serializedData;
  if (request) { request.abort(); }
  if(!/\d\d\d\d\-\d\d\-\d\d/g.test($("#submitDate").val())) {
    alertify.error('날짜를 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if($.trim($("#submitName").val()) == "") {
    alertify.error('이름을 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if($.trim($("#submitName").val()).indexOf(',') + 1) {
    alertify.error('이름에 콤마(,)는 사용할 수 없습니다.');
    $('input').attr('disabled', false);
  }
  else if($(':input[name=course]:radio:checked').val() == undefined) {
    alertify.error('코스를 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if($(':input[name=mode]:radio:checked').val() == '수정' && !/\d\d\d\d\-\d\d\-\d\d/g.test($("#editDate").val())) {
    alertify.error('수정할 날짜를 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if($(':input[name=mode]:radio:checked').val() == '수정' && $.trim($("#editName").val()) == "") {
    alertify.error('수정할 이름을 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if($(':input[name=mode]:radio:checked').val() == '수정' && $(':input[name=edit_course]:radio:checked').val() == undefined) {
    alertify.error('수정할 코스를 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if($(':input[name=mode]:radio:checked').val() == '수정' && ($.trim($("#editName").val()).indexOf(',') + 1)) {
    alertify.error('이름에 콤마(,)는 사용할 수 없습니다.');
    $('input').attr('disabled', false);
  }
  else if($(':input[name=mode]:radio:checked').val() == '삭제' && $('#submitDate').val() == new Date().format('yyyy-mm-dd')) {
    alertify.error('당일 취소는 불가능합니다.');
    $('input').attr('disabled', false);
  }
  else if($(':input[name=mode]:radio:checked').val() == '수정' && $('#submitDate').val() == new Date().format('yyyy-mm-dd') && $('#submitDate').val() != $("#editDate").val()) {
    alertify.error('당일 날짜 변경은 불가능합니다.');
    $('input').attr('disabled', false);
  }
  else {
    if($(':input[name=mode]:radio:checked').val() == '신청') {
      serializedData = "신청=신청&이름=" + $.trim($('#submitName').val()) + "&날짜=" + $('#submitDate').val() + "&코스=" + $(':input[name=course]:radio:checked').val();
    }
    else if($(':input[name=mode]:radio:checked').val() == '수정') {
      serializedData = "수정=수정&이름=" + $.trim($('#submitName').val()) + "&날짜=" + $('#submitDate').val() + "&코스=" + $(':input[name=course]:radio:checked').val() +
                       "&수정 이름=" + $.trim($('#editName').val()) + "&수정 날짜=" + $('#editDate').val() + "&수정 코스=" + $(':input[name=edit_course]:radio:checked').val();
    }
    else if($(':input[name=mode]:radio:checked').val() == '삭제') {
      serializedData = "삭제=삭제&이름=" + $.trim($('#submitName').val()) + "&날짜=" + $('#submitDate').val() + "&코스=" + $(':input[name=course]:radio:checked').val();
    }
    alertify.log('Sending ' + dataSize(encodeURI(serializedData)) + 'B Data...');
    console.log("DataSet : " + serializedData);
    request = $.ajax({
        type: 'POST',
        url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
        data: encodeURI(serializedData)
    });
    request.done(function() {
      load();
      alertify.success('Data Transmitted.');
      Cookies.set('fillName', $.trim($('#submitName').val()), {expires : 365});
    });
    request.fail(function(jqXHR, textStatus, errorThrown) { alertify.error('Error - ' + textStatus + errorThrown); });
    request.always(function() {
      $('input').attr('disabled', false);
      $('#submitDate').val("");
      $('input:radio[name=course], input:radio[name=edit_course]').prop('checked', false);
    });
  }
  event.preventDefault();
});
function setData() {
  var week = new Date().getWeek(), year = new Date().getFullYear();
  $("#latestUpdate").html("Latest Update : " + new Date().format("TT hh시 MM분 ss초"));
  if(new Date().getDay() == 0) $("#thisWeekEnd_2").css("backgroundColor", "greenyellow");
  if(new Date().getDay() == 6) $("#thisWeekEnd_1").css("backgroundColor", "greenyellow");
  for(var i = 1; i <= 5; i++)
  {
    if(new Date().getDay() == i) $("#thisWeek_" + i).css("backgroundColor", "greenyellow");
    $("#thisWeek_" + i).css("color", "#000000");
    $("#thisWeek_" + i).html(new Date(year, 0, i + ((week - 1) * 7) - new Date(year, 0, (week * 7)).getDay()).format("m/d(ddd)"));
    $("#nextWeek_" + i).html(new Date(year, 0, i + (week * 7) - new Date(year, 0, (week * 7)).getDay()).format("m/d(ddd)"));
    $("#nextTwoWeek_" + i).html(new Date(year, 0, i + ((week + 1) * 7) - new Date(year, 0, (week * 7)).getDay()).format("m/d(ddd)"));
    for(var j = 1; j <= 2; j++)
    {
      $("#thisWeek_d" + i + "_" + j).html(yourNameIs(0, i - 1, 1, j));
      $("#thisWeek_s" + i + "_" + j).html(yourNameIs(0, i - 1, 2, j));
      $("#thisWeek_t" + i + "_" + j).html(yourNameIs(0, i - 1, 3, j));
      $("#nextWeek_d" + i + "_" + j).html(yourNameIs(1, i - 1, 1, j));
      $("#nextWeek_s" + i + "_" + j).html(yourNameIs(1, i - 1, 2, j));
      $("#nextWeek_t" + i + "_" + j).html(yourNameIs(1, i - 1, 3, j));
      $("#nextTwoWeek_d" + i + "_" + j).html(yourNameIs(2, i - 1, 1, j));
      $("#nextTwoWeek_s" + i + "_" + j).html(yourNameIs(2, i - 1, 2, j));
      $("#nextTwoWeek_t" + i + "_" + j).html(yourNameIs(2, i - 1, 3, j));
    }
  }
  for(var i = 1; i <= 2; i++)
  {
    $("#thisWeekEnd_" + i).css("color", "#000000");
    $("#thisWeekEnd_" + i).html(new Date(year, 0, i + 5 + ((week - 1) * 7) - new Date(year, 0, (week * 7)).getDay()).format("m/d(ddd)"));
    $("#nextWeekEnd_" + i).html(new Date(year, 0, i + 5 + ((week + 0) * 7) - new Date(year, 0, (week * 7)).getDay()).format("m/d(ddd)"));
    $("#nextTwoWeekEnd_" + i).html(new Date(year, 0, i + 5 + ((week + 1) * 7) - new Date(year, 0, (week * 7)).getDay()).format("m/d(ddd)"));
    for(var j = 1; j <= 2; j++)
    {
      $('#thisWeekEnd_d' + i + "_" + j).html(yourNameIs(0, i + 4, 1, j));
      $('#thisWeekEnd_s' + i + "_" + j).html(yourNameIs(0, i + 4, 2, j));
      $('#thisWeekEnd_t' + i + "_" + j).html(yourNameIs(0, i + 4, 3, j));
      $('#nextWeekEnd_d' + i + "_" + j).html(yourNameIs(1, i + 4, 1, j));
      $('#nextWeekEnd_s' + i + "_" + j).html(yourNameIs(1, i + 4, 2, j));
      $('#nextWeekEnd_t' + i + "_" + j).html(yourNameIs(1, i + 4, 3, j));
      $('#nextTwoWeekEnd_d' + i + "_" + j).html(yourNameIs(2, i + 4, 1, j));
      $('#nextTwoWeekEnd_s' + i + "_" + j).html(yourNameIs(2, i + 4, 2, j));
      $('#nextTwoWeekEnd_t' + i + "_" + j).html(yourNameIs(2, i + 4, 3, j));
    }
  }
  for(var i = 1; i <= 3; i++) {
    $("#this_" + i).html(rankArray[i - 1][0]);
    $("#past_" + i).html(rankArray[i - 1][2]);
    $("#this_t_" + i).html(parseFloat(rankArray[i - 1][1]));
    $("#past_t_" + i).html(parseFloat(rankArray[i - 1][3]));
  }
  if(Cookies.get('versionInfo') != $('#version').text()) {
    Cookies.set('versionInfo', $('#version').text(), {expires : 30});
    MicroModal.show('noticeModal');
  }
  if(Cookies.get('fillName')) {
    if(Cookies.get('popup') != 'hidden') { MicroModal.show('rankModal'); }
    $('#submitName').val(Cookies.get('fillName'));
    $.ajax({
        type: 'POST',
        url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
        data: encodeURI('로그=로그&이름=' + Cookies.get('fillName'))
    });
  }
  else {
    MicroModal.show('askName');
    $('#nameSubmit').click( function() {
      Cookies.set('fillName', $.trim($('#name').val()), {expires : 365});
      $('#submitName').val(Cookies.get('fillName'));
      if(Cookies.get('fillName') == "") { Cookies.remove('fillName'); }
      $.ajax({
          type: 'POST',
          url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
          data: encodeURI('로그=로그&이름=' + Cookies.get('fillName'))
      });
      MicroModal.close('askName');
    });
  }
  calendarCount = 0, rainbowCount = 0;
  //setCalendar('3/13(수)', '★개총★', true);
  if(rainbowCount) $('#rainbowBlockBox').css('display', 'block');
}
function setCalendar(targetDate, targetText, isRainbow) {
  calendarCount += 1;
  try {
    if(isRainbow) {
      rainbowCount += 1;
      document.evaluate("//td[text()='" + targetDate + "']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.classList.add('dogriver');
    }
    document.evaluate("//td[text()='" + targetDate + "']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.classList.add('cal' + calendarCount);
    $('.cal' + calendarCount).html(targetText);
  }
  catch (e) { }
  finally { }
}
function yourNameIs(p1, p2, course, rank) {
  var week = new Date().getWeek();
  var year = new Date().getFullYear();
  var result = new Date(year, 0, 1 + p2 + ((week + p1 - 1) * 7) - new Date(year, 0, (week * 7)).getDay()).format("yyyy. m. d");
  for (var i = 0; i < datum.length - 1; i++) {
    if(rank == 1) {
      if(result == datum[i][1]) {
        if((course == 1) && (datum[i][2].includes("1코스")))
          return datum[i][0];
        else if((course == 2) && (datum[i][2].includes("2코스")))
          return datum[i][0];
        else if((course == 3) && (datum[i][2].includes("3코스")))
          return datum[i][0];
      }
    }
    else if(rank == 2) {
      if(result == datum[i][1]) {
        if((course == 1) && (datum[i][2].includes("1코스"))) {
          for(var j = 1; result == datum[i + j][1]; j++)
          {
            if((course == 1) && (datum[i + j][2].includes("1코스"))) {
              if(datum[i][0] == datum[i + j][0])
                continue;
              else
                return datum[i + j][0];
            }
          }
        }
        else if((course == 2) && (datum[i][2].includes("2코스"))) {
          for(var j = 1; result == datum[i + j][1]; j++)
          {
            if((course == 2) && (datum[i + j][2].includes("2코스"))) {
              if(datum[i][0] == datum[i + j][0])
                continue;
              else
                return datum[i + j][0];
            }
          }
        }
        else if((course == 3) && (datum[i][2].includes("3코스"))) {
          for(var j = 1; result == datum[i + j][1]; j++)
          {
            if((course == 3) && (datum[i + j][2].includes("3코스"))) {
              if(datum[i][0] == datum[i + j][0])
                continue;
              else
                return datum[i + j][0];
            }
          }
        }
      }
    }
  }
  return " ";
}
function dataSize(s, b, i, c) { for(b = i = 0; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1); return b; }
function popupBlocker() { console.log('click'); MicroModal.close('rankModal'); Cookies.set('popup', 'hidden', {expires : 3}); }
function mileageDisplayer() { MicroModal.close('rankModal'); MicroModal.show('mileModal'); }
function clickEventListener() {
  $('.reload').click(function() { load(); });
  $('#onNoticeClick').click(function() { MicroModal.show('noticeModal'); });
  $('#onMapClick').click(function() { $('img[usemap]').rwdImageMaps(); MicroModal.show('mapModal'); });
  $('#onRankClick').click(function() { MicroModal.show('rankModal'); Cookies.remove('popup'); popupBlock.checked = false; });
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
  $('#toggle').click(function() {
    if($('#toggle').html() == '▼ 업데이트 로그 보기') {
      $('#more').css('display', 'block');
      $('#toggle').html('▲ 업데이트 로그 접기');
    }
    else {
      $('#more').css('display', 'none');
      $('#toggle').html('▼ 업데이트 로그 보기');
    }
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
    url:'https://cors-anywhere.herokuapp.com/http://www.kma.go.kr/wid/queryDFSRSS.jsp?zone=4111755000',
    type: "GET",
    dataType: 'text',
    cache: false,
    success: function (response) {
      $('#weather').html('&nbsp;' + $($.parseXML(response)).find('wfKor').first().text());
      $('#icon').html('<image src="https://ssl.pstatic.net/static/weather/images/w_icon/w_' + weather[$($.parseXML(response)).find('wfKor').first().text()] + '.gif" style=""></image>');
    }
  });
  $.ajax({
    url: 'https://cors-anywhere.herokuapp.com/http://openapi.airkorea.or.kr/openapi/services/rest/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?stationName=%EC%9D%B8%EA%B3%84%EB%8F%99&dataTerm=daily&pageNo=1&numOfRows=1&ServiceKey=2O%2BuM6vSRCF6GmbRLmsCMl38w0g%2F40UY5Vtd57XSnbhwJHPuasjf58ZnVHSSPul0o8aixY7Zkvpg42TtOzQqeQ%3D%3D&ver=1.3',
    type: "GET",
    dataType: 'text',
    cache: false,
    success: function (response) {
      var pm10 = $($.parseXML(response)).find('pm10Value').text(), pm25 = $($.parseXML(response)).find('pm25Value').text();
      $('#pm10').css('color', '#000');
      $('#pm10').html('PM10 : ' + '<span id="pm10val">' + pm10 + '</span>' + '㎍/㎥');
      $('#pm25').html('PM2.5 : ' + '<span id="pm25val">' + pm25 + '</span>' + '㎍/㎥');
      $('#pm10val').css('color', pm10 > 30 ? pm10 > 80 ? pm10 > 150 ? '#ff5959' : '#fd9b5a' : '#00c73c' : '#32a1ff');
      $('#pm25val').css('color', pm25 > 15 ? pm25 > 35 ? pm25 > 75 ? '#ff5959' : '#fd9b5a' : '#00c73c' : '#32a1ff');
    }
  });
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
