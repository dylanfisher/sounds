class SoundPolicy < BlockRecordPolicy
  def show?
    admin?
  end

  def waveforms?
    true
  end
end
