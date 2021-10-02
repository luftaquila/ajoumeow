const api = 'https://ajoumeow.luftaquila.io/api';

$(function() {
  requestPhotoList(0);
  $('input[name=sortPhoto]').change(() => requestPhotoList(0));
  $('.fj-gallery').on('click', '.likes', (e) => {
    const target = e.currentTarget;
    $.ajax({
      url: `${api}/gallery/like`,
      type: 'POST',
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
      data: { photo_id: $(target).data('photo_id') },
      success: res => {
        $(target).children('i').removeClass('far').addClass('fas');
        $(target).children('span').text(Number($(target).children('span').text()) + 1);
      },
      error: res => alert(res.responseJSON.msg)
    });
    e.preventDefault();
  });
    
  loadCount = 0;
  io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      
      requestPhotoList(loadCount);
      $('.threshold').removeClass('threshold');
      observer.unobserve(entry.target);
    });
  }, {});
});

function requestPhotoList(offset) {
  $.ajax({
    url: `${api}/gallery/photo`,
    data: {
      sort: $('input[name=sortPhoto]:checked').val(),
      offset: offset,
      type: 'gallery'
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
        <a href="photo?pid=${v.photo_id}" class="fj-gallery-item" oncontextmenu="return false;">
          <img
            class="fj-gallery-item-image"
            src="../res/image/gallery/thumb_${v.photo_id}"
            width="800" height="600"
            style="max-height: none; max-width: none; margin: 0;"
          />
          <div class='fj-gallery-item-info'>
            <div style='width: fit-content; position: relative; left: 0; bottom: 0; padding: .75rem; line-height: 1rem;'>
              <span>${v.uploader_name}</span><br>
              <span style='font-size: .8rem'>${v.tags.map(x => '#' + x).join(' ')}</span>
            </div>
            <div class='likes' data-photo_id='${v.photo_id}'>
              <i class='far fa-heart'></i>
              <span style='display: inline-block; width: 1rem; text-align: center'>${v.likes}</span>
            </div>
          </div>
       </a>`);
    });
    
    // initialize gallery
    let initCount = 0;
    loadCount = 0;
    $('.fj-gallery').fjGallery({
      itemSelector: '.fj-gallery-item',
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
        <a href="photo?pid=${v.photo_id}" class="fj-gallery-item" oncontextmenu="return false;">
          <img
            class="fj-gallery-item-image"
            src="../res/image/gallery/thumb_${v.photo_id}"
            width="800" height="600"
            style="max-height: none; max-width: none; margin: 0;"
          />
          <div class='fj-gallery-item-info'>
            <div style='width: fit-content; position: relative; left: 0; bottom: 0; padding: .75rem; line-height: 1rem;'>
              <span>${v.uploader_name}</span><br>
              <span style='font-size: .8rem'>${v.tags.map(x => '#' + x).join(' ' )}</span>
            </div>
            <div class='likes' data-photo_id='${v.photo_id}'>
              <i class='far fa-heart'></i>
              <span style='display: inline-block; width: 1rem; text-align: center'>${v.likes}</span>
            </div>
          </div>
       </a>`);
    });
    
    $('.fj-gallery').fjGallery('appendImages', $(`.fj-gallery-item:nth-last-child(-n+${photoList.length})`));
  }
  $('a.fj-gallery-item:nth-last-child(3)').addClass('threshold');
  loadCount += photoList.length;
}
