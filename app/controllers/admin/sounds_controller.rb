class Admin::SoundsController < Admin::ForestController
  before_action :set_sound, only: [:edit, :update, :destroy, :reprocess_mp3, :reanalyze_waveform]

  def index
    @pagy, @sounds = pagy apply_scopes(Sound).by_date
    authorize @sounds, :admin_index?
  end

  def new
    @sound = Sound.new
    authorize @sound
  end

  def edit
    load_sound_ratings
    authorize @sound
  end

  def reprocess_mp3
    authorize @sound, :edit?

    if @sound.media_item.reprocess_sound_metadata
      redirect_to edit_admin_sound_path(@sound), notice: 'Sound mp3 was successfully reprocessed.'
    else
      flash[:error] = 'Error reprocessing mp3'
      render :edit
    end
  end

  def reanalyze_waveform
    authorize @sound, :edit?

    media_item = @sound.media_item

    if media_item.blank? || media_item.attachment.blank? || media_item.attachment_content_type != 'audio/mpeg'
      redirect_to edit_admin_sound_path(@sound), alert: 'Sound needs an attached MP3 before waveform data can be analyzed.'
      return
    end

    waveform_json = Sounds::GenerateWaveform.new(source_url: media_item.attachment.url).call.to_json
    @sound.update_columns(waveform: waveform_json, updated_at: Time.current)

    redirect_to edit_admin_sound_path(@sound), notice: 'Waveform data was successfully reanalyzed.'
  rescue StandardError => e
    redirect_to edit_admin_sound_path(@sound), alert: "Error reanalyzing waveform data: #{e.message}"
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

  def bulk_upload
    authorize Sound, :create?

    files = Array(params[:files]).compact

    if files.blank?
      render json: { created_count: 0, errors: ['Please choose one or more MP3 files.'] }, status: :unprocessable_entity
      return
    end

    created_sounds = []
    errors = []

    files.each do |file|
      begin
        created_sounds << Sounds::CreateFromUploadedMp3.new(uploaded_file: file).call
      rescue StandardError => e
        errors << "#{file.original_filename}: #{e.message}"
      end
    end

    status =
      if created_sounds.any?
        :ok
      else
        :unprocessable_entity
      end

    render json: {
      created_count: created_sounds.count,
      created_sound_ids: created_sounds.map(&:id),
      errors: errors
    }, status: status
  end

  def update
    authorize @sound

    if @sound.update(sound_params)
      redirect_to edit_admin_sound_path(@sound), notice: 'Sound was successfully updated.'
    else
      load_sound_ratings
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
    params.require(:sound).permit(:slug, :status, :title, :date, :media_item_id, :description, :waveform, :metadata, :artist_id, :stars)
  end

  def set_sound
    @sound = Sound.find(params[:id])
  end

  def load_sound_ratings
    @sound_ratings_pagy, @sound_ratings = pagy(
      @sound.sound_ratings.order(created_at: :desc),
      page_param: :sound_ratings_page
    )
  end
end
