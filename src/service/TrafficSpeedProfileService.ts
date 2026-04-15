import type { TrafficSegment } from './Traffic_Service';
import type { TrafficStatus } from './RouteXAI_Service';

export interface TrafficSpeedProfile {
  fluid: number;
  moderate: number;
  heavy: number;
  tunedAt: string;
  sampleSize: number;
}

const DEFAULT_PROFILE: TrafficSpeedProfile = {
  fluid: 44,
  moderate: 28,
  heavy: 16,
  tunedAt: new Date(0).toISOString(),
  sampleSize: 0,
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function clampSpeed(value: number): number {
  return Math.max(8, Math.min(65, Number(value.toFixed(1))));
}

export class TrafficSpeedProfileService {
  static defaultProfile(): TrafficSpeedProfile {
    return { ...DEFAULT_PROFILE };
  }

  static deriveProfile(samples: TrafficSegment[]): TrafficSpeedProfile {
    if (samples.length < 6) {
      return this.defaultProfile();
    }

    const statusSpeeds: Record<TrafficStatus, number[]> = {
      fluid: [],
      moderate: [],
      heavy: [],
    };

    for (const sample of samples) {
      if (Number.isFinite(sample.speedKmh) && sample.speedKmh > 0) {
        statusSpeeds[sample.status].push(sample.speedKmh);
      }
    }

    const fluid = clampSpeed(median(statusSpeeds.fluid) || DEFAULT_PROFILE.fluid);
    const moderate = clampSpeed(median(statusSpeeds.moderate) || DEFAULT_PROFILE.moderate);
    const heavy = clampSpeed(median(statusSpeeds.heavy) || DEFAULT_PROFILE.heavy);

    return {
      fluid: Math.max(fluid, moderate + 4),
      moderate: Math.max(20, Math.min(moderate, fluid - 4)),
      heavy: Math.max(8, Math.min(heavy, moderate - 4)),
      tunedAt: new Date().toISOString(),
      sampleSize: samples.length,
    };
  }

  static resolveSpeed(profile: TrafficSpeedProfile | undefined, status: TrafficStatus): number {
    const active = profile || DEFAULT_PROFILE;
    return active[status];
  }
}
