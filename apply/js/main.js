$(function () {
  //(function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
  eventWatcher();
  collegeDict = {
    '공과대학': ['기계공학과', '산업공학과', '화학공학과', '신소재공학과', '응용화학생명공학과', '환경안전공학과', '건설시스템공학과', '교통시스템공학과', '건축학과', '건축공학과', '융합시스템공학과'],
    '정보통신대학': ['전자공학과', '소프트웨어학과', '사이버보안학과', '미디어학과', '국방디지털융합학과'],
    '자연과학대학': ['수학과', '물리학과', '화학과', '생명과학과'],
    '경영대학': ['경영학과', 'e-비즈니스학과', '금융공학과', '글로벌경영학과'],
    '인문대학': ['국어국문학과', '영어영문학과', '불어불문학과', '사학과', '문화콘텐츠학과'],
    '사회과학대학': ['경제학과', '행정학과', '심리학과', '사회학과', '정치외교학과', '스포츠레저학과'],
    '의과대학': ['의학과'],
    '간호대학': ['간호학과'],
    '약학대학': ['약학과'],
    '국제학부': ['국제통상전공', '지역연구전공(일본)', '지역연구전공(중국)'],
    '다산학부대학': ['다산학부대학'],
    '기타': ['기타']
  }
  
  $.ajax({ // Request settings
    url: "https://luftaquila.io/ajoumeow/api/requestApply",
    type: "POST",
    dataType: 'json',
    success: function (res) {
      if (res.result) {
        semister = res.semister;
        $('.semister').text(res.semister);
        $('.loading').css('display', 'none');
        $('#asktype').css('display', 'block');
      }
      else $('.loading').html('<br><br><br><h4>모집 기간이 아닙니다!<br>다음 모집 때 지원해 주세요 ㅠㅠ</h4><br><br><img src="images/failed.jpg" style="width:90%">');
    }
  });

  var collegeList = '',
    departmentList = '';
  for (var college in collegeDict) collegeList += '<option value="' + college + '">' + college + '</option>';
  $('#college').html(collegeList).change();
  $('#o_college').html(collegeList).change();


  /*==================================================================
  [ Validate ]*/
  $('.validate-form').on('submit', function (event) {
    event.preventDefault();
    
    let tgt = $(this).attr('class').split(/\s+/).reduce((acc, val) => acc = val.includes('type_') ? val : acc);

    var input = $('.' + tgt + ' .validate-input .input100').not('.not');
    var check = true, flag = true;
    
    for (var i = 0; i < input.length; i++) {
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

    if (check) {
      if(tgt == 'type_new') {
        let payload = 
          '단과대학=' + $('#college').val() +
          '&학과=' + $('#department').val() +
          '&학번=' + $('#number').val() +
          '&이름=' + $.trim($('#name').val()) + 
          '&전화번호=' + $('#tel').val() +
          '&생년월일=' + $('#birth').val() +
          '&1365 아이디=' + $.trim($('#1365').val().replace('-', '')) +
          '&가입 학기=' + '20' + semister + '학기' +
          '&직책=회원';

        $.ajax({
          url: "https://luftaquila.io/ajoumeow/api/requestUserDetail",
          type: "POST",
          dataType: 'json',
          data: {
            ID: $('#number').val(),
            semister: 'past'
          },
          success: function(res) {
            if(res.length) return alertify.error('신입 회원이 아닙니다!');
            else { 
              $.ajax({
                url: "https://luftaquila.io/ajoumeow/api/apply",
                data: encodeURI(payload),
                type: "POST",
                dataType: 'json',
                success: function(response) {
                  if(response.affectedRows) location.href = 'https://luftaquila.io/ajoumeow/apply/success.html'
                  else if(response.error == 'ER_DUP_ENTRY') aleryify.error('ERR::DATA_EXISTS<br>이미 등록된 학번입니다.');
                  else alertify.error('ERR::' + response.error + '<br>관리자에게 문의하세요.');
                }
              });
            }
          }
        });
      }
      else if(tgt == 'type_old') {
        let payload = 
          '단과대학=' + $('#o_college').val() +
          '&학과=' + $('#o_department').val() +
          '&학번=' + $('#o_ID').val() +
          '&이름=' + $.trim($('#o_name').val()) + 
          '&전화번호=' + $('#o_phone').val() +
          '&생년월일=' + $('#o_birthday').val() +
          '&1365 아이디=' + $.trim($('#o_1365ID').val().replace('-', '')) +
          '&가입 학기=' + $('#o_register').val() +
          '&직책=' + $('#o_role').val();

        $.ajax({
          url: "https://luftaquila.io/ajoumeow/api/apply",
          data: encodeURI(payload),
          type: "POST",
          dataType: 'json',
          success: function(response) {
            if(response.affectedRows) location.href = 'https://luftaquila.io/ajoumeow/apply/success.html'
            else if(response.error == 'ER_DUP_ENTRY') aleryify.error('ERR::DATA_EXISTS<br>이미 등록된 학번입니다.');
            else alertify.error('ERR::' + response.error + '<br>관리자에게 문의하세요.');
          }
        });
      }
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
});

function eventWatcher() {
  $('#college').change(function () {
    var departmentList = '';
    for (var i in collegeDict[$(this).val()]) departmentList += '<option value="' + collegeDict[$(this).val()][i] + '">' + collegeDict[$(this).val()][i] + '</option>';
    $('#department').html(departmentList);
  });
  $('#o_college').change(function () {
    var departmentList = '';
    for (var i in collegeDict[$(this).val()]) departmentList += '<option value="' + collegeDict[$(this).val()][i] + '">' + collegeDict[$(this).val()][i] + '</option>';
    $('#o_department').html(departmentList);
  });
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
      url: "https://luftaquila.io/ajoumeow/api/requestUserDetail",
      type: "POST",
      dataType: 'json',
      data: {
        ID: $('#findID').val(),
        semister: 'past'
      },
      success: function(res) {
        if(res.length) {
          res = res[0];
          $('#finddiv').css('display', 'none');
          $('#confirmdiv').css('display', 'block');
          $('#o_college').val(res.college).attr('disabled', 'true');
          $('#select2-o_college-container').text(res.college);
          let html = '';
          for(var j in collegeDict[$('#o_college').val()]) html += '<option value="' + collegeDict[$('#o_college').val()][j] + '">' + collegeDict[$('#o_college').val()][j] + '</option>';
          $('#o_department').html(html).val(res.department).attr('disabled', 'true');

          for(let [key, value] of Object.entries(res)) {
            if(key == 'college' || key == 'department') continue;
            $('#o_' + key).val(value).attr('disabled', 'true');
          }
        }
        else alertify.error('ERR::NO_EXISTING_MEMBER<br>해당 학번의 이전학기 가입자가 없습니다.');
      }
    });
  });
}
                  
                  
                  