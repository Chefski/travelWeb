import { vi } from 'vitest'

const MockMarker = vi.fn().mockImplementation(function (this: any, opts?: { element?: HTMLElement }) {
  const customEl = opts?.element
  const fallbackEl = (() => {
    const el = document.createElement('div')
    el.appendChild(document.createElement('div'))
    return el
  })()
  let _lngLat = { lng: 0, lat: 0 }

  this.setLngLat = vi.fn((ll: any) => {
    if (Array.isArray(ll)) _lngLat = { lng: ll[0], lat: ll[1] }
    else _lngLat = ll
    return this
  })
  this.setPopup = vi.fn().mockReturnValue(this)
  this.addTo = vi.fn().mockReturnValue(this)
  this.remove = vi.fn().mockReturnValue(this)
  this.getElement = vi.fn(() => customEl || fallbackEl)
  this.getLngLat = vi.fn(() => _lngLat)
})

const MockPopup = vi.fn().mockImplementation(function (this: any) {
  this.setHTML = vi.fn().mockReturnValue(this)
  this.setLngLat = vi.fn().mockReturnValue(this)
  this.addTo = vi.fn().mockReturnValue(this)
  this.remove = vi.fn().mockReturnValue(this)
})

const MockLngLatBounds = vi.fn().mockImplementation(function (this: any) {
  this.extend = vi.fn().mockReturnValue(this)
  this.getWest = vi.fn(() => -180)
  this.getSouth = vi.fn(() => -90)
  this.getEast = vi.fn(() => 180)
  this.getNorth = vi.fn(() => 90)
})

const MockMap = vi.fn().mockImplementation(function (this: any) {
  this.on = vi.fn()
  this.off = vi.fn()
  this.once = vi.fn()
  this.remove = vi.fn()
  this.flyTo = vi.fn()
  this.fitBounds = vi.fn()
  this.getBounds = vi.fn(() => new MockLngLatBounds())
  this.getZoom = vi.fn(() => 10)
  this.project = vi.fn((lngLat: [number, number]) => ({ x: lngLat[0], y: lngLat[1] }))
  this.loaded = vi.fn(() => true)
  this.addSource = vi.fn()
  this.addLayer = vi.fn()
  this.getLayer = vi.fn(() => undefined)
  this.getSource = vi.fn(() => undefined)
  this.removeLayer = vi.fn()
  this.removeSource = vi.fn()
})

vi.mock('mapbox-gl', () => ({
  default: {
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    LngLatBounds: MockLngLatBounds,
    accessToken: '',
  },
  Map: MockMap,
  Marker: MockMarker,
  Popup: MockPopup,
  LngLatBounds: MockLngLatBounds,
}))

export { MockMap, MockMarker, MockPopup, MockLngLatBounds }
