class CreateArtists < ActiveRecord::Migration[7.2]
  def change
    create_table :artists do |t|
      t.string :name
      t.text :description
      t.string :slug

      t.timestamps
    end
    add_index :artists, :slug, unique: true
  end
end
