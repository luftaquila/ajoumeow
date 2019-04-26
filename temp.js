$("#DATA").submit( function() { Submit(event) } );
function Submit(event) {
  var submitType = $(':input[name=mode]:radio:checked').val();
  if($('#adminActive').css('display') == 'inline' && $('#admin').val() == '0512') {
    transmitter(submitType);
    event.preventDefault();
    return;
  }
  if(!/\d\d\d\d\-\d\d\-\d\d/g.test($("#submitDate").val())) {
    alertify.error('날짜를 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if($(':input[name=course]:radio:checked').val() == undefined) {
    alertify.error('코스를 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if($.trim($("#" + (submitType == '수정' ? 'editName' : 'submitName')).val()) == "") {
    alertify.error('이름을 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if($.trim($("#" + (submitType == '수정' ? 'editName' : 'submitName')).val()).indexOf(',') + 1) {
    alertify.error('이름에 콤마(,)는 사용할 수 없습니다.');
    $('input').attr('disabled', false);
  }
  else if(submitType == '수정' && !/\d\d\d\d\-\d\d\-\d\d/g.test($("#editDate").val())) {
    alertify.error('수정할 날짜를 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if(submitType == '수정' && $(':input[name=edit_course]:radio:checked').val() == undefined) {
    alertify.error('수정할 코스를 입력하세요.');
    $('input').attr('disabled', false);
  }
  else if(submitType == '삭제' && (new Date(new Date($('#submitDate').val()) - 1000 * 3600 * 9) < new Date(new Date().format('yyyy-mm-dd')))) {
    alertify.error('당일 및 지난 날짜에 대한 삭제는 불가능합니다.');
    $('input').attr('disabled', false);
  }
  else if((submitType == '삭제') && $('#submitDate').val() == new Date(new Date(new Date().format('yyyy-mm-dd')) - 1000 * 3600 * 15 * -1).format('yyyy-mm-dd') && new Date().getHours() > 17) {
    alertify.error('전일 오후 6시 이후 취소는 불가능합니다.');
    $('input').attr('disabled', false);
  }
  else if(submitType == '수정' && $('#submitDate').val() == new Date().format('yyyy-mm-dd') && $('#submitDate').val() != $("#editDate").val()) {
    alertify.error('당일 날짜 변경은 불가능합니다.');
    $('input').attr('disabled', false);
  }
  else if(submitType == '수정' && (new Date(new Date($('#submitDate').val()) - 1000 * 3600 * 9) < new Date(new Date().format('yyyy-mm-dd')) - 1000 * 3600 * 24)) {
    alertify.error('지난 날짜에 대한 수정은 불가능합니다.');
    $('input').attr('disabled', false);
  }
  else if((submitType == '수정') && $('#submitDate').val() == new Date(new Date(new Date().format('yyyy-mm-dd')) - 1000 * 3600 * 15 * -1).format('yyyy-mm-dd') && new Date().getHours() > 17 && $('#submitDate').val() != $("#editDate").val()) {
    alertify.error('전일 오후 6시 이후 다른 날짜로의 수정은 불가능합니다.');
    $('input').attr('disabled', false);
  }
  else if((submitType == '신청' || submitType == '수정') && (new Date(new Date($('#' + (submitType == '신청' ? 'submitDate' : 'editDate')).val()) - 1000 * 3600 * 9) < new Date(new Date(new Date().format('yyyy-mm-dd')) - 1000 * 3600 * 9)) || (new Date(new Date($('#' + (submitType == '신청' ? 'submitDate' : 'editDate')).val()) - 1000 * 3600 * 9) > new Date(new Date(new Date().format('yyyy-mm-dd')) - 1000 * 3600 * (9 - (24 * (14 + ((new Date().getDay()) ? (7 - new Date().getDay()) : 0))))))) {
    alertify.error('신청 및 수정은 급식표 표시 범위 내에서만 가능합니다.');
    $('input').attr('disabled', false);
  }
  else transmitter(submitType);
  event.preventDefault();
}
function transmitter(submitType) {
  $('input').attr('disabled', true);
  if(submitType == '신청') {
    serializedData = "신청=신청&이름=" + $.trim($('#submitName').val()) + "&날짜=" + $('#submitDate').val() + "&코스=" + $(':input[name=course]:radio:checked').val();
  }
  else if(submitType == '수정') {
    serializedData = "수정=수정&이름=" + $.trim($('#submitName').val()) + "&날짜=" + $('#submitDate').val() + "&코스=" + $(':input[name=course]:radio:checked').val() +
                     "&수정 이름=" + $.trim($('#editName').val()) + "&수정 날짜=" + $('#editDate').val() + "&수정 코스=" + $(':input[name=edit_course]:radio:checked').val();
  }
  else if(submitType == '삭제') {
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
