class Sound < Forest::ApplicationRecord
  include Sluggable
  include Statusable

  belongs_to :artist
  belongs_to :media_item

  after_commit :enqueue_waveform_generation, on: %i[create update]

  validates :title, :artist, :date, :stars, presence: true

  scope :by_date, -> { order(date: :desc, id: :desc) }

  def self.resource_description
    'Is it music?'
  end

  def slug_attribute
    "#{id} #{title}"
  end

  def duration
    seconds = media_item.sound_metadata.try(:[], 'length').to_i || 0
    [seconds / 3600, seconds / 60 % 60, seconds % 60].map { |t| t.to_s.rjust(2,'0') }.join(':').sub(/^00:/, '')
  end

  private

  def enqueue_waveform_generation
    return unless previous_changes.key?('id') || previous_changes.key?('media_item_id')
    return if media_item.blank? || media_item.attachment.blank?
    return unless media_item.attachment_content_type == 'audio/mpeg'

    GenerateSoundWaveformJob.perform_later(id)
  end
end
