import { createTile, distanceToSegmentKm, calculateDistance } from './MapUtilities';

export type FloodTileLevel = 'low' | 'medium' | 'high';

export interface FloodTile {
  positions: [number, number][];
  level: FloodTileLevel;
}

export const floodHeatColors: Record<FloodTileLevel, { fill: string; stroke: string; opacity: number }> = {
  low: { fill: '#FDE047', stroke: '#FBBF24', opacity: 0.42 },
  medium: { fill: '#F97316', stroke: '#FB923C', opacity: 0.5 },
  high: { fill: '#EF4444', stroke: '#F87171', opacity: 0.58 },
};

export const pampangaBounds = {
  south: 14.80,
  north: 15.25,
  west: 120.39,
  east: 120.86,
};

export const floodInfluenceCenters: Array<{ lat: number; lng: number; weight: number }> = [
  { lat: 15.0333, lng: 120.6833, weight: 0.72 },
  { lat: 15.1450, lng: 120.5850, weight: 0.92 },
  { lat: 15.2160, lng: 120.6520, weight: 0.88 },
  { lat: 15.1020, lng: 120.7300, weight: 0.84 },
  { lat: 14.9500, lng: 120.6400, weight: 0.78 },
];

export const floodCorridors: Array<[[number, number], [number, number]]> = [
  [[14.86, 120.44], [15.22, 120.80]],
  [[14.92, 120.40], [15.18, 120.72]],
  [[14.84, 120.56], [15.24, 120.62]],
];

export const trafficThoroughfares = [
  {
    name: "Jose Abad Santos Ave (East-West)",
    path: [[15.0333, 120.6500], [15.0333, 120.7200]] as [number, number][],
    status: 'heavy',
  },
  {
    name: "MacArthur Highway (Main North)",
    path: [[14.9800, 120.6898], [15.0286, 120.6898], [15.0800, 120.6898]] as [number, number][],
    status: 'moderate',
  },
  {
    name: "Olongapo-Gapan Road",
    path: [[15.0333, 120.6833], [15.1000, 120.8000]] as [number, number][],
    status: 'fluid',
  }
];

export const trafficColors: Record<string, string> = {
  heavy: "#ef4444", // Red
  moderate: "#f59e0b", // Amber
  fluid: "#22c55e", // Green
};

export const SAN_FERNANDO_BOUNDS = {
  minLat: 14.95, maxLat: 15.10,
  minLng: 120.60, maxLng: 120.78
};

export const isWithinSanFernando = (lat: number, lng: number) => {
  return lat >= SAN_FERNANDO_BOUNDS.minLat && lat <= SAN_FERNANDO_BOUNDS.maxLat &&
    lng >= SAN_FERNANDO_BOUNDS.minLng && lng <= SAN_FERNANDO_BOUNDS.maxLng;
};

// Flood tiles generated via raster propagation (cell-based flood spread)
export const generateFloodTiles = (): FloodTile[] => {
  const tiles: FloodTile[] = [];
  const rows = 96;
  const cols = 96;
  const iterations = 12;
  const latStep = (pampangaBounds.north - pampangaBounds.south) / rows;
  const lngStep = (pampangaBounds.east - pampangaBounds.west) / cols;

  const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
  const index = (r: number, c: number) => r * cols + c;

  // Raster field storing flood intensity per cell.
  const field = new Float32Array(rows * cols);

  // Seed 1: flood epicenters (historical hotspot origins).
  floodInfluenceCenters.forEach(center => {
    const r = Math.floor(((center.lat - pampangaBounds.south) / (pampangaBounds.north - pampangaBounds.south)) * rows);
    const c = Math.floor(((center.lng - pampangaBounds.west) / (pampangaBounds.east - pampangaBounds.west)) * cols);
    if (r >= 0 && r < rows && c >= 0 && c < cols) {
      field[index(r, c)] = clamp01(field[index(r, c)] + center.weight);
    }
  });

  // Seed 2: corridor traces (drainage overflow / river-like channels).
  floodCorridors.forEach(([start, end]) => {
    const samples = 42;
    for (let t = 0; t <= samples; t++) {
      const ratio = t / samples;
      const lat = start[0] + (end[0] - start[0]) * ratio;
      const lng = start[1] + (end[1] - start[1]) * ratio;
      const r = Math.floor(((lat - pampangaBounds.south) / (pampangaBounds.north - pampangaBounds.south)) * rows);
      const c = Math.floor(((lng - pampangaBounds.west) / (pampangaBounds.east - pampangaBounds.west)) * cols);
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        field[index(r, c)] = clamp01(field[index(r, c)] + 0.65);
      }
    }
  });

  // Diffusion loop: propagate flood intensity to neighboring cells.
  for (let step = 0; step < iterations; step++) {
    const next = new Float32Array(field.length);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const self = field[index(r, c)];
        let neighborSum = 0;
        let neighborCount = 0;

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const rr = r + dr;
            const cc = c + dc;
            if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
              neighborSum += field[index(rr, cc)];
              neighborCount++;
            }
          }
        }

        const neighborAvg = neighborCount > 0 ? neighborSum / neighborCount : 0;

        const lat = pampangaBounds.south + (r + 0.5) * latStep;
        const lng = pampangaBounds.west + (c + 0.5) * lngStep;
        const corridorDistance = Math.min(
          ...floodCorridors.map(([start, end]) => distanceToSegmentKm(lat, lng, start, end))
        );
        const corridorPull = clamp01(1 - corridorDistance / 8.5);
        const terrainBias = Math.max(0, 1 - calculateDistance(lat, lng, 15.05, 120.64) / 90);
        const noise = (Math.sin(lat * 52 + lng * 3.2) + Math.cos(lng * 47 - lat * 3.8)) * 0.02;

        // Weighted blend: self retention + diffusion + geography bias.
        const propagated = self * 0.58 + neighborAvg * 0.34 + corridorPull * 0.05 + terrainBias * 0.03 + noise;
        next[index(r, c)] = clamp01(propagated);
      }
    }

    for (let i = 0; i < field.length; i++) field[i] = next[i];
  }

  // Raster-to-polygons conversion for Leaflet display.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const intensity = field[index(r, c)];
      if (intensity < 0.09) continue;

      const lat = pampangaBounds.south + (r + 0.5) * latStep;
      const lng = pampangaBounds.west + (c + 0.5) * lngStep;
      const level: FloodTileLevel = intensity > 0.66 ? 'high' : intensity > 0.36 ? 'medium' : 'low';

      tiles.push({
        level,
        positions: createTile(lat, lng, latStep * 1.06, lngStep * 1.06),
      });
    }
  }

  return tiles;
};
