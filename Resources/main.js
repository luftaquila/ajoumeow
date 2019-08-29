$(function() {
  $('#version').html($('#version').attr('href').substring($('#version').attr('href').indexOf('?') + 1) + ' α');
  clickEventListener();
  google.charts.load('current', {'packages':['corechart']});
  google.charts.setOnLoadCallback(chartLoader());
  setTimeout(function() {
    setInterval(chartLoader, 180000) }, 180000);
});
$("#DATA").submit(function(event) {
  event.preventDefault();
  var staffList = [['오병준', '3691'], ['신은영', '7257'], ['배주근', '4910']];
  var file = $('#filedata')[0].files[0];
  if($('#fileReq').prop('checked')) {
    if(!$.trim($('#name').val()))      { alertify.error('이름을 입력하세요');      return; }
    if(!$.trim($('#belonging').val())) { alertify.error('학과를 입력하세요');      return; }
    if(!$.trim($('#contact').val()))   { alertify.error('연락처를 입력하세요');    return; }
    if(!$.trim($('#purpose').val()))   { alertify.error('사용 목적을 입력하세요'); return; }
    if(file.name.indexOf(',') + 1)     { alertify.error('파일명에 콤마(,)는 사용하실 수 없습니다.');            return; }
    if($('#name').val().indexOf(',') + 1)      { alertify.error('이름에 콤마(,)는 사용하실 수 없습니다.');      return; }
    if($('#belonging').val().indexOf(',') + 1) { alertify.error('학과명에 콤마(,)는 사용하실 수 없습니다.');    return; }
    if($('#purpose').val().indexOf(',') + 1)   { alertify.error('사용 목적에 콤마(,)는 사용하실 수 없습니다.'); return; }
    if(!file) { alertify.error('파일을 선택하세요'); return; }
    if(!new RegExp(/\.(stl|zip)/ig).test(file.name.substr(file.name.length - 4, 4))) { alertify.error('stl 또는 zip 확장자만 업로드 가능합니다.'); return; }
  }
  alertify.prompt('Verification Required', function(e) {
    var str = $('#alertify-text').val();
    if(e) {
      for (i in staffList) {
        if(staffList[i][1] == str) {
          $('input').attr('disabled', true);
          alertify.log('Transmitting...', "", 0);
          var serializedData = '날짜=' + new Date().format('yyyy. mm. dd TT hh시 MM분') +
                               '&이름=' + $.trim($('#name').val()) +
                               '&소속 / 학과=' + $.trim($('#belonging').val()) +
                               '&연락처=' + $.trim($('#contact').val()) +
                               '&파일명=' + ($('#fileReq').prop('checked') ? file.name : '파일 없음') +
                               '&사용 목적=' + $.trim($('#purpose').val()) +
                               '&사용 장비=' + $('input:radio[name=machine]:checked').val() + machineNumReturn() +
                               '&사용량=' + machineUse($('input:radio[name=machine]:checked').attr('id')) +
                               '&구분=' + $('input:radio[name=ppl]:checked').val() +
                               '&요금=￦' + addComma(feeCalc($('input:radio[name=machine]:checked').attr('id'), $('input:radio[name=ppl]:checked').val(), Number($('input:checkbox[name=discount]:checked').length))) +
                               '&결제=' + $('input:radio[name=pay]:checked').val() +
                               '&담당자=' + staffList[i][0];
          console.log(serializedData);
          var dropboxToken = '2Gsi0PEV9cAAAAAAAAAACY5VZ_5YAk9A0360cufNAI0b1277InPbTU0o-wbw9vPc';
          var xhr = new XMLHttpRequest();
          xhr.upload.onprogress = function(evt) {
            var percentComplete = parseInt(100.0 * evt.loaded / evt.total);
            $('.alertify-log-show').html('Uploading File... ' + percentComplete + '%');
            if(isNaN(percentComplete)) {
              alertify.error('File Not Found');
              $('input').attr('disabled', false);
            }
          };
          xhr.onload = function() {
            if (xhr.status === 200) {
              var fileInfo = JSON.parse(xhr.response);
              $('.alertify-log-show').css('display', 'none');
              alertify.log('Transmitting Data...');
              request = $.ajax({
                  type: 'POST',
                  url: 'https://script.google.com/macros/s/AKfycbyi2sn97OkkOFIfVt3BVH3ToEPBFvx4G_dQ_oS_jYxqcZNuB_c/exec',
                  data: encodeURI(serializedData)
              });
              request.done(function() {
                alertify.success('Transmitted');
              });
              request.fail(function(jqXHR, textStatus, errorThrown) {
                alertify.error('DataError : ' + textStatus + errorThrown);
              });
              request.always(function() {
                $('input').attr('disabled', false);
                $('#DATA')[0].reset();
                $('#machineSelect').css('display', 'none');
              });
            }
            else {
              var errorMessage = xhr.response || 'Unable to upload file';
              $('.alertify-log-show').css('display', 'none');
              alertify.error('UploadError : ' + errorMessage);
              $('input').attr('disabled', false);
            }
          };
          if($('#fileReq').prop('checked')) {
            xhr.open('POST', 'https://content.dropboxapi.com/2/files/upload');
            xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
            xhr.setRequestHeader('Content-Type', 'application/octet-stream');
            xhr.setRequestHeader('Dropbox-API-Arg', UniEncode({
              path: '/' + new Date().format('yyyy. mm. dd TT hh시 MM분 ') + $.trim($('#name').val()) + ' - ' + $('#belonging').val().replace(/\//g, '~') + '/' + file.name,
              mode: 'add',
              autorename: true
            }));
            xhr.send(file);
          }
          else {
            xhr.open('POST', 'https://api.dropboxapi.com/2/files/create_folder_v2');
            xhr.setRequestHeader('Authorization', 'Bearer ' + dropboxToken);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(UniEncode({
              path: '/' + new Date().format('yyyy. mm. dd TT hh시 MM분 ') + $.trim($('#name').val()) + ' - ' + $('#belonging').val().replace(/\//g, '~'),
            }));
          }
          return;
        }
      }
    }
    alertify.error('Verification Failure');
  });
  $('#alertify-text').replaceWith('<input type="password" id="alertify-text" class="alertify-text"/>');
  setTimeout(function() {
    $('#alertify-text').focus();
  }, 500);
  $('#alertify-text').focus();
});
function feeCalc(machine, type, discount) {
  if(type == '수동 입력'){
    return $('#manualCost').val().replace(/[^\d]+/g, '');
  }
  if(machine == 'cubicon' || machine == 'sindo') {
    var hour = Number($('#usehour').val()), min = Number($('#usemin').val());
    if(type == '교내구성원') {
      if(discount) return calc(1500, 6, hour, min);
      else return calc(1500, 0, hour, min);
    }
    else return calc(2000, 0, hour, min);
  }
  else if(machine == 'zortrax') {
    var hour = Number($('#usehour').val()), min = Number($('#usemin').val());
    if(type == '교내구성원') {
      if(discount) return calc(1500, 2, hour, min);
      else return calc(1500, 0, hour, min);
    }
    else return calc(2000, 0, hour, min);
  }
  else if(machine == 'onyx') {
    var hour = Number($('#usehour').val()), min = Number($('#usemin').val());
    if(type == '교내구성원') {
      if(discount) return calc(2000, 2, hour, min);
      else return calc(2000, 0, hour, min);
    }
    else return calc(4000, 0, hour, min);
  }
  else if(machine == 'freeform') {
    var hour = Number($('#usehour').val()), min = Number($('#usemin').val());
    if(type == '교내구성원') {
      if(discount) return calc(4000, 1, hour, min);
      else return calc(4000, 0, hour, min);
    }
    else return calc(6000, 0, hour, min);
  }
  else if(machine == 'laser') {
    var hour = Number($('#usehour').val()), min = Number($('#usemin').val());
    if(type == '교내구성원') return calc(1500, 0, hour, min);
    else return calc(2500, 0, hour, min);
  }
  else if(machine == 'plotter') {
    var area = $('#xaxis').val() * $('#yaxis').val();
    fee = area / 100;
    if(type == '교내구성원') return Math.round(fee * 5 / 1000) * 100;
    else return Math.round(fee * 5 / 1000) * 100;
  }
  else if(machine == 'cutter') {
    var hour = Number($('#usehour').val()), min = Number($('#usemin').val());
    if(type == '교내구성원') return calc(1500, 0, hour, min);
    else return calc(2500, 0, hour, min);
  }
  else if(machine == 'uv') {
    var area = $('#xaxis').val() * $('#yaxis').val();
    fee = area / 100;
    if(type == '교내구성원') return Math.round(fee * 8 / 100) * 100;
    else return Math.round(fee * 8 / 100) * 100;
  }
  else if(machine == 'x7') {
    var hour = Number($('#usehour').val()), min = Number($('#usemin').val());
    if(type == '교내구성원') return calc(3500, 0, hour, min) + Number($('#mainMaterial').val()) * 5000;
    else return calc(6500, 0, hour, min) + Number($('#mainMaterial').val()) * 9000;
  }
  else if(machine == 'objet350') {
    if(type == '교내구성원') return Math.round(($('#mainMaterial').val() * 400 + $('#subMaterial').val() * 150) / 100) * 100;
    else return Math.round(($('#mainMaterial').val() * 700 + $('#subMaterial').val() * 250) / 100) * 100;
  }
  else if(machine == 'f370') {
    var hour = Number($('#usehour').val()), min = Number($('#usemin').val());
    if(type == '교내구성원') return calc(14000, 0, hour, min);
    else return calc(20000, 0, hour, min);
  }
  else if(machine == 'xfab') {
    if(type == '교내구성원') return $('#mainMaterial').val() * 400;
    else return $('#mainMaterial').val() * 600;
  }
  else if(machine == '3d') {
    var hour = Number($('#usehour').val()), min = Number($('#usemin').val());
    if(type == '교내구성원') return calc(6000, 0, hour, min);
    else return calc(12000, 0, hour, min);
  }
}
function calc(fee, sub, hour, min) {
  var price = Number(fee) * (hour - Number(sub) + (min / 60));
  return price <= 0 ? 0 : price < Number(fee) ? Number(fee) : Math.round(price / 100) * 100;
}
function machineUse(machine) {
  if(machine == 'cubicon' || machine == 'sindo' || machine == 'onyx' || machine == 'freeform' || machine == 'zortrax' || machine == 'laser' || machine == 'cutter' || machine == 'f370' || machine == '3d') {
    return Number($('#usehour').val()) + '시간 ' + Number($('#usemin').val()) + '분';
  }
  else if(machine == 'plotter' || machine == 'uv') {
    return Number($('#xaxis').val()) + 'mm * ' + Number($('#yaxis').val()) + 'mm';
  }
  else if(machine == 'x7') {
    return Number($('#usehour').val()) + '시간 ' + Number($('#usemin').val()) + '분 / 카본 : ' + Number($('#mainMaterial').val()) + 'cc';
  }
  else if(machine == 'objet350') {
    return '메인 : ' + Number($('#mainMaterial').val()) + 'g / 서브 : ' + Number($('#subMaterial').val()) + 'g';
  }
  else if(machine == 'xfab') {
    return '메인 : ' +  Number($('#mainMaterial').val()) + 'g';
  }
}
function machineNumReturn() {
  if($('#plotter:checked, #cutter:checked, #uv:checked, #x7:checked, #objet350:checked, #f370:checked, #xfab:checked, #zortrax:checked, #3d:checked').length == 0) {
    return ' ' + $('input:radio[name=machineNum]:checked').val().substr(1, 1) + '번';
  }
  else return '';
}
function clickReset() {
  $('#feeInfo').css('display', 'inline');
  $('#machineDetail').html('');
  $('#payment').html('');
  $('#feeInfo').html('요금 : 0원');
  $('#discountWrap').css('display', 'none');
}
function keyupReset() {
  $('#submitWrapper').css('display', 'block');
  $('#usehour').keyup(function(event) {
    event = event || window.event;
    this.value = autoLimit(this.value.trim(), 3);
  });
  $('#usemin').keyup(function(event) {
    event = event || window.event;
    this.value = autoLimit(this.value.trim(), 2);
  });
  $('input[name=cost]').keyup(function() {
    if(!$('#manualActivate').attr('checked')) {
      $('#feeInfo').html('요금 : ' + addComma(feeCalc($('input:radio[name=machine]:checked').attr('id'), $('input:radio[name=ppl]:checked').val(), Number($('input:checkbox[name=discount]:checked').length))) + '원');
    }
  });
  $('#discountWrap').click(function() {
    $('#feeInfo').html('요금 : ' + addComma(feeCalc($('input:radio[name=machine]:checked').attr('id'), $('input:radio[name=ppl]:checked').val(), Number($('input:checkbox[name=discount]:checked').length))) + '원');
  });
}
function autoLimit(str, num) {
  if(str.length > num) { return str.substr(0, num); }
  return str;
}
function addComma(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function isNum(s) {
  s += '';
  if (s == '' || isNaN(s)) return false;
  return true;
}
function UniEncode(str) {
  return JSON.stringify(str).replace(/[\u007f-\uffff]/g,
    function(c) { return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4); });
}
function chartLoader() {
  data = [], dataSlice = [], monthList = [];
  var date = [], dropDown = [], timeStr = '';
  $.ajax({
    url: 'https://docs.google.com/spreadsheet/pub?key=1vMeYMA-GLuTP_o0pUCwe9oUxSEoXZIXseeiYiiARObg&single=true&gid=0&sheet=장비사용&range=A2:J&output=csv',
    type: "GET",
    dataType: 'text',
    cache: false,
    success: function (response) {
      response = response.replace(/\"|￦/g, '');
      data = response.split('\n').map((line) => line.split(','));
      for (var i in data) date[data[i][0].substr(0, 12)] = date[data[i][0].substr(0, 12)] ? date[data[i][0].substr(0, 12)] + 1 : 1;
      monthList = Object.keys(date);
      for (var i in monthList) monthList[i] = [monthList[i], Object.values(date)[i]];
      dropDown = JSON.parse(JSON.stringify(monthList));
      for (var i in dropDown) dropDown[i] = String(dropDown[i]).substr(0, 8).replace('. ', '.');
      dropDown = dropDown.reduce( function(a,b) { if (a.indexOf(b) < 0) a.push(b); return a; }, []);
      dropDown.unshift('total');
      dropDown.forEach(function(value) { timeStr += '<option value=' + value + '>' + (value == 'total' ? '전체 기간' : value.replace('.', '년 ') + '월' ) + '</option>'; });
      $('#time').html(timeStr);
      chartDrawer();
    }
  });
}
function chartDrawer() {
  machineList = [['큐비콘', 0, 0, 0, 0], ['신도', 0, 0, 0, 0], ['Onyx', 0, 0, 0, 0], ['Freeform', 0, 0, 0, 0], ['Zortrax', 0, 0, 0, 0], ['레이저커터', 0, 0, 0, 0], ['플로터', 0, 0, 0, 0],
                     ['커팅플로터', 0, 0, 0, 0], ['UV 프린터', 0, 0, 0, 0], ['X7', 0, 0, 0, 0], ['Objet350', 0, 0, 0, 0], ['F370', 0, 0, 0, 0], ['Xfab', 0, 0, 0, 0], ['3D 스캐너', 0, 0, 0, 0]];
  dept = [], user = [];
  machineTotUse = [], machineAvgUse = [], machineTotFee = [], machineAvgFee = [], freeUse = [], usrFee = [['교내구성원', 0], ['일반인' , 0]];
  var startVal = 0, endVal = 0, dte = [];
  if( $('#time').val() != 'total') {
    for (var i in data) { if (data[i][0].substr(0, 8) == $('#time').val().replace('.', '. ')) { startVal = i; break; } }
    for (var i = startVal; i < data.length; i++) {
      if (data[i][0].substr(0, 8) != $('#time').val().replace('.', '. ')) { endVal = i; break; }
      else endVal = data.length;
    }
    dataSlice = JSON.parse(JSON.stringify(data)).splice(startVal, endVal - startVal);
  }
  else dataSlice = JSON.parse(JSON.stringify(data));
  for (var i in dataSlice) dte[dataSlice[i][0].substr(0, 12)] = dte[dataSlice[i][0].substr(0, 12)] ? dte[dataSlice[i][0].substr(0, 12)] + 1 : 1;
  for (var i in dataSlice) {
    var pos = dataSlice[i][6].indexOf(' ');
    dataSlice[i][6] = pos != -1 ? dataSlice[i][6].substr(0, pos) : dataSlice[i][6];
    dept[dataSlice[i][2].includes('학과') ? dataSlice[i][2] : '기타'] = dept[dataSlice[i][2].includes('학과') ? dataSlice[i][2] : '기타'] ? dept[dataSlice[i][2].includes('학과') ? dataSlice[i][2] : '기타'] + 1 : 1;
    user[dataSlice[i][8]] = user[dataSlice[i][8]] ? user[dataSlice[i][8]] + 1 : 1;
    if(dataSlice[i].length > 10) {
      var str = '';
      for (var j = 9; j < dataSlice[i].length; j++) str += dataSlice[i][j];
      dataSlice[i][9] = str;
      dataSlice[i].splice(10);
    }
    if(dataSlice[i][8] == '교내구성원') usrFee[0][1] += Number(dataSlice[i][9]);
    else if(dataSlice[i][8] == '일반인') usrFee[1][1] += Number(dataSlice[i][9]);
    for (var j in machineList) {
      var machine = machineList[j][0].split(' ');
      if(dataSlice[i].includes(machine[0])) {
        machineList[j][1] += 1;
        if(!(dataSlice[i].includes('Objet350') || dataSlice[i].includes('플로터') || dataSlice[i].includes('UV') || dataSlice[i].includes('Xfab'))) {
          var time;
          if(!dataSlice[i].includes('X7')) {
            time = dataSlice[i][7].split('시간 ');
            machineList[j][2] += (Number(time[0]) * 60 + Number(time[1].slice(0, -1)));
          }
          else {
            usage = dataSlice[i][7].split('분 /');
            time = usage[0].split('시간 ');
            machineList[j][2] += (Number(time[0]) * 60 + Number(time[1]));
          }
        }
        machineList[j][3] += Number(dataSlice[i][9]);
        if(dataSlice[i][9] == 0) { machineList[j][4] += 1; }
      }
    }
  }
  var dpt = Object.keys(dept), usr = Object.keys(user), dt = Object.keys(dte);
  var datum, options, avgUseZeroCount = 0, totUseZeroCount = 0, avgFeeZeroCount = 0, totFeeZeroCount = 0, freeUseCount = 0;
  machineTotUse = JSON.parse(JSON.stringify(machineList));
  machineAvgUse = JSON.parse(JSON.stringify(machineList));
  machineTotFee = JSON.parse(JSON.stringify(machineList));
  machineAvgFee = JSON.parse(JSON.stringify(machineList));
  freeUse = JSON.parse(JSON.stringify(machineList));
  for (var i in dpt) dpt[i] = [dpt[i], Object.values(dept)[i]];
  for (var i in usr) usr[i] = [usr[i], Object.values(user)[i]];
  for (var i in dt) dt[i] = [dt[i], Object.values(dte)[i]];
  for (var i in machineAvgUse) {
    machineAvgUse[i][1] = Math.round(machineAvgUse[i][2] / machineAvgUse[i][1]);
    machineAvgUse[i].splice(2);
    machineAvgUse[i][1] = isNaN(machineAvgUse[i][1]) ? 0 : machineAvgUse[i][1];
    avgUseZeroCount = machineAvgUse[i][1] == 0 ? avgUseZeroCount + 1 : avgUseZeroCount;
  }
  for (var i in machineAvgFee) {
    machineAvgFee[i][1] = Math.round(machineAvgFee[i][3] / machineAvgFee[i][1]);
    machineAvgFee[i].splice(2, 2);
    machineAvgFee[i][1] = isNaN(machineAvgFee[i][1]) ? 0 : machineAvgFee[i][1];
    avgFeeZeroCount = machineAvgFee[i][1] == 0 ? avgFeeZeroCount + 1 : avgFeeZeroCount;
  }
  for (var i in machineTotUse) {
    machineTotUse[i].splice(1, 1);
    machineTotUse[i].splice(3);
    totUseZeroCount = machineTotUse[i][1] == 0 ? totUseZeroCount + 1 : totUseZeroCount;
  }
  for (var i in machineTotFee) {
    machineTotFee[i].splice(1, 2);
    totFeeZeroCount = machineTotFee[i][1] == 0 ? totFeeZeroCount + 1 : totFeeZeroCount;
  }
  for (var i in freeUse) {
    freeUse[i].splice(2, 2);
    freeUse[i][1] = Math.round(freeUse[i][2] / freeUse[i][1] * 1000) / 10;
    freeUse[i][1] = isNaN(freeUse[i][1]) ? 0 : freeUse[i][1];
    freeUseCount = freeUse[i][1] == 0 ? freeUseCount + 1 : freeUseCount;
  }
  machineList.sort(function(a, b) { return parseInt(a[1]) > parseInt(b[1]) ? -1 : (parseInt(a[1]) < parseInt(b[1]) ? 1 : 0); });
  machineAvgUse.sort(function(a, b) { return parseInt(a[1]) > parseInt(b[1]) ? -1 : (parseInt(a[1]) < parseInt(b[1]) ? 1 : 0); });
  machineTotUse.sort(function(a, b) { return parseInt(a[1]) > parseInt(b[1]) ? -1 : (parseInt(a[1]) < parseInt(b[1]) ? 1 : 0); });
  machineAvgFee.sort(function(a, b) { return parseInt(a[1]) > parseInt(b[1]) ? -1 : (parseInt(a[1]) < parseInt(b[1]) ? 1 : 0); });
  machineTotFee.sort(function(a, b) { return parseInt(a[1]) > parseInt(b[1]) ? -1 : (parseInt(a[1]) < parseInt(b[1]) ? 1 : 0); });
  freeUse.sort(function(a, b) { return parseInt(a[1]) > parseInt(b[1]) ? -1 : (parseInt(a[1]) < parseInt(b[1]) ? 1 : 0); });
  dpt.sort(function(a, b) { return parseInt(a[1]) > parseInt(b[1]) ? -1 : (parseInt(a[1]) < parseInt(b[1]) ? 1 : 0); });
  usr.sort(function(a, b) { return parseInt(a[1]) > parseInt(b[1]) ? -1 : (parseInt(a[1]) < parseInt(b[1]) ? 1 : 0); });
  machineAvgUse.splice(machineAvgUse.length - avgUseZeroCount, avgUseZeroCount);
  machineTotUse.splice(machineTotUse.length - totUseZeroCount, totUseZeroCount);
  machineAvgFee.splice(machineAvgFee.length - avgFeeZeroCount, avgFeeZeroCount);
  machineTotFee.splice(machineTotFee.length - totFeeZeroCount, totFeeZeroCount);
  freeUse.splice(freeUse.length - freeUseCount, freeUseCount);
  options = {
    title: '오늘 현재까지 ' + (dt[dt.length - 1][0] == new Date().format('yyyy. mm. dd') ? dt[dt.length - 1][1] : 0) + ' 명 방문\n하루 평균 ' + (dataSlice.length / dt.length).toFixed(1) + ' 명 방문\n\n사용자 수 현황',
    legend: 'none',
    hAxis: { minValue: 0 }
  };
  dt.unshift(['날짜', '사용자 수']);
  for (var i in dt) dt[i][2] = dt[i][1];
  dt[0][2] = { role : 'annotation' };
  datum = google.visualization.arrayToDataTable(dt);
  new google.visualization.LineChart(document.getElementById('totalUsage')).draw(datum, options);

  machineList.unshift(['장비', '사용횟수', '총 가동 시간', '총 매출액', '무료 사용자 수']);
  machineAvgUse.unshift(['장비', '평균 가동 시간']);
  machineTotUse.unshift(['장비', '총 가동 시간']);
  machineAvgFee.unshift(['장비', '평균 매출액']);
  machineTotFee.unshift(['장비', '총 매출액']);
  freeUse.unshift(['장비', '무료 사용자 비율']);
  usrFee.unshift(['유형', '매출액']);
  dpt.unshift(['학과', '방문횟수']);
  usr.unshift(['유형', '방문횟수']);

  datum = google.visualization.arrayToDataTable(machineList);
  options = {
    title: '장비별 사용 현황',
    pieHole: 0.4
  };
  var chart = new google.visualization.PieChart(document.getElementById('MachineUse'));
  $('#MachineCnt').text(dataSlice.length);
  chart.draw(datum, options);

  datum = google.visualization.arrayToDataTable(dpt);
  options = {
    title: '학과별 사용 현황',
    pieHole: 0.4
  };
  new google.visualization.PieChart(document.getElementById('Belonging')).draw(datum, options);

  datum = google.visualization.arrayToDataTable(usr);
  options = {
    title: '사용자 분류별 현황',
    pieHole: 0.4
  };
  new google.visualization.PieChart(document.getElementById('User')).draw(datum, options);

  for (var i in machineTotUse) machineTotUse[i][2] = parseInt(machineTotUse[i][1] / 60) + '시간 ' + machineTotUse[i][1] % 60 + '분';
  machineTotUse[0][2] = { role : 'annotation' };
  machineTotUse.sort(function(a, b) { return parseInt(a[1]) > parseInt(b[1]) ? -1 : (parseInt(a[1]) < parseInt(b[1]) ? 1 : 0); });
  datum = google.visualization.arrayToDataTable(machineTotUse);
  options = {
    title: '장비 총 가동 시간 현황',
    pieSliceText : 'value',
    legend: 'none',
  };
  new google.visualization.BarChart(document.getElementById('totalWorkTime')).draw(datum, options);

  for (var i in machineAvgUse) machineAvgUse[i][2] = parseInt(machineAvgUse[i][1] / 60) + '시간 ' + machineAvgUse[i][1] % 60 + '분';
  machineAvgUse[0][2] = { role : 'annotation' };
  datum = google.visualization.arrayToDataTable(machineAvgUse);
  options = {
    title: '장비 1회 평균 가동 시간 현황',
    pieSliceText : 'value',
    legend: 'none',
  };
  new google.visualization.BarChart(document.getElementById('avgWorkTime')).draw(datum, options);

  for (var i in machineTotFee) machineTotFee[i][2] = addComma(machineTotFee[i][1]) + '원';
  machineTotFee[0][2] = { role : 'annotation' };
  datum = google.visualization.arrayToDataTable(machineTotFee);
  options = {
    title: '장비 총 매출액 현황',
    pieSliceText : 'value',
    legend: 'none',
  };
  new google.visualization.BarChart(document.getElementById('totalMoney')).draw(datum, options);
  for (var i in machineAvgFee) machineAvgFee[i][2] = addComma(Math.round(machineAvgFee[i][1])) + '원';
  machineAvgFee[0][2] = { role : 'annotation' };
  datum = google.visualization.arrayToDataTable(machineAvgFee);
  options = {
    title: '장비 1회 평균 매출액 현황',
    pieSliceText : 'value',
    legend: 'none',
  };
  new google.visualization.BarChart(document.getElementById('avgMoney')).draw(datum, options);

  for (var i in usrFee) usrFee[i][2] = addComma(Math.round(usrFee[i][1])) + '원';
  usrFee[0][2] = { role : 'annotation' };
  datum = google.visualization.arrayToDataTable(usrFee);
  options = {
    title: '사용자 분류별 총 매출액 현황',
    pieSliceText : 'value',
    legend: 'none',
    hAxis: { minValue: 0 }
  };
  new google.visualization.BarChart(document.getElementById('UserMoney')).draw(datum, options);

  for (var i in freeUse) freeUse[i][2] = freeUse[i][2] + '건 (' + freeUse[i][1] + '%)';
  freeUse[0][2] = { role : 'annotation' };
  datum = google.visualization.arrayToDataTable(freeUse);
  options = {
    title: '장비별 무료 사용자 비율 현황',
    pieSliceText : 'value',
    legend: 'none',
    hAxis: { minValue: 0,
             maxValue: 100 }
  };
  new google.visualization.BarChart(document.getElementById('freeUsage')).draw(datum, options);

  console.log('Chart updated : ' + new Date());
}

function clickEventListener() {
  $('#time').change(function() { chartDrawer(); });
  $('#analytics').click(function() {
    if($('#analytics').html() == '통계 보기 ▼') {
      $('#chartWrap1').css('display', 'block');
      $('#chartWrap2').css('display', 'block');
      $('#analytics').html('통계 접기 ▲');
    }
    else {
      $('#chartWrap1').css('display', 'none');
      $('#chartWrap2').css('display', 'none');
      $('#analytics').html('통계 보기 ▼');
    }
  });
  $('#manualFee').click(function() {
    $('input:checkbox[name=discount]').attr('checked', false);
    $('#discountWrap').css('display', 'none');
    $('#feeInfo').html('<input type="radio" id="manualActivate" name="ppl" value="수동 입력" checked>수동 입력 활성화</input><br>요금 : <input type="text" id="manualCost" style="width:70"/>원');
    $('#manualCost').keyup(function(event) {
      event = event || window.event;
      this.value = addComma(this.value.replace(/[^\d]+/g, ''));
    });
  });
  $('input:radio[name=ppl], input:radio[name=pay]').click(function() {
    if($('input:radio[name=ppl]:checked').val() == '교내구성원' && $('input:radio[name=pay]:checked').val() == '선불') {
      machine = $('input:radio[name=machine]:checked').attr('id');
      if(machine == 'cubicon' || machine == 'sindo' || machine == 'onyx' || machine == 'freeform' || machine == 'zortrax') {
        $('#discountWrap').css('display', 'inline');
      }
    }
    else {
      $('input:checkbox[name=discount]').prop('checked', false);
      $('#discountWrap').css('display', 'none');
    }
    $('#feeInfo').html('요금 : ' + addComma(feeCalc($('input:radio[name=machine]:checked').attr('id'), $('input:radio[name=ppl]:checked').val(), $('input:checkbox[name=discount]').prop('checked'))) + '원');
  });
  $('#normal').click(function() {
    $('#machineDetail').html('');
    $('#payment').html('');
    $('#machineSelect').css('display', 'block');
    $('#normalWrapper').css('display', 'block');
    $('#industrialWrapper').css('display', 'none');
    $('#feeInfo').html('');
    $('#discountWrap').css('display', 'none');
    $('#submitWrapper').css('display', 'none');
    $('input:radio[name=machine]:checked').prop('checked', false);
  });
  $('#industrial').click(function() {
    $('#machineDetail').html('');
    $('#payment').html('');
    $('#machineSelect').css('display', 'block');
    $('#normalWrapper').css('display', 'none');
    $('#industrialWrapper').css('display', 'block');
    $('#feeInfo').html('');
    $('#discountWrap').css('display', 'none');
    $('#submitWrapper').css('display', 'none');
    $('input:radio[name=machine]:checked').prop('checked', false);
  });
  payment_time_str = '사용 시간 : <input placeholder="시간" id="usehour" name="cost" type="number" required style="width:40" min="0"/> : <input placeholder="분" id="usemin" name="cost" type="number" required style="width:30" min="0" max="59"/><br>';
  payment_area_str = '인쇄 면적 : <input placeholder="mm" id="xaxis" name="cost" type="number" required style="width:40"/> * <input placeholder="mm" id="yaxis" name="cost" type="number" required style="width:40"/><br>';
  $('#cubicon').click(function() {
    clickReset();
    if($('input:radio[name=ppl]:checked').val() == '교내구성원' && $('input:radio[name=pay]:checked').val() == '선불') $('#discountWrap').css('display', 'inline');
    cubicon_str = "장비 번호<br><span style='line-height:10%'><br></span>" +
    "<label for='C1'><input type='radio' id='C1' name='machineNum' value='C1' required>1</input></label>&nbsp;&nbsp;" +
    "<label for='C2'><input type='radio' id='C2' name='machineNum' value='C2'>2</input></label><br>" +
    "<label for='C3'><input type='radio' id='C3' name='machineNum' value='C3'>3</input></label>&nbsp;&nbsp;" +
    "<label for='C4'><input type='radio' id='C4' name='machineNum' value='C4'>4</input></label><br>" +
    "<label for='C5'><input type='radio' id='C5' name='machineNum' value='C5'>5</input></label>&nbsp;&nbsp;" +
    "<label for='C6'><input type='radio' id='C6' name='machineNum' value='C6'>6</input></label><br>" +
    "<label for='C7'><input type='radio' id='C7' name='machineNum' value='C7'>7</input></label>&nbsp;&nbsp;" +
    "<label for='C8'><input type='radio' id='C8' name='machineNum' value='C8'>8</input></label><br>";
    $('#payment').html(payment_time_str);
    $('#machineDetail').html(cubicon_str);
    keyupReset();
  });
  $('#sindo').click(function() {
    clickReset();
    if($('input:radio[name=ppl]:checked').val() == '교내구성원' && $('input:radio[name=pay]:checked').val() == '선불') $('#discountWrap').css('display', 'inline');
    sindo_str = "장비 번호<br><span style='line-height:10%'><br></span>" +
    "<label for='S1'><input type='radio' id='S1' name='machineNum' value='S1' required>1</input></label>&nbsp;&nbsp;" +
    "<label for='S2'><input type='radio' id='S2' name='machineNum' value='S2'>2</input></label><br>" +
    "<label for='S3'><input type='radio' id='S3' name='machineNum' value='S3'>3</input></label>&nbsp;&nbsp;" +
    "<label for='S4'><input type='radio' id='S4' name='machineNum' value='S4'>4</input></label><br>" +
    "<label for='S5'><input type='radio' id='S5' name='machineNum' value='S5'>5</input></label><br>";
    $('#payment').html(payment_time_str);
    $('#machineDetail').html(sindo_str);
    keyupReset();
  });
  $('#onyx').click(function() {
    clickReset();
    if($('input:radio[name=ppl]:checked').val() == '교내구성원' && $('input:radio[name=pay]:checked').val() == '선불') $('#discountWrap').css('display', 'inline');
    onyx_str = "장비 번호<br><span style='line-height:10%'><br></span>" +
    "<label for='O1'><input type='radio' id='O1' name='machineNum' value='O1' required>1</input></label>&nbsp;&nbsp;" +
    "<label for='O2'><input type='radio' id='O2' name='machineNum' value='O2'>2</input></label><br>" +
    "<label for='O3'><input type='radio' id='O3' name='machineNum' value='O3'>3</input></label>&nbsp;&nbsp;" +
    "<label for='O4'><input type='radio' id='O4' name='machineNum' value='O4'>4</input></label><br>" +
    "<label for='O5'><input type='radio' id='O5' name='machineNum' value='O5'>5</input></label><br>";
    $('#payment').html(payment_time_str);
    $('#machineDetail').html(onyx_str);
    keyupReset();
  });
  $('#freeform').click(function() {
    clickReset();
    if($('input:radio[name=ppl]:checked').val() == '교내구성원' && $('input:radio[name=pay]:checked').val() == '선불') $('#discountWrap').css('display', 'inline');
    freeform_str = "장비 번호<br><span style='line-height:10%'><br></span>" +
    "<label for='F1'><input type='radio' id='F1' name='machineNum' value='F1' required>1</input></label>&nbsp;&nbsp;" +
    "<label for='F2'><input type='radio' id='F2' name='machineNum' value='F2'>2</input></label><br>";
    $('#payment').html(payment_time_str);
    $('#machineDetail').html(freeform_str);
    keyupReset();
  });
  $('#zortrax').click(function() {
    clickReset();
    if($('input:radio[name=ppl]:checked').val() == '교내구성원' && $('input:radio[name=pay]:checked').val() == '선불') $('#discountWrap').css('display', 'inline');
    $('#payment').html(payment_time_str);
    keyupReset();
  });
  $('#laser').click(function() {
    clickReset();
    laser_str = "장비 번호<br><span style='line-height:10%'><br></span>" +
    "<label for='L1'><input type='radio' id='L1' name='machineNum' value='L1' required>1</input></label>&nbsp;&nbsp;" +
    "<label for='L2'><input type='radio' id='L2' name='machineNum' value='L2'>2</input></label><br>";
    $('#payment').html(payment_time_str);
    $('#machineDetail').html(laser_str);
    keyupReset();
  });
  $('#plotter').click(function() {
    clickReset();
    $('#payment').html(payment_area_str);
    keyupReset();
  });
  $('#cutter').click(function() {
    clickReset();
    $('#payment').html(payment_time_str);
    keyupReset();
  });
  $('#uv').click(function() {
    clickReset();
    $('#payment').html(payment_area_str);
    keyupReset();
  });
  $('#x7').click(function() {
    clickReset();
    $('#payment').html(payment_time_str + '강화 재료 : <input placeholder="카본(cc)" id="mainMaterial" name="cost" type="number" required style="width:60"/>');
    keyupReset();
  });
  $('#objet350').click(function() {
    clickReset();
    payment_str = '사용 재료<br><input placeholder="메인(g)" id="mainMaterial" name="cost" type="number" required style="width:60"/>, <input placeholder="보조(g)" id="subMaterial" name="cost" type="number" required style="width:60"/><br>';
    $('#payment').html(payment_str);
    keyupReset();
  });
  $('#f370').click(function() {
    clickReset();
    $('#payment').html(payment_time_str);
    keyupReset();
  });
  $('#xfab').click(function() {
    clickReset();
    payment_str = '사용 재료 : <input placeholder="메인(g)" id="mainMaterial" name="cost" type="number" required style="width:60"/>';
    $('#payment').html(payment_str);
    keyupReset();
  });
  $('#3d').click(function() {
    clickReset();
    $('#payment').html(payment_time_str);
    keyupReset();
  });
  $('#fileReq').click(function() { $('#filedata').attr('required', $('#fileReq').prop('checked') ? true : false); });
  $('#contact').keyup(function(event) {
    event = event || window.event;
    this.value = autoHypen(this.value.trim());
    function autoHypen(str) {
      str = str.replace(/[^0-9]/g, '');
      if( str.length < 4) { return str; }
      else if(str.length < 8) { return str.substr(0, 3) + '-' + str.substr(3); }
      else { return str.substr(0, 3) + '-' + str.substr(3, 4) + '-' + str.substr(7); }
      return str;
    }
  });
}
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
      H = date[_ + "Hours"](),
      M = date[_ + "Minutes"](),
      flags = {
        dd:   pad(d),
        mm:   pad(m + 1),
        yy:   String(y).slice(2),
        yyyy: y,
        hh:   pad(H % 12 || 12),
        HH:   pad(H),
        MM:   pad(M),
        TT:   H < 12 ? "오전" : "오후"
      };
    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}();
Date.prototype.format = function (mask, utc) { return dateFormat(this, mask, utc); };
