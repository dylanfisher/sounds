class HomePagesController < PagesController
  def show
    super
    @sounds = Sound.by_date.published
  end
end
