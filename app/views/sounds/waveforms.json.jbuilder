json.cache! ['waveforms', application_cache_key], expires_in: 4.weeks do
  json.items @sounds do |record|
    json.id record.id
    json.waveform record.waveform
  end
end
