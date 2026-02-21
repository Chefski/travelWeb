<script setup lang="ts">
import { useTripStore } from '~/stores/tripStore'
import { DAY_COLORS } from '~/types/trip'

const store = useTripStore()

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getColor(index: number): string {
  return DAY_COLORS[index % DAY_COLORS.length]
}

function parseTime(timeStr: string): number {
  if (!timeStr) return 0
  let minutes = 0
  const hourMatch = timeStr.match(/(\d+)\s*h/i)
  const minMatch = timeStr.match(/(\d+)\s*m/i)
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60
  if (minMatch) minutes += parseInt(minMatch[1])
  return minutes
}

function formatTotalTime(minutes: number): string {
  if (minutes === 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}

function dayTotalTime(index: number): string {
  if (!store.trip) return ''
  const places = store.trip.days[index]?.places ?? []
  const total = places.reduce((sum, p) => sum + parseTime(p.estimatedTime), 0)
  return formatTotalTime(total)
}
</script>

<template>
  <div v-if="store.trip" class="flex gap-2 overflow-x-auto py-2 scrollbar-hide snap-x snap-mandatory" style="-webkit-overflow-scrolling: touch" role="tablist" aria-label="Trip days">
    <button
      v-for="(day, index) in store.trip.days"
      :key="day.date"
      role="tab"
      :aria-selected="index === store.selectedDayIndex"
      class="flex flex-col items-center px-3 py-2 rounded-lg min-w-[80px] transition-all text-sm shrink-0 snap-center relative"
      :class="index === store.selectedDayIndex
        ? 'text-white shadow-md scale-105'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'"
      :style="index === store.selectedDayIndex ? { backgroundColor: getColor(index) } : {}"
      @click="store.selectDay(index)"
    >
      <span class="font-semibold">Day {{ day.dayNumber }}</span>
      <span class="text-xs" :class="index === store.selectedDayIndex ? 'text-white/80' : ''">
        {{ formatShortDate(day.date) }}
      </span>
      <span
        v-if="dayTotalTime(index)"
        class="text-[9px] mt-0.5"
        :class="index === store.selectedDayIndex ? 'text-white/70' : 'text-muted-foreground/70'"
      >
        {{ dayTotalTime(index) }}
      </span>
      <!-- Place count badge -->
      <span
        v-if="day.places.length > 0"
        class="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full text-[10px] font-bold flex items-center justify-center px-1"
        :class="index === store.selectedDayIndex ? 'bg-white text-gray-800' : 'bg-primary text-primary-foreground'"
      >
        {{ day.places.length }}
      </span>
      <span
        v-else
        class="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2"
        :class="index === store.selectedDayIndex ? 'border-white/60' : 'border-muted-foreground/30'"
      />
    </button>
  </div>
</template>
