<script setup lang="ts">
import { ref } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CopyIcon, DownloadIcon, UploadIcon, LinkIcon, PrinterIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useTripStore } from '~/stores/tripStore';
import { useTripSharing } from '~/composables/useTripSharing';
import type { Trip } from '~/types/trip';

const open = defineModel<boolean>('open', { default: false });
const store = useTripStore();
const { encodeTripToUrl } = useTripSharing();
const fileInput = ref<HTMLInputElement | null>(null);

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function generateText(): string {
  const trip = store.trip;
  if (!trip) return '';

  const fmtFull = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const lines: string[] = [];
  lines.push(`🗺️ ${trip.name}`);
  lines.push(`📅 ${fmtFull(trip.startDate)} - ${fmtFull(trip.endDate)}`);
  lines.push('');

  for (const day of trip.days) {
    lines.push(`Day ${day.dayNumber} - ${formatDate(day.date)}`);
    if (day.places.length === 0) {
      lines.push('  (no places planned)');
    } else {
      for (let i = 0; i < day.places.length; i++) {
        const place = day.places[i];
        lines.push(`  ${i + 1}. ${place.name} - ${place.address}`);
        if (place.notes) {
          lines.push(`     📝 ${place.notes}`);
        }
      }
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

async function copyShareLink() {
  if (!store.trip) return;
  const url = encodeTripToUrl(store.trip);
  try {
    await navigator.clipboard.writeText(url);
    toast('Share link copied to clipboard!');
    open.value = false;
  } catch {
    toast.error('Failed to copy share link');
  }
}

async function copyAsText() {
  const text = generateText();
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied itinerary to clipboard!');
    open.value = false;
  } catch {
    toast.error('Failed to copy to clipboard');
  }
}

function downloadAsJson() {
  const trip = store.trip;
  if (!trip) return;

  const json = JSON.stringify(trip, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${trip.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Trip downloaded!');
  open.value = false;
}

function printItinerary() {
  window.print();
  open.value = false;
}

function triggerImport() {
  fileInput.value?.click();
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string) as Trip;
      if (!data.id || !data.name || !Array.isArray(data.days)) {
        toast.error('Invalid trip file format');
        return;
      }
      store.trip = data;
      toast('Trip imported successfully!');
      open.value = false;
    } catch {
      toast.error('Failed to parse trip file');
    }
  };
  reader.readAsText(file);
  input.value = '';
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Export & Share</DialogTitle>
        <DialogDescription>Export your trip itinerary or import a saved trip.</DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-3 py-4">
        <Button variant="outline" class="justify-start gap-3 h-12" @click="copyShareLink">
          <LinkIcon class="h-4 w-4 shrink-0" />
          <div class="text-left">
            <div class="font-medium">Copy Share Link</div>
            <div class="text-xs text-muted-foreground">Share your trip via a link</div>
          </div>
        </Button>

        <Button variant="outline" class="justify-start gap-3 h-12" @click="copyAsText">
          <CopyIcon class="h-4 w-4 shrink-0" />
          <div class="text-left">
            <div class="font-medium">Copy as Text</div>
            <div class="text-xs text-muted-foreground">Copy a formatted itinerary to clipboard</div>
          </div>
        </Button>

        <Button variant="outline" class="justify-start gap-3 h-12" @click="downloadAsJson">
          <DownloadIcon class="h-4 w-4 shrink-0" />
          <div class="text-left">
            <div class="font-medium">Download as JSON</div>
            <div class="text-xs text-muted-foreground">Save trip data for backup or sharing</div>
          </div>
        </Button>

        <Button variant="outline" class="justify-start gap-3 h-12" @click="printItinerary">
          <PrinterIcon class="h-4 w-4 shrink-0" />
          <div class="text-left">
            <div class="font-medium">Print Itinerary</div>
            <div class="text-xs text-muted-foreground">Print a clean version of your trip</div>
          </div>
        </Button>

        <Button variant="outline" class="justify-start gap-3 h-12" @click="triggerImport">
          <UploadIcon class="h-4 w-4 shrink-0" />
          <div class="text-left">
            <div class="font-medium">Import Trip</div>
            <div class="text-xs text-muted-foreground">Load a previously exported trip file</div>
          </div>
        </Button>

        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="onFileSelected"
        >
      </div>

      <DialogFooter>
        <Button variant="ghost" @click="open = false">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
