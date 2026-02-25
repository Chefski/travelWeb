<script setup lang="ts">
import { onMounted, ref } from 'vue';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
if (!mapboxToken) console.warn('[WorldMap] VITE_MAPBOX_TOKEN is not set. Map will not load.');

const map = ref<mapboxgl.Map | null>(null);
onMounted(() => {
  mapboxgl.accessToken = mapboxToken;
  
  map.value = new mapboxgl.Map({
    container: 'map-container',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [0, 0],
    zoom: 2
  });
});

defineExpose({ map });
</script>

<template>
  <div class="h-full">
    <div 
      id="map-container" 
      class="w-full h-full"
    ></div>
  </div>
</template>
