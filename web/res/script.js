const api = 'https://ajoumeow.luftaquila.io/api';
$(function() {
  init();
  eventListener();
});

/*
   |\---/|
   | ,_, |
    \_`_/-..----.
 ___/ `   ' ,""+ \ 
(__...'   __\    |`.___.';
  (_,...'(_,.`__)/'.....+

  ,-.       _,---._ __  / \
 /  )    .-'       `./ /   \
(  (   ,'            `/    /|
 \  `-"             \'\   / |
  `.              ,  \ \ /  |
   /`.          ,'-`----Y   |
  (            ;        |   '
  |  ,-.    ,-'         |  /
  |  | (   | luftaquila | /
  )  |  \  `.___________|/
  `--'   `--'

(:`--..___...-''``-._             |`._
  ```--...--.      . `-..__      .`/ _\  
            `\     '       ```--`.    />
            : :   :               `:`-'
             `.:.  `.._--...___     ``--...__      
                ``--..,)       ```----....__,)

      |\      _,,,---,,_
ZZZzz /,`.-'`'    -.  ;-;;,_
     |,4-  ) )-,_. ,\ (  `'-'
    '---''(_/--'  `-'\_)
*/

function init() {
  user = null;
  let indexOfToday = (new Date(new Date().format('yyyy-mm-dd')).getTime() - new Date(getDateFromCalendarStart(0)).getTime()) / (1000 * 60 * 60 * 24);
  let calendar = $('#calendar');

  // Draw calendar
  for(let i = 0; i < 35; i++) {
    if(!(i % 7)) calendar.append('<div class="calendar-table__row"></div>');
    let thisDate = new Date(getDateFromCalendarStart(i));
    if(i == 34) // add button generation
      $('.calendar-table__row').last().append(`<div id='addRecord' class="calendar-table__col"><div style='height: 100%; padding: 7px'><div class='ripple calendar-table__item' style='z-index: 0; line-height: 50px; text-align: center; font-size: 1.2rem; border-radius: 50%; background-color: #2196f3; color: white;'><i class='fas fa-plus'></i></div></div></div>`);
    else if(i < indexOfToday || i > indexOfToday + 21) // no valid dates generation
      $('.calendar-table__row').last().append('<div class="calendar-table__col calendar-table__inactive" data-date="' + thisDate.format('yyyy-mm-dd') + '"><div class="calendar-table__item"><div>' + thisDate.format(i ? (thisDate.getDate() === 1 ? 'm/d' : 'd') : 'm/d') + '</div></div></div>');
    else // valid dates generation
      $('.calendar-table__row').last().append('<div class="calendar-table__col' + (i === indexOfToday ? ' calendar-table__today calendar-table__event' : '') + '" data-date="' + thisDate.format('yyyy-mm-dd') + '"><div class="calendar-table__item"><div>' + thisDate.format(i ? (thisDate.getDate() === 1 ? 'm/d' : 'd') : 'm/d') + '</div></div></div>');
  }

  loadWeather(); // Load weather data
  autoLogin(); // Proceed login process
}

function eventListener() {
  $('.calendar-table__col').on('click', function() {
    if(this.id == 'addRecord') return;
    // Highlight selected date
    $('.calendar-table__event').removeClass('calendar-table__event');
    $(this).addClass('calendar-table__event');

    // Show add record button if active date
    if(!$(this).hasClass('calendar-table__inactive'))
      $('#addRecord').children('div').children('div').addClass('addRecord_active').css('background-color', '#2196f3');
    else
      $('#addRecord').children('div').children('div').removeClass('addRecord_active').css('background-color', 'darkgray');

    // Show date contents
    $('#contentArea').css('display', 'block');

    let datestring = new Date($(this).attr('data-date')).format('m월 d일 ddd요일');
    if(weather) {
      if($(this).hasClass('calendar-table__today')) {
        let pm10 = weather.current.dust.pm10, pm25 = weather.current.dust.pm25;
        let pm10color = pm10 > 30 ? pm10 > 80 ? pm10 > 150 ? '#ff5959' : '#fd9b5a' : '#00c73c' : '#32a1ff';
        let pm25color = pm25 > 15 ? pm25 > 35 ? pm25 > 75 ? '#ff5959' : '#fd9b5a' : '#00c73c' : '#32a1ff';
        datestring += `&ensp;<span id="weatherstat" style="font-weight: normal">${weather.current.temp}℃ ${weather.current.weather}</span>&nbsp;<img src="/res/image/weather/icon${weather.current.icon}.png" style="width: 1rem; height: 1rem;">&ensp;<div style="line-height: 0.9rem; vertical-align: middle; display: inline-block; font-weight: normal; font-size: 0.7rem">pm10 : <span style="color: ${pm10color}">${pm10}</span>㎍/㎥<br>pm2.5: <span style="color: ${pm25color}">${pm25}</span>㎍/㎥</div>`;
      }
      else {
        let tgt = weather.forecast.find(o => o.date == new Date($(this).attr('data-date')).format('yyyy-mm-dd'));
        if(tgt) datestring += `&ensp;<span id="weatherstat" style="font-weight: normal">${tgt.temp}℃ ${tgt.weather}</span>&nbsp;<img src="/res/image/weather/icon${tgt.icon}.png" style="width: 1rem; height: 1rem;">`;
      }
    }
    $('#dateInfo h4').html(datestring);
    $('#weatherstat').click(function() { alert('weather updated on\n' + weather.update); });

    let content = $(this).attr('data-content') ? JSON.parse($(this).attr('data-content')) : [], contentHTML = "";
    $('#contents').html('');
    if($(this).children('div').css('background-image') === 'none') {
      $('#contents').append("<div style='height: 9.5rem'><div width='100%' style='text-align: center'><br><i class='fas fa-calendar-check' style='font-size: 2rem; color: #aaa'></i></div><div width='100%' style='text-align: center; color: #bbb; margin: 1rem 0'>급식 신청자가 없습니다!</div></div>");
      $('#contents').append("");
    }
    else {
      let bgColor = { 1: 'lightcoral', 2: 'gold', 3: 'forestgreen' };
      
      let table = `<table>`;      
      for(let obj of content) {
        table += `<tr style='height: 3rem'><td style='padding-right: .5rem;'><b>${obj.course}코스</b></td><td class='courseContent' data-course='${obj.course}'>`
        for(let ppl of obj.ppl) table += `<span class='ripple namecard' style='display: inline-block; width: 4rem; height: 2rem; line-height: 1.5rem; text-align: center; border-radius: 3px; border: solid 1px ${bgColor[obj.course]}; background-color: ${bgColor[obj.course]}; color: white; padding: 0.2rem; margin: 0 .3rem;' data-id='${ppl.ID}' data-name='${ppl.name}'>${ppl.name}</span>`;
        table += `</td></tr>`;
      }
      table += `</table>`
      $('#contents').append(table);
    }

    $('.namecard').not('.example').on('click', function() {
      $('.deleteActive').removeClass('deleteActive');
      if(user && user.role != '회원' || (!$('.calendar-table__event').hasClass('calendar-table__inactive') && user.ID && user.ID == $(this).attr('data-id'))) $(this).addClass('deleteActive');
      $('.deleteActive').on('click', function() {
        // delete record
        let target = {
          date: $('.calendar-table__event').attr('data-date'),
          course: $(this).closest('td').attr('data-course'),
          id: $(this).attr('data-id'),
          name: $(this).attr('data-name')
        }
        validator('DELETE', target);
      });
    });
  });
  $('#addRecord').click(async function(e) {
    e.preventDefault();
    if($('.calendar-table__event').hasClass('calendar-table__inactive')) return;
    if($('.calendar-table__event').children('div').css('background-image') === 'none') { // if there is no any record
      $('#contents').html('').append(`<table><tr style='height: 3rem'><td style='padding-right: .5rem;'><b>1코스</b></td><td class='courseContent' data-course='1'><tr style='height: 3rem'><td style='padding-right: .5rem;'><b>2코스</b></td><td class='courseContent' data-course='2'><tr style='height: 3rem'><td style='padding-right: .5rem;'><b>3코스</b></td><td class='courseContent' data-course='3'></table>`);
    }
    
    let max = await $.ajax(`${api}/settings/maxFeedingUserCount`);
    $('.courseContent').each(function(index, item) {
      if($(item).children('span.addToCourse').length) return; // cancel if add button already activated
      else if($(item).children('span.namecard').length >= Number(max.data)) return; // cancel if max count met
      $(item).append("<span class='addToCourse' style='margin: 0 0.3rem;'><span class='ripple' style='display: inline-block; width: 4rem; height: 2rem; line-height: 1.5rem; text-align: center; border-radius: 3px; border: dashed 1px gray; color: gray; padding: 0.2rem;'>+</span></span>");
    });
    $('.addToCourse').on('click', function() {
      // add record
      let target = {
        date: $('.calendar-table__event').attr('data-date'),
        course: $(this).closest('td').attr('data-course')
      }
      validator('POST', target);
    });
  });
  $('.sidebar_overlay').click(function() {
    $('#sidebar').css('display', 'none');
  }).children().click(function() { return false; });
  $('#magic').click(function() { (function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })(); });
}

function load() {
  $.ajax({
    url: `${api}/record`,
    data: { 'startDate' : getDateFromCalendarStart(0), 'endDate' : getDateFromCalendarStart(35) },
    beforeSend: xhr => xhr.setRequestHeader('jwt', Cookies.get('jwt')),
    success: function(record) {
      // Build recArr data
      let recArr = [];
      for(let rec of record.data) {
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
        let svgwidth = $('div[data-date="' + date.date + '"]').width();
        let svg = dateDataToSvgTranslator(date.courses, svgwidth);
        $('div[data-date="' + date.date + '"]').attr('data-content', JSON.stringify(date.courses));
        $('div[data-date="' + date.date + '"] > div').css('background-image', svg);

        // Highlight if reserved by myself
        if(user) {
          let flag = false;
          for(let e of date.courses) {
            if(e.ppl.filter(o => o.ID == user.ID).length) {
              flag = true;
              break;
            }
          }
          if(flag) $('div[data-date="' + date.date + '"] > div > div').addClass('my');
        }
      }
      $('.calendar-table__event').trigger('click');
    },
    error: e => toastr["error"](`${e.responseJSON.msg}<br>${e.responseJSON.data}`)
  });
}

transmitFlag = false;
function validator(type, target) {
  if(!user) return toastr['error']('로그인을 해 주세요!');
  else if(transmitFlag) return toastr['error']('요청이 진행 중입니다.');
  transmitter({
    type: type,
    date: target.date,
    course: target.course + '코스',
    id: target.id ? target.id : Number(user.ID),
    name: target.name ? target.name : user.name
  });
}
function transmitter(data) {
  transmitFlag = true;
  $.ajax({
    url: `${api}/record`,
    type: data.type,
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
    data: {
      date: data.date,
      course: data.course,
      ID: data.id,
      name: data.name
    },
    success: load,
    error: e => toastr["error"](`${e.responseJSON.msg}<br>${e.responseJSON.data}`),
    complete: function() { transmitFlag = false; }
  });
}

function getDateFromCalendarStart(plusdate) { return new Date(Date.now() - ((new Date().getDayNum() + 7 - plusdate) * 24 * 3600000)).format('yyyy-mm-dd'); }
function dateDataToSvgTranslator(courses, width) {
  let courseColor = { 1: 'red', 2: 'gold', 3: 'limegreen' };
  let dotPosition = { CxCyRStrW: [25 / 54 * width, 8 / 54 * width, 1.7 / 54 * width, 1.3 / 54 * width], 1: [25 / 54 * width], 2: [21 / 54 * width, 29 / 54 * width], 3: [18 / 54 * width, 25 / 54 * width, 32 / 54 * width] };
  let svgString = `url("data:image/svg+xml,%3Csvg width='` + width + `' height='` + width + `' xmlns='http://www.w3.org/2000/svg' version='1.1'%3E`;
  let courseCount = [0, 0];
  for(let course of courses) if(course.ppl.length) courseCount[0]++;

  for(let course of courses) {
    let ppl = course.ppl.length;
    if(!ppl) continue;
    svgString += `%3Ccircle cx='` + dotPosition[courseCount[0]][courseCount[1]] + `' cy='` + dotPosition.CxCyRStrW[1] + `' r='` + dotPosition.CxCyRStrW[2] + `' stroke='` + courseColor[course.course] + `' stroke-width='` + dotPosition.CxCyRStrW[3] + `' fill='` + (ppl === 1 ? 'white' : courseColor[course.course]) + `'%3E%3C/circle%3E`;
    courseCount[1]++;
  }

  svgString += `%3C/svg%3E`;
  return svgString;
}

function loadWeather() {
  $.ajax({
    url: '/res/weather.json',
    success: res => { weather = res; }
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
Date.prototype.getDayNum = function() { return this.getDay() ? this.getDay() : 7; }
