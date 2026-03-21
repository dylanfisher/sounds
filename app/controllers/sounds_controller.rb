class SoundsController < ForestController
  before_action :set_sound, only: [:show]

  def show
    authorize @sound
  end

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

  private

  def set_sound
    @sound = Sound.find_by!(slug: params[:id])
  end
end
