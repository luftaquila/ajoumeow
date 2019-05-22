$(function() {
  var style = document.createElement('link');
  style.href = '/ajoumeow/Resources/Thanos/Thanos.css';
  style.type = 'text/css';
  style.rel = 'stylesheet';
  document.getElementsByTagName('head')[0].append(style);
  $('#thanos').load('/ajoumeow/Resources/Thanos/Thanos.html');
  $('#thanos').click(function() {
    if($('#thanos').attr('class') == 'alive') {
      $('.alive').removeClass('alive').addClass('dead');
      $('#guntlet').attr('src', '/ajoumeow/Resources/Thanos/alive.gif');
      setTimeout(function() {
        $('#guntlet').attr('src', '/ajoumeow/Resources/Thanos/preview.png');
        for(var i = 0; i < 14; i++) {
          for(var j = 0; j < 3; j++) {
            $('#nameCell_' + i + '_' + Math.floor(Math.random() * 7)).removeClass('appear').addClass('disappear');
          }
        }
        var disappearArray = $('.disappear');
        (function loop(x) {
          setTimeout(function() {
            content = disappearArray[disappearArray.length - x - 1].innerText;
            overlayHTML = "<div class=\"div-overlay div-overlay-left\">" + content + "</div>" + "<div class=\"div-overlay div-overlay-right\">" + content + "</div>";
            disappearArray[disappearArray.length - x - 1].innerHTML = '<div style="position: relative"><div class="div-hidden">' + content + '</div><div class="div-overlay">' + overlayHTML + '</div></div>';

            if(--x) loop(x);
          }, 100);
        })(disappearArray.length - 1);
      }, 2000);
    }
    else {
      $('.dead').removeClass('dead').addClass('alive');
      $('#guntlet').attr('src', '/ajoumeow/Resources/Thanos/dead.gif');
      setTimeout(function() {
        $('#guntlet').attr('src', '/ajoumeow/Resources/Thanos/preview.png');
        $('.disappear').removeClass('disappear').addClass('appear');
        $('.div-hidden').removeClass('div-hidden').addClass('div-show');
        setTimeout(function() {
          $('.div-show').removeClass('div-show');
          $('.div-overlay').html('');
        }, 1500);
      }, 2200);
    }
  });
});
