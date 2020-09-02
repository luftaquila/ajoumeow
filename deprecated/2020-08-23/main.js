$(function() {
    // (function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
    init();
    applySetup();
    lazyload();
    contextLoader();
    eventListener();
    howsTheWeather();
    load();
  //military();
});
function init() {
    $.ajax({
      url:"https://luftaquila.io/ajoumeow/api/loginCheck",
      type: "POST",
      dataType: 'json',
      success: function(res) {
        console.log(res)
        if(res.name) {
          username = res.name;
          userid = res.id;
          useradmin = (res.role != "회원");
          $('#username').text(username);
          $('#userrole').text(res.role);
          $('#userInfo').css('display', 'block');
          $('#loginForm').css('display', 'none');
          setUserStat();
        }
        else {
          username = '';
          $('#sidebar').css('display', 'block');
          $('#loginForm').css('display', 'block');
          $('#userInfo').css('display', 'none');
        }
      },
      error: function(req, stat, err) { errorHandler(req, stat, err); }
    });
}
function load() {
  $("#latestUpdate").html("Loading...");
  $('svg').addClass('rotating');
  $('#recentUpdate').text($('#version').text() + ' : ' + $('#release').text().substr(0, 10));
  $('#info').attr('href', '/ajoumeow/about.html?' + $('#version').html() + '!' + $('#release').html());
  startDate = new Date(Date.now() - ((new Date().getDayNum() - 1) * 24 * 3600000)).format('yyyy-mm-dd');
  endDate = new Date(Date.now() - ((new Date().getDayNum() - 14) * 24 * 3600000)).format('yyyy-mm-dd');
  memberlist = [], nameTable = [];
  $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/records',
    type: "POST",
    dataType: 'json',
    data: { 'startDate' : startDate, 'endDate' : endDate},
    success: function(record) { yourNameIs(record); },
    error: function(req, stat, err) { errorHandler(req, stat, err); }
  });
    
  $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/requestNameList',
    type: 'POST',
    dataType: 'json',
    data: { 'semister' : 'this' },
    success: function(namelistSet) { memberlist = namelistSet; },
    error: function(req, stat, err) { errorHandler(req, stat, err); }
  });
}
function yourNameIs(record, namelist) {
  var table = Array(14).fill('').map(x => Array(3).fill('').map(y => Array()));
  for(var obj of record[0]) {
    var target = new Date(new Date(obj.date).format('yyyy-mm-dd')), start = new Date(startDate);
    var diff = Math.ceil(Math.abs(target - start) / (1000 * 60 * 60 * 24));
    table[diff][Number(obj.course.replace('코스', '')) - 1].push({ 'id': obj.ID, 'name': obj.name });
  }
  nameTable = table;
  setData(table, record[1][0].UPDATE_TIME);
}
function setData(table, update) {
  $("#updated").html("마지막 표 업데이트 : " + new Date(update).format("yyyy-mm-dd TT hh:MM:ss"));
 $("#loaded").html("급식표 데이터 로드 : " + new Date().format("yyyy-mm-dd TT hh:MM:ss"));
  for(var date = 0; date < 14; date++) {
    $('#dateCell_' + Number(date + 1)).text(new Date(Date.now() - ((new Date().getDayNum() - (date + 1)) * 24 * 3600000)).format('m/d(ddd)'));
    for(var course = 0; course < 3; course++) {
      for(var order = 0; order < 2; order++) {
        var name = table[date][course][order];
        var cell = $('#nameCell_' + Number(date + 1) + '_' + Number(course + 1) + '_' + Number(order + 1));
        cell.removeClass().text('').css('font-weight', 'normal');
        if(username) { // 로그인 상태일 때
          if(useradmin) { // 관리자일 때
            if(name) cell.text(name.name).addClass('reserved').css('font-weight', name.name == username ? 'bold' : 'normal');
            else cell.addClass('notReserved');
          }
          else { // 일반 회원일 때
            if(((date < 7) && (new Date().getDayNum() < date + 2)) || date > 6) {
              if(name) {
                cell.text(name.name).css('font-weight', name.name == username ? 'bold' : 'normal');
                if(name.name == username && date != new Date().getDayNum() - 1) cell.addClass('reserved');
              }
              else cell.addClass('notReserved');
            }
            else if(name) cell.text(name.name).css('font-weight', name.name == username ? 'bold' : 'normal');
          }
        }
        else if(name) cell.text(name.name);
      }
    }
  }
  
  if(!!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) {
    $('.reserved, .notReserved').addClass('ios');
    $('.reload, .popup, #icon, ul.tabs.li').addClass('ios');
  }
  $('td:contains(' + new Date().format('m/d(ddd)') + ')').css('backgroundColor', 'greenyellow');
  
  $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/requestNotice',
    type: 'POST',
    success: function(res) {
      $('#notice').html(res.notice);
      if(Cookies.get('versionInfo') != res.version) {
        Cookies.set('versionInfo', res.version, {expires : 7});
        MicroModal.show('noticeModal');
      }
    }
  });

  //randomizeCat();
  //$('svg').removeClass('rotating');
  if(username) $('td:contains(' + username + ')').css('font-weight', 'bold');
}
function validator(type, cell, ID) {
  console.log(ID)
  var target = locator(cell);
  if(!ID) return alertify.error('INVAILD_PAYLOAD');
  transmitter({
    'type' : type,
    'date' : target.date,
    'course' : target.course + '코스',
    'id' : Number(ID.id),
    'name'  : ID.name
  });
}
function transmitter(data) {
  if(data.type == 'add') {
    $.ajax({
      url: 'https://luftaquila.io/ajoumeow/api/insertIntoTable',
      type: 'POST',
      dataType: 'json',
      data: {
        date: data.date,
        course: data.course,
        ID: data.id,
        name: data.name
      },
      success: load,
      error: function(req, stat, err) { errorHandler(req, stat, err); }
    });
  }
  else if(data.type == 'delete') {
    $.ajax({
      url: 'https://luftaquila.io/ajoumeow/api/deleteFromTable',
      type: 'POST',
      dataType: 'json',
      data: {
        date: data.date,
        course: data.course,
        ID: data.id,
        name: data.name
      },
      success: load,
      error: function(req, stat, err) { errorHandler(req, stat, err); }
    });
  }
}
function locator(cell) {
  var target = cell.replace('nameCell_', '').split('_');
  return {
    'date' : new Date(Date.now() - ((new Date().getDayNum() - Number(target[0])) * 24 * 3600000)).format('yyyy-mm-dd'),
    'course' : target[1],
    'text' : $('#' + cell).text()
  }
}
function setCalendar() {/*
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
  }*/
}
function setUserStat() {
  $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/requestUserStat',
    type:'POST',
    data: { id: userid },
    success: function(res) {
      var mileage_this = 0, mileage_total = 0, time_this = 0, time_total = 0, html = '<br>';
      var this_month = new Date().format('yyyy-mm');
      for(var obj of res) {
        if(new Date(obj.date).format('yyyy-mm') == this_month) {
          mileage_this += Number(obj.score);
          time_this++;
        }
        mileage_total += Number(obj.score);
        time_total++;
        html += new Date(obj.date).format('yyyy년 m월 d일') + '<br>' + obj.course + '<br>' + obj.score + '점<br><br>';
      }
      $('#mileage_this').text(mileage_this);
      $('#mileage_total').text(mileage_total);
      $('#time_this').text(time_this);
      $('#time_total').text(time_total);
      $('#myhistory').html(html + '<br><br><br>');
    }
  });
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
  if(new Date().getDayNum() > 5) {
    $('ul.tabs li').removeClass('current');
    $('#tab-1').removeClass('current');
    $('#tab-2').addClass('current');
    $('li[data-tab="tab-2"]').addClass('current');
  }
  $('.reload').click(function() {
    $('#sidebar').css('display', 'block');
  });
  $('#sidebarClose, .sidebar_overlay').click(function() {
    $('#sidebar').css('display', 'none');
  }).children().click(function() { return false; });
  $('#login').click(function() {
    $.ajax({
      url:"https://luftaquila.io/ajoumeow/api/login",
      data: { 'ID' : $('#loginID').val() },
      type: "POST",
      dataType: 'json',
      success: function(res) {
        if(res.name) {
          username = res.name;
          userid = res.id;
          useradmin = (res.role != '회원');
          load();
          setUserStat();
          $('#username').text(res.name);
          $('#userrole').text(res.role);
          $('#userInfo').css('display', 'block');
          $('#loginForm').css('display', 'none');
        }
        else alertify.error('등록되지 않은 학번입니다.');
      },
      error: function(req, stat, err) { errorHandler(req, stat, err); }
    });
  });
  $('#logout').click(function() {
    $.ajax({
      url: 'https://luftaquila.io/ajoumeow/api/logout',
      type: 'POST',
      dataType: 'json',
      success: function(res) {
        if(res.result) {
          $('td:contains(' + username + ')').css('font-weight', 'normal');
          username = '';
          userid = '';
          useradmin = false;
          load()
          $('#loginForm').css('display', 'block');
          $('#userInfo').css('display', 'none');
        }
      },
      error: function(req, stat, err) { errorHandler(req, stat, err); }
    });
  });
  $('#apply').click(function() {
    $.ajax({
      url: 'https://luftaquila.io/ajoumeow/api/requestApply',
      type: 'POST',
      dataType: 'json',
      success: function(res) {
        if(res.result) {
          $('#sidebar').css('display', 'none');
          memberApply();
        }
        else alertify.error('회원 등록 기간이 아닙니다.');
      },
      error: function(req, stat, err) { errorHandler(req, stat, err); }
    });
  });
  $('input[name=context-menu-input-ID]').keyup(function(e) {
    var name = $('input[name=context-menu-input-name');
    var obj = memberlist.find(o => o.ID == Number($(this).val()));
    if(obj) name.val(obj.name);
    else name.val('');
  });
  $('#onNoticeClick').click(function() { MicroModal.show('noticeModal'); });
  $('#onRankClick').click(function() { MicroModal.show('rankModal'); });
  $('#onMapClick').click(function() { $('img[usemap]').rwdImageMaps(); MicroModal.show('mapModal'); });
  $('#randCat').click(function() { MicroModal.show('randCatModal', { onClose : randomizeCat }); });
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
  $('#delete').click(function() {
    var tmp = deleteCell.replace('nameCell_', '').split('_');
    validator('delete', deleteCell, nameTable[tmp[0] - 1][tmp[1] - 1][tmp[2] - 1]);
    MicroModal.close('deleteConfirm');
  });
  $('#historyDispenser').click(function() {
    if($(this).text() == '내 급식 기록 보기 ▼') {
      $(this).text('내 급식 기록 닫기 ▲');
      $('#myhistory').css('display', 'block');
    }
    else {
      $(this).text('내 급식 기록 보기 ▼');
      $('#myhistory').css('display', 'none');
    }
  });
}
function randomizeCat() {
  var randNum = Math.floor(Math.random() * 404) + 1;
  $('#randCatGif').attr('src', 'https://rand.cat/gifs/cat-' + randNum + '.gif');
}
function howsTheWeather() {
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
  $.ajax({
    //url:'https://luftaquila.io/proxy?url=' + encodeURIComponent('http://ncov.mohw.go.kr/index_main.jsp'),
    url:'https://luftaquila.io/proxy?url=' + encodeURIComponent('http://ncov.mohw.go.kr/bdBoardList_Real.do?brdId=&brdGubun=&ncvContSeq=&contSeq=&board_id=&gubun='),
    type: "GET",
    dataType: 'text',
    cache: false,
    success: function (res) {
      res = $($.parseHTML(res));
      var confirmed = res.find('th:contains("확진환자")').next().text();
      var freed = res.find('th:contains("확진환자 격리해제")').next().text();
      var dead = res.find('th:contains("사망자")').next().text();
      $('#covid').text('COVID-19');
      $('#confirmed').text('확진환자 : ' + confirmed);
      $('#freed').text('퇴원환자 : ' + freed);
      $('#dead').text('사망자 : ' + dead);
    }
  });
}
function contextLoader() {
  $.contextMenu({
    selector: '.notReserved',
    trigger: 'left',
    items: {
      name: {
        name: '이름',
        type: 'text'
      },
      ID: {
        name: '학번',
        type: 'text'
      },
      add: {
        name: '신청',
        icon: 'check',
        callback: function(itemKey, opt, e) {
          var cell = $('.focusing').attr('id');
          var target = $.contextMenu.getInputValues(opt, this.data());
          if(!target.name) { alertify.error('등록되지 않은 학번입니다.'); return; }
          validator('add', cell, { id: target.ID, name: target.name });
          $(this).removeClass('focusing');
        }
      }
    },
    events: {
      show: function() {
        $(this).addClass('focusing');
        setTimeout(function() {
          $('input[name=context-menu-input-name]').val(username).attr('disabled', true);
          $('input[name=context-menu-input-ID]').val(userid).attr('type', 'number');
          if(!useradmin) {
            $('input[name=context-menu-input-ID]').attr('disabled', true);
          }
        }, 1);
      },
      hide: function() { $(this).removeClass('focusing'); }
    }
  });
  $.contextMenu({
    selector: '.reserved',
    trigger: 'left',
    items: {
      del: {
        name: '삭제',
        icon: 'del',
        callback: function(itemKey, opt, e) {
          var target = locator($('.focusing').attr('id'));
          $('#deleteInfo').html('다음 신청 내역을 삭제합니다.<br><br>' + new Date(target.date).format('m월 d일 dddd ') + target.course + '코스<br>' + $('.focusing').text() + ' 회원님');
          deleteCell = $('.focusing').attr('id');
          MicroModal.show('deleteConfirm');
        }
      }
    },
    events: {
      show: function() { $(this).addClass('focusing'); },
      hide: function() { $(this).removeClass('focusing'); }
    }
  });
}
function errorHandler(req, stat, err) {
  console.log(req)
  console.log(stat)
  console.log(err)
  alertify.error('SERVERSIDE API ERR_' + req.responseJSON.error.code + '<br><br>고양이가 사이트 어딘가를 망가뜨렸어요.<br>5분쯤 뒤에 다시 오시면 치워놓을게요😿');
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
Date.prototype.getDayNum = function() {
  return this.getDay() ? this.getDay() : 7;
}
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