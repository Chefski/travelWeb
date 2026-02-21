export interface Trip {
  id: string
  name: string
  coverImage: string
  startDate: string
  endDate: string
  days: TripDay[]
}

export interface TripDay {
  date: string
  dayNumber: number
  places: Place[]
}

export interface Place {
  id: string
  mapboxId: string
  name: string
  address: string
  category: string
  coordinates: [number, number]
  order: number
  notes: string
  estimatedTime: string
  cost: number
  rating: number
}

export interface MapboxSuggestion {
  name: string
  mapbox_id: string
  place_formatted: string
  feature_type: string
  full_address?: string
}

export interface MapboxRetrieveResult {
  type: string
  features: Array<{
    type: string
    geometry: {
      type: string
      coordinates: [number, number]
    }
    properties: {
      name: string
      mapbox_id: string
      place_formatted: string
      feature_type: string
      full_address?: string
    }
  }>
}

export const DAY_COLORS: string[] = [
  '#EF4444',
  '#F97316',
  '#FBBF24',
  '#84CC16',
  '#22C55E',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
]
