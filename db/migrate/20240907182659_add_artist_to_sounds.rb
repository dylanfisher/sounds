class AddArtistToSounds < ActiveRecord::Migration[7.2]
  def change
    add_column :sounds, :artist, :string
  end
end
