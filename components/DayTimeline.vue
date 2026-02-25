<script setup lang="ts">
import { computed } from 'vue';
import {
  UtensilsIcon, BedDoubleIcon, LandmarkIcon, ShoppingBagIcon, TreesIcon,
  BuildingIcon, MapPinIcon, ClockIcon, DollarSignIcon, StarIcon,
} from 'lucide-vue-next';
import { useTripStore } from '~/stores/tripStore';
import { DAY_COLORS } from '~/types/trip';
import type { Place } from '~/types/trip';

const CATEGORY_ICONS: Record<string, any> = {
  restaurant: UtensilsIcon,
  food: UtensilsIcon,
  cafe: UtensilsIcon,
  bar: UtensilsIcon,
  hotel: BedDoubleIcon,
  lodging: BedDoubleIcon,
  landmark: LandmarkIcon,
  monument: LandmarkIcon,
  museum: LandmarkIcon,
  attraction: LandmarkIcon,
  shopping: ShoppingBagIcon,
  store: ShoppingBagIcon,
  park: TreesIcon,
  garden: TreesIcon,
  poi: BuildingIcon,
  address: BuildingIcon,
};

function getCategoryIcon(category: string) {
  const lower = category.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return MapPinIcon;
}

const emit = defineEmits<{ 'place-clicked': [place: Place] }>();
const store = useTripStore();
const dayColor = computed(() => DAY_COLORS[store.selectedDayIndex % DAY_COLORS.length]);
const places = computed(() => store.currentDay?.places ?? []);
</script>

<template>
  <div v-if="places.length > 0" class="relative pl-8 py-2">
    <!-- Vertical line -->
    <div
      class="absolute left-[15px] top-0 bottom-0 w-0.5 rounded-full"
      :style="{ backgroundColor: dayColor }"
    />

    <div v-for="(place, index) in places" :key="place.id" class="relative mb-6 last:mb-0">
      <!-- Timeline dot -->
      <div
        class="absolute -left-8 top-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-background shadow-md z-10"
        :style="{ backgroundColor: dayColor }"
      >
        {{ place.order + 1 }}
      </div>

      <!-- Content card -->
      <div
        class="ml-2 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
        @click="emit('place-clicked', place)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-medium text-sm">{{ place.name }}</p>
            <p class="text-xs text-muted-foreground truncate">{{ place.address }}</p>
          </div>
          <component
            :is="getCategoryIcon(place.category)"
            class="h-4 w-4 text-muted-foreground shrink-0 mt-0.5"
          />
        </div>

        <!-- Meta row -->
        <div class="flex items-center gap-3 mt-2 flex-wrap">
          <span v-if="place.estimatedTime" class="text-xs text-muted-foreground inline-flex items-center gap-1">
            <ClockIcon class="h-3 w-3" />
            {{ place.estimatedTime }}
          </span>
          <span v-if="place.cost" class="text-xs text-muted-foreground inline-flex items-center gap-1">
            <DollarSignIcon class="h-3 w-3" />
            ${{ place.cost }}
          </span>
          <span v-if="place.rating" class="text-xs text-amber-500 inline-flex items-center gap-0.5">
            <StarIcon class="h-3 w-3 fill-current" />
            {{ place.rating }}
          </span>
        </div>

        <!-- Notes -->
        <p v-if="place.notes" class="mt-2 text-xs text-muted-foreground italic leading-snug border-l-2 pl-2" :style="{ borderColor: dayColor }">
          {{ place.notes }}
        </p>
      </div>

      <!-- Connector label (distance/time between places) -->
      <div v-if="index < places.length - 1" class="absolute -left-[22px] bottom-[-18px] z-0">
        <div class="w-3 h-3 rounded-full bg-muted border border-border" />
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div v-else class="flex flex-col items-center justify-center py-12 text-muted-foreground">
    <MapPinIcon class="h-8 w-8 mb-2 opacity-40" />
    <p class="text-sm font-medium">No places added yet</p>
    <p class="text-xs">Search and add places to see your timeline</p>
  </div>
</template>
