import { Incident } from '../types/incident';
import { ProneArea } from '../types/prone_area';

export interface TyphoonContext {
  lat: number;
  lng: number;
  speed: number;
  forecastPath?: [number, number][];
}

export interface PredictedProneArea {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  category: 'Flood' | 'Accident' | 'Other';
  status: 'Unfixed';
  notes: string;
  confidence: number; // 0-100
  riskScore: number; // 0-10
  updatedAt: Date;
  source: 'forecast-model';
}

const SAN_FERNANDO_BOUNDS = {
  minLat: 14.95,
  maxLat: 15.10,
  minLng: 120.60,
  maxLng: 120.78,
};

const isWithinSanFernando = (lat: number, lng: number) =>
  lat >= SAN_FERNANDO_BOUNDS.minLat &&
  lat <= SAN_FERNANDO_BOUNDS.maxLat &&
  lng >= SAN_FERNANDO_BOUNDS.minLng &&
  lng <= SAN_FERNANDO_BOUNDS.maxLng;

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export class ProneAreaPredictionService {
  /**
   * Predicts near-term prone zones using typhoon trajectory + incident pressure + known prone areas.
   */
  static predictProneAreas(params: {
    typhoon: TyphoonContext | null;
    incidents: Incident[];
    existingProneAreas: ProneArea[];
  }): PredictedProneArea[] {
    const { typhoon, incidents, existingProneAreas } = params;
    if (!typhoon) return [];

    const rawPath = typhoon.forecastPath && typhoon.forecastPath.length > 0
      ? typhoon.forecastPath
      : [[typhoon.lat, typhoon.lng] as [number, number]];

    const candidatePath = rawPath.filter(([lat, lng]) => isWithinSanFernando(lat, lng)).slice(0, 4);
    if (candidatePath.length === 0) return [];

    return candidatePath.map(([lat, lng], idx) => {
      const nearIncidents = incidents.filter((inc) => {
        const d = haversineKm(lat, lng, inc.location.lat, inc.location.lng);
        return d <= 1.8;
      });

      const nearKnownFloodZones = existingProneAreas.filter((zone) => {
        if (zone.category !== 'Flood') return false;
        const d = haversineKm(lat, lng, zone.lat, zone.lng);
        return d <= 2.5;
      });

      const severityBoost = nearIncidents.reduce((sum, inc) => {
        return sum + (inc.severity === 'high' ? 1.3 : inc.severity === 'medium' ? 0.9 : 0.6);
      }, 0);

      const incidentPressure = Math.min(1, (nearIncidents.length * 0.18) + (severityBoost * 0.08));
      const historicalPressure = Math.min(1, nearKnownFloodZones.length * 0.2);
      const typhoonPressure = Math.min(1, (typhoon.speed || 0) / 120);

      const riskScoreRaw = 0.50 * typhoonPressure + 0.30 * incidentPressure + 0.20 * historicalPressure;
      const riskScore = Math.max(0, Math.min(10, Number((riskScoreRaw * 10).toFixed(1))));
      const confidence = Math.max(55, Math.min(96, Math.round(50 + riskScoreRaw * 46)));

      const radius = Math.round(420 + riskScore * 45 + nearIncidents.length * 18);

      return {
        id: `pred-${idx}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        name: `Predicted Flood Zone ${idx + 1}`,
        lat,
        lng,
        radius,
        category: 'Flood' as const,
        status: 'Unfixed' as const,
        notes: `Forecast-based zone from typhoon trajectory, nearby incidents (${nearIncidents.length}), and historical flood pressure (${nearKnownFloodZones.length} zones).`,
        confidence,
        riskScore,
        updatedAt: new Date(),
        source: 'forecast-model' as const,
      };
    });
  }
}
