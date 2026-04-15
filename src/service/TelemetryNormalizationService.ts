import type { AIWeatherCondition } from './AI_Service';

export type NormalizedTelemetryContext = 'route' | 'prone_area';

export interface RouteTelemetryNormalizationInput {
  routeDistanceKm: number;
  canonicalEtaMinutes: number;
  routeTraffic: 'low' | 'moderate' | 'heavy';
  routeHasIncident: boolean;
  baselineMinutes: number;
  congestionPenalty: number;
  hazardPenalty: number;
  topologyPenalty: number;
  syntheticReliability: number;
}

export interface ProneAreaTelemetryNormalizationInput {
  riskScore: number;
  confidence: number;
  radius: number;
  status: string;
  category: string;
  stability: number;
  severityIndex: number;
  categoryWeight: number;
}

export interface NormalizedRouteTelemetry {
  context: 'route';
  distanceKm: number;
  etaMinutes: number;
  trafficClass: 'low' | 'moderate' | 'heavy';
  incidentFlag: boolean;
  baselineMinutes: number;
  congestionPenalty: number;
  hazardPenalty: number;
  topologyPenalty: number;
  reliability: number;
  riskBand: 'steady' | 'guarded' | 'elevated';
  weatherCondition: AIWeatherCondition;
}

export interface NormalizedProneAreaTelemetry {
  context: 'prone_area';
  riskScore: number;
  confidence: number;
  radiusMeters: number;
  status: 'Fixed' | 'Unfixed';
  category: string;
  stability: number;
  severityIndex: number;
  categoryWeight: number;
  riskBand: 'low' | 'moderate' | 'high';
}

export type NormalizedTelemetry = NormalizedRouteTelemetry | NormalizedProneAreaTelemetry;

// ---------------------------------------------------------------------------
// Normalization Policy
// All classification thresholds and clamp bounds are declared here so
// assumptions are explicit, auditable, and modifiable without touching logic.
// ---------------------------------------------------------------------------
export const NORMALIZATION_POLICY = {
  route: {
    /** Reliability below this triggers 'elevated' risk (regardless of incident). */
    reliabilityElevatedThreshold: 0.55,
    /** Reliability below this (but above elevated) triggers 'guarded' risk. */
    reliabilityGuardedThreshold: 0.72,
    /** Max plausible distance in km before clamping. */
    maxDistanceKm: 999,
    /** Max plausible time-delta in minutes before clamping. */
    maxMinutes: 999,
    /** Reliability is always clamped to [0, 1]. */
    reliabilityRange: [0, 1] as [number, number],
  },
  proneArea: {
    /** Severity at or above this triggers 'high' risk band. */
    severityHighThreshold: 8,
    /** Severity at or above this (but below high) triggers 'moderate'. */
    severityModerateThreshold: 5.5,
    /** Stability below this triggers 'high' risk band independent of severity. */
    stabilityLowThreshold: 0.55,
    /** Clamp bounds. */
    riskScoreRange: [0, 10] as [number, number],
    confidenceRange: [0, 100] as [number, number],
    radiusRange: [0, 10000] as [number, number],
    stabilityRange: [0, 1] as [number, number],
    severityRange: [0, 10] as [number, number],
    categoryWeightRange: [0, 1] as [number, number],
  },
} as const;

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

const routeRiskBand = (reliability: number, incidentFlag: boolean): NormalizedRouteTelemetry['riskBand'] => {
  if (incidentFlag || reliability < NORMALIZATION_POLICY.route.reliabilityElevatedThreshold) return 'elevated';
  if (reliability < NORMALIZATION_POLICY.route.reliabilityGuardedThreshold) return 'guarded';
  return 'steady';
};

const proneAreaRiskBand = (severityIndex: number, stability: number): NormalizedProneAreaTelemetry['riskBand'] => {
  const p = NORMALIZATION_POLICY.proneArea;
  if (severityIndex >= p.severityHighThreshold || stability < p.stabilityLowThreshold) return 'high';
  if (severityIndex >= p.severityModerateThreshold) return 'moderate';
  return 'low';
};

const routeWeather = (trafficClass: 'low' | 'moderate' | 'heavy'): AIWeatherCondition => {
  if (trafficClass === 'low') return 'clear';
  if (trafficClass === 'moderate') return 'rainy';
  return 'typhoon';
};

export class TelemetryNormalizationService {
  static normalizeRoute(input: RouteTelemetryNormalizationInput): NormalizedRouteTelemetry {
    const rp = NORMALIZATION_POLICY.route;
    const reliability = clamp(input.syntheticReliability, ...rp.reliabilityRange);
    return {
      context: 'route',
      distanceKm: Number(clamp(input.routeDistanceKm, 0, rp.maxDistanceKm).toFixed(3)),
      etaMinutes: Math.max(0, Math.round(input.canonicalEtaMinutes || 0)),
      trafficClass: input.routeTraffic,
      incidentFlag: Boolean(input.routeHasIncident),
      baselineMinutes: Number(clamp(input.baselineMinutes, 0, rp.maxMinutes).toFixed(1)),
      congestionPenalty: Number(clamp(input.congestionPenalty, 0, rp.maxMinutes).toFixed(1)),
      hazardPenalty: Number(clamp(input.hazardPenalty, 0, rp.maxMinutes).toFixed(1)),
      topologyPenalty: Number(clamp(input.topologyPenalty, 0, rp.maxMinutes).toFixed(1)),
      reliability: Number(reliability.toFixed(3)),
      riskBand: routeRiskBand(reliability, input.routeHasIncident),
      weatherCondition: routeWeather(input.routeTraffic),
    };
  }

  static normalizeProneArea(input: ProneAreaTelemetryNormalizationInput): NormalizedProneAreaTelemetry {
    const ap = NORMALIZATION_POLICY.proneArea;
    const status = input.status === 'Fixed' ? 'Fixed' : 'Unfixed';
    const stability = Number(clamp(input.stability, ...ap.stabilityRange).toFixed(3));
    const severityIndex = Number(clamp(input.severityIndex, ...ap.severityRange).toFixed(2));

    return {
      context: 'prone_area',
      riskScore: Number(clamp(input.riskScore, ...ap.riskScoreRange).toFixed(2)),
      confidence: Number(clamp(input.confidence, ...ap.confidenceRange).toFixed(1)),
      radiusMeters: Number(clamp(input.radius, ...ap.radiusRange).toFixed(0)),
      status,
      category: input.category,
      stability,
      severityIndex,
      categoryWeight: Number(clamp(input.categoryWeight, ...ap.categoryWeightRange).toFixed(2)),
      riskBand: proneAreaRiskBand(severityIndex, stability),
    };
  }
}
