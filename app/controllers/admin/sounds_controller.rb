class Admin::SoundsController < Admin::ForestController
  before_action :set_sound, only: [:edit, :update, :destroy]

  def index
    @pagy, @sounds = pagy apply_scopes(Sound).by_date
    authorize @sounds, :admin_index?
  end

  def new
    @sound = Sound.new
    authorize @sound
  end

  def edit
    authorize @sound
  end

  def create
    @sound = Sound.new(sound_params)
    authorize @sound

    if @sound.save
      redirect_to edit_admin_sound_path(@sound), notice: 'Sound was successfully created.'
    else
      render :new
    end
  end

  def update
    authorize @sound

    if @sound.update(sound_params)
      redirect_to edit_admin_sound_path(@sound), notice: 'Sound was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    authorize @sound
    @sound.destroy
    redirect_to admin_sounds_url, notice: 'Sound was successfully destroyed.'
  end

  private

  def sound_params
    # Add blockable params to the permitted attributes if this record is blockable `**BlockSlot.blockable_params`
    params.require(:sound).permit(:slug, :status, :title, :date, :media_item_id, :description, :waveform, :metadata, :artist, :stars)
  end

  def set_sound
    @sound = Sound.find(params[:id])
  end
end
