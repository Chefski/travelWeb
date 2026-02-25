import { defineStore, acceptHMRUpdate } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { Trip, TripDay, Place } from '~/types/trip'
import { DAY_COLORS } from '~/types/trip'

export const useTripStore = defineStore('trip', () => {
  const trips = useLocalStorage<Trip[]>('itinerary-trips', [], {
    serializer: { read: (v: string) => JSON.parse(v), write: (v: Trip[]) => JSON.stringify(v) },
  })

  const currentTripId = useLocalStorage<string | null>('itinerary-current-trip-id', null, {
    serializer: { read: (v: string) => JSON.parse(v), write: (v: string | null) => JSON.stringify(v) },
  })

  // Migrate old single-trip localStorage format
  if (typeof window !== 'undefined') {
    const oldData = localStorage.getItem('itinerary-trip')
    if (oldData && oldData !== 'null') {
      try {
        const oldTrip = JSON.parse(oldData) as Trip
        if (oldTrip && oldTrip.id) {
          if (!trips.value.find(t => t.id === oldTrip.id)) {
            trips.value = [...trips.value, oldTrip]
          }
          currentTripId.value = oldTrip.id
          localStorage.removeItem('itinerary-trip')
        }
      } catch {
        localStorage.removeItem('itinerary-trip')
      }
    }
  }

  // Ensure currentTripId points to a valid trip
  if (currentTripId.value && !trips.value.find(t => t.id === currentTripId.value)) {
    currentTripId.value = trips.value.length > 0 ? trips.value[0].id : null
  }
  if (!currentTripId.value && trips.value.length > 0) {
    currentTripId.value = trips.value[0].id
  }

  // Writable computed: getter finds current trip, setter replaces it in the array.
  // This preserves ALL existing mutation patterns (trip.value = { ...trip.value }).
  const trip = computed<Trip | null>({
    get: () => {
      if (!currentTripId.value) return null
      return trips.value.find(t => t.id === currentTripId.value) ?? null
    },
    set: (newVal: Trip | null) => {
      if (!newVal || !currentTripId.value) return
      const idx = trips.value.findIndex(t => t.id === currentTripId.value)
      if (idx !== -1) {
        trips.value[idx] = newVal
        trips.value = [...trips.value]
      }
    },
  })

  const selectedDayIndex = ref(0)
  const lastRemoved = ref<{ dayIndex: number; place: Place; position: number } | null>(null)

  const currentDay = computed<TripDay | null>(() => {
    if (!trip.value || !trip.value.days.length) return null
    return trip.value.days[selectedDayIndex.value] ?? null
  })

  const allPlaces = computed<Place[]>(() => {
    if (!trip.value) return []
    return trip.value.days.flatMap(d => d.places)
  })

  function generateDays(startDate: string, endDate: string): TripDay[] {
    const days: TripDay[] = []
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T00:00:00')
    let dayNumber = 1
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push({
        date: d.toISOString().split('T')[0],
        dayNumber,
        places: [],
      })
      dayNumber++
    }
    return days
  }

  function createTrip(name: string, startDate: string, endDate: string, coverImage?: string) {
    const days = generateDays(startDate, endDate)
    const newTrip: Trip = {
      id: crypto.randomUUID(),
      name,
      coverImage: coverImage || '',
      startDate,
      endDate,
      days,
    }
    trips.value = [...trips.value, newTrip]
    currentTripId.value = newTrip.id
    selectedDayIndex.value = 0
  }

  function selectDay(index: number) {
    selectedDayIndex.value = index
  }

  function addPlace(place: Omit<Place, 'id' | 'order' | 'notes' | 'estimatedTime' | 'cost' | 'rating'>) {
    if (!trip.value || !currentDay.value) return
    const newPlace: Place = {
      ...place,
      id: crypto.randomUUID(),
      order: currentDay.value.places.length,
      notes: '',
      estimatedTime: '',
      cost: 0,
      rating: 0,
    }
    currentDay.value.places.push(newPlace)
    trip.value = { ...trip.value }
  }

  function updatePlaceNotes(dayIndex: number, placeId: string, notes: string) {
    if (!trip.value) return
    const day = trip.value.days[dayIndex]
    if (!day) return
    const place = day.places.find(p => p.id === placeId)
    if (place) {
      place.notes = notes
      trip.value = { ...trip.value }
    }
  }

  function updatePlace(dayIndex: number, placeId: string, updates: Partial<Pick<Place, 'notes' | 'estimatedTime' | 'cost' | 'rating'>>) {
    if (!trip.value) return
    const day = trip.value.days[dayIndex]
    if (!day) return
    const place = day.places.find(p => p.id === placeId)
    if (place) {
      Object.assign(place, updates)
      trip.value = { ...trip.value }
    }
  }

  function removePlace(dayIndex: number, placeId: string) {
    if (!trip.value) return
    const day = trip.value.days[dayIndex]
    const placeIndex = day.places.findIndex(p => p.id === placeId)
    if (placeIndex === -1) return
    const removedPlace = { ...day.places[placeIndex] }
    lastRemoved.value = { dayIndex, place: removedPlace, position: placeIndex }
    day.places = day.places.filter(p => p.id !== placeId)
    day.places.forEach((p, i) => (p.order = i))
    trip.value = { ...trip.value }
  }

  function undoRemove() {
    if (!trip.value || !lastRemoved.value) return
    const { dayIndex, place, position } = lastRemoved.value
    const day = trip.value.days[dayIndex]
    if (!day) return
    day.places.splice(position, 0, place)
    day.places.forEach((p, i) => (p.order = i))
    trip.value = { ...trip.value }
    lastRemoved.value = null
  }

  function movePlace(fromDayIndex: number, placeId: string, toDayIndex: number) {
    if (!trip.value) return null
    const fromDay = trip.value.days[fromDayIndex]
    const toDay = trip.value.days[toDayIndex]
    if (!fromDay || !toDay) return null
    const placeIndex = fromDay.places.findIndex(p => p.id === placeId)
    if (placeIndex === -1) return null
    const [place] = fromDay.places.splice(placeIndex, 1)
    place.order = toDay.places.length
    toDay.places.push(place)
    fromDay.places.forEach((p, i) => (p.order = i))
    trip.value = { ...trip.value }
    return place
  }

  function duplicatePlace(fromDayIndex: number, placeId: string, toDayIndex: number) {
    if (!trip.value) return null
    const fromDay = trip.value.days[fromDayIndex]
    const toDay = trip.value.days[toDayIndex]
    if (!fromDay || !toDay) return null
    const place = fromDay.places.find(p => p.id === placeId)
    if (!place) return null
    const newPlace: Place = {
      ...place,
      id: crypto.randomUUID(),
      order: toDay.places.length,
      notes: '',
      estimatedTime: '',
      cost: 0,
      rating: 0,
    }
    toDay.places.push(newPlace)
    trip.value = { ...trip.value }
    return newPlace
  }

  function reorderPlaces(dayIndex: number, newPlaces: Place[]) {
    if (!trip.value) return
    trip.value.days[dayIndex].places = newPlaces.map((p, i) => ({ ...p, order: i }))
    trip.value = { ...trip.value }
  }

  function updateTrip(name: string, startDate: string, endDate: string, coverImage?: string) {
    if (!trip.value) return

    const oldDaysByDate = new Map<string, TripDay>()
    for (const day of trip.value.days) {
      oldDaysByDate.set(day.date, day)
    }

    const newDays = generateDays(startDate, endDate).map((day) => {
      const existing = oldDaysByDate.get(day.date)
      return existing ? { ...day, places: existing.places } : day
    })

    trip.value = {
      ...trip.value,
      name,
      startDate,
      endDate,
      coverImage: coverImage ?? trip.value.coverImage,
      days: newDays,
    }

    if (selectedDayIndex.value >= newDays.length) {
      selectedDayIndex.value = Math.max(0, newDays.length - 1)
    }
  }

  function getDayColor(index: number): string {
    return trip.value?.customColors?.[index] ?? DAY_COLORS[index % DAY_COLORS.length]
  }

  function setDayColor(dayIndex: number, color: string) {
    if (!trip.value) return
    const customColors = { ...trip.value.customColors, [dayIndex]: color }
    trip.value = { ...trip.value, customColors }
  }

  function clearTrip() {
    if (currentTripId.value) {
      trips.value = trips.value.filter(t => t.id !== currentTripId.value)
    }
    currentTripId.value = trips.value.length > 0 ? trips.value[0].id : null
    selectedDayIndex.value = 0
  }

  function switchTrip(tripId: string) {
    if (trips.value.find(t => t.id === tripId)) {
      currentTripId.value = tripId
      selectedDayIndex.value = 0
    }
  }

  function deleteTrip(tripId: string) {
    trips.value = trips.value.filter(t => t.id !== tripId)
    if (currentTripId.value === tripId) {
      currentTripId.value = trips.value.length > 0 ? trips.value[0].id : null
      selectedDayIndex.value = 0
    }
  }

  return {
    trip,
    trips: computed(() => trips.value),
    currentTripId,
    selectedDayIndex,
    currentDay,
    allPlaces,
    createTrip,
    updateTrip,
    selectDay,
    addPlace,
    removePlace,
    movePlace,
    duplicatePlace,
    reorderPlaces,
    updatePlace,
    updatePlaceNotes,
    clearTrip,
    switchTrip,
    deleteTrip,
    undoRemove,
    getDayColor,
    setDayColor,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTripStore, import.meta.hot))
}
