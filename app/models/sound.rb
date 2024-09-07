class Sound < Forest::ApplicationRecord
  include Sluggable
  include Statusable

  belongs_to :media_item

  validates :title, :artist, :date, presence: true

  scope :by_date, -> { order(date: :desc, id: :desc) }

  def self.resource_description
    'Is it music?'
  end

  def slug_attribute
    "#{id} #{title}"
  end
end
