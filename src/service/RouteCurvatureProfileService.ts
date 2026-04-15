import type { RouteSegmentTelemetry } from './RouteXAI_Service';

export interface RouteCurvatureProfile {
  frictionContributionCoefficient: number;
  turnPenaltyMultiplier: number;
  tunedAt: string;
  sampleSize: number;
}

const DEFAULT_PROFILE: RouteCurvatureProfile = {
  frictionContributionCoefficient: 0.35,
  turnPenaltyMultiplier: 1.1,
  tunedAt: new Date(0).toISOString(),
  sampleSize: 0,
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function clamp(value: number, min: number, max: number): number {
  return Number(Math.max(min, Math.min(max, value)).toFixed(3));
}

export class RouteCurvatureProfileService {
  static defaultProfile(): RouteCurvatureProfile {
    return { ...DEFAULT_PROFILE };
  }

  static deriveProfile(samples: RouteSegmentTelemetry[]): RouteCurvatureProfile {
    if (samples.length < 6) {
      return this.defaultProfile();
    }

    const frictionCoefficients = samples
      .filter((segment) => segment.distanceKm > 0 && segment.curvaturePenalty > 0)
      .map((segment) => segment.frictionCost / (segment.distanceKm * segment.curvaturePenalty));

    const turnMultipliers = samples
      .filter((segment) => segment.distanceKm > 0 && segment.curvaturePenalty > 0)
      .map((segment) => {
        const baseTravel = segment.distanceKm / Math.max(1, segment.speedKmh);
        return segment.frictionCost > 0 ? (segment.frictionCost / Math.max(0.0001, baseTravel)) : 1.1;
      });

    const frictionContributionCoefficient = clamp(median(frictionCoefficients) || DEFAULT_PROFILE.frictionContributionCoefficient, 0.1, 0.8);
    const turnPenaltyMultiplier = clamp(median(turnMultipliers) || DEFAULT_PROFILE.turnPenaltyMultiplier, 0.6, 2.0);

    return {
      frictionContributionCoefficient,
      turnPenaltyMultiplier,
      tunedAt: new Date().toISOString(),
      sampleSize: samples.length,
    };
  }

  static resolveFrictionCoefficient(profile: RouteCurvatureProfile | undefined): number {
    return profile?.frictionContributionCoefficient ?? DEFAULT_PROFILE.frictionContributionCoefficient;
  }

  static resolveTurnMultiplier(profile: RouteCurvatureProfile | undefined): number {
    return profile?.turnPenaltyMultiplier ?? DEFAULT_PROFILE.turnPenaltyMultiplier;
  }
}
