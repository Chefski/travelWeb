<script setup lang="ts">
import { ref } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2Icon, PlusIcon } from 'lucide-vue-next';
import { useTripStore } from '~/stores/tripStore';
import type { Trip } from '~/types/trip';

const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ 'create-new': [] }>();

const store = useTripStore();
const confirmDeleteId = ref<string | null>(null);

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

function getGradient(id: string) {
  let hash = 0;
  for (const ch of id) hash = ((hash << 5) - hash) + ch.charCodeAt(0);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function formatDates(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function totalPlaces(t: Trip) {
  return t.days.reduce((sum, d) => sum + d.places.length, 0);
}

function selectTrip(tripId: string) {
  store.switchTrip(tripId);
  confirmDeleteId.value = null;
  open.value = false;
}

function onDelete(tripId: string) {
  if (confirmDeleteId.value === tripId) {
    store.deleteTrip(tripId);
    confirmDeleteId.value = null;
  } else {
    confirmDeleteId.value = tripId;
  }
}

function onCreateNew() {
  emit('create-new');
  open.value = false;
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>My Trips</DialogTitle>
        <DialogDescription>Switch between trips or create a new one.</DialogDescription>
      </DialogHeader>

      <div class="space-y-2 max-h-[400px] overflow-y-auto py-1">
        <div
          v-for="t in store.trips"
          :key="t.id"
          class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent"
          :class="t.id === store.currentTripId ? 'border-primary bg-accent/50' : 'border-border'"
          role="button"
          tabindex="0"
          @click="selectTrip(t.id)"
          @keydown.enter="selectTrip(t.id)"
        >
          <div class="w-14 h-14 rounded-md overflow-hidden shrink-0">
            <img
              v-if="t.coverImage?.trim()"
              :src="t.coverImage"
              alt=""
              class="w-full h-full object-cover"
            >
            <div v-else class="w-full h-full" :style="{ background: getGradient(t.id) }" />
          </div>

          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ t.name }}</p>
            <p class="text-xs text-muted-foreground">{{ formatDates(t.startDate, t.endDate) }}</p>
            <div class="flex gap-1.5 mt-1">
              <Badge variant="secondary" class="text-[10px] px-1.5 py-0">{{ t.days.length }} days</Badge>
              <Badge variant="outline" class="text-[10px] px-1.5 py-0">{{ totalPlaces(t) }} places</Badge>
            </div>
          </div>

          <div class="shrink-0" @click.stop>
            <div v-if="confirmDeleteId === t.id" class="flex items-center gap-1">
              <Button variant="destructive" size="sm" class="h-7 text-xs" @click="onDelete(t.id)">Delete</Button>
              <Button variant="ghost" size="sm" class="h-7 text-xs" @click="confirmDeleteId = null">Cancel</Button>
            </div>
            <Button
              v-else
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete trip"
              @click="onDelete(t.id)"
            >
              <Trash2Icon class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div v-if="store.trips.length === 0" class="text-center py-8 text-muted-foreground">
          No trips yet. Create your first one!
        </div>
      </div>

      <Button class="w-full" @click="onCreateNew">
        <PlusIcon class="h-4 w-4 mr-2" />
        Create New Trip
      </Button>
    </DialogContent>
  </Dialog>
</template>
