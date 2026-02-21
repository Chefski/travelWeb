<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const open = defineModel<boolean>('open', { default: false })

const shortcuts = [
  { keys: ['←', '→'], description: 'Switch between days' },
  { keys: ['1', '-', '9'], description: 'Jump to day' },
  { keys: ['/'], description: 'Focus search' },
  { keys: ['⌘', 'E'], description: 'Edit trip' },
  { keys: ['⌘', 'N'], description: 'New trip' },
  { keys: ['⌘', 'S'], description: 'Export trip' },
  { keys: ['?'], description: 'Show shortcuts' },
]
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <DialogDescription>Navigate faster with these shortcuts.</DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <div
          v-for="shortcut in shortcuts"
          :key="shortcut.description"
          class="flex items-center justify-between py-1.5"
        >
          <span class="text-sm text-muted-foreground">{{ shortcut.description }}</span>
          <div class="flex items-center gap-1">
            <kbd
              v-for="key in shortcut.keys"
              :key="key"
              class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border"
            >
              {{ key }}
            </kbd>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
