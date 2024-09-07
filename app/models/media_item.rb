class MediaItem < Forest::ApplicationRecord
  include BaseMediaItem

  def after_save_callbacks
    return unless self.attachment_content_type == 'audio/mpeg'

    mp3_info = Mp3Info.open(URI.open(self.attachment.url))
    json = mp3_info.as_json.except(*['tag2', 'tag3', 'tag4', 'tag5'])
    self.update(sound_metadata: json)
  end
end
