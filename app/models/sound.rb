class Sound < Forest::ApplicationRecord
  include Sluggable
  include Statusable

  belongs_to :artist
  belongs_to :media_item
  has_many :sound_ratings, dependent: :destroy

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

  def submit_rating!(rating:, browser_identifier:, ip_address: nil, user_agent: nil, referrer: nil)
    rating = rating.to_i
    raise ArgumentError, 'Rating must be between 1 and 5.' unless (1..5).cover?(rating)

    with_lock do
      sound_rating = sound_ratings.find_or_initialize_by(browser_identifier: browser_identifier)
      sound_rating.update!(
        rating: rating,
        ip_address: ip_address,
        user_agent: user_agent,
        referrer: referrer
      )

      average_rating = sound_ratings.average(:rating).to_f.round
      ratings_count = sound_ratings.count

      update_columns(stars: average_rating, updated_at: Time.current)

      {
        submitted_rating: sound_rating.rating,
        ratings_count: ratings_count,
        average_rating: average_rating
      }
    end
  end

  private

  def enqueue_waveform_generation
    return unless previous_changes.key?('id') || previous_changes.key?('media_item_id')
    return if media_item.blank? || media_item.attachment.blank?
    return unless media_item.attachment_content_type == 'audio/mpeg'

    GenerateSoundWaveformJob.perform_later(id)
  end
end
