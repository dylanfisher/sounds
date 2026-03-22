class GenerateSoundWaveformJob < ApplicationJob
  queue_as :default

  def perform(sound_id)
    sound = Sound.includes(:media_item).find(sound_id)
    media_item = sound.media_item

    return if media_item.blank? || media_item.attachment.blank?
    return unless media_item.attachment_content_type == 'audio/mpeg'

    waveform_json = Sounds::GenerateWaveform.new(source_url: media_item.attachment.url).call.to_json
    return if sound.waveform == waveform_json

    sound.update_columns(waveform: waveform_json, updated_at: Time.current)
  end
end
