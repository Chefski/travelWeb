<script setup lang="ts">
import { ref, watch, computed } from 'vue'
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

// Sync markers whenever trip data changes
watch(
  () => store.trip,
  () => {
    if (!store.trip) {
      syncMarkers([])
      return
    }
    const allDayData = store.trip.days.map((day, idx) => ({
      dayIndex: idx,
      places: day.places,
    }))
    syncMarkers(allDayData)
  },
  { deep: true },
)

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
  <div class="min-h-screen bg-gray-100 font-outfit">
    <Toaster position="top-right" />
    <TripSetupDialog v-model:open="showSetupDialog" @created="onTripCreated" />

    <main class="pt-8 px-5 max-w-[1800px] mx-auto h-[calc(100vh-2rem)]">
      <div class="bg-white rounded-2xl p-6 shadow-lg h-full">
        <div class="flex gap-6 h-full">
          <!-- Left side -->
          <div class="w-1/2 flex flex-col min-h-0">
            <template v-if="store.trip">
              <TripHeader @new-trip="onNewTrip" />
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

          <!-- Right side -->
          <div class="w-1/2 h-full">
            <WorldMap ref="worldMapRef" />
          </div>
        </div>
      </div>
    </main>
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
