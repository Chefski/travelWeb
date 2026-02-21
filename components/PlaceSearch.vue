<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import { SearchIcon, Loader2Icon } from 'lucide-vue-next'
import { useMapboxSearch } from '~/composables/useMapboxSearch'
import { useTripStore } from '~/stores/tripStore'
import type { MapboxSuggestion, Place } from '~/types/trip'

const emit = defineEmits<{ 'place-selected': [place: Place] }>()

const store = useTripStore()
const { query, suggestions, isLoading, onSearchInput, retrievePlace, clearSearch } = useMapboxSearch()
const showDropdown = ref(false)

function handleInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  onSearchInput(value)
  showDropdown.value = true
}

async function onSelectSuggestion(suggestion: MapboxSuggestion) {
  const result = await retrievePlace(suggestion.mapbox_id)
  if (!result || !result.features?.length) return

  const feature = result.features[0]
  const coords: [number, number] = feature.geometry?.coordinates ?? [
    feature.properties.coordinates?.longitude ?? 0,
    feature.properties.coordinates?.latitude ?? 0,
  ]

  const placeData: Omit<Place, 'id' | 'order'> = {
    mapboxId: suggestion.mapbox_id,
    name: suggestion.name,
    address: suggestion.place_formatted || feature.properties.full_address || '',
    category: suggestion.feature_type || '',
    coordinates: coords,
  }

  store.addPlace(placeData)
  clearSearch()
  showDropdown.value = false

  const addedPlace = store.currentDay?.places[store.currentDay.places.length - 1]
  if (addedPlace) {
    emit('place-selected', addedPlace)
  }
}

function handleBlur() {
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}
</script>

<template>
  <div class="relative">
    <div class="relative">
      <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        :model-value="query"
        placeholder="Search for places..."
        class="pl-9 pr-9"
        @input="handleInput"
        @focus="showDropdown = suggestions.length > 0"
        @blur="handleBlur"
      />
      <Loader2Icon
        v-if="isLoading"
        class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin"
      />
    </div>

    <div
      v-if="showDropdown && suggestions.length > 0"
      class="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border max-h-[250px] overflow-y-auto"
    >
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.mapbox_id"
        class="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors border-b last:border-b-0"
        @mousedown.prevent="onSelectSuggestion(suggestion)"
      >
        <p class="font-medium text-sm truncate">{{ suggestion.name }}</p>
        <p class="text-xs text-muted-foreground truncate">{{ suggestion.place_formatted }}</p>
      </button>
    </div>
  </div>
</template>
