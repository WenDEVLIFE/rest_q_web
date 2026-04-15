import { RouteEtaBreakdownService } from './RouteEtaBreakdownService';

export type TrafficStatus = 'fluid' | 'moderate' | 'heavy';

export interface RouteSegmentTelemetry {
  index: number;
  start: [number, number];
  end: [number, number];
  midpoint: [number, number];
  distanceKm: number;
  bearingDeg: number;
  trafficStatus: TrafficStatus;
  speedKmh: number;
  congestionWeight: number;
  curvaturePenalty: number;
  frictionCost: number;
}

export interface RouteTelemetry {
  totalDistanceKm: number;
  estimatedMinutes: number;
  trafficEntropy: number;
  graphFrictionIndex: number;
  spectralCongestionEnergy: number;
  reliabilityIndex: number;
  segmentCount: number;
  statusBreakdownKm: Record<TrafficStatus, number>;
  segments: RouteSegmentTelemetry[];
  formulas: {
    eta: string;
    friction: string;
    entropy: string;
    spectral: string;
  };
}

export interface RouteSpeedProfile {
  fluid: number;
  moderate: number;
  heavy: number;
  tunedAt?: string;
  sampleSize?: number;
}

export interface RouteCongestionProfile {
  fluid: number;
  moderate: number;
  heavy: number;
  tunedAt?: string;
  sampleSize?: number;
}

export interface RouteCurvatureProfile {
  frictionContributionCoefficient: number;
  turnPenaltyMultiplier: number;
  tunedAt?: string;
  sampleSize?: number;
}

export interface RouteUrbanDelayProfile {
  baseDelayMinutes: number;
  distanceMultiplier: number;
  capDelayMinutes: number;
  heavyTrafficBonusMinutes: number;
  tunedAt?: string;
  sampleSize?: number;
}

const SPEED_BY_STATUS: Record<TrafficStatus, number> = {
  fluid: 44,
  moderate: 28,
  heavy: 16,
};

const WEIGHT_BY_STATUS: Record<TrafficStatus, number> = {
  fluid: 0.22,
  moderate: 0.56,
  heavy: 0.92,
};

const toRad = (v: number) => (v * Math.PI) / 180;

export function sampleRoutePoints(routePoints: [number, number][], maxPoints = 90): [number, number][] {
  if (routePoints.length <= maxPoints) return routePoints;

  const sampled: [number, number][] = [routePoints[0]];
  const stride = Math.ceil((routePoints.length - 1) / (maxPoints - 1));

  for (let i = stride; i < routePoints.length - 1; i += stride) {
    sampled.push(routePoints[i]);
  }

  sampled.push(routePoints[routePoints.length - 1]);
  return sampled;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const aa =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

function bearingDegrees(a: [number, number], b: [number, number]): number {
  const y = Math.sin(toRad(b[1] - a[1])) * Math.cos(toRad(b[0]));
  const x =
    Math.cos(toRad(a[0])) * Math.sin(toRad(b[0])) -
    Math.sin(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.cos(toRad(b[1] - a[1]));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function angleDeltaDeg(prev: number, next: number): number {
  const diff = Math.abs(prev - next);
  return diff > 180 ? 360 - diff : diff;
}

function safeEntropy(values: number[]): number {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return 0;
  let h = 0;
  for (const v of values) {
    if (v <= 0) continue;
    const p = v / total;
    h += -p * Math.log2(p);
  }
  return h;
}

// Simple DFT-like congestion signal energy to capture alternating stress patterns.
function spectralEnergy(weights: number[]): number {
  if (weights.length === 0) return 0;
  const N = weights.length;
  let energy = 0;

  for (let k = 1; k <= Math.min(4, N - 1); k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const theta = (-2 * Math.PI * k * n) / N;
      re += weights[n] * Math.cos(theta);
      im += weights[n] * Math.sin(theta);
    }
    energy += (re * re + im * im) / N;
  }

  return energy;
}

export class RouteXAIService {
  static buildTelemetry(
    routePoints: [number, number][],
    statuses: TrafficStatus[],
    speedProfile?: RouteSpeedProfile,
    congestionProfile?: RouteCongestionProfile,
    curvatureProfile?: RouteCurvatureProfile,
    urbanDelayProfile?: RouteUrbanDelayProfile
  ): RouteTelemetry {
    const segments: RouteSegmentTelemetry[] = [];
    const sampledRoutePoints = sampleRoutePoints(routePoints);

    if (sampledRoutePoints.length < 2) {
      return {
        totalDistanceKm: 0,
        estimatedMinutes: 0,
        trafficEntropy: 0,
        graphFrictionIndex: 0,
        spectralCongestionEnergy: 0,
        reliabilityIndex: 0,
        segmentCount: 0,
        statusBreakdownKm: { fluid: 0, moderate: 0, heavy: 0 },
        segments,
        formulas: {
          eta: 'T = sum_i(distance_i / speed_i) + urban_delay + turn_penalty',
          friction: 'F = sum_i(distance_i * congestion_weight_i)',
          entropy: 'H = -sum_j(p_j * log2(p_j))',
          spectral: 'E = sum_k(|DFT_k(congestion_series)|^2 / N)',
        },
      };
    }

    let totalDistanceKm = 0;
    const statusBreakdownKm: Record<TrafficStatus, number> = {
      fluid: 0,
      moderate: 0,
      heavy: 0,
    };

    const bearings: number[] = [];

    const sampledSegmentCount = sampledRoutePoints.length - 1;
    const sourceSegmentCount = Math.max(1, statuses.length);

    for (let i = 1; i < sampledRoutePoints.length; i++) {
      const start = sampledRoutePoints[i - 1];
      const end = sampledRoutePoints[i];
      const midpoint: [number, number] = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      const distanceKm = haversineKm(start, end);
      const normalizedIdx = Math.floor(((i - 1) / Math.max(1, sampledSegmentCount - 1)) * (sourceSegmentCount - 1));
      const trafficStatus = statuses[normalizedIdx] || 'moderate';
      const speedKmh = (speedProfile || SPEED_BY_STATUS)[trafficStatus];
      const congestionWeight = (congestionProfile || WEIGHT_BY_STATUS)[trafficStatus];
      const bearingDeg = bearingDegrees(start, end);
      bearings.push(bearingDeg);

      totalDistanceKm += distanceKm;
      statusBreakdownKm[trafficStatus] += distanceKm;

      segments.push({
        index: i - 1,
        start,
        end,
        midpoint,
        distanceKm,
        bearingDeg,
        trafficStatus,
        speedKmh,
        congestionWeight,
        curvaturePenalty: 0,
        frictionCost: 0,
      });
    }

    // Curvature penalty from directional changes.
    for (let i = 0; i < segments.length; i++) {
      if (i === 0 || i === segments.length - 1) {
        segments[i].curvaturePenalty = 0.08;
      } else {
        const delta = angleDeltaDeg(bearings[i - 1], bearings[i]);
        segments[i].curvaturePenalty = Math.min(0.65, delta / 180);
      }

      segments[i].frictionCost =
        segments[i].distanceKm *
        (segments[i].congestionWeight + segments[i].curvaturePenalty * (curvatureProfile?.frictionContributionCoefficient ?? 0.35));
    }

    const graphFrictionIndex = segments.reduce((sum, s) => sum + s.frictionCost, 0);

    const averageCurvature = segments.length > 0
      ? segments.reduce((sum, s) => sum + s.curvaturePenalty, 0) / segments.length
      : 0;

    const etaBreakdown = RouteEtaBreakdownService.calculate(
      totalDistanceKm,
      statusBreakdownKm,
      averageCurvature,
      speedProfile,
      congestionProfile,
      curvatureProfile,
      urbanDelayProfile
    );
    const estimatedMinutes = etaBreakdown.totalMinutes;

    const entropyInput = [
      statusBreakdownKm.fluid,
      statusBreakdownKm.moderate,
      statusBreakdownKm.heavy,
    ];
    const trafficEntropy = safeEntropy(entropyInput);

    const spectralCongestionEnergy = spectralEnergy(segments.map((s) => s.congestionWeight));

    const normalizedStress = Math.min(1, graphFrictionIndex / Math.max(0.01, totalDistanceKm * 1.05));
    const reliabilityIndex = Number(
      (1 - Math.min(0.92, normalizedStress * 0.65 + (trafficEntropy / 2) * 0.25)).toFixed(3)
    );

    return {
      totalDistanceKm: Number(totalDistanceKm.toFixed(3)),
      estimatedMinutes,
      trafficEntropy: Number(trafficEntropy.toFixed(3)),
      graphFrictionIndex: Number(graphFrictionIndex.toFixed(3)),
      spectralCongestionEnergy: Number(spectralCongestionEnergy.toFixed(3)),
      reliabilityIndex,
      segmentCount: segments.length,
      statusBreakdownKm: {
        fluid: Number(statusBreakdownKm.fluid.toFixed(3)),
        moderate: Number(statusBreakdownKm.moderate.toFixed(3)),
        heavy: Number(statusBreakdownKm.heavy.toFixed(3)),
      },
      segments,
      formulas: {
        eta: 'T = sum_i(distance_i / speed_i) + urban_delay + turn_penalty',
        friction: 'F = sum_i(distance_i * (w_i + 0.35 * kappa_i))',
        entropy: 'H = -sum_j(p_j * log2(p_j)) where j in {fluid,moderate,heavy}',
        spectral: 'E = sum_k(|DFT_k(w_congestion)|^2 / N), k=1..4',
      },
    };
  }
}
