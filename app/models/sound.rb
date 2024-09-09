class Sound < Forest::ApplicationRecord
  include Sluggable
  include Statusable

  belongs_to :media_item

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
end
