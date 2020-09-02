$(function() {
  $('#login').click(function() {
    $.ajax({
      url:"https://luftaquila.io/ajoumeow/api/login",
      data: { 'ID' : $('#loginID').val() },
      type: "POST",
      dataType: 'json',
      success: function(res) {
        if(res.name) {
          user.name = res.name;
          user.id = res.id;
          user.admin = (res.role != '회원');
          load();
          genUserRecord();
          if(user.admin) {
            $('#admin').css('display', 'block');
            $('#adminhelp').css('display', 'block');
          }
          $('#username').text(res.name);
          $('#userrole').text(res.role);
          $('#userInfo').css('display', 'block');
          $('#loginForm').css('display', 'none');
        }
        else toastr["error"]("등록되지 않은 학번입니다.");
      }
    });
  });
  
  $('#logout').click(function() {
    $.ajax({
      url: 'https://luftaquila.io/ajoumeow/api/logout',
      type: 'POST',
      dataType: 'json',
      success: function(res) {
        if(res.result) {
          user.name = '';
          user.id = '';
          user.admin = false;
          
          load();
          
          $('#admin').css('display', 'none');
          $('#adminhelp').css('display', 'none');
          $('#loginForm').css('display', 'block');
          $('#userInfo').css('display', 'none');
          $('.my').removeClass('my');
        }
      }
    });
  });
  
  $('#apply').click(function() {
    $.ajax({
      url: 'https://luftaquila.io/ajoumeow/api/requestApply',
      type: 'POST',
      dataType: 'json',
      success: function(res) {
        if(res.result) {
          $('#sidebar').css('display', 'none');
          memberApply();
        }
        else alertify.error('회원 등록 기간이 아닙니다.');
      }
    });
  });
});

function logincheck(user) {
  $.ajax({
    url:"https://luftaquila.io/ajoumeow/api/loginCheck",
    type: "POST",
    dataType: 'json',
    success: function(res) {
      if(res.name) {
        user.name = res.name;
        user.id = res.id;
        user.admin = (res.role != "회원");
        genUserRecord();
        if(user.admin) {
          $('#admin').css('display', 'block');
          $('#adminhelp').css('display', 'block');
        }
        $('#username').text(user.name);
        $('#userrole').text(res.role);
        $('#userInfo').css('display', 'block');
        $('#loginForm').css('display', 'none');
      }
      else {
        user.name = '';
        user.id = '';
        user.admin = false;
        $('#admin').css('display', 'none');
        $('#adminhelp').css('display', 'none');
        $('#sidebar').css('display', 'block');
        $('#loginForm').css('display', 'block');
        $('#userInfo').css('display', 'none');
      }
    }
  });
  return user;
}

function genUserRecord() {
  $.ajax({
    url: 'https://luftaquila.io/ajoumeow/api/requestUserStat',
    type:'POST',
    data: { id: user.id },
    success: function(res) {
      let mileage_this = 0, mileage_total = 0, time_this = 0, time_total = 0, html = '<br>';
      let this_month = new Date().format('yyyy-mm');
      for(let obj of res) {
        if(new Date(obj.date).format('yyyy-mm') == this_month) {
          mileage_this += Number(obj.score);
          time_this++;
        }
        mileage_total += Number(obj.score);
        time_total++;
        html += new Date(obj.date).format('yyyy년 m월 d일') + ' • ' + obj.course + ' • ' + obj.score + '점<br><br>';
      }
      $('#mileage_this').text(mileage_this);
      $('#mileage_total').text(mileage_total);
      $('#time_this').text(time_this);
      $('#time_total').text(time_total);
      $('#history').html(html);
    }
  });
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

