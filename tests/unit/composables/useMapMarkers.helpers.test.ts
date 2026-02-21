import { describe, it, expect } from 'vitest'
import { isCluster, escapeHtml, conicGradient, nearest } from '~/composables/useMapMarkers'
import { DAY_COLORS } from '~/types/trip'

// ---- isCluster ----

describe('isCluster', () => {
  it('returns true for a cluster feature', () => {
    const cluster = {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [0, 0] },
      properties: { cluster: true, cluster_id: 1, point_count: 5, dayColorCounts: { 0: 3, 1: 2 } },
    }
    expect(isCluster(cluster as any)).toBe(true)
  })

  it('returns false for a point feature', () => {
    const point = {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [0, 0] },
      properties: { placeId: 'x', dayIndex: 0, order: 0, name: 'Test', address: 'Addr' },
    }
    expect(isCluster(point as any)).toBe(false)
  })
})

// ---- escapeHtml ----

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B')
  })

  it('escapes angle brackets and double quotes', () => {
    expect(escapeHtml('<div class="x">')).toBe('&lt;div class=&quot;x&quot;&gt;')
  })

  it('returns plain string unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

// ---- conicGradient ----

describe('conicGradient', () => {
  it('returns solid color for a single day entry', () => {
    const result = conicGradient({ 0: 5 })
    // Day 0 maps to DAY_COLORS[0] = '#EF4444'
    expect(result).toBe(DAY_COLORS[0])
  })

  it('returns conic-gradient string for multiple day entries', () => {
    const result = conicGradient({ 0: 1, 1: 1 })
    expect(result).toMatch(/^conic-gradient\(/)
    // Two equal counts: first color 0-180deg, second color 180-360deg
    expect(result).toContain(DAY_COLORS[0])
    expect(result).toContain(DAY_COLORS[1])
    expect(result).toContain('180deg')
    expect(result).toContain('360deg')
  })

  it('wraps day index using modulo when index >= DAY_COLORS length', () => {
    // Day 10 should wrap to DAY_COLORS[0]
    const result = conicGradient({ 10: 3 })
    expect(result).toBe(DAY_COLORS[0])
  })
})

// ---- nearest ----

describe('nearest', () => {
  it('returns null for an empty candidates array', () => {
    expect(nearest([0, 0], [])).toBeNull()
  })

  it('returns the only candidate when there is one', () => {
    const candidates = [{ lngLat: [10, 20] as [number, number] }]
    expect(nearest([0, 0], candidates)).toEqual([10, 20])
  })

  it('returns the nearest candidate by Euclidean distance', () => {
    const candidates = [
      { lngLat: [100, 100] as [number, number] },
      { lngLat: [1, 1] as [number, number] },
      { lngLat: [50, 50] as [number, number] },
    ]
    expect(nearest([0, 0], candidates)).toEqual([1, 1])
  })
})
