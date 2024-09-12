class CreateArtistsFromSounds < ActiveRecord::Migration[7.2]
  def up
    Sound.all.each do |sound|
      sound_artist = sound.attributes['artist']
      artist = Artist.find_or_initialize_by(name: sound_artist)
      artist.save if artist.new_record?

      sound.artist = artist
      sound.save if sound.changed?
    end
  end
end
