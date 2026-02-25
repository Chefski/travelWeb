import { type Ref } from 'vue'
import mapboxgl from 'mapbox-gl'
import Supercluster from 'supercluster'
import type { Place } from '~/types/trip'
import { DAY_COLORS } from '~/types/trip'

interface PointProps {
  placeId: string
  dayIndex: number
  order: number
  name: string
  address: string
  notes: string
  estimatedTime: string
  category: string
}

interface ClusterProps {
  dayColorCounts: Record<number, number>
}

interface RenderedEntry {
  marker: mapboxgl.Marker
  lngLat: [number, number]
}

type CFeature = Supercluster.ClusterFeature<ClusterProps>
type PFeature = Supercluster.PointFeature<PointProps>
type AnyFeature = CFeature | PFeature

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const PULL = 'cubic-bezier(0.36, 0, 0.66, -0.56)'

export function isCluster(f: AnyFeature): f is CFeature {
  return (f.properties as any).cluster === true
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function conicGradient(counts: Record<number, number>, colorFn?: (index: number) => string): string {
  const getColor = colorFn ?? ((i: number) => DAY_COLORS[i % DAY_COLORS.length])
  const entries = Object.entries(counts)
    .map(([d, c]) => ({ day: Number(d), count: c }))
    .sort((a, b) => a.day - b.day)
  const total = entries.reduce((s, e) => s + e.count, 0)
  if (entries.length <= 1) {
    return getColor(entries[0]?.day ?? 0) ?? '#3B82F6'
  }
  let angle = 0
  const stops: string[] = []
  for (const { day, count } of entries) {
    const color = getColor(day)
    const end = angle + (count / total) * 360
    stops.push(`${color} ${angle}deg ${end}deg`)
    angle = end
  }
  return `conic-gradient(${stops.join(', ')})`
}

export function nearest(
  lngLat: [number, number],
  candidates: Array<{ lngLat: [number, number] }>,
): [number, number] | null {
  if (!candidates.length) return null
  let best = candidates[0]!
  let min = Infinity
  for (const c of candidates) {
    const dx = c.lngLat[0] - lngLat[0]
    const dy = c.lngLat[1] - lngLat[1]
    const d = dx * dx + dy * dy
    if (d < min) { min = d; best = c }
  }
  return best.lngLat
}

export function useMapMarkers(mapRef: Ref<mapboxgl.Map | null>, onMarkerClick?: (placeId: string, dayIndex: number) => void, getDayColor?: (index: number) => string) {
  const resolveColor = (dayIndex: number) => getDayColor ? getDayColor(dayIndex) : DAY_COLORS[dayIndex % DAY_COLORS.length]
  let index: Supercluster<PointProps, ClusterProps> | null = null
  const rendered = new Map<string, RenderedEntry>()
  let rafId = 0
  let boundMap: mapboxgl.Map | null = null
  let shouldAnimate = true
  let currentSelectedDay: number | undefined
  let pendingLoad = false
  const activeRouteDays = new Set<number>()

  // --- Supercluster ---

  function ensureIndex() {
    if (index) return
    index = new Supercluster<PointProps, ClusterProps>({
      radius: 60,
      maxZoom: 16,
      minPoints: 2,
      map: (props) => ({ dayColorCounts: { [props.dayIndex]: 1 } }),
      reduce: (acc, props) => {
        for (const key of Object.keys(props.dayColorCounts)) {
          const day = Number(key)
          const inc = props.dayColorCounts[day] ?? 0
          acc.dayColorCounts[day] = (acc.dayColorCounts[day] ?? 0) + inc
        }
      },
    })
  }

  // --- Map Event Binding ---

  function bindEvents(map: mapboxgl.Map) {
    if (boundMap === map) return
    unbindEvents()
    boundMap = map
    map.on('moveend', scheduleUpdate)
    map.on('zoom', scheduleUpdate)
  }

  function unbindEvents() {
    if (!boundMap) return
    boundMap.off('moveend', scheduleUpdate)
    boundMap.off('zoom', scheduleUpdate)
    boundMap = null
  }

  function scheduleUpdate() {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      render()
    })
  }

  // --- DOM Element Builders ---

  function createPointEl(dayIndex: number, order: number, isSelected: boolean): HTMLElement {
    // IMPORTANT: Do not set/animate `transform` on the root marker element.
    // Mapbox GL uses `transform` on the marker root to position it; overwriting it
    // can snap markers to the map container's top-left.
    const root = document.createElement('div')
    const anim = document.createElement('div')
    const ui = document.createElement('div')
    const color = resolveColor(dayIndex)
    Object.assign(anim.style, {
      willChange: 'transform, opacity',
      opacity: isSelected ? '1' : '0.35',
      transform: isSelected ? 'scale(1)' : 'scale(0.8)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    })
    Object.assign(ui.style, {
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
    ui.textContent = String(order + 1)

    anim.appendChild(ui)
    root.appendChild(anim)
    return root
  }

  function createClusterEl(count: number, dayColorCounts: Record<number, number>): HTMLElement {
    // Root is controlled by Mapbox's positioning transform.
    const root = document.createElement('div')
    const anim = document.createElement('div')
    const el = document.createElement('div')
    Object.assign(anim.style, {
      willChange: 'transform, opacity',
    })
    Object.assign(el.style, {
      width: '44px',
      height: '44px',
      borderRadius: '50%',
      background: conicGradient(dayColorCounts, resolveColor),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    })
    const inner = document.createElement('div')
    Object.assign(inner.style, {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '14px',
      fontFamily: "'Outfit', sans-serif",
    })
    inner.textContent = String(count)
    el.appendChild(inner)
    anim.appendChild(el)
    root.appendChild(anim)

    // Idle pulse
    el.animate(
      [
        { boxShadow: '0 0 0 0 rgba(99, 102, 241, 0.4)' },
        { boxShadow: '0 0 0 8px rgba(99, 102, 241, 0)' },
      ],
      { duration: 2000, iterations: Infinity },
    )

    // Hover scale
    // Hover scale on the UI element only (not the root marker element).
    el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.15)' })
    el.addEventListener('mouseleave', () => { el.style.transform = '' })

    return root
  }

  // --- Marker Factory ---

  function makeMarker(feature: AnyFeature): mapboxgl.Marker {
    const coords = feature.geometry.coordinates as [number, number]

    if (isCluster(feature)) {
      const { point_count, dayColorCounts, cluster_id } = feature.properties
      const el = createClusterEl(point_count, dayColorCounts)

      el.addEventListener('click', () => {
        if (!mapRef.value || !index) return
        const zoom = index.getClusterExpansionZoom(cluster_id)
        mapRef.value.flyTo({ center: coords, zoom, duration: 500 })
      })

      return new mapboxgl.Marker({ element: el }).setLngLat(coords)
    }

    const props = feature.properties
    const isSelected = currentSelectedDay === undefined || props.dayIndex === currentSelectedDay
    const el = createPointEl(props.dayIndex, props.order, isSelected)

    el.addEventListener('click', () => {
      onMarkerClick?.(props.placeId, props.dayIndex)
    })

    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth: '250px' }).setHTML(
      `<div style="font-family:'Outfit',sans-serif;padding:6px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <span style="background:${resolveColor(props.dayIndex)};color:white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0">${props.order + 1}</span>
          <strong style="font-size:13px">${escapeHtml(props.name)}</strong>
        </div>
        <p style="margin:0;font-size:11px;color:#666">${escapeHtml(props.address)}</p>
        ${props.category ? `<span style="display:inline-block;margin-top:4px;padding:1px 6px;border-radius:8px;background:#f1f5f9;font-size:10px;color:#475569">${escapeHtml(props.category)}</span>` : ''}
        ${props.estimatedTime ? `<p style="margin:4px 0 0;font-size:11px;color:#666">⏱ ${escapeHtml(props.estimatedTime)}</p>` : ''}
        ${props.notes ? `<p style="margin:4px 0 0;font-size:11px;color:#888;font-style:italic">${escapeHtml(props.notes)}</p>` : ''}
      </div>`,
    )
    return new mapboxgl.Marker({ element: el }).setLngLat(coords).setPopup(popup)
  }

  function fid(f: AnyFeature): string {
    if (isCluster(f)) return `c-${f.properties.cluster_id}`
    return f.properties.placeId
  }

  // --- Animations ---

  function animTarget(marker: mapboxgl.Marker): HTMLElement {
    // Our marker element is: root -> anim -> ui
    // Animate the `anim` wrapper so Mapbox's root transform stays intact.
    const root = marker.getElement()
    const t = root.firstElementChild
    return (t as HTMLElement) || root
  }

  function pixelOffset(map: mapboxgl.Map, from: [number, number], to: [number, number]) {
    const a = map.project(from)
    const b = map.project(to)
    return { x: a.x - b.x, y: a.y - b.y }
  }

  function animSplit(marker: mapboxgl.Marker, origin: [number, number], map: mapboxgl.Map) {
    if (!shouldAnimate) return
    const ll = marker.getLngLat()
    const { x, y } = pixelOffset(map, origin, [ll.lng, ll.lat])
    animTarget(marker).animate(
      [
        { transform: `translate(${x}px,${y}px) scale(0)`, opacity: '0' },
        { transform: 'translate(0,0) scale(1)', opacity: '1' },
      ],
      { duration: 350, easing: SPRING, fill: 'backwards' },
    )
  }

  function animMerge(marker: mapboxgl.Marker, target: [number, number], map: mapboxgl.Map) {
    if (!shouldAnimate) { marker.remove(); return }
    const ll = marker.getLngLat()
    const { x, y } = pixelOffset(map, target, [ll.lng, ll.lat])
    const a = animTarget(marker).animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: '1' },
        { transform: `translate(${x}px,${y}px) scale(0)`, opacity: '0' },
      ],
      { duration: 300, easing: PULL, fill: 'forwards' },
    )
    a.onfinish = () => marker.remove()
  }

  function animIn(marker: mapboxgl.Marker) {
    if (!shouldAnimate) return
    animTarget(marker).animate(
      [
        { transform: 'scale(0)', opacity: '0' },
        { transform: 'scale(1)', opacity: '1' },
      ],
      { duration: 350, easing: SPRING, fill: 'backwards' },
    )
  }

  function animOut(marker: mapboxgl.Marker) {
    if (!shouldAnimate) { marker.remove(); return }
    const a = animTarget(marker).animate(
      [
        { transform: 'scale(1)', opacity: '1' },
        { transform: 'scale(0)', opacity: '0' },
      ],
      { duration: 300, easing: 'ease-in', fill: 'forwards' },
    )
    a.onfinish = () => marker.remove()
  }

  // --- Core Render (diff-based) ---

  function render() {
    const map = mapRef.value
    if (!map || !index) return

    const b = map.getBounds()
    if (!b) return
    const bbox: [number, number, number, number] = [
      b.getWest(), b.getSouth(), b.getEast(), b.getNorth(),
    ]
    const zoom = Math.floor(map.getZoom())
    const features = index.getClusters(bbox, zoom)

    // Build next state
    const next = new Map<string, { feature: AnyFeature; lngLat: [number, number] }>()
    for (const f of features) {
      next.set(fid(f), { feature: f, lngLat: f.geometry.coordinates as [number, number] })
    }

    // Diff against rendered
    const toRemove: string[] = []
    const toAdd: string[] = []
    for (const key of rendered.keys()) if (!next.has(key)) toRemove.push(key)
    for (const key of next.keys()) if (!rendered.has(key)) toAdd.push(key)

    // Collect cluster positions for animation origins/targets
    const removedClusters: Array<{ lngLat: [number, number] }> = []
    const addedClusters: Array<{ lngLat: [number, number] }> = []
    for (const k of toRemove) {
      if (k.startsWith('c-')) removedClusters.push({ lngLat: rendered.get(k)!.lngLat })
    }
    for (const k of toAdd) {
      if (k.startsWith('c-')) addedClusters.push({ lngLat: next.get(k)!.lngLat })
    }

    // Animate out departing markers
    for (const key of toRemove) {
      const entry = rendered.get(key)!
      rendered.delete(key)
      if (!key.startsWith('c-') && addedClusters.length) {
        const t = nearest(entry.lngLat, addedClusters)
        t ? animMerge(entry.marker, t, map) : animOut(entry.marker)
      } else {
        animOut(entry.marker)
      }
    }

    // Animate in arriving markers
    for (const key of toAdd) {
      const { feature, lngLat } = next.get(key)!
      const marker = makeMarker(feature)
      marker.addTo(map)
      if (!key.startsWith('c-') && removedClusters.length) {
        const o = nearest(lngLat, removedClusters)
        o ? animSplit(marker, o, map) : animIn(marker)
      } else {
        animIn(marker)
      }
      rendered.set(key, { marker, lngLat })
    }
  }

  // --- Route Lines ---

  function clearRouteLines(map: mapboxgl.Map) {
    for (const dayIndex of activeRouteDays) {
      const layerId = `route-layer-${dayIndex}`
      const sourceId = `route-day-${dayIndex}`
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
    activeRouteDays.clear()
  }

  function syncRouteLines(map: mapboxgl.Map, days: Array<{ dayIndex: number; places: Place[] }>, selectedDayIndex?: number) {
    clearRouteLines(map)

    for (const { dayIndex, places } of days) {
      if (places.length < 2) continue

      const coordinates = places
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(p => p.coordinates)

      const sourceId = `route-day-${dayIndex}`
      const layerId = `route-layer-${dayIndex}`

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates },
        },
      })

      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': resolveColor(dayIndex),
          'line-width': selectedDayIndex !== undefined && dayIndex === selectedDayIndex ? 4 : 2,
          'line-dasharray': selectedDayIndex !== undefined && dayIndex === selectedDayIndex ? [1, 0] : [2, 2],
          'line-opacity': selectedDayIndex !== undefined ? (dayIndex === selectedDayIndex ? 0.9 : 0.25) : 0.7,
        },
      })

      activeRouteDays.add(dayIndex)
    }
  }

  // --- Public API ---

  function syncMarkers(days: Array<{ dayIndex: number; places: Place[] }>, selectedDayIndex?: number) {
    ensureIndex()
    const map = mapRef.value

    // Build GeoJSON features from trip data
    const features: GeoJSON.Feature<GeoJSON.Point, PointProps>[] = []
    for (const { dayIndex, places } of days) {
      for (const place of places) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: place.coordinates },
          properties: {
            placeId: place.id,
            dayIndex,
            order: place.order,
            name: place.name,
            address: place.address,
            notes: place.notes || '',
            estimatedTime: place.estimatedTime || '',
            category: place.category || '',
          },
        })
      }
    }
    index!.load(features)
    currentSelectedDay = selectedDayIndex

    if (!map) return
    bindEvents(map)

    // Clear rendered state for a fresh render on data changes
    for (const { marker } of rendered.values()) marker.remove()
    rendered.clear()

    // Render without animation for data-driven updates
    if (map.loaded()) {
      syncRouteLines(map, days, selectedDayIndex)
      shouldAnimate = false
      render()
      shouldAnimate = true
    } else if (!pendingLoad) {
      pendingLoad = true
      map.once('load', () => {
        pendingLoad = false
        syncRouteLines(map!, days, selectedDayIndex)
        render()
      })
    }
  }

  function flyToPlace(coordinates: [number, number]) {
    mapRef.value?.flyTo({ center: coordinates, zoom: 14, duration: 1500 })
  }

  function fitAllPlaces(places: Place[]) {
    if (!mapRef.value || !places.length) return
    if (places.length === 1) {
      flyToPlace(places[0]!.coordinates)
      return
    }
    const bounds = new mapboxgl.LngLatBounds()
    places.forEach(p => bounds.extend(p.coordinates))
    mapRef.value.fitBounds(bounds, { padding: 60, duration: 1500 })
  }

  return { syncMarkers, flyToPlace, fitAllPlaces }
}
