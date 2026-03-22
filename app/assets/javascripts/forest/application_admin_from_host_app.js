$(function() {
  var $upload = $('#admin-sounds-bulk-upload')

  if ( !$upload.length ) return

  var $fileInput = $upload.find('.admin-sounds-bulk-upload__input')
  var $button = $upload.find('.admin-sounds-bulk-upload__button')
  var $status = $upload.find('.admin-sounds-bulk-upload__status')
  var csrfToken = $('meta[name="csrf-token"]').attr('content')
  var dragDepth = 0

  var setStatus = function(message, isError) {
    $status.text(message || '')
    $upload.toggleClass('is-error', !!isError)
  }

  var setUploadingState = function(isUploading) {
    $upload.toggleClass('is-uploading', isUploading)
    $button.prop('disabled', isUploading)
    $fileInput.prop('disabled', isUploading)
  }

  var uploadFiles = function(fileList) {
    var files = Array.from(fileList).filter(function(file) {
      return file.name.match(/\.mp3$/i) || file.type === 'audio/mpeg'
    })

    if ( !files.length ) {
      setStatus('Only MP3 files are supported.', true)
      return
    }

    var formData = new FormData()

    files.forEach(function(file) {
      formData.append('files[]', file)
    })

    setUploadingState(true)
    setStatus(`Uploading ${files.length} MP3${files.length === 1 ? '' : 's'}...`, false)

    $.ajax({
      url: $upload.data('upload-url'),
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        'X-CSRF-Token': csrfToken,
        'Accept': 'application/json'
      },
      success: function(data) {
        var createdCount = data.created_count || 0
        var errors = data.errors || []

        if ( errors.length ) window.alert(errors.join('\n'))

        setStatus(`Created ${createdCount} sound${createdCount === 1 ? '' : 's'}. Reloading...`, false)
        window.setTimeout(function() {
          window.location.reload()
        }, 500)
      },
      error: function(xhr) {
        var data = xhr.responseJSON || {}
        var message = (data.errors || ['Upload failed.']).join(' ')

        setStatus(message, true)
      },
      complete: function() {
        setUploadingState(false)
        $fileInput.val('')
      }
    })
  }

  $button.on('click', function(event) {
    event.preventDefault()
    $fileInput.trigger('click')
  })

  $fileInput.on('change', function(event) {
    if ( event.target.files.length ) uploadFiles(event.target.files)
  })

  $(document).on('dragenter.adminSoundsUpload dragover.adminSoundsUpload', function(event) {
    event.preventDefault()
  })

  $(document).on('drop.adminSoundsUpload', function(event) {
    event.preventDefault()
  })

  $upload.on('dragenter', function(event) {
    event.preventDefault()
    dragDepth += 1
    $upload.addClass('is-dragover')
  })

  $upload.on('dragover', function(event) {
    event.preventDefault()
    $upload.addClass('is-dragover')
  })

  $upload.on('dragleave', function(event) {
    event.preventDefault()
    dragDepth = Math.max(0, dragDepth - 1)

    if ( dragDepth === 0 ) $upload.removeClass('is-dragover')
  })

  $upload.on('drop', function(event) {
    event.preventDefault()
    dragDepth = 0
    $upload.removeClass('is-dragover')

    if ( $upload.hasClass('is-uploading') ) return

    var files = event.originalEvent.dataTransfer && event.originalEvent.dataTransfer.files

    if ( files && files.length ) uploadFiles(files)
  })
})
