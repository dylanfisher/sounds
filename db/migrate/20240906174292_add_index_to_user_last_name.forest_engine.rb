# This migration comes from forest_engine (originally 20230801171402)
class AddIndexToUserLastName < ActiveRecord::Migration[7.0]
  def change
    add_index :users, :last_name
  end
end
