import type { Place } from '~/types/trip';

export const SAMPLE_PLACE: Omit<Place, 'id' | 'order'> = {
  mapboxId: 'poi.123',
  name: 'Eiffel Tower',
  address: 'Champ de Mars, Paris, France',
  category: 'landmark',
  coordinates: [2.2945, 48.8584],
};

export const SAMPLE_PLACE_2: Omit<Place, 'id' | 'order'> = {
  mapboxId: 'poi.456',
  name: 'Louvre Museum',
  address: 'Rue de Rivoli, Paris, France',
  category: 'museum',
  coordinates: [2.3376, 48.8606],
};
