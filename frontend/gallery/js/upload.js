const api = '/api';

$(function() {
  const jwt = Cookies.get('jwt');
  if(jwt) { // if jwt exists
    $.ajax({
      url: `${api}/auth/autologin`,
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', jwt),
      type: "POST",
      success: res => {
        if(res.stat = 'success') uppyInit();
        else autoLoginFailure();
      },
      error: autoLoginFailure
    });
  }
  else autoLoginFailure();
});

$('#upload').click(function() {
  $("html, body").animate({ scrollTop: 0 }, "slow");
  
  let tagFlag = true;
  uppy.getFiles().forEach((v, i) => {
    if(v.meta.tags) {
      if(!JSON.parse(v.meta.tags).length) {
        tagFlag = false;
        uppy.info(`${Number(i) + 1}번째 사진에 태그를 입력해 주세요.`, 'error', 2000);
      }
    }
    else {
      tagFlag = false;
      uppy.info(`${Number(i) + 1}번째 사진에 태그를 입력해 주세요.`, 'error', 2000);
    }
  });
  
  if(tagFlag) uppy.upload();
});

async function generateFileManager() {
  $('#fileManager').html('');
  $('#fileManagerContainer').css('display', uppy.getFiles().length ? 'block' : 'none');
  $('#filecount').text(uppy.getFiles().length);
  
  let tags = await $.ajax(`${api}/gallery/tags`);
  tags = tags.map(x => { return { text: x.tag_name } });
  
  uppy.getFiles().forEach((v, i) => {
    $('#fileManager').append(`<div style='margin: 0 0 1rem; padding: 0.75rem; border: 1.5px solid gray; border-radius: 0.75rem; position: relative;'><span style='width: 1.5rem; height: 1.5rem; line-height: 1.5rem; background-color: #1fad9f; color: white; position: absolute; top: 0.25rem; left: 0.25rem; text-align: center; border-radius: 50%;'>${Number(i) + 1}</span><img id='img-${i}' src='${URL.createObjectURL(v.data)}' style='width: 100%; margin-bottom: 0.5rem'><select id='select-${i}' multiple></select></div>`);
    new SlimSelect({
      select: `#select-${i}`,
      placeholder: '등장한 고양이',
      searchPlaceholder: '검색',
      searchFocus: false,
      data: tags,
      addable: value => { return { text: $.trim(value) }; },
      closeOnSelect: false,
      onChange: info => uppy.setFileMeta(v.id, { tags: JSON.stringify(info.map(x => { return { text: x.text }})) } )
    });
  });
}

function autoLoginFailure() {
  $('#contents').html(`<br><span style='color: black; font-size: 1.5rem;'>📣 앗, 잠깐만요! 🚧</span><br><img src='/res/image/loading.gif' style='width: 100%; max-width: 500px; margin: 10px 0px'><br>사진 업로드는 미유미유 회원만 가능합니다.<br><a href='/'>미유미유 포탈</a>에서 먼저 로그인을 해 주세요.<br><p style='margin: 1rem 0'>401 Unauthorized.</p><br>`).css('text-align', 'center');
}


