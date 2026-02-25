import { describe, it, expect, beforeEach } from 'vitest';
import { createTestStore } from '../helpers/store-helper';
import { SAMPLE_PLACE } from '../helpers/fixtures';
import type { useTripStore } from '~/stores/tripStore';

type TripStore = ReturnType<typeof useTripStore>

describe('edit trip preserves places (integration)', () => {
  let store: TripStore;

  beforeEach(() => {
    store = createTestStore();
    store.clearTrip();

    // Seed: 3-day trip with a place on day 0
    store.createTrip('Paris', '2026-06-01', '2026-06-03');
    store.addPlace(SAMPLE_PLACE);
    expect(store.trip!.days[0].places).toHaveLength(1);
  });

  it('extend end date -- existing days keep their places', () => {
    // Capture the date of day 0 before the update
    const day0Date = store.trip!.days[0].date;

    store.updateTrip('Paris Extended', '2026-06-01', '2026-06-05');

    expect(store.trip!.days).toHaveLength(5);
    // Day 0 kept the same date and still has its place
    expect(store.trip!.days[0].date).toBe(day0Date);
    expect(store.trip!.days[0].places).toHaveLength(1);
    expect(store.trip!.days[0].places[0].name).toBe('Eiffel Tower');
    // Newly added days are empty
    expect(store.trip!.days[3].places).toHaveLength(0);
    expect(store.trip!.days[4].places).toHaveLength(0);
  });

  it('shift start date later -- overlapping days keep their places', () => {
    // Original: 3-day trip, place on day index 0
    // Add a place to day index 1 as well so we can verify overlap
    const day1Date = store.trip!.days[1].date;
    store.selectDay(1);
    store.addPlace(SAMPLE_PLACE);
    expect(store.trip!.days[1].places).toHaveLength(1);

    // Shift start date one day later -- day 0 is dropped, day 1 and 2 overlap
    store.updateTrip('Paris Shifted', '2026-06-02', '2026-06-04');

    expect(store.trip!.days).toHaveLength(3);
    // The old day1 date should now be in the new days and keep its place
    const matchingDay = store.trip!.days.find(d => d.date === day1Date);
    expect(matchingDay).toBeDefined();
    expect(matchingDay!.places).toHaveLength(1);
    expect(matchingDay!.places[0].name).toBe('Eiffel Tower');
    // The last day should be brand new and empty
    expect(store.trip!.days[2].places).toHaveLength(0);
  });

  it('shrink trip -- clamps selectedDayIndex to last day', () => {
    // Select the last day (index 2) of a 3-day trip
    store.selectDay(2);
    expect(store.selectedDayIndex).toBe(2);

    // Shrink to 1 day
    store.updateTrip('Paris Short', '2026-06-01', '2026-06-01');

    expect(store.trip!.days).toHaveLength(1);
    // selectedDayIndex should be clamped to 0 (the only valid index)
    expect(store.selectedDayIndex).toBe(0);
    // The surviving day still has its place (same start date = same internal date)
    expect(store.trip!.days[0].places).toHaveLength(1);
  });
});
