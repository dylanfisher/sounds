import WaveSurfer from 'wavesurfer.js'

// Backend analyzer
App.pageLoad.push(function() {
  var $waveform = $('#waveform')

  if ( !$waveform.length ) return

  var $parent = $('#waveform-parent')
  var $loadingMessage = $('#waveform-loading-message')
  var $form = $parent.find('form')
  var $metadata = $form.find('#sound_waveform')
  var wavesurfer = WaveSurfer.create({
    container: $waveform[0],
    waveColor: '#000000',
    progressColor: '#55198B',
    height: 24,
    cursorWidth: 0,
  })

  wavesurfer.load($waveform.attr('data-url'))

  wavesurfer.on('ready', function () {
    $loadingMessage.remove()

    var peaks = wavesurfer.exportPeaks({ maxLength: 2000 })

    $form.removeClass('d-none')
    $metadata.val(JSON.stringify(peaks))
  })
})

// Frontend waveform display
App.pageLoad.push(function() {
  var $sounds = $('.sound')

  if ( !$sounds.length ) return

  var $soundTrs = $('.sound-tr')

  function secondsToHHMMSS(seconds) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const sec = Math.floor(seconds % 60)

    if ( hours > 0 ) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    } else {
      return `${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    }
  }

  var playPauseCallback = function(wavesurfer, $button, $wrapper) {
    var $currentTime = $wrapper.find('.sound-current-time')
    var updateTime = function() {
      var time = secondsToHHMMSS( wavesurfer.getCurrentTime() )
      $currentTime.html(time)
    }

    if ( wavesurfer.isPlaying() ) {
      $button.html('Pause')

      $wrapper.find('.sound-total-time').hide()
      $wrapper.find('.sound-current-time').show()

      if ( $wrapper.data('timer') ) window.clearInterval($wrapper.data('timer'))

      var timer = window.setInterval(function() {
        updateTime()
      }, 1000)

      updateTime()

      $wrapper.data('timer', timer)
    } else {
      $button.html('Play')

      $wrapper.find('.sound-total-time').show()
      $wrapper.find('.sound-current-time').hide()

      if ( $wrapper.data('timer') ) window.clearInterval($wrapper.data('timer'))
    }
  }

  var initSounds = function() {
    $sounds.each(function() {
      var $sound = $(this)
      var $wrapper = $sound.closest('.sound-wrapper')
      var $button = $wrapper.find('.play-sound-button')
      var wavesurfer = WaveSurfer.create({
        container: $sound[0],
        waveColor: '#000000',
        progressColor: '#55198B',
        height: 24,
        cursorWidth: 0,
      })

      $sound.data('wavesurfer', wavesurfer)

      wavesurfer.load($sound.attr('data-url'), JSON.parse($wrapper.data('waveform')))

      wavesurfer.on('click', () => {
        wavesurfer.play()
        playPauseCallback(wavesurfer, $button, $wrapper)
      })
    })
  }

  $.ajax({
    url: '/sounds/waveforms',
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      data['items'].forEach(function(item) {
        var $wrapper = $(`.sound-wrapper[data-id="${item.id}"]`)

        $wrapper.data('waveform', item.waveform)
      })

      initSounds()
    },
    error: function(xhr, status, error) {
      console.error(error)
    }
  })

  App.$document.on('click', '.play-sound-button', function() {
    var $button = $(this)
    var $wrapper  = $button.closest('.sound-wrapper')
    var $sound  = $wrapper.find('.sound')
    var wavesurfer = $sound.data('wavesurfer')

    if ( App.breakpoint.isMobile() ) {
      window.open($sound.attr('data-url'))
    } else {
      wavesurfer.playPause()

      playPauseCallback(wavesurfer, $button, $wrapper)
    }
  })

  App.$document.on('click', '.tr-words-link', function(e) {
    e.preventDefault()

    var $link = $(this)
    var $wrapper  = $link.closest('.sound-wrapper')
    var id = $wrapper.attr('data-id')
    var $tr = $soundTrs.filter(`[data-id="${id}"]`)

    $tr.toggleClass('d-none')
  })
})
