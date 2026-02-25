<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { FolderOpenIcon, PencilIcon, ShareIcon, ShuffleIcon } from 'lucide-vue-next'
import { useLocalStorage } from '@vueuse/core'
import { useTripStore } from '~/stores/tripStore'
import { useCountryFlag } from '~/composables/useCountryFlag'

const store = useTripStore()
const { flag } = useCountryFlag()
const emit = defineEmits<{ 'new-trip': []; 'edit-trip': []; 'export-trip': [] }>()

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
]

const hasImage = computed(() => {
  const img = store.trip?.coverImage
  return img && img.trim().length > 0
})

const gradientOverrides = useLocalStorage<Record<string, number>>('trip-gradient-overrides', {})

const fallbackGradient = computed(() => {
  if (!store.trip) return GRADIENTS[0]
  const override = gradientOverrides.value[store.trip.id]
  if (override !== undefined) return GRADIENTS[override % GRADIENTS.length]
  let hash = 0
  for (const ch of store.trip.id) {
    hash = ((hash << 5) - hash) + ch.charCodeAt(0)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
})

function cycleGradient(e: Event) {
  e.stopPropagation()
  if (!store.trip) return
  const currentIdx = GRADIENTS.indexOf(fallbackGradient.value)
  const nextIdx = (currentIdx + 1) % GRADIENTS.length
  gradientOverrides.value = { ...gradientOverrides.value, [store.trip.id]: nextIdx }
}

const progressPercent = computed(() => {
  if (!store.trip) return 0
  const total = store.trip.days.length
  if (total === 0) return 0
  const planned = store.trip.days.filter(d => d.places.length > 0).length
  return Math.round((planned / total) * 100)
})

const dateDisplay = computed(() => {
  if (!store.trip) return ''
  const fmt = (d: string) => {
    const date = new Date(d + 'T00:00:00')
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return `${fmt(store.trip.startDate)} - ${fmt(store.trip.endDate)}`
})
</script>

<template>
  <div v-if="store.trip">
    <div
      class="group relative rounded-xl overflow-hidden h-[120px] md:h-[180px] cursor-pointer"
      role="button"
      tabindex="0"
      aria-label="Edit trip cover image"
      @click="emit('edit-trip')"
      @keydown.enter="emit('edit-trip')"
      @keydown.space.prevent="emit('edit-trip')"
    >
      <img
        v-if="hasImage"
        :src="store.trip!.coverImage"
        alt="Trip cover"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div
        v-else
        class="w-full h-full"
        :style="{ background: fallbackGradient }"
      />
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-lg">
          <PencilIcon class="h-4 w-4 text-gray-800" />
        </div>
      </div>
      <button
        v-if="!hasImage"
        class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white"
        aria-label="Shuffle gradient"
        @click="cycleGradient"
      >
        <ShuffleIcon class="h-3.5 w-3.5 text-gray-800" />
      </button>
    </div>
    <div class="mt-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xl md:text-2xl font-semibold">{{ flag }} {{ store.trip.name }}</h2>
        <div class="flex items-center gap-2">
          <Badge variant="secondary">{{ store.trip.days.length - 1 }}N {{ store.trip.days.length }}D</Badge>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('export-trip')" aria-label="Export trip">
            <ShareIcon class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('edit-trip')" aria-label="Edit trip">
            <PencilIcon class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('new-trip')" aria-label="My trips">
            <FolderOpenIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p class="text-sm text-muted-foreground mt-1">{{ dateDisplay }}</p>
      <div class="w-full bg-muted rounded-full h-1 mt-2 overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          :style="{ width: progressPercent + '%', background: 'linear-gradient(90deg, hsl(var(--primary)), #22c55e)' }"
        />
      </div>
      <Separator class="mt-2" />
    </div>
  </div>
</template>
