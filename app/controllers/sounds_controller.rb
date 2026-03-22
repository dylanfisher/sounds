class SoundsController < ForestController
  before_action :set_sound, only: [:rate]
  before_action :set_rating_browser_identifier, only: [:rate]

  def waveforms
    page = params.fetch(:page, 1).to_i
    page = 1 if page < 1

    @per_page = 20
    scope = Sound.by_date.published
    @total_count = scope.count
    @total_pages = (@total_count.to_f / @per_page).ceil
    @current_page = page
    @next_page = page < @total_pages ? page + 1 : nil
    @sounds = scope.offset((page - 1) * @per_page).limit(@per_page)

    authorize Sound
  end

  def rate
    authorize @sound

    rating = params[:rating].to_i
    if current_user.try(:admin?)
      @sound.update_columns(stars: rating, updated_at: Time.current)
      Setting.expire_application_cache_key!

      render json: {
        sound_id: @sound.id,
        submitted_rating: rating,
        average_rating: rating,
        ratings_count: @sound.sound_ratings.count
      }
      return
    end

    existing_rating = @sound.sound_ratings.find_by(browser_identifier: @rating_browser_identifier)

    if existing_rating.blank? && rating_limit_reached?
      render json: { error: 'Too many rating submissions for this sound from your IP address. Please try again later.' }, status: :too_many_requests
      return
    end

    result = @sound.submit_rating!(
      rating: rating,
      browser_identifier: @rating_browser_identifier,
      ip_address: request.remote_ip,
      user_agent: request.user_agent,
      referrer: request.referer
    )

    render json: {
      sound_id: @sound.id,
      submitted_rating: result[:submitted_rating],
      average_rating: result[:average_rating],
      ratings_count: result[:ratings_count]
    }
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.record.errors.full_messages.to_sentence }, status: :unprocessable_entity
  rescue ArgumentError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def set_sound
    @sound = Sound.find_by!(slug: params[:id])
  end

  def set_rating_browser_identifier
    browser_identifier = cookies.permanent.signed[:rating_browser_identifier]

    if browser_identifier.blank?
      browser_identifier = SecureRandom.uuid
      cookies.permanent.signed[:rating_browser_identifier] = {
        value: browser_identifier,
        httponly: true,
        same_site: :lax
      }
    end

    @rating_browser_identifier = browser_identifier
  end

  def rating_limit_reached?
    @sound.sound_ratings
      .where(ip_address: request.remote_ip)
      .where('created_at >= ?', 24.hours.ago)
      .count >= 3
  end
end
