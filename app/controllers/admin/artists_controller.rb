class Admin::ArtistsController < Admin::ForestController
  before_action :set_artist, only: [:edit, :update, :destroy]

  def index
    @pagy, @artists = pagy apply_scopes(Artist).by_id
    authorize @artists, :admin_index?
  end

  def new
    @artist = Artist.new
    authorize @artist
  end

  def edit
    authorize @artist
  end

  def create
    @artist = Artist.new(artist_params)
    authorize @artist

    if @artist.save
      redirect_to edit_admin_artist_path(@artist), notice: 'Artist was successfully created.'
    else
      render :new
    end
  end

  def update
    authorize @artist

    if @artist.update(artist_params)
      redirect_to edit_admin_artist_path(@artist), notice: 'Artist was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    authorize @artist
    @artist.destroy
    redirect_to admin_artists_url, notice: 'Artist was successfully destroyed.'
  end

  private

  def artist_params
    # Add blockable params to the permitted attributes if this record is blockable `**BlockSlot.blockable_params`
    params.require(:artist).permit(:slug, :name, :description)
  end

  def set_artist
    @artist = Artist.find(params[:id])
  end
end
