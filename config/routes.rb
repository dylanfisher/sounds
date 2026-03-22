Rails.application.routes.draw do
  # TODO: sort these new admin routes
  namespace :admin do
    resources :sound_ratings
  end
  root to: 'home_pages#show'

  resources :sounds, only: :show do
    member do
      post 'rate'
    end

    collection do
      get 'waveforms'
    end
  end

  namespace :admin do
    resources :artists
    resources :sounds do
      post 'bulk_upload', on: :collection
      get 'reprocess_mp3', on: :member
    end
  end
end
