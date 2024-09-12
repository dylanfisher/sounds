class DropArtistFromSounds < ActiveRecord::Migration[7.2]
  def change
    remove_column :sounds, :artist, :string
  end
end
