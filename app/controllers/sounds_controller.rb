class SoundsController < ForestController
  before_action :set_sound, only: [:show]

  def show
    authorize @sound
  end

  def waveforms
    @sounds = Sound.all.published
    authorize @sounds
  end

  private

  def set_sound
    @sound = Sound.find_by!(slug: params[:id])
  end
end
