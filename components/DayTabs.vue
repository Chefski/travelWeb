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
</script>

<template>
  <div v-if="store.trip" class="flex gap-2 overflow-x-auto py-2 scrollbar-hide" role="tablist" aria-label="Trip days">
    <button
      v-for="(day, index) in store.trip.days"
      :key="day.date"
      role="tab"
      :aria-selected="index === store.selectedDayIndex"
      class="flex flex-col items-center px-3 py-2 rounded-lg min-w-[80px] transition-all text-sm shrink-0"
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
    </button>
  </div>
</template>
