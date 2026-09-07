module Sounds
  class CreateFromUploadedMp3
    LOOP_LOOP_LOOP_FILENAME_PATTERN = /\Aloop-loop-loop-(?:export|recording)_(.+)\z/i
    # e.g. 2026-09-06_mulch-export-1802_South-Yarrow_Put-Your-Hands-Down
    # => title "1802_South-Yarrow_Put-Your-Hands-Down"
    MULCH_FILENAME_PATTERN = /\A(\d{4}-\d{2}-\d{2})_mulch-(?:export|recording)-(\d+)_(.+)\z/i

    def initialize(uploaded_file:)
      @uploaded_file = uploaded_file
    end

    def call
      validate_mp3_upload!

      ActiveRecord::Base.transaction do
        sound_attributes = build_sound_attributes
        media_item = MediaItem.create!(
          title: filename,
          attachment: uploaded_file
        )

        Sound.create!(
          title: sound_attributes[:title],
          date: sound_attributes[:date],
          stars: 0,
          artist: sound_attributes[:artist],
          media_item: media_item
        )
      end
    end

    private

    attr_reader :uploaded_file

    def validate_mp3_upload!
      return if filename.match?(/\.mp3\z/i)
      return if uploaded_file.content_type.to_s == 'audio/mpeg'

      raise ArgumentError, 'Only MP3 uploads are supported.'
    end

    def build_sound_attributes
      if mulch_match.present?
        {
          title: "#{mulch_match[2]}_#{mulch_match[3]}",
          date: parse_mulch_date(mulch_match[1]),
          artist: find_or_create_artist!('mulch')
        }
      elsif loop_loop_loop_title.present?
        {
          title: loop_loop_loop_title,
          date: parse_loop_loop_loop_date(loop_loop_loop_title),
          artist: find_or_create_artist!('Loop Loop Loop')
        }
      else
        {
          title: default_title,
          date: Date.current,
          artist: find_or_create_artist!('unknown')
        }
      end
    end

    def parse_loop_loop_loop_date(title)
      segments = title.split('-')
      meridiem = segments[-1].to_s.upcase
      second = integer_segment(segments[-2])
      minute = integer_segment(segments[-3])
      hour = integer_segment(segments[-4])
      year = integer_segment(segments[-5])
      day = integer_segment(segments[-6])
      month = integer_segment(segments[-7])

      valid_time_segments = [month, day, year, hour, minute, second].all?(&:present?)

      return loop_loop_loop_fallback_date unless %w[AM PM].include?(meridiem) && valid_time_segments

      Date.new(year, month, day)
    rescue Date::Error
      loop_loop_loop_fallback_date
    end

    def parse_mulch_date(value)
      Date.iso8601(value)
    rescue Date::Error
      Rails.logger.warn(
        "Could not parse mulch export date from #{filename}. " \
        'Falling back to current date. Expected date segment like YYYY-MM-DD.'
      )
      Date.current
    end

    def integer_segment(value)
      Integer(value, exception: false)
    end

    def loop_loop_loop_fallback_date
      Rails.logger.warn(
        "Could not parse loop-loop-loop export date from #{filename}. " \
        'Falling back to current date. Expected date segment like YYYY-MM-DD.'
      )
      Date.current
    end

    def find_or_create_artist!(name)
      Artist.where('LOWER(name) = ?', name.downcase).first_or_create!(name: name)
    end

    def mulch_match
      return @mulch_match if defined?(@mulch_match)

      @mulch_match = filename_base.match(MULCH_FILENAME_PATTERN)
    end

    def loop_loop_loop_title
      @loop_loop_loop_title ||= filename_base[LOOP_LOOP_LOOP_FILENAME_PATTERN, 1]
    end

    def default_title
      filename_base
    end

    def filename
      @filename ||= uploaded_file.original_filename.to_s
    end

    def filename_base
      @filename_base ||= File.basename(filename, File.extname(filename))
    end
  end
end
