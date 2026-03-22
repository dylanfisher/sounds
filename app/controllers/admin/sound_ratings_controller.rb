class Admin::SoundRatingsController < Admin::ForestController
  before_action :set_sound_rating, only: [:edit, :update, :destroy]

  def index
    @pagy, @sound_ratings = pagy apply_scopes(SoundRating).by_id
    authorize @sound_ratings, :admin_index?
  end

  def new
    @sound_rating = SoundRating.new
    authorize @sound_rating
  end

  def edit
    authorize @sound_rating
  end

  def create
    @sound_rating = SoundRating.new(sound_rating_params)
    authorize @sound_rating

    if @sound_rating.save
      redirect_to edit_admin_sound_rating_path(@sound_rating), notice: 'SoundRating was successfully created.'
    else
      render :new
    end
  end

  def update
    authorize @sound_rating

    if @sound_rating.update(sound_rating_params)
      redirect_to edit_admin_sound_rating_path(@sound_rating), notice: 'SoundRating was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    authorize @sound_rating
    @sound_rating.destroy
    redirect_to admin_sound_ratings_url, notice: 'SoundRating was successfully destroyed.'
  end

  private

  def sound_rating_params
    # Add blockable params to the permitted attributes if this record is blockable `**BlockSlot.blockable_params`
    params.require(:sound_rating).permit(:sound_id, :rating, :browser_identifier, :ip_address, :user_agent, :referrer)
  end

  def set_sound_rating
    @sound_rating = SoundRating.find(params[:id])
  end
end
