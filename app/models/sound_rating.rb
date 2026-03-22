class SoundRating < Forest::ApplicationRecord

  belongs_to :sound

  validates :rating, inclusion: { in: 1..5 }
  validates :browser_identifier, presence: true, uniqueness: { scope: :sound_id }

  def self.resource_description
    'Sounds can be rated by users.'
  end
end
