const CATEGORY_DURATIONS: Record<string, string> = {
  restaurant: '1-1.5h',
  cafe: '30min-1h',
  coffee: '30min-1h',
  bar: '1-2h',
  pub: '1-2h',
  museum: '2-3h',
  gallery: '1-2h',
  park: '1-2h',
  garden: '1-1.5h',
  beach: '2-3h',
  shopping: '1-2h',
  mall: '2-3h',
  market: '1-2h',
  viewpoint: '30min-1h',
  landmark: '30min-1h',
  monument: '30min',
  temple: '1h',
  shrine: '1h',
  church: '30min-1h',
  cathedral: '1h',
  mosque: '30min-1h',
  zoo: '3-4h',
  aquarium: '2-3h',
  theme_park: '4-6h',
  amusement: '3-5h',
  spa: '2-3h',
  hotel: '30min',
  airport: '2-3h',
  station: '15-30min',
  theater: '2-3h',
  cinema: '2-3h',
  stadium: '3-4h',
  gym: '1-2h',
  pool: '1-2h',
  library: '1-2h',
  university: '1-2h',
  castle: '1.5-2.5h',
  palace: '2-3h',
  ruins: '1-2h',
  hiking: '2-4h',
  trail: '2-4h',
  winery: '1.5-2h',
  brewery: '1-2h',
  food: '1-1.5h',
  bakery: '15-30min',
  pharmacy: '15min',
  hospital: '1h',
};

export function useVisitDuration() {
  function suggestDuration(category: string): string | null {
    if (!category) return null;
    const lower = category.toLowerCase();

    // Direct match
    if (CATEGORY_DURATIONS[lower]) return CATEGORY_DURATIONS[lower];

    // Partial match: check if the category contains a known key
    for (const [key, duration] of Object.entries(CATEGORY_DURATIONS)) {
      if (lower.includes(key) || key.includes(lower)) return duration;
    }

    return null;
  }

  return { suggestDuration };
}
