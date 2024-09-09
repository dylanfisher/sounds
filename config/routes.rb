Rails.application.routes.draw do
  root to: 'home_pages#show'

  resources :sounds, only: :show do
    collection do
      get 'waveforms'
    end
  end

  namespace :admin do
    resources :sounds
  end
end
