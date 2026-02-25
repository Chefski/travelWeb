import { describe, it, expect, beforeEach } from 'vitest';
import { createTestStore } from '../../helpers/store-helper';
import { SAMPLE_PLACE, SAMPLE_PLACE_2 } from '../../helpers/fixtures';
import type { useTripStore } from '~/stores/tripStore';

type TripStore = ReturnType<typeof useTripStore>

describe('tripStore', () => {
  let store: TripStore;

  beforeEach(() => {
    localStorage.removeItem('itinerary-trips');
    localStorage.removeItem('itinerary-current-trip-id');
    store = createTestStore();
    store.clearTrip();
  });

  // ── createTrip ──────────────────────────────────────────────

  describe('createTrip', () => {
    it('creates a trip with correct name, dates, and days', () => {
      store.createTrip('Paris Vacation', '2026-06-01', '2026-06-03');

      expect(store.trip).not.toBeNull();
      expect(store.trip!.name).toBe('Paris Vacation');
      expect(store.trip!.startDate).toBe('2026-06-01');
      expect(store.trip!.endDate).toBe('2026-06-03');
      expect(store.trip!.days).toHaveLength(3);
    });

    it('generates the correct number of days from date range', () => {
      store.createTrip('Week Trip', '2026-03-10', '2026-03-16');

      expect(store.trip!.days).toHaveLength(7);
      expect(store.trip!.days[0].dayNumber).toBe(1);
      expect(store.trip!.days[6].dayNumber).toBe(7);
      // Each day should have an empty places array
      for (const day of store.trip!.days) {
        expect(day.places).toEqual([]);
      }
    });

    it('resets selectedDayIndex to 0', () => {
      store.createTrip('Trip A', '2026-06-01', '2026-06-05');
      store.selectDay(3);
      store.createTrip('Trip B', '2026-08-01', '2026-08-03');

      expect(store.selectedDayIndex).toBe(0);
    });

    it('assigns a UUID as the trip id', () => {
      store.createTrip('ID Test', '2026-06-01', '2026-06-01');

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(store.trip!.id).toMatch(uuidRegex);
    });
  });

  // ── addPlace ────────────────────────────────────────────────

  describe('addPlace', () => {
    it('adds a place with auto-incremented order', () => {
      store.createTrip('Paris', '2026-06-01', '2026-06-02');
      store.addPlace(SAMPLE_PLACE);
      store.addPlace(SAMPLE_PLACE_2);

      const places = store.currentDay!.places;
      expect(places).toHaveLength(2);
      expect(places[0].name).toBe('Eiffel Tower');
      expect(places[0].order).toBe(0);
      expect(places[1].name).toBe('Louvre Museum');
      expect(places[1].order).toBe(1);
    });

    it('does nothing when no trip exists', () => {
      store.addPlace(SAMPLE_PLACE);

      expect(store.trip).toBeNull();
      expect(store.allPlaces).toHaveLength(0);
    });
  });

  // ── removePlace ─────────────────────────────────────────────

  describe('removePlace', () => {
    it('removes a place by id and re-indexes order', () => {
      store.createTrip('Paris', '2026-06-01', '2026-06-02');
      store.addPlace(SAMPLE_PLACE);
      store.addPlace(SAMPLE_PLACE_2);

      const firstPlaceId = store.currentDay!.places[0].id;
      store.removePlace(0, firstPlaceId);

      const places = store.currentDay!.places;
      expect(places).toHaveLength(1);
      expect(places[0].name).toBe('Louvre Museum');
      expect(places[0].order).toBe(0);
    });
  });

  // ── reorderPlaces ───────────────────────────────────────────

  describe('reorderPlaces', () => {
    it('reorders places and updates order field', () => {
      store.createTrip('Paris', '2026-06-01', '2026-06-02');
      store.addPlace(SAMPLE_PLACE);
      store.addPlace(SAMPLE_PLACE_2);

      const reversed = [...store.currentDay!.places].reverse();
      store.reorderPlaces(0, reversed);

      const places = store.currentDay!.places;
      expect(places[0].name).toBe('Louvre Museum');
      expect(places[0].order).toBe(0);
      expect(places[1].name).toBe('Eiffel Tower');
      expect(places[1].order).toBe(1);
    });
  });

  // ── updateTrip ──────────────────────────────────────────────

  describe('updateTrip', () => {
    it('preserves places on overlapping dates', () => {
      store.createTrip('Paris', '2026-06-01', '2026-06-03');
      store.addPlace(SAMPLE_PLACE);

      store.updateTrip('Paris Extended', '2026-06-01', '2026-06-05');

      expect(store.trip!.name).toBe('Paris Extended');
      expect(store.trip!.days).toHaveLength(5);
      expect(store.trip!.days[0].places).toHaveLength(1);
      expect(store.trip!.days[0].places[0].name).toBe('Eiffel Tower');
    });

    it('clamps selectedDayIndex when trip becomes shorter', () => {
      store.createTrip('Long Trip', '2026-06-01', '2026-06-10');
      store.selectDay(9);
      expect(store.selectedDayIndex).toBe(9);

      store.updateTrip('Short Trip', '2026-06-01', '2026-06-03');

      expect(store.selectedDayIndex).toBe(2);
    });
  });

  // ── updateTrip guard ───────────────────────────────────────

  describe('updateTrip guard', () => {
    it('does nothing when no trip exists', () => {
      // store.trip is null after clearTrip
      expect(store.trip).toBeNull();
      store.updateTrip('Name', '2026-06-01', '2026-06-03');
      expect(store.trip).toBeNull();
    });
  });

  // ── removePlace guard ─────────────────────────────────────

  describe('removePlace guard', () => {
    it('does nothing when no trip exists', () => {
      expect(store.trip).toBeNull();
      // Should not throw
      store.removePlace(0, 'nonexistent-id');
      expect(store.trip).toBeNull();
    });
  });

  // ── clearTrip ───────────────────────────────────────────────

  describe('clearTrip', () => {
    it('sets trip to null and resets selectedDayIndex', () => {
      store.createTrip('Paris', '2026-06-01', '2026-06-05');
      store.selectDay(3);
      store.addPlace(SAMPLE_PLACE);

      store.clearTrip();

      expect(store.trip).toBeNull();
      expect(store.selectedDayIndex).toBe(0);
    });
  });
});
