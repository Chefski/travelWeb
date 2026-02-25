<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  GripVerticalIcon, XIcon, PencilIcon, ArrowRightLeftIcon, ClockIcon, CopyIcon,
  UtensilsIcon, BedDoubleIcon, LandmarkIcon, ShoppingBagIcon, TreesIcon,
  BuildingIcon, MapPinIcon, NavigationIcon, DollarSignIcon, ExternalLinkIcon, StarIcon,
} from 'lucide-vue-next'
import { useTripStore } from '~/stores/tripStore'
import { DAY_COLORS } from '~/types/trip'
import type { Place } from '~/types/trip'
import { toast } from 'vue-sonner'

const CATEGORY_ICONS: Record<string, any> = {
  restaurant: UtensilsIcon,
  food: UtensilsIcon,
  cafe: UtensilsIcon,
  bar: UtensilsIcon,
  hotel: BedDoubleIcon,
  lodging: BedDoubleIcon,
  landmark: LandmarkIcon,
  monument: LandmarkIcon,
  museum: LandmarkIcon,
  attraction: LandmarkIcon,
  shopping: ShoppingBagIcon,
  store: ShoppingBagIcon,
  park: TreesIcon,
  garden: TreesIcon,
  poi: BuildingIcon,
  address: BuildingIcon,
}

function getCategoryIcon(category: string) {
  const lower = category.toLowerCase()
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return MapPinIcon
}

const props = defineProps<{
  place: Place
  color: string
  dayIndex: number
  totalDays: number
}>()

const emit = defineEmits<{
  remove: [placeId: string]
  click: [place: Place]
}>()

const store = useTripStore()

const isExpanded = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

const moveOpen = ref(false)

function moveToDay(targetDayIndex: number) {
  const moved = store.movePlace(props.dayIndex, props.place.id, targetDayIndex)
  if (moved) {
    toast(`Moved "${moved.name}" to Day ${targetDayIndex + 1}`)
  }
  moveOpen.value = false
}

function copyToDay(targetDayIndex: number) {
  const copied = store.duplicatePlace(props.dayIndex, props.place.id, targetDayIndex)
  if (copied) {
    toast(`Copied "${copied.name}" to Day ${targetDayIndex + 1}`)
  }
  moveOpen.value = false
}

const isEditingNotes = ref(false)
const notesText = ref(props.place.notes ?? '')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function startEditing() {
  notesText.value = props.place.notes ?? ''
  isEditingNotes.value = true
  nextTick(() => textareaRef.value?.focus())
}

function saveNotes() {
  isEditingNotes.value = false
  const trimmed = notesText.value.trim()
  if (trimmed !== (props.place.notes ?? '')) {
    store.updatePlaceNotes(props.dayIndex, props.place.id, trimmed)
  }
}

const isEditingTime = ref(false)
const timeText = ref(props.place.estimatedTime ?? '')
const timeInputRef = ref<HTMLInputElement | null>(null)

function startEditingTime() {
  timeText.value = props.place.estimatedTime ?? ''
  isEditingTime.value = true
  nextTick(() => timeInputRef.value?.focus())
}

function saveTime() {
  isEditingTime.value = false
  const trimmed = timeText.value.trim()
  if (trimmed !== (props.place.estimatedTime ?? '')) {
    store.updatePlace(props.dayIndex, props.place.id, { estimatedTime: trimmed })
  }
}

const isEditingCost = ref(false)
const costText = ref(String(props.place.cost || ''))
const costInputRef = ref<HTMLInputElement | null>(null)

function startEditingCost() {
  costText.value = props.place.cost ? String(props.place.cost) : ''
  isEditingCost.value = true
  nextTick(() => costInputRef.value?.focus())
}

function saveCost() {
  isEditingCost.value = false
  const val = parseFloat(costText.value) || 0
  if (val !== (props.place.cost || 0)) {
    store.updatePlace(props.dayIndex, props.place.id, { cost: val })
  }
}

function setRating(value: number) {
  const newRating = value === (props.place.rating || 0) ? 0 : value
  store.updatePlace(props.dayIndex, props.place.id, { rating: newRating })
}
</script>

<template>
  <div
    class="flex items-start gap-3 p-3 rounded-lg border bg-card group cursor-pointer transition-colors hover:bg-muted/30"
    :class="isExpanded ? 'bg-muted/40 shadow-sm' : ''"
    :style="{ borderLeftColor: color, borderLeftWidth: '3px' }"
    role="button"
    tabindex="0"
    :aria-label="`${place.name}, ${place.address}`"
    @click="toggleExpand()"
    @keydown.enter="toggleExpand()"
    @keydown.space.prevent="toggleExpand()"
  >
    <div class="flex flex-col items-center gap-1 shrink-0">
      <div
        class="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
        :style="{ backgroundColor: color }"
      >
        {{ place.order + 1 }}
      </div>
      <GripVerticalIcon class="h-4 w-4 text-muted-foreground cursor-grab" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-medium text-sm truncate">{{ place.name }}</p>
      <p class="text-xs text-muted-foreground truncate">{{ place.address }}</p>
      <div class="flex items-center gap-1.5 mt-1 flex-wrap">
        <Badge v-if="place.category" variant="secondary" class="text-xs inline-flex items-center gap-1">
          <component :is="getCategoryIcon(place.category)" class="h-3 w-3" />
          {{ place.category }}
        </Badge>
        <!-- Time estimate -->
        <button
          v-if="!isEditingTime && !place.estimatedTime"
          class="text-xs text-muted-foreground/60 hover:text-muted-foreground inline-flex items-center gap-0.5 transition-colors"
          @click.stop="startEditingTime"
        >
          <ClockIcon class="h-3 w-3" />
          Add time
        </button>
        <button
          v-if="!isEditingTime && place.estimatedTime"
          class="text-xs text-muted-foreground inline-flex items-center gap-0.5 hover:text-foreground transition-colors"
          @click.stop="startEditingTime"
        >
          <ClockIcon class="h-3 w-3" />
          {{ place.estimatedTime }}
        </button>
        <input
          v-if="isEditingTime"
          ref="timeInputRef"
          v-model="timeText"
          class="text-xs border rounded px-1.5 py-0.5 w-16 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="1h 30m"
          @click.stop
          @blur="saveTime"
          @keydown.enter.prevent="saveTime"
          @keydown.escape="isEditingTime = false"
        />
        <!-- Cost -->
        <button
          v-if="!isEditingCost && !place.cost"
          class="text-xs text-muted-foreground/60 hover:text-muted-foreground inline-flex items-center gap-0.5 transition-colors"
          @click.stop="startEditingCost"
        >
          <DollarSignIcon class="h-3 w-3" />
          Add cost
        </button>
        <button
          v-if="!isEditingCost && place.cost"
          class="text-xs text-muted-foreground inline-flex items-center gap-0.5 hover:text-foreground transition-colors"
          @click.stop="startEditingCost"
        >
          <DollarSignIcon class="h-3 w-3" />
          ${{ place.cost }}
        </button>
        <input
          v-if="isEditingCost"
          ref="costInputRef"
          v-model="costText"
          type="number"
          class="text-xs border rounded px-1.5 py-0.5 w-16 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="0"
          @click.stop
          @blur="saveCost"
          @keydown.enter.prevent="saveCost"
          @keydown.escape="isEditingCost = false"
        />
        <!-- Star rating (collapsed - show only if rated) -->
        <span v-if="place.rating" class="text-xs text-amber-500 inline-flex items-center gap-0.5">
          <StarIcon class="h-3 w-3 fill-current" />
          {{ place.rating }}
        </span>
      </div>

      <!-- Notes display -->
      <p
        v-if="place.notes && !isEditingNotes"
        class="mt-1.5 text-xs text-muted-foreground italic leading-snug"
        @click.stop="startEditing"
      >
        {{ place.notes }}
      </p>

      <!-- Add note link -->
      <button
        v-if="!place.notes && !isEditingNotes"
        class="mt-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1 transition-colors"
        @click.stop="startEditing"
      >
        <PencilIcon class="h-3 w-3" />
        Add note
      </button>

      <!-- Notes editor -->
      <textarea
        v-if="isEditingNotes"
        ref="textareaRef"
        v-model="notesText"
        class="mt-1.5 w-full text-xs border rounded-md p-1.5 resize-none bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        rows="2"
        placeholder="Add a note..."
        @click.stop
        @blur="saveNotes"
        @keydown.enter.exact.prevent="saveNotes"
        @keydown.escape="isEditingNotes = false"
      />

      <!-- Expanded details -->
      <div
        class="grid transition-all duration-200 ease-in-out"
        :class="isExpanded ? 'grid-rows-[1fr] mt-2' : 'grid-rows-[0fr]'"
      >
        <div class="overflow-hidden">
          <div class="pt-2 border-t border-border space-y-2">
            <p class="text-xs text-muted-foreground">
              {{ place.address }}
            </p>
            <p class="text-[10px] text-muted-foreground/60 font-mono">
              {{ place.coordinates[1].toFixed(4) }}, {{ place.coordinates[0].toFixed(4) }}
            </p>
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="h-7 text-xs gap-1"
                @click.stop="emit('click', place)"
              >
                <NavigationIcon class="h-3 w-3" />
                Fly to map
              </Button>
              <a
                :href="`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates[1]},${place.coordinates[0]}`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 h-7 px-3 text-xs rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                @click.stop
              >
                <ExternalLinkIcon class="h-3 w-3" />
                Directions
              </a>
            </div>
            <!-- Star rating -->
            <div class="flex items-center gap-1" @click.stop>
              <span class="text-xs text-muted-foreground mr-1">Rating:</span>
              <button
                v-for="star in 5"
                :key="star"
                class="p-0 h-5 w-5 flex items-center justify-center transition-colors"
                @click="setRating(star)"
              >
                <StarIcon
                  class="h-4 w-4 transition-colors"
                  :class="star <= (place.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-0.5 shrink-0">
      <Popover v-if="totalDays > 1" v-model:open="moveOpen">
        <PopoverTrigger as-child>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            aria-label="Move to another day"
            @click.stop
          >
            <ArrowRightLeftIcon class="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent class="w-36 p-2" align="end" @click.stop>
          <p class="text-xs font-medium text-muted-foreground mb-1.5">Move to</p>
          <div class="flex flex-col gap-1">
            <button
              v-for="i in totalDays"
              :key="i"
              v-show="i - 1 !== dayIndex"
              class="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-muted transition-colors text-left"
              @click="moveToDay(i - 1)"
            >
              <span
                class="h-2.5 w-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: DAY_COLORS[(i - 1) % DAY_COLORS.length] }"
              />
              Day {{ i }}
            </button>
          </div>
          <div class="border-t border-border my-1.5" />
          <p class="text-xs font-medium text-muted-foreground mb-1.5">Copy to</p>
          <div class="flex flex-col gap-1">
            <button
              v-for="i in totalDays"
              :key="'copy-' + i"
              v-show="i - 1 !== dayIndex"
              class="flex items-center gap-2 px-2 py-1 text-sm rounded hover:bg-muted transition-colors text-left"
              @click="copyToDay(i - 1)"
            >
              <CopyIcon class="h-3 w-3 text-muted-foreground" />
              <span
                class="h-2.5 w-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: DAY_COLORS[(i - 1) % DAY_COLORS.length] }"
              />
              Day {{ i }}
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
        aria-label="Remove place"
        @click.stop="emit('remove', place.id)"
      >
        <XIcon class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
