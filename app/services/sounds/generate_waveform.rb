require 'open3'
require 'open-uri'
require 'tempfile'

module Sounds
  class GenerateWaveform
    MAX_LENGTH = 1000
    PRECISION = 10_000.0

    def initialize(source_url:, max_length: MAX_LENGTH)
      @source_url = source_url
      @max_length = max_length
    end

    def call
      Tempfile.create(['sound-waveform', file_extension]) do |file|
        file.binmode
        URI.open(source_url) do |remote_file|
          IO.copy_stream(remote_file, file)
        end
        file.flush

        [build_peaks(decode_samples(file.path))]
      end
    end

    private

    attr_reader :source_url, :max_length

    def decode_samples(file_path)
      stdout, stderr, status = Open3.capture3(
        'ffmpeg',
        '-v', 'error',
        '-i', file_path,
        '-map', 'a:0',
        '-ac', '1',
        '-f', 'f32le',
        '-acodec', 'pcm_f32le',
        'pipe:1',
        binmode: true
      )

      raise "ffmpeg failed to decode waveform data: #{stderr.presence || 'unknown error'}" unless status.success?

      stdout.unpack('e*')
    end

    def build_peaks(samples)
      return [0.0] if samples.empty?

      Array.new(max_length) do |index|
        segment = samples.slice(segment_start(index, samples.length)...segment_end(index, samples.length)) || []

        dominant_sample = segment.reduce(0.0) do |current_peak, sample|
          sample.abs > current_peak.abs ? sample : current_peak
        end

        (dominant_sample * PRECISION).round / PRECISION
      end
    end

    def segment_start(index, sample_count)
      (index * sample_count / max_length.to_f).floor
    end

    def segment_end(index, sample_count)
      ((index + 1) * sample_count / max_length.to_f).ceil
    end

    def file_extension
      File.extname(URI.parse(source_url).path).presence || '.audio'
    rescue URI::InvalidURIError
      '.audio'
    end
  end
end
