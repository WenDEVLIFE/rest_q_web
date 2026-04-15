const MAPTILER_KEY = process.env.NEXT_PUBLIC_OPEN_MAPTILER_API_KEY;
const BASE_URL = 'https://api.maptiler.com/geocoding';

export interface GeocodingResult {
  id: string;
  text: string;
  place_name: string;
  center: [number, number]; // [lng, lat]
}

/**
 * Service to handle geocoding search using MapTiler API.
 * Biased towards San Fernando, Pampanga.
 */
export const getAddressSuggestions = async (query: string): Promise<GeocodingResult[]> => {
  if (!query || query.length < 3) return [];

  // Bounding box for San Fernando, Pampanga area
  // format: minLon,minLat,maxLon,maxLat
  const bbox = '120.60,15.00,120.75,15.15';
  const proximity = '120.6848,15.0333'; // Center of San Fernando

  try {
    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&bbox=${bbox}&proximity=${proximity}&autocomplete=true`
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    return data.features.map((feature: any) => ({
      id: feature.id,
      text: feature.text,
      place_name: feature.place_name,
      center: feature.center,
    }));
  } catch (error) {
    console.error('MapTiler Geocoding Error:', error);
    return [];
  }
};

/**
 * Reverse geocoding by coordinates -> full address label.
 */
export const getAddressFromCoordinates = async (
  lat: number,
  lng: number
): Promise<string | null> => {
  try {
    const response = await fetch(
      `${BASE_URL}/${lng},${lat}.json?key=${MAPTILER_KEY}`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }

    const data = await response.json();
    const feature = data?.features?.[0];

    if (!feature) return null;
    return feature.place_name || feature.text || null;
  } catch (error) {
    console.error('MapTiler Reverse Geocoding Error:', error);
    return null;
  }
};
