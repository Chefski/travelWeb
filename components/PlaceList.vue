<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { MapPinIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useTripStore } from '~/stores/tripStore';
import { DAY_COLORS } from '~/types/trip';
import type { Place } from '~/types/trip';

const props = defineProps<{
  highlightedPlaceId?: string | null
}>();

const emit = defineEmits<{ 'place-clicked': [place: Place] }>();

const store = useTripStore();

const cardRefs: Record<string, HTMLElement> = {};

watch(() => props.highlightedPlaceId, (id) => {
  if (id && cardRefs[id]) {
    cardRefs[id].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

const localPlaces = ref<Place[]>([]);

watch(
  () => store.currentDay?.places,
  (newPlaces) => {
    localPlaces.value = [...(newPlaces ?? [])];
  },
  { immediate: true, deep: true },
);

const dayColor = computed(() => DAY_COLORS[store.selectedDayIndex % DAY_COLORS.length]);

function onDragEnd() {
  store.reorderPlaces(store.selectedDayIndex, localPlaces.value);
}

function onRemovePlace(placeId: string) {
  const place = localPlaces.value.find(p => p.id === placeId);
  const placeName = place?.name ?? 'Place';
  store.removePlace(store.selectedDayIndex, placeId);
  toast(`Removed "${placeName}"`, {
    action: {
      label: 'Undo',
      onClick: () => store.undoRemove(),
    },
    duration: 5000,
  });
}
</script>

<template>
  <div v-if="localPlaces.length > 0">
    <VueDraggable
      v-model="localPlaces"
      :animation="150"
      handle=".cursor-grab"
      class="space-y-2"
      @end="onDragEnd"
    >
      <PlaceCard
        v-for="place in localPlaces"
        :key="place.id"
        :ref="(el: any) => { if (el?.$el) cardRefs[place.id] = el.$el }"
        :place="place"
        :color="dayColor"
        :day-index="store.selectedDayIndex"
        :total-days="store.trip?.days.length ?? 0"
        :class="{ 'ring-2 ring-primary ring-offset-2 ring-offset-background transition-shadow': props.highlightedPlaceId === place.id }"
        @remove="onRemovePlace"
        @click="emit('place-clicked', $event)"
      />
    </VueDraggable>
  </div>

  <Transition name="fade">
    <div v-if="localPlaces.length === 0" class="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <MapPinIcon class="h-8 w-8 mb-2 opacity-40 animate-bounce-slow" />
      <p class="text-sm font-medium">No places added yet</p>
      <p class="text-xs mb-4">Search and add places above</p>
      <div class="flex flex-wrap gap-2 justify-center max-w-[280px]">
        <span class="text-xs bg-muted px-2 py-1 rounded-full cursor-default opacity-60">🏛️ Museums</span>
        <span class="text-xs bg-muted px-2 py-1 rounded-full cursor-default opacity-60">🍜 Restaurants</span>
        <span class="text-xs bg-muted px-2 py-1 rounded-full cursor-default opacity-60">🌳 Parks</span>
        <span class="text-xs bg-muted px-2 py-1 rounded-full cursor-default opacity-60">🛍️ Shopping</span>
        <span class="text-xs bg-muted px-2 py-1 rounded-full cursor-default opacity-60">📸 Viewpoints</span>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active {
  transition: opacity 0.3s ease;
}
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-bounce-slow {
  animation: bounce-slow 3s ease-in-out infinite;
}
</style>
