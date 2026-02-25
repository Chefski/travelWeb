<script setup lang="ts">
import { onMounted, ref } from 'vue';
import mapboxgl from 'mapbox-gl';
import { useLocalStorage } from '@vueuse/core';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (!mapboxToken) console.warn('[WorldMap] VITE_MAPBOX_TOKEN is not set. Map will not load.');

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
  mapboxgl.accessToken = mapboxToken;

  map.value = new mapboxgl.Map({
    container: 'map-container',
    style: getStyleUrl(savedStyleId.value),
    center: [0, 0],
    zoom: 2,
  });

  map.value.on('style.load', () => {
    emit('style-changed');
  });
});

defineExpose({ map });
</script>

<template>
  <div class="relative w-full h-full">
    <div id="map-container" class="w-full h-full" />

    <div
      class="absolute bottom-6 left-3 z-10 flex gap-0.5 rounded-full border border-border bg-background/90 p-1 shadow-lg backdrop-blur-sm"
    >
      <button
        v-for="style in MAP_STYLES"
        :key="style.id"
        :title="style.label"
        class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
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
