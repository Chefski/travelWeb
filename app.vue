<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import {
  CalendarPlusIcon,
  ClockIcon,
  KeyboardIcon,
  LayoutListIcon,
  ListIcon,
  MapIcon,
  MoonIcon,
  PanelLeftIcon,
  SunIcon,
} from 'lucide-vue-next';
import { useTripWorkspace } from '~/composables/useTripWorkspace';

const SpeedInsights = defineAsyncComponent(() =>
  import('@vercel/speed-insights/vue').then(m => m.SpeedInsights),
);
const enableSpeedInsights = typeof window !== 'undefined'
  && !['localhost', '127.0.0.1'].includes(window.location.hostname);

const {
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
} = useTripWorkspace();
</script>

<template>
  <div class="h-screen bg-background font-outfit overflow-hidden text-foreground">
    <SpeedInsights v-if="enableSpeedInsights" />
    <Toaster position="top-right" />
    <LazyTripSetupDialog v-model:open="showSetupDialog" @created="onTripCreated" />
    <LazyTripEditDialog v-model:open="showEditDialog" />
    <LazyTripExport v-model:open="showExportDialog" />
    <LazyKeyboardShortcutsHelp v-model:open="showShortcutsHelp" />
    <LazyTripSelector v-model:open="showTripSelector" @create-new="onCreateNewFromSelector" />

    <div class="flex h-full">
      <!-- Left panel -->
      <div
        class="w-full md:w-[430px] xl:w-[500px] flex flex-col min-h-0 border-r border-border bg-background/95"
        :class="{ 'hidden': showMap, 'flex': !showMap }"
      >
        <div class="flex items-center justify-between gap-2 border-b border-border px-4 py-3 md:px-5">
          <div class="flex items-center gap-2 text-sm font-semibold">
            <span class="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MapIcon class="h-4 w-4" />
            </span>
            <span>TravelWeb</span>
          </div>

          <div class="flex items-center gap-1">
            <Button
              v-if="store.trip"
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              aria-label="My trips"
              @click="showTripSelector = true"
            >
              <PanelLeftIcon class="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" class="h-8 w-8" aria-label="Toggle dark mode" @click="toggleDarkMode">
              <SunIcon v-if="colorMode.value === 'dark'" class="h-4 w-4" />
              <MoonIcon v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <template v-if="store.trip">
          <div class="flex min-h-0 flex-1 flex-col gap-3 px-4 py-4 md:px-5 md:py-5">
            <TripHeader @new-trip="showTripSelector = true" @edit-trip="showEditDialog = true" @export-trip="showExportDialog = true" />
            <TripStats />
            <DayTabs />
            <div class="flex items-center gap-2">
              <PlaceSearch ref="placeSearchRef" class="flex-1" @place-selected="onPlaceSelected" />
              <div class="flex rounded-md border border-input bg-muted/50 p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 rounded-sm"
                  :class="viewMode === 'list' ? 'bg-background shadow-sm' : 'text-muted-foreground'"
                  aria-label="List view"
                  @click="viewMode = 'list'"
                >
                  <LayoutListIcon class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 rounded-sm"
                  :class="viewMode === 'timeline' ? 'bg-background shadow-sm' : 'text-muted-foreground'"
                  aria-label="Timeline view"
                  @click="viewMode = 'timeline'"
                >
                  <ClockIcon class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <ScrollArea class="min-h-0 flex-1 pr-1">
              <Transition name="slide-fade" mode="out-in">
                <PlaceList v-if="viewMode === 'list'" :key="'list-' + store.selectedDayIndex" :highlighted-place-id="highlightedPlaceId" @place-clicked="onPlaceClicked" />
                <DayTimeline v-else :key="'timeline-' + store.selectedDayIndex" @place-clicked="onPlaceClicked" />
              </Transition>
            </ScrollArea>
          </div>
        </template>

        <template v-else>
          <div class="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CalendarPlusIcon class="h-7 w-7" />
            </div>
            <div>
              <p class="text-lg font-semibold">Start a trip plan</p>
              <p class="mt-1 text-sm text-muted-foreground">Create a date-based itinerary, then add places to each day.</p>
            </div>
            <Button @click="showSetupDialog = true">Create Trip</Button>
          </div>
        </template>
      </div>

      <!-- Right panel -->
      <div
        class="h-full bg-muted/30 md:block md:flex-1"
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
