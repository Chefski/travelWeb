<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { RotateCcwIcon } from 'lucide-vue-next'
import { useTripStore } from '~/stores/tripStore'

const store = useTripStore()
const emit = defineEmits<{ 'new-trip': [] }>()

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/14621/Warsaw-at-night-free-license-CC0.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'

const coverSrc = computed(() => store.trip?.coverImage || FALLBACK_IMAGE)

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
    <div class="rounded-xl overflow-hidden">
      <img :src="coverSrc" alt="Trip cover" class="w-full h-[180px] object-cover" />
    </div>
    <div class="mt-3">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold">{{ store.trip.name }}</h2>
        <div class="flex items-center gap-2">
          <Badge variant="secondary">{{ store.trip.days.length }} days</Badge>
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
