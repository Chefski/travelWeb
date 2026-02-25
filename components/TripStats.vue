<script setup lang="ts">
import { computed } from 'vue';
import { MapPinIcon, CalendarIcon, BarChart3Icon } from 'lucide-vue-next';
import { useTripStore } from '~/stores/tripStore';
import { useWeather } from '~/composables/useWeather';

const store = useTripStore();
const { weather } = useWeather();

const totalPlaces = computed(() => store.allPlaces.length);

const currentDayPlaces = computed(() => store.currentDay?.places.length ?? 0);

const daysPlanned = computed(() => {
  if (!store.trip) return { planned: 0, total: 0 };
  const total = store.trip.days.length;
  const planned = store.trip.days.filter(d => d.places.length > 0).length;
  return { planned, total };
});

const totalCost = computed(() => {
  return store.allPlaces.reduce((sum, p) => sum + (p.cost || 0), 0);
});

const countdown = computed(() => {
  if (!store.trip) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(store.trip.startDate + 'T00:00:00');
  const end = new Date(store.trip.endDate + 'T00:00:00');

  if (today < start) {
    const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return `In ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  }
  if (today <= end) {
    return 'Happening now!';
  }
  return 'Trip ended';
});
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span class="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
      <MapPinIcon class="h-3 w-3" />
      {{ totalPlaces }} place{{ totalPlaces === 1 ? '' : 's' }} total
    </span>

    <span class="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
      <MapPinIcon class="h-3 w-3" />
      {{ currentDayPlaces }} today
    </span>

    <span class="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
      <CalendarIcon class="h-3 w-3" />
      {{ countdown }}
    </span>

    <span
      v-if="weather"
      class="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full"
      :title="weather.condition"
    >
      {{ weather.icon }} {{ weather.temp }}
    </span>

    <span class="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
      <BarChart3Icon class="h-3 w-3" />
      {{ daysPlanned.planned }} of {{ daysPlanned.total }} days planned
    </span>

    <span
      v-if="totalCost > 0"
      class="inline-flex items-center gap-1 bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full"
    >
      💰 ${{ totalCost.toFixed(0) }} total
    </span>
  </div>
</template>
