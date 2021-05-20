$(function() {
  const jwt = Cookies.get('jwt');
  if(jwt) { // if jwt exists
    $.ajax({
      url: "/ajoumeow/api/auth/autologin",
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

function uppyInit() {
  uppy = Uppy.Core({
    debug: false,
    restrictions: {
      maxFileSize: 20971520, // 20MiB
      allowedFileTypes: ['image/*']
    }
  })
  .use(Uppy.Dashboard, {
    inline: true,
    target: '#drag-drop-area',
    height: 200,
    hideUploadButton: true,
    showLinkToFileUploadResult: false,
    showProgressDetails: true,
    proudlyDisplayPoweredByUppy: false,
    note: '20MB 미만인 사진만 업로드 가능합니다.',
    locale: {
      strings: {
        browse: '선택',
        cancel: '취소',
        back: '뒤로',
        done: '확인',
        uploading: '업로드 중...',
        complete: '업로드 성공!',
        uploadComplete: '업로드를 완료했습니다.',
        dropPaste: '📷 사진을 %{browse}하거나 여기로 드래그하세요.',
        addingMoreFiles: '파일 추가',
        xFilesSelected: '총 %{smart_count}개 사진',
        uploadingXFiles: '%{smart_count}개 사진 업로드 대기 중...'
      }
    }
  })
  .use(Uppy.XHRUpload, {
    endpoint: '/ajoumeow/api/gallery/photo',
    headers: { 'x-access-token': Cookies.get('jwt') }
  });

  uppy.on('complete', result => {
    $('#fileManagerContainer').css('display', 'none');
  });
  uppy.on('files-added', generateFileManager);
  uppy.on('file-removed', generateFileManager);
}

$('#upload').click(function() {
  $("html, body").animate({ scrollTop: 0 }, "slow");

  let flag = null;
  for(const [i, v] of uppy.getFiles().entries()) {
    if(!v.meta.tags) return uppy.info(`${Number(i) + 1}번째 사진에 태그를 입력해 주세요.`, 'error', 2000);
  }
  
  uppy.upload();
});

async function generateFileManager() {
  $('#fileManager').html('');
  $('#fileManagerContainer').css('display', uppy.getFiles().length ? 'block' : 'none');
  $('#filecount').text(uppy.getFiles().length);
  
  let tags = await $.ajax('/ajoumeow/api/gallery/tags');
  tags = tags.map(x => { return { text: x.tag_name, value: x.tag_id }; });
  
  uppy.getFiles().forEach((v, i) => {
    $('#fileManager').append(`<div style='margin: 0 0 1rem; padding: 0.75rem; border: 1.5px solid gray; border-radius: 0.75rem; position: relative;'><span style='width: 1.5rem; height: 1.5rem; line-height: 1.5rem; background-color: #1fad9f; color: white; position: absolute; top: 0.25rem; left: 0.25rem; text-align: center; border-radius: 50%;'>${Number(i) + 1}</span><img id='img-${i}' src='${URL.createObjectURL(v.data)}' style='width: 100%; margin-bottom: 0.5rem'><select id='select-${i}' multiple></select></div>`);
    new SlimSelect({
      select: `#select-${i}`,
      placeholder: '등장한 고양이',
      searchPlaceholder: '검색',
      searchFocus: false,
      data: tags,
      addable: value => { return { text: $.trim(value), value: $.trim(value) }; },
      closeOnSelect: false,
      onChange: info => uppy.setFileMeta(v.id, { tags: JSON.stringify(info.map(x => { return { text: x.text, value: x.value }; })) } )
    });
  });
}

function autoLoginFailure() {
  $('#contents').html(`<br><span style='color: black; font-size: 1.5rem;'>📣 앗, 잠깐만요! 🚧</span><br><img src='/ajoumeow/res/image/loading.gif' style='width: 100%; max-width: 500px; margin: 10px 0px'><br>사진 업로드는 미유미유 회원만 가능합니다.<br><a href='/ajoumeow'>미유미유 포탈</a>에서 먼저 로그인을 해 주세요.<br><p style='margin: 1rem 0'>401 Unauthorized.</p><br>`).css('text-align', 'center');
}


