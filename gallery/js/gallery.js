$(function() {
  requestPhotoList(0);
  $('input[name=sortPhoto]').change(() => requestPhotoList(0));
  $('a.fj-gallery-item, img.fj-gallery-item-image, div.fj-gallery-item-info').on('contextmenu', function(e) { return false; }).mousedown(e => e.preventDefault());
  
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
      offset: offset
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
        <a href="#" class="fj-gallery-item" oncontextmenu="return true;">
          <img
            class="fj-gallery-item-image"
            src="/ajoumeow/res/image/gallery/${v.photo_id}"
            width="800" height="600"
            style="max-height: none; max-width: none; margin: 0;"
          />
          <div class='fj-gallery-item-info'>
            <div style='width: fit-content; position: relative; left: 0; bottom: 0; padding: .75rem; line-height: 1rem;'>
              <span>${v.uploader_name}</span><br>
              <span style='font-size: .8rem'>#${v.tags}</span>
            </div>
            <div style='width: fit-content; position: absolute; right: 0; bottom: 0; padding: 1rem;'>
              <i class='far fa-heart' onclick="$.ajax({ url: '/ajoumeow/api/gallery/like', type: 'POST', success: res => { $(this).removeClass('far').addClass('fas'); $(this).text(Number($(this).text()) + 1); }}); " style='float: right; font-size: 1.5rem;'> ${v.likes}</i>
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
        <a href="/ajoumeow/res/image/gallery/${v.photo_id}" class="fj-gallery-item" oncontextmenu="return true;">
          <img
            class="fj-gallery-item-image"
            src="/ajoumeow/res/image/gallery/${v.photo_id}"
            width="800"
            height="600"
            style="max-height: none; max-width: none; margin: 0;"
          />
          <div class='fj-gallery-item-info'>
            <div style='width: fit-content; position: relative; left: 0; bottom: 0; padding: .75rem; line-height: 1rem;'>
              <span>${v.uploader_name}</span><br>
              <span style='font-size: .8rem'>#${v.tags}</span>
            </div>
            <div style='width: fit-content; position: absolute; right: 0; bottom: 0; padding: 1rem;'>
              <i class='far fa-heart' style='float: right; font-size: 1.5rem;'> ${v.likes}</i>
            </div>
          </div>
       </a>`);
    });
    
    $('.fj-gallery').fjGallery('appendImages', $(`.fj-gallery-item:nth-last-child(-n+${photoList.length})`));
  }
  $('a.fj-gallery-item:nth-last-child(3)').addClass('threshold');
  loadCount += photoList.length;
}
