class AddStarsToSounds < ActiveRecord::Migration[7.2]
  def change
    add_column :sounds, :stars, :integer
  end
end
