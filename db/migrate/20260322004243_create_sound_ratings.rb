class CreateSoundRatings < ActiveRecord::Migration[8.1]
  def change
    create_table :sound_ratings do |t|
      t.references :sound, null: false, foreign_key: true
      t.integer :rating
      t.string :browser_identifier
      t.string :ip_address
      t.string :user_agent
      t.string :referrer

      t.timestamps
    end
  end
end
