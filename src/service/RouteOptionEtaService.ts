export type RouteTrafficClass = 'low' | 'moderate' | 'heavy';

export interface RouteOptionEtaInput {
  distKm: number;
  traffic: RouteTrafficClass;
  etaMinutes: number;
  confidence: number;
}

export class RouteOptionEtaService {
  static estimate(input: RouteOptionEtaInput): number {
    if (!Number.isFinite(input.distKm) || input.distKm <= 0) {
      return Math.max(0, Math.round(input.etaMinutes || 0));
    }

    if (input.confidence) {
      return Math.max(0, Math.round(input.etaMinutes || 0));
    }

    const trafficMultiplier = input.traffic === 'low' ? 1.2 : input.traffic === 'moderate' ? 1.6 : 2.0;
    return Math.max(0, Math.round(input.distKm * 2.5 * trafficMultiplier));
  }
}
