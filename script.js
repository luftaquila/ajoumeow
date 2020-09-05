$(function() {
  //(function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
  init();
  eventListener();
});

function init() {
  let indexOfToday = (new Date(new Date().format('yyyy-mm-dd')).getTime() - new Date(getDateFromCalendarStart(0)).getTime()) / (1000 * 60 * 60 * 24);
  let calendar = $('#calendar');
  $('#calendar-title').text(new Date().format('mmmm yyyy'));
  
  // Load Notice
  $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/requestNotice',
    type: 'POST',
    success: function(res) {
      $('#notice_content').html(res.notice);
      if(Cookies.get('versionInfo') != res.version) {
        Cookies.set('versionInfo', res.version, {expires : 7});
        MicroModal.show('notice_modal');
      }
    }
  });
  
  // Draw Calendar
  for(let i = 0; i < 35; i++) {
    if(!(i % 7)) calendar.append('<div class="calendar-table__row"></div>');
    let thisDate = new Date(getDateFromCalendarStart(i));
    if(i < indexOfToday || i > indexOfToday + 14) // no valid dates generation
      $('.calendar-table__row').last().append('<div class="calendar-table__col calendar-table__inactive" data-date="' + thisDate.format('yyyy-mm-dd') + '"><div class="calendar-table__item"><div>' + thisDate.format(i ? (thisDate.getDate() === 1 ? 'm/d' : 'd') : 'm/d') + '</div></div></div>');
    else // valid dates generation
      $('.calendar-table__row').last().append('<div class="calendar-table__col' + (i === indexOfToday ? ' calendar-table__today calendar-table__event' : '') + '" data-date="' + thisDate.format('yyyy-mm-dd') + '"><div class="calendar-table__item"><div>' + thisDate.format(i ? (thisDate.getDate() === 1 ? 'm/d' : 'd') : 'm/d') + '</div></div></div>');
  }
  
  weather();
  
  // Load Table data
  user = {};
  load(logincheck(user));
}

function eventListener() {
  $('.calendar-table__col').on('click', function() {
    // Highlight selected date
    $('.calendar-table__event').removeClass('calendar-table__event');
    $(this).addClass('calendar-table__event');

    // Show add record button if active date
    if(!$(this).hasClass('calendar-table__inactive'))
      $('#addRecord').addClass('addRecord_active').css('background-color', '#2196f3');
    else
      $('#addRecord').removeClass('addRecord_active').css('background-color', 'darkgray');
    
    // Show date contents
    $('#contentArea').css('display', 'block');
    let datestring = new Date($(this).attr('data-date')).format('m월 d일 ddd요일');
    if(weather) {
      if($(this).hasClass('calendar-table__today')) {
        let pm10 = weather.current_weather.dust.pm10, pm25 = weather.current_weather.dust.pm25;
        let pm10color = pm10 > 30 ? pm10 > 80 ? pm10 > 150 ? '#ff5959' : '#fd9b5a' : '#00c73c' : '#32a1ff';
        let pm25color = pm25 > 15 ? pm25 > 35 ? pm25 > 75 ? '#ff5959' : '#fd9b5a' : '#00c73c' : '#32a1ff';
        datestring += '&nbsp;&nbsp;&nbsp;<span style="font-weight: normal">' + weather.current_weather.temp + '℃ ' + weather.current_weather.stat +
          '</span>&nbsp;<img src="/ajoumeow/Resources/weather/icon/now.png" style="width: 1rem; height: 1rem;">&nbsp;&nbsp;&nbsp;' +
          '<div style="line-height: 0.9rem; vertical-align: middle; display: inline-block; font-weight: normal; font-size: 0.7rem">pm10 : <span style="color: ' + pm10color + '">' + pm10 + '</span>㎍/㎥<br>pm2.5: <span style="color: ' + pm25color + '">' + pm25 + '</span>㎍/㎥</div>';
      }
      else {
        let tgt = weather.weather_forecast.filter(o => o.day == new Date($(this).attr('data-date')).format('mm-dd'));
        if(tgt[0]) datestring += '&nbsp;&nbsp;&nbsp;<span style="font-weight: normal">' + tgt[0].temp + ' ' + tgt[0].stat + '</span>&nbsp;<img src="/ajoumeow/Resources/weather/icon/' + tgt[0].day + '.png" style="width: 1rem; height: 1rem;">';
      }
    }
    
    $('#dateInfo h4').html(datestring);
    
    //weather

    let content = $(this).attr('data-content') ? JSON.parse($(this).attr('data-content')) : [], contentHTML = "";
    
    $('#contents').html('');
    if($(this).children('div').css('background-image') === 'none') {
      $('#contents').append("<div width='100%' style='text-align: center'><br><i class='fas fa-calendar-check' style='font-size: 2rem; color: #aaa'></i></div>");
      $('#contents').append("<div width='100%' style='text-align: center; color: #bbb; margin: 1rem 0'>급식 신청자가 없습니다!</div>");
    }
    else {
      let bgColor = { 1: 'lightcoral', 2: 'gold', 3: 'forestgreen' };
      for(let obj of content) {
        let pplHTML = "<div class='courseContent' data-course='" + obj.course + "'>";
        for(let ppl of obj.ppl) pplHTML += "<span style='margin: 0 0.3rem;'><span class='ripple namecard' style='display: inline-block; width: 4rem; height: 2rem; line-height: 1.5rem; text-align: center; border-radius: 3px; border: solid 1px " + bgColor[obj.course] + "; background-color: " + bgColor[obj.course] + "; color: white; padding: 0.2rem' data-id='" + ppl.ID + "' data-name='" + ppl.name + "'>" + ppl.name + "</span></span>";
        pplHTML += "</div>";
        $('#contents').append('<div style="margin-bottom: 0.1rem; margin-top: 0.5rem"><h4>' + obj.course + '코스</h4></div>').append(pplHTML);
      }
    }
    $('.namecard').not('.example').on('click', function() {
      $('.deleteActive').removeClass('deleteActive');
      if(user.admin || (!$('.calendar-table__event').hasClass('calendar-table__inactive') && user.id && user.id == $(this).attr('data-id'))) $(this).addClass('deleteActive');
      $('.deleteActive').on('click', function() {
        // delete record
        let target = {
          date: $('.calendar-table__event').attr('data-date'),
          course: $(this).closest('div').attr('data-course'),
          id: $(this).attr('data-id'),
          name: $(this).attr('data-name')
        }
        validator('delete', target);
      });
    });
  });
  $('#addRecord').click(function() {
    if($('.calendar-table__event').hasClass('calendar-table__inactive')) return; 
    if($('.calendar-table__event').children('div').css('background-image') === 'none') {
      $('#contents').html('');
      for(let i = 1; i <= 3; i++) $('#contents').append('<div style="margin-bottom: 0.1rem; margin-top: 0.5rem"><h4>' + i + '코스</h4><div class="courseContent" data-course="' + i + '"></div></div>');
    }
    
    $('.courseContent').each(function(index, item) {
      if($(item).children('span.addToCourse').length) return;
      $(item).append("<span class='addToCourse' style='margin: 0 0.3rem;'><span class='ripple' style='display: inline-block; width: 4rem; height: 2rem; line-height: 1.5rem; text-align: center; border-radius: 3px; border: dashed 1px gray; color: gray; padding: 0.2rem;'>+</span></span>");
    });
    $('.addToCourse').on('click', function() {
      // add record
      let target = {
        date: $('.calendar-table__event').attr('data-date'),
        course: $(this).closest('div').attr('data-course')
      }
      validator('add', target);
    });
  });
  $('.sidebar_overlay').click(function() { 
    $('#sidebar').css('display', 'none');
  }).children().click(function() { return false; });
}

function load() {
  $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/records',
    type: "POST",
    dataType: 'json',
    data: { 'startDate' : getDateFromCalendarStart(0), 'endDate' : getDateFromCalendarStart(28) },
    success: function(record) {
      // Build recArr data
      let recArr = [];
      for(let rec of record[0]) {
        let recDate = new Date(rec.date).format('yyyy-mm-dd');
        let target = recArr.filter(o => o.date === recDate);
        if(!target.length) {
          recArr.push({ date: recDate, courses: [{ course: 1, ppl: [] }, { course: 2, ppl: [] }, { course: 3, ppl: [] }] });
          let course = recArr[recArr.length - 1].courses.filter(o => o.course == rec.course.replace(/\D/g, ''));
          course[0].ppl.push({ ID: rec.ID, name: rec.name, timestamp: rec.timestamp });
        }
        else {
          let course = target[0].courses.filter(o => o.course == rec.course.replace(/\D/g, ''));
          course[0].ppl.push({ ID: rec.ID, name: rec.name, timestamp: rec.timestamp });
        }
      }
      
      // Set Calendar
      $('.calendar-table__item').not('.hovered').css('background-image', 'none').children('div.my').removeClass('my');
      for(let date of recArr) {
        // Set SVG background
        let svg = dateDataToSvgTranslator(date.courses);
        $('div[data-date="' + date.date + '"]').attr('data-content', JSON.stringify(date.courses));
        $('div[data-date="' + date.date + '"] > div').css('background-image', svg);
        
        // Highlight if reserved
        let flag = false;
        for(let e of date.courses) {
          if(e.ppl.filter(o => o.ID == user.id).length) {
            flag = true;
            break;
          }
        }
        if(flag) $('div[data-date="' + date.date + '"] > div > div').addClass('my');
      }
      $('.calendar-table__event').trigger('click');
    },
  });
}
      
function validator(type, target) {
  if(!user.id) return toastr['error']('INVAILD_PAYLOAD');
  transmitter({
    type: type,
    date: target.date,
    course: target.course + '코스',
    id: target.id ? target.id : Number(user.id),
    name: target.name ? target.name : user.name
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
      success: load
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
      success: load
    });
  }
}

function courseImg(course) {
  $('#spot_modal-title').text(course.replace('-', '코스 ') + '번째 급식소');
  $('#courseImg').attr('src', '/ajoumeow/Resources/Images/Map/spot_' + course + '.jpg');
  MicroModal.show('spot_modal');
}

function getDateFromCalendarStart(plusdate) { return new Date(Date.now() - ((new Date().getDayNum() + 7 - plusdate) * 24 * 3600000)).format('yyyy-mm-dd'); }
function dateDataToSvgTranslator(courses) {
  let courseColor = { 1: 'red', 2: 'gold', 3: 'limegreen' };
  let dotPosition = { CxCyRStrW: [25, 8, 1.8, 1.7], 1: [25], 2: [21, 29], 3: [18, 25, 32] };
  let svgString = `url("data:image/svg+xml,%3Csvg width='54' height='54' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E`;
  let courseCount = [0, 0];
  for(let course of courses) if(course.ppl.length) courseCount[0]++;
  
  for(let course of courses) {
    let ppl = course.ppl.length;
    if(!ppl) continue;
    svgString += `%3Ccircle cx='` + dotPosition[courseCount[0]][courseCount[1]] + `' cy='8' r='1.7' stroke='` + courseColor[course.course] + `' stroke-width='1.3' fill='` + (ppl === 1 ? 'white' : courseColor[course.course]) + `'%3E%3C/circle%3E`;
    courseCount[1]++;
  }
  
  svgString += `%3C/svg%3E`;
  return svgString;
}

function weather() {
  $.ajax({
    url: '/ajoumeow/Resources/weather/weather.json',
    cache: false,
    success: function(res) {
      weather = res;
      console.log('Weather Update : ' + new Date(weather.update * 1000).format('yyyy-mm-dd HH:MM:ss'));
    }
  });
}

window.onload = function () {
  var ImageMap = function (map) {
    var n,
      areas = map.getElementsByTagName('area'),
      len = areas.length,
      coords = [],
      previousWidth = 2500;
    for (n = 0; n < len; n++) coords[n] = areas[n].coords.split(',');
    this.resize = function () {
      var n, m, clen,
        x = document.body.clientWidth / previousWidth;
      for (n = 0; n < len; n++) {
        clen = coords[n].length;
        for (m = 0; m < clen; m++) coords[n][m] *= x;
        areas[n].coords = coords[n].join(',');
      }
      previousWidth = document.body.clientWidth;
      return true;
    };
    window.onresize = this.resize;
  },
  imageMap = new ImageMap(document.getElementById('Map'));
  imageMap.resize();
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
Date.prototype.getDayNum = function() { return this.getDay() ? this.getDay() : 7; }

