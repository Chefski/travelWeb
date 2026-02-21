<script setup lang="ts">
import { ref, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { SearchIcon, Loader2Icon, ClockIcon, XIcon } from 'lucide-vue-next'
import { useMapboxSearch } from '~/composables/useMapboxSearch'
import { useTripStore } from '~/stores/tripStore'
import { useSearchHistory, type HistoryEntry } from '~/composables/useSearchHistory'
import type { MapboxSuggestion, Place } from '~/types/trip'

const emit = defineEmits<{ 'place-selected': [place: Place] }>()

const store = useTripStore()
const { query, suggestions, isLoading, onSearchInput, retrievePlace, clearSearch } = useMapboxSearch()
const { history, addToHistory, removeFromHistory } = useSearchHistory()
const showDropdown = ref(false)
const isFocused = ref(false)
const showHistory = computed(() => isFocused.value && !query.value.trim() && history.value.length > 0)
const searchInputRef = ref<InstanceType<typeof Input> | null>(null)

defineExpose({
  focus() {
    searchInputRef.value?.$el?.focus()
  },
})

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

  const placeData: Omit<Place, 'id' | 'order' | 'notes' | 'estimatedTime'> = {
    mapboxId: suggestion.mapbox_id,
    name: suggestion.name,
    address: suggestion.place_formatted || feature.properties.full_address || '',
    category: suggestion.feature_type || '',
    coordinates: coords,
  }

  store.addPlace(placeData)
  addToHistory({
    name: placeData.name,
    mapboxId: placeData.mapboxId,
    address: placeData.address,
    category: placeData.category,
    coordinates: placeData.coordinates,
  })
  clearSearch()
  showDropdown.value = false

  const addedPlace = store.currentDay?.places[store.currentDay.places.length - 1]
  if (addedPlace) {
    emit('place-selected', addedPlace)
  }
}

function selectFromHistory(entry: HistoryEntry) {
  store.addPlace({
    mapboxId: entry.mapboxId,
    name: entry.name,
    address: entry.address,
    category: entry.category,
    coordinates: entry.coordinates,
  })
  const addedPlace = store.currentDay?.places[store.currentDay.places.length - 1]
  if (addedPlace) {
    emit('place-selected', addedPlace)
  }
  isFocused.value = false
}

function handleBlur() {
  setTimeout(() => {
    showDropdown.value = false
    isFocused.value = false
  }, 200)
}
</script>

<template>
  <div class="relative">
    <div class="relative">
      <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref="searchInputRef"
        :model-value="query"
        placeholder="Search for places..."
        class="pl-9 pr-9"
        @input="handleInput"
        @focus="isFocused = true; showDropdown = suggestions.length > 0"
        @blur="handleBlur"
      />
      <Loader2Icon
        v-if="isLoading"
        class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin"
      />
    </div>

    <div
      v-if="showDropdown && suggestions.length > 0"
      class="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md shadow-lg border max-h-[250px] overflow-y-auto"
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

    <div
      v-if="showHistory"
      class="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-20 overflow-hidden"
    >
      <div class="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50">Recent</div>
      <div
        v-for="entry in history"
        :key="entry.mapboxId"
        class="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
        @mousedown.prevent="selectFromHistory(entry)"
      >
        <ClockIcon class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-sm truncate">{{ entry.name }}</p>
          <p class="text-xs text-muted-foreground truncate">{{ entry.address }}</p>
        </div>
        <button
          class="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-destructive shrink-0"
          @mousedown.prevent.stop="removeFromHistory(entry.mapboxId)"
        >
          <XIcon class="h-3 w-3" />
        </button>
      </div>
    </div>
  </div>
</template>
