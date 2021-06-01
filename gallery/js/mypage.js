$(function() {
  const jwt = Cookies.get('jwt');
  if(jwt) { // if jwt exists
    $.ajax({
      url: "/ajoumeow/api/auth/autologin",
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', jwt),
      type: "POST",
      success: res => {
        if(res.stat = 'success') init(res.data.user);
        else autoLoginFailure();
      },
      error: autoLoginFailure
    });
  }
  else autoLoginFailure();
});

function autoLoginFailure() {
  $('#contents').html(`<br><span style='color: black; font-size: 1.5rem;'>📣 앗, 잠깐만요! 🚧</span><br><img src='/ajoumeow/res/image/loading.gif' style='width: 100%; max-width: 500px; margin: 10px 0px'><br>사진 업로드는 미유미유 회원만 가능합니다.<br><a href='/ajoumeow'>미유미유 포탈</a>에서 먼저 로그인을 해 주세요.<br><p style='margin: 1rem 0'>401 Unauthorized.</p><br>`).css('text-align', 'center');
}

function init(user) {
  userID = user.ID;
  requestPhotoList(0);
  $('input[name=sortPhoto]').change(() => requestPhotoList(0));

  loadCount = 0;
  io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;

      requestPhotoList(loadCount);
      $('.threshold').removeClass('threshold');
      observer.unobserve(entry.target);
    });
  }, {});
}

function requestPhotoList(offset) {
  $.ajax({
    url: '/ajoumeow/api/gallery/photographer',
    data: {
      sort: $('input[name=sortPhoto]:checked').val(),
      offset: offset,
      uid: userID
    },
    success: res => renderPhoto(res, offset)
  });
}

function renderPhoto(photoList, offset) {
  console.log('render', offset);
  if(!offset) { // if rendered for the first time
    // destroy existing gallery
    $('.fj-gallery').fjGallery('destroy').html('');

    // rendering photos
    photoList.forEach(v => {
      $('.fj-gallery').append(`
        <a href="/ajoumeow/gallery/photo?pid=${v.photo_id}" class="fj-gallery-item" oncontextmenu="return false;">
          <img
            class="fj-gallery-item-image"
            src="/ajoumeow/res/image/gallery/thumb_${v.photo_id}"
            width="200" height="200"
            style="max-height: none; max-width: none; margin: 0;"
          />
          <div class='fj-gallery-item-info' style='height: 100%'>
            <div style='width: fit-content; position: absolute; left: 0; bottom: 0; padding: .75rem; line-height: 1rem;'>
              <span>${v.uploader_name}</span><br>
              <span style='font-size: .8rem'>${v.tags.map(x => '#' + x).join(' ')}</span>
            </div>
            <div class='likes'>
              <i class='far fa-heart'></i>
              <span style='display: inline-block; width: 1rem; text-align: center'>${v.likes}</span>
            </div>
            <div class='likes edit' style='top: 0; left: 0'><i class='far fa-edit'></i></div>
            <div class='likes trash' onclick='deletePhoto("${v.photo_id}"); return false;' style='top: 0; right: 0; height: fit-content;'><i class='far fa-trash-alt'></i></div>
          </div>
       </a>`);
    });

    // initialize gallery
    let initCount = 0;
    loadCount = 0;
    $('.fj-gallery').fjGallery({
      itemSelector: '.fj-gallery-item',
      rowHeight: 200,
      onJustify: () => {
        initCount ++;
        if(initCount > 1) {
          setTimeout(() => {
            io.observe(document.querySelector('.threshold'));
          }, 500);
        }
      }
    });
  }
  else { // just appending
    // rendering photos
    photoList.forEach(v => {
      $('.fj-gallery').append(`
        <a href="/ajoumeow/gallery/photo?pid=${v.photo_id}" class="fj-gallery-item" oncontextmenu="return false;">
          <img
            class="fj-gallery-item-image"
            src="/ajoumeow/res/image/gallery/thumb_${v.photo_id}"
            width="200" height="200"
            style="max-height: none; max-width: none; margin: 0;"
          />
          <div class='fj-gallery-item-info' style='height: 100%'>
            <div style='width: fit-content; position: absolute; left: 0; bottom: 0; padding: .75rem; line-height: 1rem;'>
              <span>${v.uploader_name}</span><br>
              <span style='font-size: .8rem'>${v.tags.map(x => '#' + x).join(' ')}</span>
            </div>
            <div class='likes'>
              <i class='far fa-heart'></i>
              <span style='display: inline-block; width: 1rem; text-align: center'>${v.likes}</span>
            </div>
            <div class='likes edit' style='top: 0; left: 0'><i class='far fa-edit'></i></div>
            <div class='likes trash' onclick='deletePhoto("${v.photo_id}"); return false;' style='top: 0; right: 0; height: fit-content;'><i class='far fa-trash-alt'></i></div>
          </div>
       </a>`);
    });

    $('.fj-gallery').fjGallery('appendImages', $(`.fj-gallery-item:nth-last-child(-n+${photoList.length})`));
  }
  $('a.fj-gallery-item:nth-last-child(3)').addClass('threshold');
  loadCount += photoList.length;
}

function deletePhoto(pid) {
  const jwt = Cookies.get('jwt');
  $.ajax({
    url: '/ajoumeow/api/gallery/photo',
    beforeSend: xhr => xhr.setRequestHeader('x-access-token', jwt),
    type: 'DELETE',
    data: { pid: pid },
    success: res => requestPhotoList(0),
    error: res => alert(res.msg)
  });
}
