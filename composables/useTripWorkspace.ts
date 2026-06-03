import { computed, ref, watch, watchEffect } from 'vue';
import { toast } from 'vue-sonner';
import { useKeyboardShortcuts } from '~/composables/useKeyboardShortcuts';
import { useMapMarkers } from '~/composables/useMapMarkers';
import { useTripSharing } from '~/composables/useTripSharing';
import { useTripStore } from '~/stores/tripStore';
import type { Place } from '~/types/trip';
import type WorldMap from '~/components/WorldMap.vue';

interface PlaceSearchExpose {
  focus: () => void
}

export function useTripWorkspace() {
  const store = useTripStore();
  const colorMode = useColorMode();

  const worldMapRef = ref<InstanceType<typeof WorldMap> | null>(null);
  const placeSearchRef = ref<PlaceSearchExpose | null>(null);
  const mapRef = computed(() => worldMapRef.value?.map ?? null);

  const highlightedPlaceId = ref<string | null>(null);
  const showSetupDialog = ref(!store.trip);
  const showEditDialog = ref(false);
  const showExportDialog = ref(false);
  const showShortcutsHelp = ref(false);
  const showTripSelector = ref(false);
  const showMap = ref(false);
  const viewMode = ref<'list' | 'timeline'>('list');

  function toggleDarkMode() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
  }

  function onMarkerClicked(placeId: string, dayIndex: number) {
    if (store.selectedDayIndex !== dayIndex) {
      store.selectDay(dayIndex);
    }
    highlightedPlaceId.value = placeId;
    window.setTimeout(() => {
      highlightedPlaceId.value = null;
    }, 2000);
  }

  const { syncMarkers, flyToPlace, fitAllPlaces } = useMapMarkers(mapRef, onMarkerClicked, store.getDayColor);

  useKeyboardShortcuts({
    onFocusSearch: () => placeSearchRef.value?.focus(),
    onEditTrip: () => { showEditDialog.value = true; },
    onNewTrip: () => { showTripSelector.value = true; },
    onToggleExport: () => { showExportDialog.value = true; },
    showShortcutsHelp,
  });

  function importSharedTripFromUrl() {
    if (typeof window === 'undefined') return;
    const { decodeTripFromUrl, clearShareHash } = useTripSharing();
    const sharedTrip = decodeTripFromUrl();
    if (!sharedTrip) return;

    store.createTrip(sharedTrip.name, sharedTrip.startDate, sharedTrip.endDate);
    if (store.trip) {
      store.trip = { ...store.trip, days: sharedTrip.days };
    }
    clearShareHash();
    toast(`Imported shared trip: "${sharedTrip.name}"`);
  }

  function syncCurrentMarkers() {
    const map = mapRef.value;
    const trip = store.trip;

    if (!map || !trip) {
      syncMarkers([]);
      return;
    }

    syncMarkers(
      trip.days.map((day, idx) => ({
        dayIndex: idx,
        places: day.places,
      })),
      store.selectedDayIndex,
    );
  }

  importSharedTripFromUrl();

  watchEffect(syncCurrentMarkers);

  watch(
    () => store.selectedDayIndex,
    () => {
      if (store.currentDay?.places.length) {
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
    toast('Trip created. Start adding places.');
    const { default: confetti } = await import('canvas-confetti');
    confetti({
      particleCount: 70,
      spread: 64,
      origin: { y: 0.64 },
      colors: ['#2563eb', '#0f766e', '#f97316', '#16a34a'],
    });
  }

  function onCreateNewFromSelector() {
    showSetupDialog.value = true;
  }

  function onStyleChanged() {
    syncCurrentMarkers();
  }

  return {
    store,
    colorMode,
    worldMapRef,
    placeSearchRef,
    highlightedPlaceId,
    showSetupDialog,
    showEditDialog,
    showExportDialog,
    showShortcutsHelp,
    showTripSelector,
    showMap,
    viewMode,
    toggleDarkMode,
    onPlaceSelected,
    onPlaceClicked,
    onTripCreated,
    onCreateNewFromSelector,
    onStyleChanged,
  };
}
