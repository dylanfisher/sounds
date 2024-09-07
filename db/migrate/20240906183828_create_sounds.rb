class CreateSounds < ActiveRecord::Migration[7.2]
  def change
    create_table :sounds do |t|
      t.string :title
      t.date :date
      t.references :media_item, null: false, foreign_key: true
      t.text :description
      t.text :waveform
      t.text :metadata
      t.string :slug
      t.integer :status, default: 1, null: false

      t.timestamps
    end
    add_index :sounds, :slug, unique: true
    add_index :sounds, :status
  end
end
