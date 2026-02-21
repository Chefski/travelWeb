<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { MapPinIcon } from 'lucide-vue-next'
import { useTripStore } from '~/stores/tripStore'
import { DAY_COLORS } from '~/types/trip'
import type { Place } from '~/types/trip'

const emit = defineEmits<{ 'place-clicked': [place: Place] }>()

const store = useTripStore()

const localPlaces = ref<Place[]>([])

watch(
  () => store.currentDay?.places,
  (newPlaces) => {
    localPlaces.value = [...(newPlaces ?? [])]
  },
  { immediate: true, deep: true },
)

const dayColor = computed(() => DAY_COLORS[store.selectedDayIndex % DAY_COLORS.length])

function onDragEnd() {
  store.reorderPlaces(store.selectedDayIndex, localPlaces.value)
}

function onRemovePlace(placeId: string) {
  store.removePlace(store.selectedDayIndex, placeId)
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
        :place="place"
        :color="dayColor"
        @remove="onRemovePlace"
        @click="emit('place-clicked', $event)"
      />
    </VueDraggable>
  </div>

  <div v-else class="flex flex-col items-center justify-center py-12 text-muted-foreground">
    <MapPinIcon class="h-8 w-8 mb-2 opacity-40" />
    <p class="text-sm">No places added yet</p>
    <p class="text-xs">Search and add places above</p>
  </div>
</template>
