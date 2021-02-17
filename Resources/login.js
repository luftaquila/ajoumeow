$(function() {
  autoLogin();
  
  $('#login').click(function() {
    $.ajax({
      url: "api/auth/login",
      data: { 'id' : $('#loginID').val() },
      type: "POST",
      success: res => {
        Cookies.set('jwt', res.msg, { expires: 365 });
        loginProcess(res);
      },
      error: function(err) {
        let errorMSG;
        switch(err.responseJSON.data) {
          case 'ERR_INVAILD_ID':
            errorMSG = '유효하지 않은 학번입니다.';
            break;
  
          case 'ERR_NOT_REGISTERED':
            errorMSG = '등록되지 않은 학번입니다.';
            break;

          case 'ERR_UNKNOWN':
            errorMSG = '알 수 없는 오류입니다.';
            break;
        }
        toastr["error"](errorMSG);
      }
    });
  });
  
  $('#logout').click(function() {
    Cookies.remove('jwt');
    user = null;
    load();
  
    $('#admin').css('display', 'none');
    $('#loginForm').css('display', 'block');
    $('#userInfo').css('display', 'none');
    $('.my').removeClass('my');
  });
});

function autoLogin() {
  const jwt = Cookies.get('jwt');
  if(jwt) { // if jwt exists
    $.ajax({
      url: "api/auth/autologin",
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', jwt),
      type: "POST",
      success: res => loginProcess(res),
      error: autoLoginFailure
    });
  }
  else autoLoginFailure();
}

function autoLoginFailure() {
  $.ajax({
    url: "api/settings/currentSemister",
    success: res => {
      if(!Cookies.get('isNew')) { startIntro(); } // if first appearence
      else if(Cookies.get('currentSemister')) { // if previously saved semister exists
        if(Cookies.get('currentSemister') != res.data) { // if current semister and saved semister is different
          let semisterChange = introJs();
          semisterChange.setOptions({
            steps: [{
              intro: `<span style="font-size: 0.8rem">새 학기가 밝았습니다!</span>`
            }, {
              intro: `<span style="font-size: 0.8rem">기존 회원 분들도 회원 등록으로 새 학기 명단에 이름을 올려 주세요!</span>`
            }],
            exitOnOverlayClick: false,
            showStepNumbers: false,
            showBullets: false,
            showProgress: true
          });
          semisterChange.onbeforechange(function(elem) {
            if(this._currentStep == 1) $('#sidebar').css('display', 'block');
          }).onexit(function() {
            Cookies.set('currentSemister', res.data, { expires : 365 });
          }).start();
        }
        else $('#sidebar').css('display', 'block');
      }
      else {
        Cookies.set('currentSemister', res.data, { expires : 365 });
        $('#sidebar').css('display', 'block');
      }  
    }
  });
}

function loginProcess(res) {
  user = res.data.user;
  load();

  if(user.role != '회원') $('#admin').css('display', 'block');

  let mileage_this = 0, mileage_total = 0, time_this = 0, time_total = 0, cnt = 0;
  let html = '<table cellspacing="10px"><tr><th>순번</th><th>날짜</th><th>코스</th><th>점수</th></tr>';
  let this_month = new Date().format('yyyy-mm');
  for(let obj of res.data.statistics) {
    if(new Date(obj.date).format('yyyy-mm') == this_month) {
      mileage_this += Number(obj.score);
      if(obj.course.slice(-2) == '코스') time_this++;
    }
    mileage_total += Number(obj.score);
    if(obj.course.slice(-2) == '코스') time_total++;
    html += '<tr><td>' + (res.data.statistics.length - cnt++) + '</td><td>' + new Date(obj.date).format('yyyy년 m월 d일') + '</td><td>' + obj.course + '</td><td>' + obj.score + '점</td></tr>';
  }
  html += '</table>';

  $('#mileage_this').text(mileage_this);
  $('#mileage_total').text(mileage_total);
  $('#time_this').text(time_this);
  $('#time_total').text(time_total);
  $('#history').html(html);

  $('#username').text(user.name);
  $('#userrole').text(user.role);
  $('#userInfo').css('display', 'block');
  $('#loginForm').css('display', 'none');

  Cookies.set('currentSemister', res.data.semister, { expires : 365 });
}

toastr.options = {
  "closeButton": false,
  "debug": false,
  "newestOnTop": false,
  "progressBar": true,
  "positionClass": "toast-bottom-right",
  "preventDuplicates": true,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "500",
  "timeOut": "1500",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}

function startIntro() {
  let intro = introJs();
  intro.setOptions({
    steps: [{
      intro: `<span style="font-size: 0.8rem">신입 집사 여러분 안녕하세요!<br><br>아주대학교 고양이 동아리<br><b>미유미유</b>에 오신 것을 환영합니다.<br><br>사이트를 간단히 설명해 드릴게요!</span>`,
    }, {
      element: document.querySelector('#noticeTrig'),
      intro: `<span style="font-size: 0.9rem"><b>공지사항</b> 버튼이에요.</span>`,
    }, {
      element: document.querySelector('#helpTrig'),
      intro: `<span style="font-size: 0.9rem"><b>도움말</b> 버튼이에요.<br><br><b>급식표를 보는 방법</b>, 급식을 <b>신청</b>하고 <b>삭제</b>하는 방법을 알려줍니다.</span>`
    }, {
      element: document.querySelector('#mapTrig'),
      intro: `<span style="font-size: 0.9rem"><b>급식소 지도</b> 버튼이에요.<br><br>급식 코스가 헷갈릴 때 사용하세요!</span>`
    }, {
      element: document.querySelector('#guideTrig'),
      intro: `<span style="font-size: 0.9rem"><b>급식 가이드</b> 버튼이에요.<br><br>급식이 처음이라면 유용할 거에요!</span>`
    }, {
      intro: `<span style="font-size: 0.9rem">이 가이드를 다시 보려면 <i class="far fa-question-circle"></i> 메뉴에서 <b><i class='fas fa-book'></i> 튜토리얼</b>을 누르세요!</span>`
    }],
    exitOnOverlayClick: false,
    showStepNumbers: false,
    showBullets: false,
    showProgress: true
  });
  intro.onchange(function(elem) {
    if(!this._currentStep) {
      try { MicroModal.close('notice_modal'); } catch(e) { }
    }
    else if(this._currentStep == 1) {
      try { MicroModal.close('help_modal'); } catch(e) { }
      MicroModal.show('notice_modal');
    }
    else if(this._currentStep == 2) {
      try { MicroModal.close('notice_modal'); MicroModal.close('map_modal'); } catch(e) { }
      MicroModal.show("help_modal");
    }
    else if(this._currentStep == 3) {
      try { MicroModal.close('help_modal'); } catch(e) { }
      posID = setMap();
      MicroModal.show("map_modal", { onClose: function() { navigator.geolocation.clearWatch(posID); }});
      try { document.querySelector('#map > div > div > div:nth-child(1) > div:nth-child(3) > div > div:nth-child(3) > div:nth-child(1)').click() } catch(e) { }
    }
    else if(this._currentStep == 4) {
      try { MicroModal.close('map_modal'); } catch(e) { }
      MicroModal.show("guide_modal");
    }
    else if(this._currentStep == 5) {
      try { MicroModal.close('guide_modal'); } catch(e) { }
    }
  }).onexit(function() {
    if(!user.name) {
      let applyGuide = introJs();
      applyGuide.setOptions({
        steps: [{
          intro: `<span style="font-size: 0.8rem">신입 집사 분들은 먼저 회원 등록을 하셔야 합니다!</span>`
        }, {
          intro: `<span style="font-size: 0.8rem"><a style='font-size: 0.6rem' class='btn green'>회원 등록</a> 버튼을 눌러<br>회원 등록을 진행해 주세요!</span>`
        }],
        exitOnOverlayClick: false,
        showStepNumbers: false,
        showBullets: false,
        showProgress: true
      });
      applyGuide.onbeforechange(function(elem) {
        if(this._currentStep == 1) $('#sidebar').css('display', 'block');
      }).onexit(function() {
        Cookies.set('isNew', false, { expires : 3650 });
      }).start();
    }
  }).start();
}
