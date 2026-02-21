<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GripVerticalIcon, XIcon } from 'lucide-vue-next'
import type { Place } from '~/types/trip'

defineProps<{
  place: Place
  color: string
}>()

const emit = defineEmits<{
  remove: [placeId: string]
  click: [place: Place]
}>()
</script>

<template>
  <div
    class="flex items-start gap-3 p-3 rounded-lg border bg-white group cursor-pointer transition-colors hover:bg-muted/30"
    :style="{ borderLeftColor: color, borderLeftWidth: '3px' }"
    @click="emit('click', place)"
  >
    <GripVerticalIcon class="h-5 w-5 text-muted-foreground cursor-grab shrink-0 mt-0.5" />
    <div class="flex-1 min-w-0">
      <p class="font-medium text-sm truncate">{{ place.name }}</p>
      <p class="text-xs text-muted-foreground truncate">{{ place.address }}</p>
      <Badge v-if="place.category" variant="secondary" class="mt-1 text-xs">
        {{ place.category }}
      </Badge>
    </div>
    <Button
      variant="ghost"
      size="icon"
      class="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      @click.stop="emit('remove', place.id)"
    >
      <XIcon class="h-4 w-4" />
    </Button>
  </div>
</template>
