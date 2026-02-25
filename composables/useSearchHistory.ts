import { useLocalStorage } from '@vueuse/core';

interface HistoryEntry {
  name: string
  mapboxId: string
  address: string
  category: string
  coordinates: [number, number]
}

export type { HistoryEntry };

export function useSearchHistory() {
  const history = useLocalStorage<HistoryEntry[]>('itinerary-search-history', [], {
    serializer: { read: (v: string) => JSON.parse(v), write: (v: HistoryEntry[]) => JSON.stringify(v) },
  });

  function addToHistory(entry: HistoryEntry) {
    const filtered = history.value.filter(h => h.mapboxId !== entry.mapboxId);
    history.value = [entry, ...filtered].slice(0, 5);
  }

  function removeFromHistory(mapboxId: string) {
    history.value = history.value.filter(h => h.mapboxId !== mapboxId);
  }

  function clearHistory() {
    history.value = [];
  }

  return { history, addToHistory, removeFromHistory, clearHistory };
}
