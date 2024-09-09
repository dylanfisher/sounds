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

  var playPauseCallback = function(wavesurfer, $button) {
    if ( wavesurfer.isPlaying() ) {
      $button.html('Pause')
    } else {
      $button.html('Play')
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
        playPauseCallback(wavesurfer, $button)
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
    var $soundWrapper  = $button.closest('.sound-wrapper')
    var $sound  = $soundWrapper.find('.sound')
    var wavesurfer = $sound.data('wavesurfer')

    wavesurfer.playPause()

    playPauseCallback(wavesurfer, $button)
  })

  App.$document.on('click', '.tr-words-link', function(e) {
    e.preventDefault()

    var $link = $(this)
    var $soundWrapper  = $link.closest('.sound-wrapper')
    var id = $soundWrapper.attr('data-id')
    var $tr = $soundTrs.filter(`[data-id="${id}"]`)

    $tr.toggleClass('d-none')
  })
})
