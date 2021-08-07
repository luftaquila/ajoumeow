const Uppy = require('@uppy/core')
const Dashboard = require('@uppy/dashboard')
const XHRUpload = require('@uppy/xhr-upload')
const ImageEditor = require('@uppy/image-editor')
const ThumbnailGenerator = require('@uppy/thumbnail-generator')

uppyInit = function() {
  uppy = new Uppy({
      debug: false,
      restrictions: {
        maxFileSize: 20971520, // 20MiB
        //maxNumberOfFiles: 3,
        allowedFileTypes: ['image/*']
      }
    })
    .use(Dashboard, {
      inline: true,
      target: '#drag-drop-area',
      height: 500,
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
          dropPaste: '📷 사진을 %{browse}하거나 드래그하세요.',
          addingMoreFiles: '파일 추가',
          xFilesSelected: '총 %{smart_count}개 사진',
          uploadingXFiles: '%{smart_count}개 사진 업로드 대기 중...'
        }
      }
    })
    .use(ThumbnailGenerator, {
      thumbnailWidth: 1000,
      thumbnailType: 'image/jpeg',
      waitForThumbnailsBeforeUpload: false
    })
    .use(XHRUpload, {
      endpoint: '/ajoumeow/api/gallery/photo',
      headers: { 'x-access-token': Cookies.get('jwt') }
    })
    .use(ImageEditor, {
      target: Dashboard,
      quality: 1,
    })

  uppy.on('complete', result => $('#fileManagerContainer').css('display', 'none') );
  uppy.on('files-added', generateFileManager);
  uppy.on('file-removed', generateFileManager);
}

