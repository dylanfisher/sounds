Rails.application.routes.draw do
  root to: 'home_pages#show'

  resources :sounds, only: :show

  namespace :admin do
    resources :sounds
  end
end
