class AddArtistsToSounds < ActiveRecord::Migration[7.2]
  def change
    add_reference :sounds, :artist, null: true, foreign_key: true
  end
end
