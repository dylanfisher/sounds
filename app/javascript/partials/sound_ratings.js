App.pageLoad.push(function() {
  var $ratings = $('.sound-rating')

  if ( !$ratings.length ) return

  var storageKey = 'soundRatings'
  var storedRatings
  var csrfToken = $('meta[name="csrf-token"]').attr('content')

  try {
    storedRatings = JSON.parse(window.localStorage.getItem(storageKey) || '{}')
  } catch (error) {
    storedRatings = {}
  }

  var persistRatings = function() {
    window.localStorage.setItem(storageKey, JSON.stringify(storedRatings))
  }

  var starsMarkup = function(rating) {
    rating = Math.max(0, Math.min(5, parseInt(rating || 0, 10)))

    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  }

  var hoverRatingForEvent = function($rating, event) {
    var width = $rating.find('.sound-rating__value').outerWidth()
    var offset = event.pageX - $rating.find('.sound-rating__value').offset().left
    var ratio = Math.max(0, Math.min(1, offset / width))

    return Math.max(1, Math.min(5, Math.ceil(ratio * 5)))
  }

  var setDisplayedRating = function($rating, rating) {
    $rating.find('.sound-rating__value').text(starsMarkup(rating))
  }

  var setTitle = function($rating) {
    var averageRating = parseInt($rating.data('display-rating') || 0, 10)
    var ratingsCount = parseInt($rating.data('ratings-count') || 0, 10)
    $rating.attr('title', 'Average rating: ' + averageRating + '/5. Total ratings: ' + ratingsCount + '.')
  }

  var markAsRated = function($rating, submittedRating, averageRating) {
    $rating.addClass('is-rated')
    $rating.data('submitted-rating', submittedRating)
    $rating.data('display-rating', averageRating)
    setDisplayedRating($rating, submittedRating)
    setTitle($rating)
  }

  $ratings.each(function() {
    var $rating = $(this)
    var soundId = String($rating.data('sound-id'))
    var submittedRating = storedRatings[soundId]

    $rating.data('display-rating', $rating.data('current-rating'))
    setDisplayedRating($rating, $rating.data('current-rating'))
    setTitle($rating)

    if ( submittedRating ) {
      markAsRated($rating, submittedRating, $rating.data('current-rating'))
    }
  })

  App.$document.on('mousemove', '.sound-rating', function(event) {
    var $rating = $(this)

    var hoverRating = hoverRatingForEvent($rating, event)

    $rating.data('hover-rating', hoverRating)
    $rating.addClass('is-hovering')
    setDisplayedRating($rating, hoverRating)
  })

  App.$document.on('mouseleave', '.sound-rating', function() {
    var $rating = $(this)

    $rating.removeData('hover-rating')
    $rating.removeClass('is-hovering')

    if ( $rating.hasClass('is-rated') ) {
      setDisplayedRating($rating, $rating.data('submitted-rating'))
      return
    }

    setDisplayedRating($rating, $rating.data('display-rating'))
  })

  App.$document.on('click', '.sound-rating', function(event) {
    var $rating = $(this)
    var soundId = String($rating.data('sound-id'))
    var ratingValue = $rating.data('hover-rating') || hoverRatingForEvent($rating, event)

    $rating.addClass('is-submitting')

    $.ajax({
      url: $rating.data('rate-url'),
      type: 'POST',
      dataType: 'json',
      headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
      data: { rating: ratingValue },
      success: function(data) {
        storedRatings[soundId] = data.submitted_rating
        persistRatings()
        $rating.data('ratings-count', data.ratings_count)
        markAsRated($rating, data.submitted_rating, data.average_rating)
      },
      error: function(xhr) {
        var data = xhr.responseJSON || {}

        if ( data.submitted_rating ) {
          storedRatings[soundId] = data.submitted_rating
          persistRatings()
          markAsRated($rating, data.submitted_rating, data.average_rating || $rating.data('current-rating'))
          return
        }

        $rating.removeClass('is-submitting')
        $rating.removeClass('is-hovering')
        setDisplayedRating($rating, $rating.hasClass('is-rated') ? $rating.data('submitted-rating') : $rating.data('display-rating'))
      },
      complete: function() {
        $rating.removeClass('is-submitting')
      }
    })
  })

  App.$document.on('mouseenter', '.sounds-table__rating-heading', function() {
    var $table = $(this).closest('.sounds-table')

    $table.addClass('show-average-ratings')
    $table.find('.sound-rating').each(function() {
      var $rating = $(this)

      setDisplayedRating($rating, $rating.data('display-rating'))
    })
  })

  App.$document.on('mouseleave', '.sounds-table__rating-heading', function() {
    var $table = $(this).closest('.sounds-table')

    $table.removeClass('show-average-ratings')
    $table.find('.sound-rating').each(function() {
      var $rating = $(this)

      if ( $rating.hasClass('is-hovering') ) {
        setDisplayedRating($rating, $rating.data('hover-rating') || $rating.data('display-rating'))
      } else if ( $rating.hasClass('is-rated') ) {
        setDisplayedRating($rating, $rating.data('submitted-rating'))
      } else {
        setDisplayedRating($rating, $rating.data('display-rating'))
      }
    })
  })
})
