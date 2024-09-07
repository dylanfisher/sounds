import WaveSurfer from 'wavesurfer.js'

// Backend analyzer
App.pageLoad.push(function() {
  var $waveform = $('#waveform')

  if ( !$waveform.length ) return

  var $parent = $('#waveform-parent')
  var $loadingMessage = $('#waveform-loading-message')
  var $form = $parent.find('form')
  var $metadata = $form.find('#sound_waveform')
  var metadataValue = $metadata.val()

  if ( metadataValue ) {
    wavesurfer.load($waveform.attr('data-url'), JSON.parse(metadataValue))
  } else {
    wavesurfer.load($waveform.attr('data-url'))
  }

  wavesurfer.on('ready', function () {
    $loadingMessage.remove()

    const peaks = wavesurfer.exportPeaks()

    $form.removeClass('d-none')
    $metadata.val(JSON.stringify(peaks))
  })
})

// Frontend waveform display
App.pageLoad.push(function() {
  var $sounds = $('.sound')

  if ( !$sounds.length ) return

  $sounds.each(function() {
    var $sound = $(this)
    const wavesurfer = WaveSurfer.create({
      container: $sound[0],
      waveColor: '#000000',
      progressColor: '#a0a0a0',
      height: 20,
    })

    wavesurfer.load($sound.attr('data-url'), JSON.parse($sound.attr('data-waveform')))
  })
})
