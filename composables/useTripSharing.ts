import type { Trip } from '~/types/trip';

interface ShareableTrip {
  n: string       // name
  s: string       // startDate
  e: string       // endDate
  d: Array<{      // days
    dt: string    // date
    dn: number    // dayNumber
    p: Array<{    // places
      n: string   // name
      a: string   // address
      c: string   // category
      co: [number, number] // coordinates
      mid: string // mapboxId
    }>
  }>
}

function compress(trip: Trip): string {
  const data: ShareableTrip = {
    n: trip.name,
    s: trip.startDate,
    e: trip.endDate,
    d: trip.days.map(day => ({
      dt: day.date,
      dn: day.dayNumber,
      p: day.places.map(p => ({
        n: p.name,
        a: p.address,
        c: p.category,
        co: p.coordinates,
        mid: p.mapboxId,
      })),
    })),
  };
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

function decompress(encoded: string): Trip | null {
  try {
    const data: ShareableTrip = JSON.parse(decodeURIComponent(atob(encoded)));
    return {
      id: crypto.randomUUID(),
      name: data.n,
      coverImage: '',
      startDate: data.s,
      endDate: data.e,
      days: data.d.map(day => ({
        date: day.dt,
        dayNumber: day.dn,
        places: day.p.map((p, i) => ({
          id: crypto.randomUUID(),
          mapboxId: p.mid,
          name: p.n,
          address: p.a,
          category: p.c,
          coordinates: p.co,
          order: i,
          notes: '',
          estimatedTime: '',
          cost: 0,
          rating: 0,
        })),
      })),
    };
  } catch {
    return null;
  }
}

export function useTripSharing() {
  function encodeTripToUrl(trip: Trip): string {
    const encoded = compress(trip);
    const base = window.location.origin + window.location.pathname;
    return `${base}#share=${encoded}`;
  }

  function decodeTripFromUrl(): Trip | null {
    const hash = window.location.hash;
    if (!hash.startsWith('#share=')) return null;
    const encoded = hash.slice(7);
    return decompress(encoded);
  }

  function clearShareHash() {
    if (window.location.hash.startsWith('#share=')) {
      history.replaceState(null, '', window.location.pathname);
    }
  }

  return { encodeTripToUrl, decodeTripFromUrl, clearShareHash };
}
