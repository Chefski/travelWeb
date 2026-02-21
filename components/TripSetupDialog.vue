<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RangeCalendar } from '@/components/ui/range-calendar'
import { CalendarDate, type DateValue } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import { useTripStore } from '~/stores/tripStore'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ created: [] }>()

const store = useTripStore()

const tripName = ref('')
const dateRange = ref<{ start: DateValue | undefined; end: DateValue | undefined }>({
  start: undefined,
  end: undefined,
})
const coverImage = ref('')

const canCreate = computed(() => {
  return tripName.value.trim().length > 0 && dateRange.value.start && dateRange.value.end
})

function formatDate(d: DateValue | undefined): string {
  if (!d) return ''
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`
}

function formatDisplay(d: DateValue | undefined): string {
  if (!d) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.month - 1]} ${d.day}, ${d.year}`
}

const dateLabel = computed(() => {
  if (dateRange.value.start && dateRange.value.end) {
    return `${formatDisplay(dateRange.value.start)} - ${formatDisplay(dateRange.value.end)}`
  }
  if (dateRange.value.start) {
    return `${formatDisplay(dateRange.value.start)} - ...`
  }
  return 'Pick your travel dates'
})

function onCreate() {
  if (!canCreate.value) return
  store.createTrip(
    tripName.value.trim(),
    formatDate(dateRange.value.start),
    formatDate(dateRange.value.end),
    coverImage.value.trim() || undefined,
  )
  tripName.value = ''
  dateRange.value = { start: undefined, end: undefined }
  coverImage.value = ''
  open.value = false
  emit('created')
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Plan a new trip</DialogTitle>
        <DialogDescription>Set your trip details to get started.</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium">Trip name</label>
          <Input v-model="tripName" placeholder="e.g. Summer in Italy" />
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Travel dates</label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="justify-start text-left font-normal">
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ dateLabel }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0" align="start">
              <RangeCalendar
                v-model="dateRange"
                :number-of-months="2"
                class="rounded-md border"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium">Cover image URL <span class="text-muted-foreground">(optional)</span></label>
          <Input v-model="coverImage" placeholder="https://..." />
        </div>
      </div>

      <DialogFooter>
        <Button :disabled="!canCreate" @click="onCreate">
          Create Trip
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
