$(function() { onLoad(); });
function onLoad() {
  data = [], datum = [], errorCount = 0, addCount = 0, mnAddCount = 0;
  $('#status').css('color', '#ffbf00');
  $('#status').text('Loading Data...');
  $('input').attr('disabled', true);
  $.ajax({
    url: 'https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec',
    type: "GET",
    dataType: 'text',
    cache: false,
    success: function (response) {
      datum = response.split('\n').map((line) => line.split(','));
      $('#status').css('color', '#15be00');
      $('#status').text('200 Ready. ' + (dataSize(response) / 1000).toFixed(1) + 'KB Loaded');
      $('input').attr('disabled', false);

      //MicroModal.show('admin');
      $('#adminPW').focus();

      $.ajax({
        url: 'https://docs.google.com/spreadsheet/pub?key=1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A&single=true&gid=513873447&sheet=Receiver&range=A:D&output=csv',
        type: "GET",
        dataType: 'text',
        cache: false,
        success: function (response) {
          var name = response.split('\n').map((line) => line.split(','));
          $('#latestConfirm').text('마지막 인증 : ' + name[name.length - 1][0]);
        }
      });
      load();
    }
  });
  $('#confirmAdmin').click(function() {
    if($('#adminPW').val() == '0512') MicroModal.close('admin');
    else {
      errorCount++;
      if(errorCount > 4) { alert('Access Denied'); window.location.href = '/ajoumeow'; }
      else {
        $('#modalText').text('비밀번호 오류 ' + errorCount + '회');
        $('#adminPW').focus();
      }
    }
  });
}
$("#DATA").submit( function(event) {
  $('input').attr('disabled', true);
  var request;
  if (request) { request.abort(); }
  if($("#nonManual").prop('checked')) {
    var flag = true;
    $("input:checkbox[name=add]:checked").each(function() { if(!$.trim($($(this).siblings($('input'))[0]).val())) flag = false; });
    if(!/\d\d\d\d\-\d\d\-\d\d/g.test($("#timestamp").val())) {
      $('#status').css('color', '#da0000');
      $('#status').text('Error - Wrong Input');
      $('input').attr('disabled', false);
    }
    else if(!$("input:checkbox[name=namelist]:checked").length && !$("input:checkbox[name=add]:checked").length) {
      $('#status').css('color', '#da0000');
      $('#status').text('Error - No Data');
      $('input').attr('disabled', false);
    }
    else if(!flag) {
      $('#status').css('color', '#da0000');
      $('#status').text('Error - No Final Data');
      $('input').attr('disabled', false);
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
        data[count][0] = $(obj[0]).val() + '코스';
        data[count][1] = $(obj[1]).val() + '코스';
        count++;
      });
      for(var i = 1; i < 4; i++) { scoreProvider(data, date, i, $("#boost").prop('checked')); }
      for(var i = 0; i < data.length; i++) {
        var serializedData = "지급 일자=" + date + "&이름=" + data[i][0] + "&코스=" + data[i][1] + "&점수=" + data[i][2];
        transmitter(serializedData, count);
      }
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
      $('#status').text('Error - Wrong Input');
      $('input').attr('disabled', false);
    }
    else if(!$("input:checkbox[name=mnAdd]:checked").length) {
      $('#status').css('color', '#da0000');
      $('#status').text('Error - No Data');
      $('input').attr('disabled', false);
    }
    else if(!flag) {
      $('#status').css('color', '#da0000');
      $('#status').text('Error - No Final Data');
      $('input').attr('disabled', false);
    }
    else {
      var dateSlicer = $("#timestamp").val().split('-');
      var date = new Date(dateSlicer[0], dateSlicer[1] - 1, dateSlicer[2]).format('yyyy. m. d');
      $("input:checkbox[name=mnAdd]:checked").each(function() {
        var obj = $(this).siblings($('input'));
        var serializedData = "지급 일자=" + date + "&이름=" + $.trim($(obj[0]).val()) + "&코스=" + $.trim($(obj[2]).val()) + "&점수=" + $(obj[1]).val();
        transmitter(serializedData, $("input:checkbox[name=mnAdd]:checked").length);
      });
    }
  }
  addCount = 0, mnAddCount = 0;
  $("#list").html("");
  $("#booster").html("");
  $("#mnName").val("");
  $("#mnScore").val("");
  $("#timestamp").val("");
  $('#addSection').html('');
  $('#mnAddSection').html('');
  $('#add').css('display', 'none');
  $('#mnadd').css('display', 'none');
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
  data = [];
  $('#addSection').html('');
  $('#mnAddSection').html('');
  var currentDate = $("#timestamp").val(), str = "", booster = "";
  if(currentDate) {
    $('#add').css('display', 'block');
    $('#mnadd').css('display', 'block');
    var dateSlicer = $("#timestamp").val().split('-'), j = 1;
    currentDate = new Date(dateSlicer[0], dateSlicer[1] - 1, dateSlicer[2]).format('yyyy. m. d');
    for(var i = 0; i < datum.length - 1; i++) { if(currentDate == datum[i][1]) { str += '<label for="namelist_' + j + '">' + '<input type="checkbox" checked="checked" name="namelist" id="namelist_' + j + '" value=' + $.trim(datum[i][0]) + "/" + $.trim(datum[i][2]) + '>' + datum[i][0] + " / " + datum[i][2] + "</input></label><br>"; j++; } }
    if(str != "") $("#booster").html("<label for='radio'><input type='checkbox' id='boost' value='test'>마일리지 할증</input></label><hr style='width:130px;border-bottom:0px;text-align:left;margin-left:0px'>");
    else { $("#booster").html(""); }
    $("#list").html(str);
  }
}
function transmitter(serializedData, count) {
  console.log("DataSet : " + serializedData);
  $('#status').css('color', '#ffbf00');
  $('#status').text('Sending ' + dataSize(encodeURI(serializedData)) * count + 'B Data...');
  request = $.ajax({
      type: 'POST',
      url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
      data: encodeURI(serializedData)
  });
  request.done(function() {
    $('#status').css('color', '#15be00');
    $('#status').text('201 Transmitted. Ready.');
    $('#addSection').html('');
    $('#mnAddSection').html('');
  });
  request.fail(function(jqXHR, textStatus, errorThrown) {
    $('#status').css('color', '#da0000');
    $('#status').text('Error - ' + textStatus + errorThrown);
  });
  request.always(function() {  $('input').attr('disabled', false);  });
}
function dataSize(s, b, i, c) { for(b = i = 0; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1); return b; }
$('#log').click(function() { $('#logModal').css("display", "block"); });
$('#rawLog').click(function() { $('#rawLogModal').css("display", "block"); });
$('#reload').click(function () { onLoad(); });
$('#nonManual').click(function() { $("#stdWrapper").show(); $("#mnWrapper").hide(); });
$('#Manual').click(function() { $("#stdWrapper").hide(); $("#mnWrapper").show(); });
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
  div.append('점수 : ').append($('<input id="mnAddScore_' + mnAddCount + '" style="width: 30" />')).append('&nbsp;&nbsp;');
  div.append('지급 사유 : ').append($('<input id="mnAddReason_' + mnAddCount + '" style="width: 80" />')).append('&nbsp;&nbsp;');
});
window.onclick = function(event) {
  if (event.target == document.getElementById('logModal')) { $('#logModal').css("display", "none"); }
  if (event.target == document.getElementById('rawLogModal')) { $('#rawLogModal').css("display", "none"); }
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
