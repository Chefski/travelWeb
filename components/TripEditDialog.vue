<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RangeCalendar } from '@/components/ui/range-calendar';
import { CalendarDate, type DateValue } from '@internationalized/date';
import { CalendarIcon, ImageIcon, XIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useTripStore } from '~/stores/tripStore';
import { useImageUpload } from '~/composables/useImageUpload';

const open = defineModel<boolean>('open', { default: false });

const store = useTripStore();
const { processFile } = useImageUpload();

const tripName = ref('');
const dateRange = ref<{ start: DateValue | undefined; end: DateValue | undefined }>({
  start: undefined,
  end: undefined,
});
const coverImage = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const imagePreview = ref<string | null>(null);
const isProcessingImage = ref(false);

function parseDate(dateStr: string): CalendarDate {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new CalendarDate(y, m, d);
}

watch(open, (isOpen) => {
  if (isOpen && store.trip) {
    tripName.value = store.trip.name;
    dateRange.value = {
      start: parseDate(store.trip.startDate),
      end: parseDate(store.trip.endDate),
    };
    coverImage.value = store.trip.coverImage || '';
    imagePreview.value = store.trip.coverImage || null;
  }
});

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file');
    return;
  }

  isProcessingImage.value = true;
  try {
    const dataUrl = await processFile(file);
    coverImage.value = dataUrl;
    imagePreview.value = dataUrl;
  } catch {
    toast.error('Failed to process image');
  } finally {
    isProcessingImage.value = false;
  }
}

function clearImage() {
  coverImage.value = '';
  imagePreview.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
}

watch(coverImage, (val) => {
  if (val && !val.startsWith('data:')) {
    imagePreview.value = null;
  }
});

const canSave = computed(() => {
  return tripName.value.trim().length > 0 && dateRange.value.start && dateRange.value.end;
});

function formatDate(d: DateValue | undefined): string {
  if (!d) return '';
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

function formatDisplay(d: DateValue | undefined): string {
  if (!d) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.month - 1]} ${d.day}, ${d.year}`;
}

const dateLabel = computed(() => {
  if (dateRange.value.start && dateRange.value.end) {
    return `${formatDisplay(dateRange.value.start)} - ${formatDisplay(dateRange.value.end)}`;
  }
  if (dateRange.value.start) {
    return `${formatDisplay(dateRange.value.start)} - ...`;
  }
  return 'Pick your travel dates';
});

function onSave() {
  if (!canSave.value) return;
  store.updateTrip(
    tripName.value.trim(),
    formatDate(dateRange.value.start),
    formatDate(dateRange.value.end),
    coverImage.value.trim() || undefined,
  );
  open.value = false;
  toast('Trip updated');
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle>Edit trip</DialogTitle>
        <DialogDescription>Update your trip details.</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <label for="edit-trip-name" class="text-sm font-medium">Trip name</label>
          <Input id="edit-trip-name" v-model="tripName" placeholder="e.g. Summer in Italy" />
        </div>

        <div class="grid gap-2">
          <label for="edit-trip-dates" class="text-sm font-medium">Travel dates</label>
          <Popover>
            <PopoverTrigger as-child>
              <Button id="edit-trip-dates" variant="outline" class="justify-start text-left font-normal">
                <CalendarIcon class="h-4 w-4" />
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
          <label for="edit-trip-cover" class="text-sm font-medium">Cover image <span class="text-muted-foreground">(optional)</span></label>

          <div
v-if="imagePreview || (coverImage && !coverImage.startsWith('data:'))"
               class="relative rounded-lg overflow-hidden h-[120px]">
            <img
:src="imagePreview || coverImage"
                 class="w-full h-full object-cover"
                 alt="Preview" >
            <Button
variant="destructive" size="icon"
                    class="absolute top-2 right-2 h-6 w-6"
                    aria-label="Remove cover image"
                    @click="clearImage">
              <XIcon class="h-3 w-3" />
            </Button>
          </div>

          <div class="flex gap-2">
            <Button
variant="outline" size="sm" class="shrink-0"
                    :disabled="isProcessingImage"
                    type="button"
                    @click="fileInputRef?.click()">
              <ImageIcon class="h-4 w-4" />
              {{ isProcessingImage ? 'Processing...' : 'Upload' }}
            </Button>
            <Input
id="edit-trip-cover" v-model="coverImage"
                   placeholder="or paste image URL..."
                   class="flex-1"
                   :disabled="isProcessingImage" />
          </div>

          <input
ref="fileInputRef" type="file" accept="image/*"
                 class="hidden" @change="onFileSelected" >
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button :disabled="!canSave" @click="onSave">
          Save Changes
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
