const api = 'https://ajoumeow.luftaquila.io/api';

$(function() {
  const pid = new URLSearchParams(window.location.search).get('pid');

  $('#mainImage').attr('src', '/res/image/gallery/' + pid).one('load', () => {
    $('#imageInfo').css('width', $('#mainImage').width());

    EXIF.getData(document.getElementById('mainImage'), async function() {
      const image = await $.ajax({ url: `${api}/gallery/image`, data: { photo_id: pid }});

      $('#photographer').html(`<a href='/gallery/photographer/?uid=${btoa(image.uploader_id)}'>${image.uploader_name}</a>`);
      $('#tags').html(image.tags.map(x => `<a href='/gallery/cat/?cid=${encodeURI(x)}'>#${x}</a>`).join(' '));
      $('#size').text(humanFileSize(image.size));
      $('.likes span').text(image.likes);

      if(EXIF.getTag(this, "DateTimeOriginal")) $('#time').text(EXIF.getTag(this, "DateTimeOriginal").replace(':', '-').replace(':', '-'));
      else $('#time').text(new Date(image.timestamp).format('yyyy-mm-dd HH:MM:ss'));

      if(EXIF.getTag(this, "Model")) $('#camera').text(EXIF.getTag(this, "Model"));
      if(EXIF.getTag(this, "LensModel")) $('#lens').text(EXIF.getTag(this, "LensModel"));
      if(EXIF.getTag(this, "FNumber")) $('#aperture').text('f/' + EXIF.getTag(this, "FNumber"));
      if(EXIF.getTag(this, "ExposureTime")) $('#shutterspeed').text(new Fraction(Number(EXIF.getTag(this, "ExposureTime"))).toFraction(true) + 's');
      if(EXIF.getTag(this, "ISOSpeedRatings")) $('#iso').text(EXIF.getTag(this, "ISOSpeedRatings"));
      if(EXIF.getTag(this, "FocalLength")) $('#focal-length').text(EXIF.getTag(this, "FocalLength") + 'mm');
      if(EXIF.getTag(this, "ExposureBias")) $('#exposure').text(Math.round(EXIF.getTag(this, "ExposureBias") * 1000) / 1000 + ' EV');
      if(EXIF.getTag(this, "Flash")) $('#flash').text(EXIF.getTag(this, "Flash").includes('not') ? 'flash off' : 'flash on');

      if(EXIF.getTag(this, "GPSMapDatum") || EXIF.getTag(this, "GPSVersionID")) $('#location').text(`${coordTranslator(EXIF.getTag(this, "GPSLatitude"))}°${EXIF.getTag(this, "GPSLatitudeRef")} ${coordTranslator(EXIF.getTag(this, "GPSLongitude"))}°${EXIF.getTag(this, "GPSLongitudeRef")}`).append(`<br><iframe src="https://www.google.com/maps/embed/v1/place?key=AIzaSyAioaKVxmqI05VXqQqgEDWSgAUdobXSIrs&zoom=17&q=${coordTranslator(EXIF.getTag(this, "GPSLatitude"))},${coordTranslator(EXIF.getTag(this, "GPSLongitude"))}&center=${coordTranslator(EXIF.getTag(this, "GPSLatitude"))},${coordTranslator(EXIF.getTag(this, "GPSLongitude"))}" frameborder="0" style="width: 100%; max-width:400px; height: 300px;"></iframe>`);
    });

    if($('#mainImage').complete) $($('#mainImage')).trigger('load');
  });

  $('.likes').on('click', () => {
    $.ajax({
      url: `${api}/gallery/like`,
      type: 'POST',
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', Cookies.get('jwt')),
      data: { photo_id: pid },
      success: res => {
        $('.likes').children('i').removeClass('far').addClass('fas');
        $('.likes').children('span').text(Number($('.likes').children('span').text()) + 1);
      },
      error: res => alert(res.responseJSON.msg)
    });
  });
});

function humanFileSize(size) {
  let i = Math.floor( Math.log(size) / Math.log(1024) );
  return ( size / Math.pow(1024, i) ).toFixed(1) + ['B', 'KB', 'MB', 'GB', 'TB'][i];
};

function coordTranslator(data) {
  return Math.round((data[0] + data[1] / 60 + data[2] / 3600) * 1000000) / 1000000;
}
