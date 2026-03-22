web: bin/bundle exec puma -C config/puma.rb
release: bin/bundle exec rake db:migrate; bin/bundle exec rails forest:cache:clear
