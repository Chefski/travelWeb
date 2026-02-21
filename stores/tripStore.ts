import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import type { Trip, TripDay, Place } from '~/types/trip'

export const useTripStore = defineStore('trip', () => {
  const trip = useLocalStorage<Trip | null>('itinerary-trip', null, {
    serializer: { read: (v: string) => JSON.parse(v), write: (v: Trip | null) => JSON.stringify(v) },
  })

  const selectedDayIndex = ref(0)

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
    trip.value = {
      id: crypto.randomUUID(),
      name,
      coverImage: coverImage || '',
      startDate,
      endDate,
      days,
    }
    selectedDayIndex.value = 0
  }

  function selectDay(index: number) {
    selectedDayIndex.value = index
  }

  function addPlace(place: Omit<Place, 'id' | 'order'>) {
    if (!trip.value || !currentDay.value) return
    const newPlace: Place = {
      ...place,
      id: crypto.randomUUID(),
      order: currentDay.value.places.length,
    }
    currentDay.value.places.push(newPlace)
    trip.value = { ...trip.value }
  }

  function removePlace(dayIndex: number, placeId: string) {
    if (!trip.value) return
    const day = trip.value.days[dayIndex]
    day.places = day.places.filter(p => p.id !== placeId)
    day.places.forEach((p, i) => (p.order = i))
    trip.value = { ...trip.value }
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

  function clearTrip() {
    trip.value = null
    selectedDayIndex.value = 0
  }

  return {
    trip,
    selectedDayIndex,
    currentDay,
    allPlaces,
    createTrip,
    updateTrip,
    selectDay,
    addPlace,
    removePlace,
    reorderPlaces,
    clearTrip,
  }
})
