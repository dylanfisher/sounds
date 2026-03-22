// Frontend waveform display
App.pageLoad.push(function() {
  var $sounds = $('.sound')

  if ( !$sounds.length ) return

  var $soundTrs = $('.sound-tr')
  var waveformRequestInFlight = false
  var queuedWaveformPage = null
  var audio = new window.Audio()
  var activeSoundId = null
  var activeAudioUrl = null
  var activeWrapperId = null
  var pendingSeekRatio = null
  var audioBusy = false

  audio.preload = 'none'

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

  var getSoundById = function(soundId) {
    return $(`.sound-wrapper[data-id="${soundId}"]`).find('.sound')
  }

  var getState = function($sound) {
    return $sound.data('waveformState')
  }

  var getProgressRatio = function(soundId) {
    if ( !soundId || soundId !== activeSoundId || !audio.duration || !Number.isFinite(audio.duration) || audio.ended ) {
      return 0
    }

    return Math.max(0, Math.min(1, audio.currentTime / audio.duration))
  }

  var ensureCanvasSize = function(state) {
    var width = Math.max(1, Math.floor(state.$sound.innerWidth()))
    var pixelRatio = window.devicePixelRatio || 1
    var height = state.height

    if ( state.width === width && state.pixelRatio === pixelRatio ) return

    state.width = width
    state.pixelRatio = pixelRatio
    state.canvas.width = width * pixelRatio
    state.canvas.height = height * pixelRatio
    state.canvas.style.width = width + 'px'
    state.canvas.style.height = height + 'px'
    state.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }

  var drawWaveform = function(state, progressRatio) {
    ensureCanvasSize(state)

    var ctx = state.ctx
    var width = state.width
    var height = state.height
    var peaks = state.peaks
    var middle = height / 2
    var progressWidth = Math.round(width * progressRatio)

    ctx.clearRect(0, 0, width, height)

    if ( !peaks.length ) return

    for ( let x = 0; x < width; x += 1 ) {
      var peakIndex = Math.min(peaks.length - 1, Math.floor(x * peaks.length / width))
      var peak = Math.abs(peaks[peakIndex] || 0)
      var amplitude = Math.max(1, peak * middle)

      ctx.strokeStyle = x <= progressWidth ? '#55198B' : '#000000'
      ctx.beginPath()
      ctx.moveTo(x + 0.5, middle - amplitude)
      ctx.lineTo(x + 0.5, middle + amplitude)
      ctx.stroke()
    }
  }

  var renderSoundWaveform = function($sound) {
    var state = getState($sound)

    if ( !state ) return

    drawWaveform(state, getProgressRatio(state.soundId))
  }

  var setButtonLabel = function($button, label) {
    if ( $button.text() === label ) return

    $button.html(label)
  }

  var refreshSoundUi = function($sound) {
    if ( !$sound.length ) return

    var state = getState($sound)

    if ( !state ) return

    var $wrapper = $sound.closest('.sound-wrapper')
    var $button = $wrapper.find('.play-sound-button')
    var $currentTime = $wrapper.find('.sound-current-time')
    var isActive = state.soundId === activeSoundId
    var isPlaying = isActive && !audio.paused && !audio.ended
    var isLoading = isActive && audioBusy

    if ( isLoading ) {
      setButtonLabel($button, isPlaying ? 'Pause' : 'Play')
      updateCurrentSoundState($wrapper, true)
      $wrapper.find('.sound-total-time').show()
      $wrapper.find('.sound-current-time').hide()
      renderSoundWaveform($sound)
      return
    }

    if ( isPlaying ) {
      setButtonLabel($button, 'Pause')
      updateCurrentSoundState($wrapper, true)
      $wrapper.find('.sound-total-time').hide()
      $wrapper.find('.sound-current-time').show()
      $currentTime.html(secondsToHHMMSS(audio.currentTime))
    } else {
      setButtonLabel($button, 'Play')
      updateCurrentSoundState($wrapper, false)
      $wrapper.find('.sound-total-time').show()
      $wrapper.find('.sound-current-time').hide()
    }

    renderSoundWaveform($sound)
  }

  var safeAudioPlay = function() {
    var playPromise = audio.play()

    if ( playPromise && typeof playPromise.catch === 'function' ) {
      playPromise.catch(function(error) {
        if ( error && error.name === 'AbortError' ) return

        throw error
      })
    }
  }

  var refreshActiveAndPrevious = function(previousSoundId) {
    if ( previousSoundId ) refreshSoundUi(getSoundById(previousSoundId))
    if ( activeSoundId ) refreshSoundUi(getSoundById(activeSoundId))
  }

  var playSound = function($sound, options) {
    var state = getState($sound)

    if ( !state ) return

    var previousSoundId = activeSoundId
    var seekRatio = options && options.seekRatio !== undefined ? Math.max(0, Math.min(1, options.seekRatio)) : null

    activeSoundId = state.soundId
    activeWrapperId = state.soundId
    pendingSeekRatio = seekRatio
    audioBusy = true

    if ( activeAudioUrl !== state.url ) {
      audio.pause()
      audio.src = state.url
      activeAudioUrl = state.url
      audio.load()
    } else if ( pendingSeekRatio !== null && audio.duration && Number.isFinite(audio.duration) ) {
      audio.currentTime = audio.duration * pendingSeekRatio
      pendingSeekRatio = null
    }

    refreshActiveAndPrevious(previousSoundId)
    safeAudioPlay()
  }

  var toggleSoundPlayback = function($sound) {
    var state = getState($sound)

    if ( !state ) return

    if ( activeSoundId === state.soundId && activeAudioUrl === state.url && !audioBusy ) {
      if ( audio.paused || audio.ended ) {
        safeAudioPlay()
      } else {
        audio.pause()
      }

      refreshSoundUi($sound)
      return
    }

    playSound($sound)
  }

  var playSoundAtPosition = function($sound, position) {
    playSound($sound, { seekRatio: position })
  }

  var initSounds = function($targetSounds) {
    $targetSounds.each(function() {
      var $sound = $(this)
      var $wrapper = $sound.closest('.sound-wrapper')
      var waveform = $wrapper.data('waveform')

      if ( getState($sound) || !waveform ) return

      var $button = $wrapper.find('.play-sound-button')
      var canvas = document.createElement('canvas')
      var parsedWaveform = typeof waveform === 'string' ? JSON.parse(waveform) : waveform
      var peaks = Array.isArray(parsedWaveform[0]) ? parsedWaveform[0] : parsedWaveform
      var state = {
        $sound: $sound,
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        peaks: peaks || [],
        duration: parseFloat($sound.attr('data-duration') || 0),
        soundId: String($wrapper.data('id')),
        url: $sound.attr('data-url'),
        height: 24,
      }

      $sound.empty().append(canvas)
      $sound.data('waveformState', state)
      renderSoundWaveform($sound)

      $button.prop('disabled', false)
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

  audio.addEventListener('loadstart', function() {
    audioBusy = true
    if ( activeSoundId ) refreshSoundUi(getSoundById(activeSoundId))
  })

  audio.addEventListener('loadedmetadata', function() {
    if ( pendingSeekRatio !== null && audio.duration && Number.isFinite(audio.duration) ) {
      audio.currentTime = audio.duration * pendingSeekRatio
      pendingSeekRatio = null
    }
  })

  audio.addEventListener('canplay', function() {
    audioBusy = false
    if ( activeSoundId ) refreshSoundUi(getSoundById(activeSoundId))
  })

  audio.addEventListener('playing', function() {
    audioBusy = false
    if ( activeSoundId ) refreshSoundUi(getSoundById(activeSoundId))
  })

  audio.addEventListener('waiting', function() {
    audioBusy = true
    if ( activeSoundId ) refreshSoundUi(getSoundById(activeSoundId))
  })

  audio.addEventListener('timeupdate', function() {
    if ( activeSoundId ) refreshSoundUi(getSoundById(activeSoundId))
  })

  audio.addEventListener('pause', function() {
    if ( activeSoundId ) refreshSoundUi(getSoundById(activeSoundId))
  })

  audio.addEventListener('ended', function() {
    var previousSoundId = activeSoundId

    if ( audio.duration && Number.isFinite(audio.duration) ) {
      audio.currentTime = 0
    }

    activeSoundId = null
    activeWrapperId = null
    pendingSeekRatio = null
    audioBusy = false
    if ( previousSoundId ) refreshSoundUi(getSoundById(previousSoundId))
  })

  $(window).on('resize', function() {
    $sounds.each(function() {
      renderSoundWaveform($(this))
    })
  })

  App.$document.on('click', '.play-sound-button', function() {
    var $wrapper  = $(this).closest('.sound-wrapper')
    var $sound  = $wrapper.find('.sound')

    if ( !getState($sound) ) return

    toggleSoundPlayback($sound)
  })

  App.$document.on('click', '.sound', function(event) {
    var $sound = $(this)
    var state = getState($sound)

    if ( !state || !state.width ) return

    var rect = state.canvas.getBoundingClientRect()
    var ratio = (event.clientX - rect.left) / rect.width

    playSoundAtPosition($sound, ratio)
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
