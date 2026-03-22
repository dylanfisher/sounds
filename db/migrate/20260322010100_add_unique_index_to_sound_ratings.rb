class AddUniqueIndexToSoundRatings < ActiveRecord::Migration[8.1]
  def change
    add_index :sound_ratings, [:sound_id, :browser_identifier], unique: true
  end
end
