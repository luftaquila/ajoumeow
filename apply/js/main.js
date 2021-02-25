$(function () {
  $.when(
    $.ajax("/ajoumeow/api/settings/currentSemister"),
    $.ajax("/ajoumeow/api/settings/isApply"),
    $.ajax("/ajoumeow/api/settings/isApplyRestricted"),
    $.ajax("/ajoumeow/api/settings/applyTerm")
  ).done((currentSemister, isApply, isApplyRestricted, applyTerm) => {
    let flag = false;
    
    if(isApply[0].data == 'TRUE') {
      if(isApplyRestricted[0].data == 'FALSE') flag = true;
      else {
        let term = applyTerm[0].data.split('~');
        if((new Date() > new Date(term[0]) && new Date() < new Date(new Date(term[1]).getTime() + 60 * 60 * 24 * 1000))) flag = true;
        else flag = false;
      }
    }
    else flag = false;
    
    if(flag) {
      $('.semister').text(currentSemister[0].data);
      $('.loading').css('display', 'none');
      $('#asktype').css('display', 'block');
      
      $.ajax('/ajoumeow/res/collegeList.json').done(collegeDict => {
        let collegeList = '', departmentList = '';
        for (let college in collegeDict) collegeList += `<option value="${college}">${college}</option>`;
        
        $('#college, #o_college').html(collegeList).on('change', function() {
          let departmentList = '';
          for (let i in collegeDict[$(this).val()]) departmentList += `<option value="${collegeDict[$(this).val()][i]}">${collegeDict[$(this).val()][i]}</option>`;
          $('#' + $(this).attr('id').replace('college', '') + 'department').html(departmentList);
        }).trigger('change');
      });
    }
    else $('.loading').html('<br><br><br><h2>모집 기간이 아닙니다!<br>다음 모집 때 지원해 주세요 ㅠㅠ</h2><br><br><img src="images/failed.jpg" style="width:90%">'); 
  });
});



  /*==================================================================
  [ Validate ]*/
$('.validate-form').on('submit', function (event) {
  event.preventDefault();
  let tgt = $(this).attr('class').split(/\s+/).reduce((acc, val) => acc = val.includes('type_') ? val : acc);

  let input = $('.' + tgt + ' .validate-input .input100').not('.not');
  let check = true, flag = true, isNew = null;
  
  if(tgt == 'type_new') isNew = true;
  else isNew = false;

  for (let i = 0; i < input.length; i++) {
    if (!validate(input[i])) {
      showValidate(input[i]);
      if(flag) {
        $(input[i]).focus();
        flag = false;
      }
      check = false;
    }
    else hideValidate(input[i]);
  }

  if(check) {
    let payload = {};
    payload = {
      단과대학: isNew ? $('#college').val() : $('#o_college').val(),
      학과: isNew ? $('#department').val() : $('#o_department').val(),
      학번: isNew ? $('#number').val() : $('#o_ID').val(),
      이름: isNew ? $.trim($('#name').val()) : $.trim($('#o_name').val()),
      전화번호: isNew ? $('#tel').val() : $('#o_phone').val(),
      생년월일: isNew ? $('#birth').val() : $('#o_birthday').val(),
      '1365 아이디': isNew ? $.trim($('#1365').val().replace('-', '')) : $.trim($('#o_1365ID').val().replace('-', '')),
      '가입 학기': isNew ? (`20${$('.semister').first().text()}학기`) : $('#o_register').val(),
      직책: isNew ? '회원' : $('#o_role').val(),
      'new': isNew
    }
    $.ajax({
      url: "https://luftaquila.io/ajoumeow/api/users/id",
      type: "POST",
      data: payload,
      success: res => { location.href = 'https://luftaquila.io/ajoumeow/apply/success.html' },
      error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
    });
  }
});

$('.validate-form .input100').each(function () {
  $(this).keyup(function () { hideValidate(this); });
});

function validate(input) {
  if ($(input).attr('name') == 'tel') {
    if (!$(input).val().trim().match(/010-\d{4}-\d{4}/))
      return false;
  }
  else if ($(input).attr('name') == 'number') {
    if (!$(input).val().trim().match(/^\d{9}$/))
      return false;
  }
  else if ($(input).attr('name') == 'birth') {
    if (!$(input).val().trim().match(/^[0-9][0-9]([0][1-9]|[1][0-2])[0-3][0-9]$/ig))
      return false;
  }
  else if ($(input).attr('name') == 'tel') {
    if (!$(input).val().trim().match(/010-\d{4}-\d{4}/ig))
      return false;
  }
  else if ($(input).attr('type') == 'checkbox') {
    if (!$(input).is(':checked'))
      return false;
  }

  else { if ($(input).val().trim() == '') return false; }

  return true;
}

function showValidate(input) {
  var thisAlert = $(input).parent();

  $(thisAlert).addClass('alert-validate');
}

function hideValidate(input) {
  var thisAlert = $(input).parent();

  $(thisAlert).removeClass('alert-validate');
}

$('#tel').keyup(function (event) {
  event = event || window.event;
  this.value = autoHypen(this.value.trim());

  function autoHypen(str) {
    str = str.replace(/[^0-9]/g, '');
    if (str.length < 4)  return str;
    else if (str.length < 8) return str.substr(0, 3) + '-' + str.substr(3);
    else return str.substr(0, 3) + '-' + str.substr(3, 4) + '-' + str.substr(7);
    return str;
  }
});

$('.ask').click(function() {
  $('#asktype').css('display', 'none');
  $('.container-contact100#' + $(this).attr('id').replace('_', '')).css('display', 'block');
});      

$('#find').click(function() {
  $.ajax({
    url: "/ajoumeow/api/users/id",
    type: "POST",
    data: { 학번: $('#findID').val(), new: false },
    success: res => {
      res = res.data[0];
      $('#finddiv').css('display', 'none');
      $('#confirmdiv').css('display', 'block');

      for(let [key, value] of Object.entries(res)) {
        //if(key == 'college' || key == 'department') continue;
        $('#o_' + key).val(value).attr('disabled', 'true').trigger('change');
      }
    },
    error: err => alertify.error(`${err.responseJSON.msg}<br>${err.responseJSON.data}`)
  });
}); 