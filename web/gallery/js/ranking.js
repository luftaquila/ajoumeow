const api = 'https://ajoumeow.luftaquila.io/api';

$(function() {
  $.ajax({
    url: `${api}/gallery/ranking`,
    success: res => {
      $('.fj-gallery').fjGallery('destroy').html('');
      
      const rank = ['gold', 'silver', 'bronze'];
      
      res.week.forEach((v, i) => {
        $('#trending').append(`
          <a href="photo?pid=${v.photo_id}" class="fj-gallery-item" style='position: relative;' oncontextmenu="return false;">
            <img
              class="fj-gallery-item-image"
              src="/res/image/gallery/thumb_${v.photo_id}"
              width="800" height="600"
              style="max-height: none; max-width: none; margin: 0;"
            />
            <div class='fj-gallery-item-category' style='width: 100%'>
              <div style='width: fit-content; position: relative; left: 0; bottom: 0; padding: .75rem; line-height: 1rem;'>
                <span>${v.uploader}</span><br>
                <span style='font-size: .8rem'>${v.tag.map(x => '#' + x).join(' ')}</span>
              </div>
              <div class='likes' data-photo_id='${v.photo_id}'>
                <i class='far fa-heart'></i>
                <span style='display: inline-block; width: 1rem; text-align: center'>${v.count}</span>
              </div>
            </div>
            <div class='likes edit' style='top: 0rem; left: 1rem; padding: 0px;'><img src='/gallery/image/${rank[i]}.png' style='width: 40px'></div>
         </a>`);
      });
      
      res.month.forEach((v, i) => {
        $('#this-month').append(`
          <a href="photo?pid=${v.photo_id}" class="fj-gallery-item" style='position: relative;' oncontextmenu="return false;">
            <img
              class="fj-gallery-item-image"
              src="/res/image/gallery/thumb_${v.photo_id}"
              width="800" height="600"
              style="max-height: none; max-width: none; margin: 0;"
            />
            <div class='fj-gallery-item-category' style='width: 100%'>
              <div style='width: fit-content; position: relative; left: 0; bottom: 0; padding: .75rem; line-height: 1rem;'>
                <span>${v.uploader}</span><br>
                <span style='font-size: .8rem'>${v.tag.map(x => '#' + x).join(' ')}</span>
              </div>
              <div class='likes' data-photo_id='${v.photo_id}'>
                <i class='far fa-heart'></i>
                <span style='display: inline-block; width: 1rem; text-align: center'>${v.count}</span>
              </div>
            </div>
            <div class='likes edit' style='top: 0rem; left: 1rem; padding: 0px;'><img src='/gallery/image/${rank[i]}.png' style='width: 40px'></div>
         </a>`);
      });
      
      res.lastmonth.forEach((v, i) => {
        $('#last-month').append(`
          <a href="photo?pid=${v.photo_id}" class="fj-gallery-item" style='position: relative;' oncontextmenu="return false;">
            <img
              class="fj-gallery-item-image"
              src="/res/image/gallery/thumb_${v.photo_id}"
              width="800" height="600"
              style="max-height: none; max-width: none; margin: 0;"
            />
            <div class='fj-gallery-item-category' style='width: 100%'>
              <div style='width: fit-content; position: relative; left: 0; bottom: 0; padding: .75rem; line-height: 1rem;'>
                <span>${v.uploader}</span><br>
                <span style='font-size: .8rem'>${v.tag.map(x => '#' + x).join(' ')}</span>
              </div>
              <div class='likes' data-photo_id='${v.photo_id}'>
                <i class='far fa-heart'></i>
                <span style='display: inline-block; width: 1rem; text-align: center'>${v.count}</span>
              </div>
            </div>
            <div class='likes edit' style='top: 0rem; left: 1rem; padding: 0px;'><img src='/gallery/image/${rank[i]}.png' style='width: 40px'></div>
         </a>`);
      });
      
      $('#trending').fjGallery({ itemSelector: '.fj-gallery-item' });
      $('#this-month').fjGallery({ itemSelector: '.fj-gallery-item' });
      $('#last-month').fjGallery({ itemSelector: '.fj-gallery-item' });
    }
  });
});