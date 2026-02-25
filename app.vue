<script setup lang="ts">
import { ref, watch, computed, watchEffect, onMounted } from 'vue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'vue-sonner';
import { MapIcon, ListIcon, SunIcon, MoonIcon, KeyboardIcon, LayoutListIcon, ClockIcon } from 'lucide-vue-next';
import { SpeedInsights } from '@vercel/speed-insights/vue';
import { useTripStore } from '~/stores/tripStore';
import { useTripSharing } from '~/composables/useTripSharing';
import { useMapMarkers } from '~/composables/useMapMarkers';
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts';
import type { Place } from '~/types/trip';

const store = useTripStore();
const colorMode = useColorMode();

// Check for shared trip in URL
if (typeof window !== 'undefined') {
  const { decodeTripFromUrl, clearShareHash } = useTripSharing();
  const sharedTrip = decodeTripFromUrl();
  if (sharedTrip) {
    store.createTrip(sharedTrip.name, sharedTrip.startDate, sharedTrip.endDate);
    if (store.trip) {
      store.trip = { ...store.trip, days: sharedTrip.days };
    }
    clearShareHash();
    toast(`Imported shared trip: "${sharedTrip.name}"`);
  }
}

function toggleDarkMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}

const worldMapRef = ref<InstanceType<typeof WorldMap> | null>(null);
const mapRef = computed(() => worldMapRef.value?.map ?? null);
const highlightedPlaceId = ref<string | null>(null);

function onMarkerClicked(placeId: string, dayIndex: number) {
  if (store.selectedDayIndex !== dayIndex) {
    store.selectDay(dayIndex);
  }
  highlightedPlaceId.value = placeId;
  setTimeout(() => {
    highlightedPlaceId.value = null;
  }, 2000);
}

const { syncMarkers, flyToPlace, fitAllPlaces } = useMapMarkers(mapRef, onMarkerClicked, store.getDayColor);

const showSetupDialog = ref(!store.trip);
const showEditDialog = ref(false);
const showExportDialog = ref(false);
const showShortcutsHelp = ref(false);
const showTripSelector = ref(false);
const showMap = ref(false);
const viewMode = ref<'list' | 'timeline'>('list');
const placeSearchRef = ref<InstanceType<typeof PlaceSearch> | null>(null);

const isLoaded = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    isLoaded.value = true;
  });
});

useKeyboardShortcuts({
  onFocusSearch: () => placeSearchRef.value?.focus(),
  onEditTrip: () => { showEditDialog.value = true; },
  onNewTrip,
  onToggleExport: () => { showExportDialog.value = true; },
  showShortcutsHelp,
});

// Sync markers whenever trip data or map readiness changes
watchEffect(() => {
  const map = mapRef.value;
  const trip = store.trip;

  if (!map || !trip) {
    syncMarkers([]);
    return;
  }

  const allDayData = trip.days.map((day, idx) => ({
    dayIndex: idx,
    places: day.places,
  }));
  syncMarkers(allDayData, store.selectedDayIndex);
});

// Fit map to current day's places when switching days
watch(
  () => store.selectedDayIndex,
  () => {
    if (store.currentDay && store.currentDay.places.length > 0) {
      fitAllPlaces(store.currentDay.places);
    }
  },
);

function onPlaceSelected(place: Place) {
  flyToPlace(place.coordinates);
  toast(`Added "${place.name}" to Day ${store.selectedDayIndex + 1}`);
}

function onPlaceClicked(place: Place) {
  flyToPlace(place.coordinates);
}

async function onTripCreated() {
  showSetupDialog.value = false;
  toast('Trip created! Start adding places.');
  const { default: confetti } = await import('canvas-confetti');
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'],
  });
}

function onNewTrip() {
  showTripSelector.value = true;
}

function onCreateNewFromSelector() {
  showSetupDialog.value = true;
}

function onStyleChanged() {
  if (!store.trip || !mapRef.value) return;
  const allDayData = store.trip.days.map((day, idx) => ({
    dayIndex: idx,
    places: day.places,
  }));
  syncMarkers(allDayData, store.selectedDayIndex);
}
</script>

<template>
  <div class="h-screen bg-background font-outfit overflow-hidden transition-all duration-700 ease-out" :class="isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'">
    <SpeedInsights />
    <Toaster position="top-right" />
    <LazyTripSetupDialog v-model:open="showSetupDialog" @created="onTripCreated" />
    <LazyTripEditDialog v-model:open="showEditDialog" />
    <LazyTripExport v-model:open="showExportDialog" />
    <LazyKeyboardShortcutsHelp v-model:open="showShortcutsHelp" />
    <LazyTripSelector v-model:open="showTripSelector" @create-new="onCreateNewFromSelector" />

    <div class="flex h-full">
      <!-- Left panel -->
      <div
        class="w-full md:w-[45%] xl:w-[40%] flex flex-col gap-3 min-h-0 px-4 md:px-6 py-4 md:py-6 border-r border-border"
        :class="{ 'hidden': showMap, 'flex': !showMap }"
      >
        <div class="flex justify-end">
          <Button variant="ghost" size="icon" class="h-8 w-8" aria-label="Toggle dark mode" @click="toggleDarkMode">
            <SunIcon v-if="colorMode.value === 'dark'" class="h-4 w-4" />
            <MoonIcon v-else class="h-4 w-4" />
          </Button>
        </div>

        <template v-if="store.trip">
          <TripHeader @new-trip="onNewTrip" @edit-trip="showEditDialog = true" @export-trip="showExportDialog = true" />
          <TripStats />
          <DayTabs />
          <div class="flex items-center justify-between">
            <PlaceSearch ref="placeSearchRef" class="flex-1" @place-selected="onPlaceSelected" />
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 shrink-0 ml-1"
              :aria-label="viewMode === 'list' ? 'Switch to timeline view' : 'Switch to list view'"
              @click="viewMode = viewMode === 'list' ? 'timeline' : 'list'"
            >
              <LayoutListIcon v-if="viewMode === 'list'" class="h-4 w-4" />
              <ClockIcon v-else class="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea class="flex-1">
            <Transition name="slide-fade" mode="out-in">
              <PlaceList v-if="viewMode === 'list'" :key="'list-' + store.selectedDayIndex" :highlighted-place-id="highlightedPlaceId" @place-clicked="onPlaceClicked" />
              <DayTimeline v-else :key="'timeline-' + store.selectedDayIndex" @place-clicked="onPlaceClicked" />
            </Transition>
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
      <div
        class="h-full md:block md:flex-1"
        :class="showMap ? 'block flex-1' : 'hidden'"
      >
        <LazyWorldMap ref="worldMapRef" @style-changed="onStyleChanged" />
      </div>
    </div>

    <!-- Keyboard shortcuts help button -->
    <Button
      variant="outline"
      size="icon"
      class="fixed bottom-6 right-6 z-50 hidden md:flex rounded-full h-9 w-9 shadow-md"
      aria-label="Keyboard shortcuts"
      @click="showShortcutsHelp = true"
    >
      <KeyboardIcon class="h-4 w-4" />
    </Button>

    <!-- Mobile map/list toggle -->
    <Button
      class="fixed bottom-6 right-6 z-50 md:hidden rounded-full h-14 w-14 shadow-lg"
      size="icon"
      :aria-label="showMap ? 'Show list' : 'Show map'"
      @click="showMap = !showMap"
    >
      <ListIcon v-if="showMap" class="h-5 w-5" />
      <MapIcon v-else class="h-5 w-5" />
    </Button>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
@import '~/assets/css/print.css';

body {
  margin: 0;
  min-height: 100vh;
  font-family: 'Outfit', sans-serif;
}

.slide-fade-enter-active {
  transition: all 0.2s ease;
}
.slide-fade-leave-active {
  transition: all 0.15s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
