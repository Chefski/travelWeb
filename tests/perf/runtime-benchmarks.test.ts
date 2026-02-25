import { describe, it, expect } from 'vitest';
import { createTestStore } from '../helpers/store-helper';
import { SAMPLE_PLACE } from '../helpers/fixtures';

const IS_CI = Boolean(process.env.CI);
const ADD_PLACE_THRESHOLD_MS = IS_CI ? 10 : 2;
const REORDER_THRESHOLD_MS = IS_CI ? 5 : 2;

describe('runtime performance benchmarks', () => {
  it('createTrip with 30 days completes in < 5ms', () => {
    const store = createTestStore();

    const start = performance.now();
    store.createTrip('30-Day Trip', '2026-01-01', '2026-01-30');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(5);
    expect(store.trip!.days).toHaveLength(30);
  });

  it('addPlace to day with 100 existing places completes in < 2ms', () => {
    const store = createTestStore();
    store.createTrip('Perf Trip', '2026-01-01', '2026-01-02');

    // Populate day 0 with 100 places
    for (let i = 0; i < 100; i++) {
      store.addPlace({
        ...SAMPLE_PLACE,
        mapboxId: `poi.${i}`,
        name: `Place ${i}`,
      });
    }
    expect(store.currentDay!.places).toHaveLength(100);

    // Time adding one more place
    const start = performance.now();
    store.addPlace({
      ...SAMPLE_PLACE,
      mapboxId: 'poi.final',
      name: 'Final Place',
    });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(ADD_PLACE_THRESHOLD_MS);
    expect(store.currentDay!.places).toHaveLength(101);
  });

  it('reorderPlaces with 50 places completes in < 2ms', () => {
    const store = createTestStore();
    store.createTrip('Reorder Trip', '2026-01-01', '2026-01-02');

    // Populate day 0 with 50 places
    for (let i = 0; i < 50; i++) {
      store.addPlace({
        ...SAMPLE_PLACE,
        mapboxId: `poi.${i}`,
        name: `Place ${i}`,
      });
    }
    expect(store.currentDay!.places).toHaveLength(50);

    // Reverse the places array to simulate a full reorder
    const reversed = [...store.currentDay!.places].reverse();

    const start = performance.now();
    store.reorderPlaces(0, reversed);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(REORDER_THRESHOLD_MS);
    expect(store.trip!.days[0].places[0].name).toBe('Place 49');
    expect(store.trip!.days[0].places[49].name).toBe('Place 0');
  });

  it('createTrip with 365-day range completes in < 10ms', () => {
    const store = createTestStore();

    const start = performance.now();
    store.createTrip('Year-Long Trip', '2026-01-01', '2026-12-31');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(10);
    expect(store.trip!.days).toHaveLength(365);
  });
});
