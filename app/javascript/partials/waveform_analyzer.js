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
  var waveformRequestInFlight = false
  var queuedWaveformPage = null

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

  var updateCurrentSoundState = function($wrapper, isCurrent) {
    $wrapper.toggleClass('sound-wrapper--current', isCurrent)
  }

  var playPauseCallback = function(wavesurfer, $button, $wrapper) {
    var $currentTime = $wrapper.find('.sound-current-time')
    var updateTime = function() {
      var time = secondsToHHMMSS( wavesurfer.getCurrentTime() )
      $currentTime.html(time)
    }

    if ( wavesurfer.isPlaying() ) {
      $button.html('Pause')
      updateCurrentSoundState($wrapper, true)

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
      updateCurrentSoundState($wrapper, false)

      $wrapper.find('.sound-total-time').show()
      $wrapper.find('.sound-current-time').hide()

      if ( $wrapper.data('timer') ) window.clearInterval($wrapper.data('timer'))
    }
  }

  var pauseOtherSounds = function(activeWavesurfer) {
    $sounds.each(function() {
      var $sound = $(this)
      var wavesurfer = $sound.data('wavesurfer')

      if ( !wavesurfer || wavesurfer === activeWavesurfer || !wavesurfer.isPlaying() ) return

      var $wrapper = $sound.closest('.sound-wrapper')
      var $button = $wrapper.find('.play-sound-button')

      wavesurfer.pause()
      playPauseCallback(wavesurfer, $button, $wrapper)
    })
  }

  var ensureAudioLoaded = function($sound, wavesurfer, onReady) {
    if ( $sound.data('audioLoaded') ) {
      onReady()
      return
    }

    if ( $sound.data('audioLoading') ) {
      wavesurfer.once('ready', onReady)
      return
    }

    var peaks = JSON.parse($sound.closest('.sound-wrapper').data('waveform'))
    var duration = parseFloat($sound.attr('data-duration') || 0)

    $sound.data('audioLoading', true)
    wavesurfer.once('ready', function() {
      $sound.data('audioLoading', false)
      $sound.data('audioLoaded', true)
      onReady()
    })
    wavesurfer.load($sound.attr('data-url'), peaks, duration)
  }

  var toggleSoundPlayback = function($sound) {
    var wavesurfer = $sound.data('wavesurfer')

    if ( !wavesurfer ) return

    var $wrapper = $sound.closest('.sound-wrapper')
    var $button = $wrapper.find('.play-sound-button')

    ensureAudioLoaded($sound, wavesurfer, function() {
      if ( !wavesurfer.isPlaying() ) pauseOtherSounds(wavesurfer)

      wavesurfer.playPause()
      playPauseCallback(wavesurfer, $button, $wrapper)
    })
  }

  var initSounds = function($targetSounds) {
    $targetSounds.each(function() {
      var $sound = $(this)
      var $wrapper = $sound.closest('.sound-wrapper')

      if ( $sound.data('wavesurfer') || !$wrapper.data('waveform') ) return

      var $button = $wrapper.find('.play-sound-button')
      var wavesurfer = WaveSurfer.create({
        container: $sound[0],
        waveColor: '#000000',
        progressColor: '#55198B',
        height: 24,
        cursorWidth: 0,
      })

      $sound.data('wavesurfer', wavesurfer)
      wavesurfer.load('', JSON.parse($wrapper.data('waveform')), parseFloat($sound.attr('data-duration') || 0))

      $button.prop('disabled', false)

      wavesurfer.on('click', () => {
        toggleSoundPlayback($sound)
      })

      wavesurfer.on('finish', () => {
        playPauseCallback(wavesurfer, $button, $wrapper)
      })
    })
  }

  $('.play-sound-button').prop('disabled', true)

  var queueWaveformPageLoad = function(page) {
    if ( !page || waveformRequestInFlight ) return

    waveformRequestInFlight = true

    $.ajax({
      url: '/sounds/waveforms',
      type: 'GET',
      dataType: 'json',
      data: { page: page },
      success: function(data) {
        var $batchSounds = $()

        data['items'].forEach(function(item) {
          var $wrapper = $(`.sound-wrapper[data-id="${item.id}"]`)
          var $sound = $wrapper.find('.sound')

          if ( !$wrapper.length ) return

          $wrapper.data('waveform', item.waveform)
          $batchSounds = $batchSounds.add($sound)
        })

        initSounds($batchSounds)

        if ( data.next_page ) {
          queuedWaveformPage = data.next_page
        }
      },
      error: function(xhr, status, error) {
        console.error(error)
      },
      complete: function() {
        waveformRequestInFlight = false

        if ( queuedWaveformPage ) {
          var nextPage = queuedWaveformPage

          queuedWaveformPage = null

          window.setTimeout(function() {
            queueWaveformPageLoad(nextPage)
          }, 0)
        }
      }
    })
  }

  queueWaveformPageLoad(1)

  App.$document.on('click', '.play-sound-button', function() {
    var $button = $(this)
    var $wrapper  = $button.closest('.sound-wrapper')
    var $sound  = $wrapper.find('.sound')

    if ( !$sound.data('wavesurfer') ) return

    if ( false && App.breakpoint.isMobile() && !$sound.data('audioLoaded') ) {
      window.open($sound.attr('data-url'))
      return
    }

    toggleSoundPlayback($sound)
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
