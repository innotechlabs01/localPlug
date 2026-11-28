export interface LocalPlace {
  id: string
  label: string
  detail: string
  lat: number
  lng: number
  keywords: string[]
}

/**
 * Hand-verified anchors inside the Medellín metro area. They guarantee that
 * the common destinations resolve to real coordinates even when OSM's free
 * text index has no matching feature for a neighbourhood name.
 */
export const LOCAL_PLACES: LocalPlace[] = [
  {
    id: 'local-provenza',
    label: 'Provenza, El Poblado',
    detail: 'Medellín, Antioquia, Colombia',
    // Provenza/Parque Lleras area, distinct from the map's default centre.
    lat: 6.2088,
    lng: -75.5627,
    keywords: ['provenza', 'poblado'],
  },
  {
    id: 'local-el-poblado',
    label: 'El Poblado',
    detail: 'Medellín, Antioquia, Colombia',
    lat: 6.2146,
    lng: -75.5395,
    keywords: ['el poblado', 'poblado'],
  },
  {
    id: 'local-laureles',
    label: 'Laureles',
    detail: 'Medellín, Antioquia, Colombia',
    lat: 6.2445,
    lng: -75.605,
    keywords: ['laureles', 'laureles - estadio'],
  },
  {
    id: 'local-envigado',
    label: 'Envigado',
    detail: 'Antioquia, Colombia',
    lat: 6.1717,
    lng: -75.585,
    keywords: ['envigado'],
  },
  {
    id: 'local-jmc',
    label: 'Aeropuerto Internacional José María Córdova',
    detail: 'Rionegro, Antioquia, Colombia',
    lat: 6.1566,
    lng: -75.7422,
    keywords: ['aeropuerto', 'airport', 'jmc', 'mde', 'cordova', 'córdova', 'rionegro'],
  },
]

export function normalizePlaceText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-CO')
}

export function filterLocalPlaces(query: string): LocalPlace[] {
  const needle = normalizePlaceText(query.trim())
  if (needle.length < 2) return []
  return LOCAL_PLACES.filter((place) =>
    normalizePlaceText(`${place.label} ${place.detail} ${place.keywords.join(' ')}`).includes(needle),
  )
}
