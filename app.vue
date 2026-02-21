<script setup lang="ts">
import { ref, watch, computed, watchEffect } from 'vue'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'vue-sonner'
import { MapIcon } from 'lucide-vue-next'
import { useTripStore } from '~/stores/tripStore'
import { useMapMarkers } from '~/composables/useMapMarkers'
import type { Place } from '~/types/trip'

const store = useTripStore()

const worldMapRef = ref<InstanceType<typeof WorldMap> | null>(null)
const mapRef = computed(() => worldMapRef.value?.map ?? null)
const { syncMarkers, flyToPlace, fitAllPlaces } = useMapMarkers(mapRef)

const showSetupDialog = ref(!store.trip)
const showEditDialog = ref(false)

// Sync markers whenever trip data or map readiness changes
watchEffect(() => {
  const map = mapRef.value
  const trip = store.trip

  if (!map || !trip) {
    syncMarkers([])
    return
  }

  const allDayData = trip.days.map((day, idx) => ({
    dayIndex: idx,
    places: day.places,
  }))
  syncMarkers(allDayData)
})

// Fit map to current day's places when switching days
watch(
  () => store.selectedDayIndex,
  () => {
    if (store.currentDay && store.currentDay.places.length > 0) {
      fitAllPlaces(store.currentDay.places)
    }
  },
)

function onPlaceSelected(place: Place) {
  flyToPlace(place.coordinates)
  toast(`Added "${place.name}" to Day ${store.selectedDayIndex + 1}`)
}

function onPlaceClicked(place: Place) {
  flyToPlace(place.coordinates)
}

function onTripCreated() {
  showSetupDialog.value = false
  toast('Trip created! Start adding places.')
}

function onNewTrip() {
  store.clearTrip()
  showSetupDialog.value = true
}
</script>

<template>
  <div class="h-screen bg-white font-outfit overflow-hidden">
    <Toaster position="top-right" />
    <TripSetupDialog v-model:open="showSetupDialog" @created="onTripCreated" />
    <TripEditDialog v-model:open="showEditDialog" />

    <div class="flex h-full">
      <!-- Left panel -->
      <div class="w-[45%] xl:w-[40%] flex flex-col min-h-0 px-6 py-6 border-r border-gray-200">
        <template v-if="store.trip">
          <TripHeader @new-trip="onNewTrip" @edit-trip="showEditDialog = true" />
          <DayTabs class="mt-3" />
          <PlaceSearch class="mt-3" @place-selected="onPlaceSelected" />
          <ScrollArea class="flex-1 mt-3">
            <PlaceList @place-clicked="onPlaceClicked" />
          </ScrollArea>
        </template>

        <template v-else>
          <div class="flex flex-col items-center justify-center h-full gap-4">
            <MapIcon class="h-12 w-12 text-muted-foreground opacity-40" />
            <p class="text-lg text-muted-foreground">No trip planned yet</p>
            <Button @click="showSetupDialog = true">Create a Trip</Button>
          </div>
        </template>
      </div>

      <!-- Right panel -->
      <div class="flex-1 h-full">
        <WorldMap ref="worldMapRef" />
      </div>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Outfit', sans-serif;
}
</style>
