json.cache! ['waveforms', application_cache_key, @current_page, @per_page], expires_in: 4.weeks do
  json.page @current_page
  json.per_page @per_page
  json.total_count @total_count
  json.total_pages @total_pages
  json.next_page @next_page

  json.items @sounds do |record|
    json.id record.id
    json.waveform record.waveform
  end
end
