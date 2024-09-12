class Artist < Forest::ApplicationRecord
  include Sluggable

  validates :name, presence: true

  def self.resource_description
    'Alias names'
  end
end
