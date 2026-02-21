import { computed } from 'vue'
import { useTripStore } from '~/stores/tripStore'

const FLAGS: Record<string, string> = {
  japan: '\u{1F1EF}\u{1F1F5}', 'united states': '\u{1F1FA}\u{1F1F8}', usa: '\u{1F1FA}\u{1F1F8}', france: '\u{1F1EB}\u{1F1F7}', italy: '\u{1F1EE}\u{1F1F9}',
  spain: '\u{1F1EA}\u{1F1F8}', germany: '\u{1F1E9}\u{1F1EA}', 'united kingdom': '\u{1F1EC}\u{1F1E7}', uk: '\u{1F1EC}\u{1F1E7}', england: '\u{1F1EC}\u{1F1E7}',
  australia: '\u{1F1E6}\u{1F1FA}', canada: '\u{1F1E8}\u{1F1E6}', brazil: '\u{1F1E7}\u{1F1F7}', mexico: '\u{1F1F2}\u{1F1FD}', india: '\u{1F1EE}\u{1F1F3}',
  china: '\u{1F1E8}\u{1F1F3}', 'south korea': '\u{1F1F0}\u{1F1F7}', korea: '\u{1F1F0}\u{1F1F7}', thailand: '\u{1F1F9}\u{1F1ED}', vietnam: '\u{1F1FB}\u{1F1F3}',
  indonesia: '\u{1F1EE}\u{1F1E9}', turkey: '\u{1F1F9}\u{1F1F7}', greece: '\u{1F1EC}\u{1F1F7}', portugal: '\u{1F1F5}\u{1F1F9}', netherlands: '\u{1F1F3}\u{1F1F1}',
  switzerland: '\u{1F1E8}\u{1F1ED}', austria: '\u{1F1E6}\u{1F1F9}', sweden: '\u{1F1F8}\u{1F1EA}', norway: '\u{1F1F3}\u{1F1F4}', denmark: '\u{1F1E9}\u{1F1F0}',
  finland: '\u{1F1EB}\u{1F1EE}', iceland: '\u{1F1EE}\u{1F1F8}', ireland: '\u{1F1EE}\u{1F1EA}', poland: '\u{1F1F5}\u{1F1F1}', 'czech republic': '\u{1F1E8}\u{1F1FF}',
  czechia: '\u{1F1E8}\u{1F1FF}', hungary: '\u{1F1ED}\u{1F1FA}', croatia: '\u{1F1ED}\u{1F1F7}', egypt: '\u{1F1EA}\u{1F1EC}', morocco: '\u{1F1F2}\u{1F1E6}',
  'south africa': '\u{1F1FF}\u{1F1E6}', argentina: '\u{1F1E6}\u{1F1F7}', colombia: '\u{1F1E8}\u{1F1F4}', peru: '\u{1F1F5}\u{1F1EA}', chile: '\u{1F1E8}\u{1F1F1}',
  'new zealand': '\u{1F1F3}\u{1F1FF}', singapore: '\u{1F1F8}\u{1F1EC}', malaysia: '\u{1F1F2}\u{1F1FE}', philippines: '\u{1F1F5}\u{1F1ED}',
  'united arab emirates': '\u{1F1E6}\u{1F1EA}', uae: '\u{1F1E6}\u{1F1EA}', dubai: '\u{1F1E6}\u{1F1EA}', israel: '\u{1F1EE}\u{1F1F1}',
  russia: '\u{1F1F7}\u{1F1FA}', belgium: '\u{1F1E7}\u{1F1EA}', romania: '\u{1F1F7}\u{1F1F4}', taiwan: '\u{1F1F9}\u{1F1FC}', cuba: '\u{1F1E8}\u{1F1FA}',
  'costa rica': '\u{1F1E8}\u{1F1F7}', panama: '\u{1F1F5}\u{1F1E6}', jamaica: '\u{1F1EF}\u{1F1F2}', scotland: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
}

export function useCountryFlag() {
  const store = useTripStore()

  const flag = computed(() => {
    if (!store.allPlaces.length) return '\u{1F30D}'

    const countryCounts: Record<string, number> = {}
    for (const place of store.allPlaces) {
      const parts = place.address.split(',')
      if (parts.length < 2) continue
      const country = parts[parts.length - 1].trim().toLowerCase()
      countryCounts[country] = (countryCounts[country] || 0) + 1
    }

    let topCountry = ''
    let topCount = 0
    for (const [country, count] of Object.entries(countryCounts)) {
      if (count > topCount) {
        topCount = count
        topCountry = country
      }
    }

    if (!topCountry) return '\u{1F30D}'
    return FLAGS[topCountry] || '\u{1F30D}'
  })

  return { flag }
}
