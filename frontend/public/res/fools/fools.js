$(function() {
  setTimeout(function() {
    $('html, body').css('animation-name', 'ㅁ');
  }, 20000);
  setTimeout(function() {
    $('#dateInfo, .calendar-container__body, #homeTrig, #helpTrig, #rankTrig, #sidebarTrig, table, #helpTrig, #rankTrig, #noticeTrig, #galleryTrig, #mapTrig, .namecard:nth-child(odd), #bottomInfo,.namecard:nth-child(even), .calendar-container__header').css('animation-name', 'ㅁ');
    $('.calendar-table__col').not('#addRecord').on('click', function() {
      $('table, .namecard').css('animation-name', 'ㅁ');
      if($('#contents table').length) $('#contents table').css('display', 'inline-block').after(`<div id='thanos' style="float: right; margin-top: ${((Number($('#contents table').css('height').replace('px', '')) - 80) / 2) + 'px'}; margin-right: 1rem"><img src='/res/fools/preview.png' style="width: 80px; height: 80px"></img></div>`);
      $('#thanos').click(function() {
        if($('#thanos').hasClass('activated')) {
          $('html').css('animation', '100ms ease-in-out 2200ms 3 shake');
          $('#thanos').addClass('deactivated').removeClass('activated').css('pointer-events', 'none');
          $('#thanos img').attr('src', '/res/fools/deactive.gif');
          setTimeout(function() {
            $('#thanos img').attr('src', '/res/fools/preview.png');
            $('#thanos').css('pointer-events', 'initial');
            $('.deactive').removeClass('deactive');
            $('.div-hidden').removeClass('div-hidden').addClass('div-show');
            setTimeout(function() {
              $('.div-show').removeClass('div-show');
              $('.div-overlay').html('');
              $('.calendar-table__col').css('pointer-events', 'initial');
            }, 1500);
            $('html').css('animation-name', 'ㅁ');
          }, 2700);
        }
        else {
          $('.calendar-table__col').css('pointer-events', 'none');
          $('html').css('animation', '100ms ease-in-out 2s 3 shake');
          $('#thanos').removeClass('deactivated').addClass('activated').css('pointer-events', 'none');
          $('#thanos img').attr('src', '/res/fools/active.gif');
          setTimeout(function () {
            $('#thanos').css('pointer-events', 'initial');
            for(const course of $('#contents table tbody tr td.courseContent')) {
              const target = $(course).children()[(Math.round(Math.random() * ($(course).children().length - 1) + 1)) - 1];
              $(target).addClass('deactive');
            }
            for(const week of $('div.calendar-table__row')) {
              for(let i = 0; i < 4; i++) {
                const day = $(week).children()[(Math.round(Math.random() * ($(week).children().length - 1) + 1)) - 1];
                $(day).children().children().addClass('deactive');
              }
            }
            const targets = $('.deactive');
            (function loop(x) {
              setTimeout(function() {
                const content = targets[targets.length - x - 1].innerText;
                const overlayHTML = "<div class=\"div-overlay div-overlay-left\">" + content + "</div>" + "<div class=\"div-overlay div-overlay-right\">" + content + "</div>";
                targets[targets.length - x - 1].innerHTML = '<div style="position: relative"><div class="div-hidden">' + content + '</div><div class="div-overlay">' + overlayHTML + '</div></div>';
  
                if(x--) loop(x);
              }, 100);
            })(targets.length - 1);
            $('html').css('animation-name', 'ㅁ');
          }, 2500);
        }
      });
    });

    $('.calendar-table__today').click();
  }, 1000);//23000);
});
