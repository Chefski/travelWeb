<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { RotateCcwIcon, PencilIcon } from 'lucide-vue-next'
import { useTripStore } from '~/stores/tripStore'

const store = useTripStore()
const emit = defineEmits<{ 'new-trip': []; 'edit-trip': [] }>()

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

const fallbackGradient = computed(() => {
  if (!store.trip) return GRADIENTS[0]
  let hash = 0
  for (const ch of store.trip.id) {
    hash = ((hash << 5) - hash) + ch.charCodeAt(0)
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
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
      class="group relative rounded-xl overflow-hidden h-[180px] cursor-pointer"
      @click="emit('edit-trip')"
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
    </div>
    <div class="mt-3">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold">{{ store.trip.name }}</h2>
        <div class="flex items-center gap-2">
          <Badge variant="secondary">{{ store.trip.days.length }} days</Badge>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('edit-trip')" title="Edit trip">
            <PencilIcon class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('new-trip')">
            <RotateCcwIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
      <p class="text-sm text-muted-foreground mt-1">{{ dateDisplay }}</p>
      <Separator class="mt-2" />
    </div>
  </div>
</template>
