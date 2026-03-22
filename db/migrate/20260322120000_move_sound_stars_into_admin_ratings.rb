class MoveSoundStarsIntoAdminRatings < ActiveRecord::Migration[8.1]
  ADMIN_BROWSER_IDENTIFIER = 'admin_migrated_stars'
  ADMIN_USER_AGENT = 'Admin migrated legacy Sound#stars'

  def up
    say_with_time 'Moving legacy Sound#stars values into sound_ratings' do
      Sound.reset_column_information
      SoundRating.reset_column_information

      Sound.where.not(stars: nil).find_each do |sound|
        next unless (1..5).cover?(sound.stars.to_i)
        next if SoundRating.where(sound_id: sound.id).exists?

        SoundRating.create!(
          sound_id: sound.id,
          rating: sound.stars,
          browser_identifier: ADMIN_BROWSER_IDENTIFIER,
          user_agent: ADMIN_USER_AGENT,
          created_at: sound.updated_at || sound.created_at || Time.current,
          updated_at: Time.current
        )
      end
    end
  end

  def down
    SoundRating.where(
      browser_identifier: ADMIN_BROWSER_IDENTIFIER,
      user_agent: ADMIN_USER_AGENT
    ).delete_all
  end
end
