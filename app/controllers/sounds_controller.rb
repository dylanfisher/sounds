class SoundsController < ForestController
  before_action :set_sound, only: [:show]

  def show
    authorize @sound
  end

  private

  def set_sound
    @sound = Sound.find_by!(slug: params[:id])
  end
end
