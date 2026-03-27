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

  var normalizedErrorMessage = function(xhr, fallbackMessage) {
    if ( xhr && xhr.status === 413 ) {
      return 'Upload rejected (413 Content Too Large). Try fewer files at once or smaller files.'
    }

    var data = (xhr && xhr.responseJSON) || {}
    var errors = data.errors || []
    return errors.join(' ') || fallbackMessage
  }

  var uploadSingleFile = function(file) {
    var formData = new FormData()
    formData.append('files[]', file)

    return $.ajax({
      url: $upload.data('upload-url'),
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        'X-CSRF-Token': csrfToken,
        'Accept': 'application/json'
      }
    })
  }

  var uploadFiles = function(fileList) {
    var files = Array.from(fileList).filter(function(file) {
      return file.name.match(/\.mp3$/i) || file.type === 'audio/mpeg'
    })

    if ( !files.length ) {
      setStatus('Only MP3 files are supported.', true)
      return
    }

    var createdCount = 0
    var errors = []
    var currentIndex = 0

    var uploadNext = function() {
      if ( currentIndex >= files.length ) {
        if ( errors.length ) window.alert(errors.join('\n'))

        if ( createdCount > 0 ) {
          setStatus(`Created ${createdCount} sound${createdCount === 1 ? '' : 's'}. Reloading...`, false)
          window.setTimeout(function() {
            window.location.reload()
          }, 500)
        } else {
          setStatus(errors.join(' ') || 'No sounds were created.', true)
        }

        setUploadingState(false)
        $fileInput.val('')
        return
      }

      var file = files[currentIndex]
      setStatus(`Uploading ${currentIndex + 1}/${files.length}: ${file.name}`, false)

      uploadSingleFile(file)
        .done(function(data) {
          createdCount += data.created_count || 0
          var responseErrors = data.errors || []
          if ( responseErrors.length ) {
            errors = errors.concat(responseErrors)
          }
        })
        .fail(function(xhr) {
          errors.push(`${file.name}: ${normalizedErrorMessage(xhr, 'Upload failed.')}`)
        })
        .always(function() {
          currentIndex += 1
          uploadNext()
        })
    }

    setUploadingState(true)
    uploadNext()
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
