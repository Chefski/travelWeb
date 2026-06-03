<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import mapboxgl from 'mapbox-gl';
import { useLocalStorage } from '@vueuse/core';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

const emit = defineEmits<{ 'style-changed': [] }>();

const MAP_STYLES = [
  { id: 'streets', label: 'Map', url: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'satellite', label: 'Sat', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { id: 'light', label: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
  { id: 'dark', label: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
] as const;

const savedStyleId = useLocalStorage('map-style', 'streets');
const activeStyleId = ref(savedStyleId.value);
const map = ref<mapboxgl.Map | null>(null);
const mapContainer = ref<HTMLElement | null>(null);
const mapError = ref(mapboxToken ? '' : 'Mapbox token is missing. Add VITE_MAPBOX_TOKEN to .env.');

function getStyleUrl(id: string) {
  return MAP_STYLES.find(s => s.id === id)?.url ?? MAP_STYLES[0].url;
}

function switchStyle(id: string) {
  if (!map.value || id === activeStyleId.value) return;
  activeStyleId.value = id;
  savedStyleId.value = id;
  map.value.setStyle(getStyleUrl(id));
}

onMounted(() => {
  if (!mapContainer.value || !mapboxToken) return;

  mapboxgl.accessToken = mapboxToken;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: getStyleUrl(savedStyleId.value),
    center: [0, 0],
    zoom: 2,
    attributionControl: false,
  });

  if (typeof mapboxgl.AttributionControl === 'function') {
    map.value.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
  }
  if (typeof mapboxgl.NavigationControl === 'function') {
    map.value.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
  }

  map.value.on('style.load', () => {
    emit('style-changed');
  });
});

onBeforeUnmount(() => {
  map.value?.remove();
  map.value = null;
});

defineExpose({ map });
</script>

<template>
  <div class="relative h-full w-full">
    <div id="map-container" ref="mapContainer" class="h-full w-full" />

    <div v-if="mapError" class="absolute inset-0 z-10 flex items-center justify-center bg-muted/80 p-6 text-center">
      <div class="max-w-sm rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground shadow-sm">
        {{ mapError }}
      </div>
    </div>

    <div
      v-if="!mapError"
      class="absolute bottom-6 left-3 z-10 flex gap-0.5 rounded-md border border-border bg-background/90 p-1 shadow-lg backdrop-blur-sm"
    >
      <button
        v-for="style in MAP_STYLES"
        :key="style.id"
        :title="style.label"
        class="rounded-sm px-2.5 py-1 text-xs font-medium transition-colors"
        :class="
          activeStyleId === style.id
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-muted-foreground hover:bg-muted'
        "
        @click="switchStyle(style.id)"
      >
        {{ style.label }}
      </button>
    </div>
  </div>
</template>
