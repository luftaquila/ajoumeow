$(function() {
  nameList = [], data = [], downloadSize = 0;
  $.ajax({
    url: 'https://docs.google.com/spreadsheet/pub?key=1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A&single=true&gid=1034362398&sheet=Statistics&range=AH4:Ah&output=csv',
    type: "GET",
    dataType: 'text',
    cache: false,
    success: function (response) {
      nameList = response.split('\n').map((line) => line.split(','));
      downloadSize += dataSize(response);
      $.ajax({
        url: 'https://docs.google.com/spreadsheet/pub?key=1tubdLyELoYAPi8f3PVeh6jfIbQiQ3au3frIVEbnj20A&single=true&gid=1034362398&sheet=Statistics&range=AK4:AN&output=csv',
        type: "GET",
        dataType: 'text',
        cache: false,
        success: function (response) {
          data = response.split('\n').map((line) => line.split(','));
          downloadSize += dataSize(response);
          $('#status').css('color', '#15be00');
          $('#status').text('200 Ready. ' + (downloadSize / 1000).toFixed(1) + 'KB Loaded');
          $('select').attr('disabled', false);
          genDropDown();
        }
      });
    }
  });
});
function load() {
  var thisMonth = '<table style="text-align:center;"><tr><td colspan="4">' + new Date().getFullYear() + '년 ' + (new Date().getMonth() + 1) + '월 활동 내역</td></tr><tr height="30"><td>날짜</td><td>이름</td><td>코스</td><td>점수</td></tr>';
  var totalTime = '<table style="text-align:center;"><tr><td colspan="4"><hr style="width:auto;border-bottom:0px;text-align:left;margin-left:0px"></td></tr><tr><td colspan="4">전 기간 활동 내역</td></tr><tr height="30"><td>날짜</td><td>이름</td><td>코스</td><td>점수</td></tr>';
  data.forEach(function(value) {
    if(new Date(value[0]).getFullYear() == new Date().getFullYear() && new Date(value[0]).getMonth() == new Date().getMonth() && $('#name').val() == value[1]) { thisMonth += '<tr><td>' + value[0] + '</td><td>' + value[1] + '</td><td>' + value[2] + '</td><td>' + value[3] + '</td></tr>'; }
    if($('#name').val() == value[1]) { totalTime += '<tr><td>' + value[0] + '</td><td>' + value[1] + '</td><td>' + value[2] + '</td><td>' + value[3] + '</td></tr>'; }
  });
  $('#thisMonth').html(thisMonth + '</table>');
  $('#totalTime').html(totalTime + '</table>');
  Cookies.set('name', $('#name').val(), {expires : 7});
}
function genDropDown() {
  var str = "", isSelected = "";
  nameList.forEach(function(value) {
    if(value[0].includes(Cookies.get('name'))) { isSelected = " selected" }
    str += '<option value=' + value + isSelected + '>' + value + '</option>';
    isSelected = "";
  });
  $('#name').html(str);
  if(Cookies.get('name') != null) { load(); }
}
function dataSize(s, b, i, c) { for(b = i = 0; c = s.charCodeAt(i++); b += c >> 11 ? 3 : c >> 7 ? 2 : 1); return b; }
