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
  
  $.ajax({
    url: "https://luftaquila.io/ajoumeow/api/requestRegister",
    type: "POST",
    dataType: 'json',
    success: function (res) {
      if (res.result) {
        semister = res.semister;
        $('#semister').text(res.semister);
        $('.loading').css('display', 'none');
        $('.container-contact100').css('display', 'block');
      }
      else $('.loading').html('<br><br><br><h4>모집 기간이 아닙니다!<br>다음 모집 때 지원해 주세요 ㅠㅠ</h4><br><br><img src="images/failed.jpg" style="width:90%">');
    }
  });

  
  var collegeList = '',
    departmentList = '';
  for (var college in collegeDict) collegeList += '<option value="' + college + '">' + college + '</option>';
  $('#college').html(collegeList).change();


  /*==================================================================
  [ Validate ]*/
  var input = $('.validate-input .input100').not('.not');

  $('.validate-form').on('submit', function (event) {
    event.preventDefault();
    var check = true;

    for (var i = 0; i < input.length; i++) {
      if (!validate(input[i])) {
        showValidate(input[i]);
        check = false;
      }
    }

    if (check) {
      payload =
        '이름=' + $('#name').val() +
        '&단과대학=' + $('#college').val() +
        '&학과=' + $('#department').val() +
        '&학번=' + $('#number').val() +
        '&연락처=' + $('#tel').val() +
        '&학기=' + semister;

      $.ajax({
        //url: "https://script.google.com/macros/s/AKfycbzxfoEcT8YkxV7lL4tNykzUt_7qwMsImV9-3BzFNvtclJOHrqM/exec",
        url: "https://script.google.com/macros/s/AKfycbwOT83RGEPIgdu1oTM9VvBqyRN6jcEXRkGlpdqG1EUCr1HdaBxX/exec",
        data: encodeURI('type=registerMember&' + payload),
        type: "POST",
        dataType: 'text',
        cache: false,
        success: function (response) {
          if (response == 'duplicate') alertify.error('ERR::DUPLICATED_RESPONSE<br>이미 등록된 응답입니다.');
          else location.href = 'https://luftaquila.io/ajoumeow/register/success.html'
        },
        error: function (response) {
          alertify.error('ERR::REGISTER_FAILURE<br>관리자에게 문의하세요.');
        }
      });

    }

  });


  $('.validate-form .input100').not('.not').each(function () {
    $(this).focus(function () { hideValidate(this); });
  });

  function validate(input) {
    if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
      if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null)
        return false;
    }
    else if ($(input).attr('type') == 'tel' && $(input).attr('name') == 'tel') {
      if ($(input).val().trim().match(/010-\d{4}-\d{4}/) == null)
        return false;
    }
    else if ($(input).attr('name') == 'number') {
      if ($(input).val().trim().match(/^\d{9}$/) == null)
        return false;
    }
    else if ($(input).attr('type') == 'checkbox') {
      if (!$(input).is(':checked'))
        return false;
    }
    else {
      if ($(input).val().trim() == '') {
        return false;
      }
    }
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
}