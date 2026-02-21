import { onMounted, onUnmounted, type Ref } from 'vue'
import { useTripStore } from '~/stores/tripStore'

export function useKeyboardShortcuts(options: {
  onFocusSearch: () => void
  onEditTrip: () => void
  onNewTrip: () => void
  onToggleExport: () => void
  showShortcutsHelp: Ref<boolean>
}) {
  const store = useTripStore()

  function isInInput(): boolean {
    const el = document.activeElement
    if (!el) return false
    const tag = el.tagName.toLowerCase()
    return tag === 'input' || tag === 'textarea' || tag === 'select' || (el as HTMLElement).isContentEditable
  }

  function handleKeydown(e: KeyboardEvent) {
    if (isInInput()) return

    if (e.key === 'ArrowLeft' && store.trip) {
      e.preventDefault()
      const newIndex = Math.max(0, store.selectedDayIndex - 1)
      store.selectDay(newIndex)
      return
    }

    if (e.key === 'ArrowRight' && store.trip) {
      e.preventDefault()
      const maxIndex = store.trip.days.length - 1
      const newIndex = Math.min(maxIndex, store.selectedDayIndex + 1)
      store.selectDay(newIndex)
      return
    }

    if (e.key === '/') {
      e.preventDefault()
      options.onFocusSearch()
      return
    }

    if (e.key >= '1' && e.key <= '9' && store.trip) {
      const dayIndex = parseInt(e.key) - 1
      if (dayIndex < store.trip.days.length) {
        e.preventDefault()
        store.selectDay(dayIndex)
      }
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'e' && store.trip) {
      e.preventDefault()
      options.onEditTrip()
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault()
      options.onNewTrip()
      return
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's' && store.trip) {
      e.preventDefault()
      options.onToggleExport()
      return
    }

    if (e.key === '?') {
      e.preventDefault()
      options.showShortcutsHelp.value = !options.showShortcutsHelp.value
    }
  }

  onMounted(() => document.addEventListener('keydown', handleKeydown))
  onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
}
