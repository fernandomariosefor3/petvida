export type ServiceCategory = 'vet' | 'petshop' | 'park';

export interface NearbyPlace {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category: ServiceCategory;
  phone?: string;
  is24h?: boolean;
  address?: string;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const CATEGORY_TAGS: Record<ServiceCategory, [key: string, value: string]> = {
  vet: ['amenity', 'veterinary'],
  petshop: ['shop', 'pet'],
  park: ['leisure', 'park'],
};

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * Live query against OpenStreetMap's Overpass API — never a stored or
 * fabricated dataset. Fields the source data doesn't have (phone, 24h)
 * stay undefined instead of being guessed, so the UI never shows a fact
 * that wasn't actually in OSM.
 */
export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusMeters: number,
  categories: ServiceCategory[]
): Promise<NearbyPlace[]> {
  const filters = categories
    .map((c) => CATEGORY_TAGS[c])
    .map(([key, value]) => `["${key}"="${value}"]`);

  const around = `(around:${radiusMeters},${lat},${lon})`;
  const clauses = filters
    .map((f) => `node${f}${around};way${f}${around};`)
    .join('\n  ');

  const query = `[out:json][timeout:15];\n(\n  ${clauses}\n);\nout center tags;`;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: query,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Overpass API respondeu ${res.status}`);
  }

  const data = (await res.json()) as { elements: OverpassElement[] };
  const categoryByTags = (tags: Record<string, string>): ServiceCategory | null => {
    for (const [category, [key, value]] of Object.entries(CATEGORY_TAGS) as [ServiceCategory, [string, string]][]) {
      if (tags[key] === value) return category;
    }
    return null;
  };

  return data.elements
    .map((el): NearbyPlace | null => {
      const tags = el.tags ?? {};
      const category = categoryByTags(tags);
      const placeLat = el.lat ?? el.center?.lat;
      const placeLon = el.lon ?? el.center?.lon;
      if (!category || placeLat === undefined || placeLon === undefined || !tags.name) return null;

      const openingHours = tags.opening_hours ?? '';
      return {
        id: `${el.type}/${el.id}`,
        name: tags.name,
        lat: placeLat,
        lon: placeLon,
        category,
        phone: tags.phone ?? tags['contact:phone'] ?? undefined,
        is24h: openingHours.includes('24/7') || undefined,
        address: [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(', ') || undefined,
      };
    })
    .filter((place): place is NearbyPlace => place !== null);
}
