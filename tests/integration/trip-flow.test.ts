import { describe, it, expect, beforeEach } from 'vitest';
import { createTestStore } from '../helpers/store-helper';
import { SAMPLE_PLACE, SAMPLE_PLACE_2 } from '../helpers/fixtures';
import type { useTripStore } from '~/stores/tripStore';

type TripStore = ReturnType<typeof useTripStore>

describe('trip flow (integration)', () => {
  let store: TripStore;

  beforeEach(() => {
    store = createTestStore();
    store.clearTrip();
  });

  it('creates a trip and adds places to the first day', () => {
    store.createTrip('Rome Weekend', '2026-09-05', '2026-09-07');
    store.addPlace(SAMPLE_PLACE);
    store.addPlace(SAMPLE_PLACE_2);

    expect(store.trip!.days).toHaveLength(3);
    expect(store.currentDay!.places).toHaveLength(2);
    expect(store.allPlaces).toHaveLength(2);
  });

  it('reorders places within a day', () => {
    store.createTrip('Rome Weekend', '2026-09-05', '2026-09-07');
    store.addPlace(SAMPLE_PLACE);
    store.addPlace(SAMPLE_PLACE_2);

    const reversed = [...store.currentDay!.places].reverse();
    store.reorderPlaces(0, reversed);

    expect(store.currentDay!.places[0].name).toBe('Louvre Museum');
    expect(store.currentDay!.places[0].order).toBe(0);
    expect(store.currentDay!.places[1].name).toBe('Eiffel Tower');
    expect(store.currentDay!.places[1].order).toBe(1);
  });

  it('removes a place and re-indexes remaining places', () => {
    store.createTrip('Rome Weekend', '2026-09-05', '2026-09-07');
    store.addPlace(SAMPLE_PLACE);
    store.addPlace(SAMPLE_PLACE_2);

    const firstId = store.currentDay!.places[0].id;
    store.removePlace(0, firstId);

    expect(store.currentDay!.places).toHaveLength(1);
    expect(store.currentDay!.places[0].name).toBe('Louvre Museum');
    expect(store.currentDay!.places[0].order).toBe(0);
    expect(store.allPlaces).toHaveLength(1);
  });

  it('switches days and adds places independently per day', () => {
    store.createTrip('Rome Weekend', '2026-09-05', '2026-09-07');

    // Add to day 0
    store.addPlace(SAMPLE_PLACE);
    expect(store.currentDay!.places).toHaveLength(1);

    // Switch to day 1 and add a different place
    store.selectDay(1);
    expect(store.currentDay!.places).toHaveLength(0);
    store.addPlace(SAMPLE_PLACE_2);
    expect(store.currentDay!.places).toHaveLength(1);

    // Verify day 0 still has its place
    store.selectDay(0);
    expect(store.currentDay!.places).toHaveLength(1);
    expect(store.currentDay!.places[0].name).toBe('Eiffel Tower');

    // Total places across all days
    expect(store.allPlaces).toHaveLength(2);
  });

  it('full lifecycle: create, populate, reorder, remove, switch day, clear', () => {
    // Create
    store.createTrip('Full Test', '2026-10-01', '2026-10-03');
    expect(store.trip).not.toBeNull();

    // Populate day 0
    store.addPlace(SAMPLE_PLACE);
    store.addPlace(SAMPLE_PLACE_2);
    expect(store.currentDay!.places).toHaveLength(2);

    // Reorder day 0
    const reversed = [...store.currentDay!.places].reverse();
    store.reorderPlaces(0, reversed);
    expect(store.currentDay!.places[0].name).toBe('Louvre Museum');

    // Remove from day 0
    const louvreId = store.currentDay!.places[0].id;
    store.removePlace(0, louvreId);
    expect(store.currentDay!.places).toHaveLength(1);
    expect(store.currentDay!.places[0].name).toBe('Eiffel Tower');

    // Switch to day 1 and add
    store.selectDay(1);
    store.addPlace(SAMPLE_PLACE_2);
    expect(store.allPlaces).toHaveLength(2);

    // Clear
    store.clearTrip();
    expect(store.trip).toBeNull();
    expect(store.allPlaces).toHaveLength(0);
    expect(store.selectedDayIndex).toBe(0);
  });
});
