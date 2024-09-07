class SoundPolicy < BlockRecordPolicy
  def show?
    admin?
  end
end
