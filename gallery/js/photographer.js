$(function() {
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
});

function requestPhotoList(offset) {
  $.ajax({
    url: '/ajoumeow/api/gallery/photo',
    data: {
      sort: $('input[name=sortPhoto]:checked').val(),
      offset: offset,
      type: 'uploader'
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
        <a href="" class="fj-gallery-item" oncontextmenu="return false;">
          <img
            class="fj-gallery-item-image"
            src="/ajoumeow/res/image/gallery/${v.newest_photo_id}"
            width="800" height="600"
            style="max-height: none; max-width: none; margin: 0;"
          />
          <div class='fj-gallery-item-category'>
            <div style='width: fit-content; position: relative; left: 0; bottom: 0; padding: 1rem; font-size: 1.2rem; line-height: 1rem;'>
              <span>${v.uploader_name}</span>
            </div>
            <div class='likes' style='width: fit-content; position: absolute; right: .5rem; bottom: 0; padding: 1rem; font-size: 1.2rem; line-height: 1.2rem;'>
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
        <a href="" class="fj-gallery-item" oncontextmenu="return false;">
          <img
            class="fj-gallery-item-image"
            src="/ajoumeow/res/image/gallery/${v.newest_photo_id}"
            width="800" height="600"
            style="max-height: none; max-width: none; margin: 0;"
          />
          <div class='fj-gallery-item-category'>
            <div style='width: fit-content; position: relative; left: 0; bottom: 0; padding: 1rem; font-size: 1.2rem; line-height: 1rem;'>
              <span>${v.uploader_name}</span>
            </div>
            <div class='likes' style='width: fit-content; position: absolute; right: .5rem; bottom: 0; padding: 1rem; font-size: 1.2rem; line-height: 1.2rem;'>
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
