import type { RouteSegmentTelemetry, TrafficStatus } from './RouteXAI_Service';

export interface TrafficCongestionProfile {
  fluid: number;
  moderate: number;
  heavy: number;
  tunedAt: string;
  sampleSize: number;
}

const DEFAULT_PROFILE: TrafficCongestionProfile = {
  fluid: 0.22,
  moderate: 0.56,
  heavy: 0.92,
  tunedAt: new Date(0).toISOString(),
  sampleSize: 0,
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function clampWeight(value: number): number {
  return Number(Math.max(0.05, Math.min(0.98, value)).toFixed(2));
}

export class TrafficCongestionProfileService {
  static defaultProfile(): TrafficCongestionProfile {
    return { ...DEFAULT_PROFILE };
  }

  static deriveProfile(samples: RouteSegmentTelemetry[]): TrafficCongestionProfile {
    if (samples.length < 6) {
      return this.defaultProfile();
    }

    const weights: Record<TrafficStatus, number[]> = {
      fluid: [],
      moderate: [],
      heavy: [],
    };

    for (const sample of samples) {
      if (Number.isFinite(sample.congestionWeight)) {
        weights[sample.trafficStatus].push(sample.congestionWeight);
      }
    }

    const fluid = clampWeight(median(weights.fluid) || DEFAULT_PROFILE.fluid);
    const moderate = clampWeight(median(weights.moderate) || DEFAULT_PROFILE.moderate);
    const heavy = clampWeight(median(weights.heavy) || DEFAULT_PROFILE.heavy);

    return {
      fluid: Math.min(fluid, moderate - 0.1),
      moderate: Math.max(fluid + 0.1, Math.min(moderate, heavy - 0.1)),
      heavy: Math.max(moderate + 0.1, heavy),
      tunedAt: new Date().toISOString(),
      sampleSize: samples.length,
    };
  }

  static resolveWeight(profile: TrafficCongestionProfile | undefined, status: TrafficStatus): number {
    const active = profile || DEFAULT_PROFILE;
    return active[status];
  }
}
