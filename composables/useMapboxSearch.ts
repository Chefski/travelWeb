import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { MapboxSuggestion, MapboxRetrieveResult } from '~/types/trip'

export function useMapboxSearch() {
  const query = ref('')
  const suggestions = ref<MapboxSuggestion[]>([])
  const isLoading = ref(false)
  const sessionToken = ref(crypto.randomUUID())

  const token = import.meta.env.VITE_MAPBOX_TOKEN

  async function fetchSuggestions(q: string) {
    if (!q || q.length < 2) {
      suggestions.value = []
      return
    }
    isLoading.value = true
    try {
      const params = new URLSearchParams({
        q,
        access_token: token,
        session_token: sessionToken.value,
        limit: '5',
      })
      const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params}`)
      const data = await res.json()
      suggestions.value = data.suggestions ?? []
    } catch (e) {
      console.error('Mapbox suggest error:', e)
      suggestions.value = []
    } finally {
      isLoading.value = false
    }
  }

  const debouncedSearch = useDebounceFn(fetchSuggestions, 300)

  function onSearchInput(value: string) {
    query.value = value
    debouncedSearch(value)
  }

  async function retrievePlace(mapboxId: string): Promise<MapboxRetrieveResult | null> {
    try {
      const params = new URLSearchParams({
        access_token: token,
        session_token: sessionToken.value,
      })
      const res = await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${mapboxId}?${params}`)
      const data: MapboxRetrieveResult = await res.json()
      sessionToken.value = crypto.randomUUID()
      return data
    } catch (e) {
      console.error('Mapbox retrieve error:', e)
      return null
    }
  }

  function clearSearch() {
    query.value = ''
    suggestions.value = []
  }

  return {
    query,
    suggestions,
    isLoading,
    onSearchInput,
    retrievePlace,
    clearSearch,
  }
}
