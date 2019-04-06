isVerified = 0;
$(function() { onLoad(); });
function onLoad() {
  data = [], datum = [];
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
      datum.push(['11', '11', '11']);
      $('#status').css('color', '#15be00');
      $('#status').text('200 Ready. ' + (dataSize(response) / 1000).toFixed(1) + 'KB Loaded');
      $('input').attr('disabled', false);
      if(!isVerified) {
        setTimeout(function verify() {
          var pwPosition = datum.length - 1, pwInput = prompt("Verification Required", "");
          if(pwInput == datum[pwPosition][1] + datum[pwPosition][2]) { isVerified = 1; return; }
          else if(pwInput == null) { alert("Access Denied"); window.location.href = 'https://luftaquila.github.io/ajoumeyoumeow'; }
          else verify();
        }, 100);
      }
      $.ajax({
        url: 'https://docs.google.com/spreadsheet/pub?key=1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A&single=true&gid=513873447&sheet=Receiver&range=A:D&output=csv',
        type: "GET",
        dataType: 'text',
        cache: false,
        success: function (response) {
          var name = response.split('\n').map((line) => line.split(','));
          $('#latestConfirm').text('마지막 인증 날짜 : ' + name[name.length - 1][0]);
        }
      });
      load();
    }
  });
}
$("#DATA").submit( function(event) {
  $('input').attr('disabled', true);
  var request;
  if (request) { request.abort(); }
  if($("#nonManual").prop('checked')) {
    if(!/\d\d\d\d\-\d\d\-\d\d/g.test($("#timestamp").val())) {
      $('#status').css('color', '#da0000');
      $('#status').text('400 Error - Wrong Input');
      $('input').attr('disabled', false);
    }
    else if($("#list").html() == "" || $("input:checkbox[name=namelist]:checked").length == 0) {
      $('#status').css('color', '#da0000');
      $('#status').text('400 Error - No Data');
      $('input').attr('disabled', false);
    }
    else {
      var count = 0;
      $("input:checkbox[name=namelist]:checked").each(function() {
        var nameSlicer = $.trim($(this).val()).split('/'), dateSlicer = $("#timestamp").val().split('-');
        var date = new Date(dateSlicer[0], dateSlicer[1] - 1, dateSlicer[2]).format('yyyy. m. d');
        data[count] = [];
        data[count][0] = nameSlicer[0];
        data[count][1] = date;
        data[count][2] = nameSlicer[1];
        count++;
      });
      for(var i = 1; i < 4; i++) { scoreProvider(data, i, $("#radio").prop('checked')); }
      for(var i = 0; i < data.length; i++) {
        var serializedData = "지급 일자=" + data[i][1] + "&이름=" + data[i][0] + "&코스=" + data[i][2] + "&점수=" + data[i][3];
        transmitter(serializedData, count);
      }
    }
  }
  else if($("#Manual").prop('checked')) {
    if(!/\d\d\d\d\-\d\d\-\d\d/g.test($("#timestamp").val())) {
      $('#status').css('color', '#da0000');
      $('#status').text('400 Error - Wrong Input');
      $('input').attr('disabled', false);
    }
    else if($.trim($("#mnName").val()) == "" || $.trim($("#mnScore").val()) == "") {
      $('#status').css('color', '#da0000');
      $('#status').text('400 Error - No Data');
      $('input').attr('disabled', false);
    }
    else {
      var dateSlicer = $("#timestamp").val().split('-');
      var date = new Date(dateSlicer[0], dateSlicer[1] - 1, dateSlicer[2]).format('yyyy. m. d');
      var serializedData = "지급 일자=" + date + "&이름=" + $.trim($("#mnName").val()) + "&코스=수동 입력&점수=" + $.trim($("#mnScore").val());
      transmitter(serializedData, 1);
    }
  }
  $("#list").html("");
  $("#isTest").html("");
  $("#mnName").val("");
  $("#mnScore").val("");
  $("#timestamp").val("");
  event.preventDefault();
});
function scoreProvider(data, course, check) {
  var low = 1, mid = 1.5, high = 2;
  if(check) { low = 1.5; mid = 2; high = 3; }
  var dateArray = new Date(data[0][1].replace(/\s/g, '').replace(/\./g, '-'));
  for(var i = count = 0; i < data.length; i++) { if(data[i][2].includes(course + "코스")) { count++; } }
  if(count == 1) {
    if(dateArray.getDay() == 0 || dateArray.getDay() == 6) { for(var i = 0; i < data.length; i++) { if(data[i][2].includes(course + "코스")) { data[i][3] = high; } } }
    else { for(var i = 0; i < data.length; i++) { if(data[i][2].includes(course + "코스")) { data[i][3] = mid; } } }
  }
  else {
    if(dateArray.getDay() == 0 || dateArray.getDay() == 6) { for(var i = 0; i < data.length; i++) { if(data[i][2].includes(course + "코스")) { data[i][3] = mid; } } }
    else { for(var i = 0; i < data.length; i++) { if(data[i][2].includes(course + "코스")) { data[i][3] = low; } } }
  }
}
function load() {
  data = [];
  var currentDate = $("#timestamp").val(), str = "", isTest = "";
  if(currentDate !== null) {
    var dateSlicer = $("#timestamp").val().split('-');
    currentDate = new Date(dateSlicer[0], dateSlicer[1] - 1, dateSlicer[2]).format('yyyy. m. d');
    var i = j = 1;
    for(i = 0; i < datum.length - 1; i++) { if(currentDate == datum[i][1]) { str += '<label for="namelist_' + j + '">' + '<input type="checkbox" checked="checked" name="namelist" id="namelist_' + j + '" value=' + $.trim(datum[i][0]) + "/" + $.trim(datum[i][2]) + '>' + datum[i][0] + " / " + datum[i][2] + "</input></label><br>"; j++; } }
    if(str != "") { $("#isTest").html("<label for='radio'><input type='checkbox' id='radio' value='test'>마일리지 할증</input></label><hr style='width:130px;border-bottom:0px;text-align:left;margin-left:0px'>"); }
    else { $("#isTest").html(""); }
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
