import type { RouteTelemetry } from './RouteXAI_Service';

export interface RouteMetricThresholds {
  friction: { low: number; high: number };
  entropy: { low: number; high: number };
  reliability: { low: number; high: number };
  sampleSize: number;
  tunedAt: string;
}

export interface RouteMetricBands {
  friction: 'low' | 'moderate' | 'high';
  entropy: 'low' | 'moderate' | 'high';
  reliability: 'low' | 'moderate' | 'high';
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function toSorted(values: number[]): number[] {
  return values
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
}

function bandByThreshold(value: number, low: number, high: number): 'low' | 'moderate' | 'high' {
  if (value <= low) return 'low';
  if (value >= high) return 'high';
  return 'moderate';
}

/**
 * Workflow for tuning metric thresholds from historical route telemetry.
 * Uses percentile bands (P35/P75) to avoid sensitivity to outliers.
 */
export class RouteThresholdTuner {
  static defaultThresholds(): RouteMetricThresholds {
    return {
      friction: { low: 0.35, high: 0.8 },
      entropy: { low: 0.45, high: 1.1 },
      reliability: { low: 0.35, high: 0.75 },
      sampleSize: 0,
      tunedAt: new Date(0).toISOString(),
    };
  }

  static tuneThresholds(samples: RouteTelemetry[]): RouteMetricThresholds {
    if (samples.length < 8) {
      return this.defaultThresholds();
    }

    const friction = toSorted(samples.map((s) => s.graphFrictionIndex / Math.max(0.5, s.totalDistanceKm)));
    const entropy = toSorted(samples.map((s) => s.trafficEntropy));
    const reliability = toSorted(samples.map((s) => s.reliabilityIndex));

    const thresholds: RouteMetricThresholds = {
      friction: {
        low: Number(quantile(friction, 0.35).toFixed(3)),
        high: Number(quantile(friction, 0.75).toFixed(3)),
      },
      entropy: {
        low: Number(quantile(entropy, 0.35).toFixed(3)),
        high: Number(quantile(entropy, 0.75).toFixed(3)),
      },
      reliability: {
        low: Number(quantile(reliability, 0.25).toFixed(3)),
        high: Number(quantile(reliability, 0.65).toFixed(3)),
      },
      sampleSize: samples.length,
      tunedAt: new Date().toISOString(),
    };

    if (thresholds.friction.high <= thresholds.friction.low) {
      thresholds.friction.high = Number((thresholds.friction.low + 0.1).toFixed(3));
    }
    if (thresholds.entropy.high <= thresholds.entropy.low) {
      thresholds.entropy.high = Number((thresholds.entropy.low + 0.1).toFixed(3));
    }
    if (thresholds.reliability.high <= thresholds.reliability.low) {
      thresholds.reliability.high = Number((thresholds.reliability.low + 0.1).toFixed(3));
    }

    return thresholds;
  }

  static classifyMetrics(
    telemetry: RouteTelemetry,
    thresholds: RouteMetricThresholds = RouteThresholdTuner.defaultThresholds()
  ): RouteMetricBands {
    const frictionNorm = telemetry.graphFrictionIndex / Math.max(0.5, telemetry.totalDistanceKm);

    const frictionBand = bandByThreshold(frictionNorm, thresholds.friction.low, thresholds.friction.high);
    const entropyBand = bandByThreshold(telemetry.trafficEntropy, thresholds.entropy.low, thresholds.entropy.high);

    // Reliability is inverse-severity: high reliability is good, low reliability is risky.
    const reliabilityBand = telemetry.reliabilityIndex >= thresholds.reliability.high
      ? 'high'
      : telemetry.reliabilityIndex <= thresholds.reliability.low
        ? 'low'
        : 'moderate';

    return {
      friction: frictionBand,
      entropy: entropyBand,
      reliability: reliabilityBand,
    };
  }
}
