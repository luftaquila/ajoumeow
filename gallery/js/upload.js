$(function() {
  const jwt = Cookies.get('jwt');
  if(jwt) { // if jwt exists
    $.ajax({
      url: "api/auth/autologin",
      beforeSend: xhr => xhr.setRequestHeader('x-access-token', jwt),
      type: "POST",
      success: res => uppyInit(res),
      error: autoLoginFailure
    });
  }
  else autoLoginFailure();
});

function uppyInit() {
  uppy = Uppy.Core({
    debug: false,
    restrictions: {
      maxFileSize: 2000000,
      allowedFileTypes: ['image/*'],
      onBeforeUpload: (files) => files
    }
  })
  .use(Uppy.Dashboard, {
    inline: true,
    target: '#drag-drop-area',
    height: 200,
    hideUploadButton: true,
    showLinkToFileUploadResult: false,
    showProgressDetails: false,
    proudlyDisplayPoweredByUppy: false,
    note: '20MB 미만인 사진만 업로드 가능합니다.'
  })
  .use(Uppy.Tus, {endpoint: 'https://tusd.tusdemo.net/files/'})

  uppy.on('complete', (result) => {
    console.log('Upload complete! We’ve uploaded these files:', result.successful)
  })
  
  uppy.on('files-added', generateFileManager)
  uppy.on('file-removed', generateFileManager)
  
}

function generateFileManager() {
  $('#fileManager').html('');
  $('#fileManagerContainer').css('display', uppy.getFiles().length ? 'block' : 'none');
  
  uppy.getFiles().forEach((v, i) => {
    $('#fileManager').append(`<div style='margin: 0 0 1rem; padding: 0.75rem; border: 1.5px solid gray; border-radius: 0.75rem; position: relative;'><span style='width: 1.5rem; height: 1.5rem; line-height: 1.5rem; background-color: #1fad9f; color: white; position: absolute; top: 0.25rem; left: 0.25rem; text-align: center; border-radius: 50%;'>${Number(i) + 1}</span><img id='img-${i}' src='${URL.createObjectURL(v.data)}' style='width: 100%; margin-bottom: 0.5rem'><select id='select-${i}' multiple></select></div>`);
    new SlimSelect({
      select: `#select-${i}`,
      placeholder: '등장한 고양이',
      searchingText: '검색 중...', // Optional - Will show during ajax request
      ajax: function (search, callback) {
        fetch('https://jsonplaceholder.typicode.com/users')
        .then(function (response) {
          return response.json()
        })
        .then(function (json) {
          let data = []
          for (let i = 0; i < json.length; i++) {
            data.push({text: json[i].name})
          }

      // Upon successful fetch send data to callback function.
      // Be sure to send data back in the proper format.
      // Refer to the method setData for examples of proper format.
          callback(data)
        })
        .catch(function(error) { callback(false) });
      },
      addable: function (value) {
        return {
          text: $.trim(value),
          value: 'new'
        }
      }
    });   
  });
  $('#fileManager').append(`<span class='btn btn-primary' style='width: 100%'>${uppy.getFiles().length}개 사진 업로드</span>`);
}

function autoLoginFailure() {
  $('#contents').html(`<br><span style='color: black; font-size: 1.5rem;'>📣 앗, 잠깐만요! 🚧</span><br><img src='/ajoumeow/res/image/loading.gif' style='width: 100%; max-width: 500px; margin: 10px 0px'><br>사진 업로드는 미유미유 회원만 가능합니다.<br><a href='/ajoumeow'>미유미유 포탈</a>에서 먼저 로그인을 해 주세요.<br><p style='margin: 1rem 0'>401 Unauthorized.</p><br>`).css('text-align', 'center');
}


