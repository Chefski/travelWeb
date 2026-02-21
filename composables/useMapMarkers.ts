import { type Ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import type { Place } from '~/types/trip'
import { DAY_COLORS } from '~/types/trip'

interface MarkerEntry {
  placeId: string
  marker: mapboxgl.Marker
}

export function useMapMarkers(mapRef: Ref<mapboxgl.Map | null>) {
  const entries: MarkerEntry[] = []

  function createMarkerElement(dayIndex: number, orderInDay: number): HTMLElement {
    const el = document.createElement('div')
    const color = DAY_COLORS[dayIndex % DAY_COLORS.length]
    Object.assign(el.style, {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: color,
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '600',
      fontFamily: "'Outfit', sans-serif",
      border: '2px solid white',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      cursor: 'pointer',
    })
    el.textContent = String(orderInDay + 1)
    return el
  }

  function addMarker(place: Place, dayIndex: number) {
    if (!mapRef.value) return
    const el = createMarkerElement(dayIndex, place.order)
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
      .setHTML(`
        <div style="font-family: 'Outfit', sans-serif; padding: 4px;">
          <strong>${place.name}</strong>
          <p style="margin: 2px 0 0; font-size: 12px; color: #666;">${place.address}</p>
        </div>
      `)
    const marker = new mapboxgl.Marker({ element: el })
      .setLngLat(place.coordinates)
      .setPopup(popup)
      .addTo(mapRef.value)
    entries.push({ placeId: place.id, marker })
  }

  function clearAllMarkers() {
    entries.forEach(e => e.marker.remove())
    entries.length = 0
  }

  function syncMarkers(days: Array<{ dayIndex: number; places: Place[] }>) {
    clearAllMarkers()
    days.forEach(({ dayIndex, places }) => {
      places.forEach(place => addMarker(place, dayIndex))
    })
  }

  function flyToPlace(coordinates: [number, number]) {
    if (!mapRef.value) return
    mapRef.value.flyTo({ center: coordinates, zoom: 14, duration: 1500 })
  }

  function fitAllPlaces(places: Place[]) {
    if (!mapRef.value || places.length === 0) return
    if (places.length === 1) {
      flyToPlace(places[0].coordinates)
      return
    }
    const bounds = new mapboxgl.LngLatBounds()
    places.forEach(p => bounds.extend(p.coordinates))
    mapRef.value.fitBounds(bounds, { padding: 60, duration: 1500 })
  }

  return {
    addMarker,
    clearAllMarkers,
    syncMarkers,
    flyToPlace,
    fitAllPlaces,
  }
}
