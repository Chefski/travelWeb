import { createPinia, setActivePinia } from 'pinia';
import { useTripStore } from '~/stores/tripStore';

export function createTestStore() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return useTripStore();
}
