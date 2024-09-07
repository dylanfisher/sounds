class AddSoundMetadataToMediaItems < ActiveRecord::Migration[7.2]
  def change
    add_column :media_items, :sound_metadata, :jsonb
  end
end
