export interface RouteUrbanDelayProfile {
  baseDelayMinutes: number;
  distanceMultiplier: number;
  capDelayMinutes: number;
  heavyTrafficBonusMinutes: number;
  tunedAt: string;
  sampleSize: number;
}

export interface RouteUrbanDelayObservation {
  distanceKm: number;
  observedDelayMinutes: number;
  trafficIntensity: 'fluid' | 'moderate' | 'heavy';
}

const DEFAULT_PROFILE: RouteUrbanDelayProfile = {
  baseDelayMinutes: 1.5,
  distanceMultiplier: 0.22,
  capDelayMinutes: 10,
  heavyTrafficBonusMinutes: 0,
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

export class RouteUrbanDelayProfileService {
  static defaultProfile(): RouteUrbanDelayProfile {
    return { ...DEFAULT_PROFILE };
  }

  static deriveProfile(observations: RouteUrbanDelayObservation[]): RouteUrbanDelayProfile {
    if (observations.length < 6) {
      return this.defaultProfile();
    }

    const baseCandidates: number[] = [];
    const multiplierCandidates: number[] = [];
    const capCandidates: number[] = [];
    let heavyTrafficCount = 0;

    for (const obs of observations) {
      if (!Number.isFinite(obs.distanceKm) || obs.distanceKm <= 0) continue;
      const normalizedDelay = Math.max(0, obs.observedDelayMinutes);
      const perKm = normalizedDelay / obs.distanceKm;

      baseCandidates.push(normalizedDelay);
      multiplierCandidates.push(perKm);
      capCandidates.push(normalizedDelay);

      if (obs.trafficIntensity === 'heavy') {
        heavyTrafficCount++;
      }
    }

    const sampleSize = baseCandidates.length;
    if (sampleSize < 6) {
      return this.defaultProfile();
    }

    const baseDelayMinutes = clamp(median(baseCandidates) * 0.35, 0.5, 4.5);
    const distanceMultiplier = clamp(median(multiplierCandidates) * 0.12, 0.08, 0.35);
    const capDelayMinutes = clamp(median(capCandidates) * 1.55, 6, 18);
    const heavyTrafficBonusMinutes = clamp((heavyTrafficCount / sampleSize) * 2.0, 0, 3);

    return {
      baseDelayMinutes,
      distanceMultiplier,
      capDelayMinutes,
      heavyTrafficBonusMinutes,
      tunedAt: new Date().toISOString(),
      sampleSize,
    };
  }

  static resolveDelay(
    distanceKm: number,
    trafficIntensity: 'fluid' | 'moderate' | 'heavy',
    profile?: RouteUrbanDelayProfile
  ): number {
    const active = profile || DEFAULT_PROFILE;
    const raw = active.baseDelayMinutes + distanceKm * active.distanceMultiplier + (trafficIntensity === 'heavy' ? active.heavyTrafficBonusMinutes : 0);
    return Math.max(0, Math.min(active.capDelayMinutes, raw));
  }
}
