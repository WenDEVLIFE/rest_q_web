import type { RouteTelemetry, TrafficStatus } from './RouteXAI_Service';

export interface StatusDistribution {
  fluid: number;
  moderate: number;
  heavy: number;
}

export interface DriftStatusDelta {
  baseline: number;
  current: number;
  delta: number;
}

export interface DriftMetrics {
  psi: number;
  jsd: number;
  maxDelta: number;
}

export interface DriftReport {
  detected: boolean;
  severity: 'none' | 'low' | 'moderate' | 'high';
  metrics: DriftMetrics;
  distribution: Record<TrafficStatus, DriftStatusDelta>;
  sampleSize: {
    baseline: number;
    current: number;
  };
  generatedAt: string;
}

const STATUSES: TrafficStatus[] = ['fluid', 'moderate', 'heavy'];
const EPS = 1e-6;

function normalize(dist: StatusDistribution): StatusDistribution {
  const total = dist.fluid + dist.moderate + dist.heavy;
  if (total <= 0) {
    return { fluid: 1 / 3, moderate: 1 / 3, heavy: 1 / 3 };
  }
  return {
    fluid: dist.fluid / total,
    moderate: dist.moderate / total,
    heavy: dist.heavy / total,
  };
}

function klDivergence(p: StatusDistribution, q: StatusDistribution): number {
  let sum = 0;
  for (const status of STATUSES) {
    const pv = Math.max(EPS, p[status]);
    const qv = Math.max(EPS, q[status]);
    sum += pv * Math.log(pv / qv);
  }
  return sum;
}

function psi(p: StatusDistribution, q: StatusDistribution): number {
  let sum = 0;
  for (const status of STATUSES) {
    const pv = Math.max(EPS, p[status]);
    const qv = Math.max(EPS, q[status]);
    sum += (qv - pv) * Math.log(qv / pv);
  }
  return sum;
}

function jsd(p: StatusDistribution, q: StatusDistribution): number {
  const m: StatusDistribution = {
    fluid: (p.fluid + q.fluid) / 2,
    moderate: (p.moderate + q.moderate) / 2,
    heavy: (p.heavy + q.heavy) / 2,
  };
  return 0.5 * klDivergence(p, m) + 0.5 * klDivergence(q, m);
}

export class TelemetryDriftMonitor {
  static aggregateDistribution(samples: RouteTelemetry[]): StatusDistribution {
    const totals: StatusDistribution = { fluid: 0, moderate: 0, heavy: 0 };

    for (const sample of samples) {
      totals.fluid += Number(sample.statusBreakdownKm?.fluid ?? 0);
      totals.moderate += Number(sample.statusBreakdownKm?.moderate ?? 0);
      totals.heavy += Number(sample.statusBreakdownKm?.heavy ?? 0);
    }

    return normalize(totals);
  }

  static detectDrift(
    baseline: StatusDistribution,
    current: StatusDistribution,
    sampleSize: { baseline: number; current: number }
  ): DriftReport {
    const p = normalize(baseline);
    const q = normalize(current);

    const psiValue = psi(p, q);
    const jsdValue = jsd(p, q);

    const deltas: Record<TrafficStatus, DriftStatusDelta> = {
      fluid: {
        baseline: Number(p.fluid.toFixed(4)),
        current: Number(q.fluid.toFixed(4)),
        delta: Number((q.fluid - p.fluid).toFixed(4)),
      },
      moderate: {
        baseline: Number(p.moderate.toFixed(4)),
        current: Number(q.moderate.toFixed(4)),
        delta: Number((q.moderate - p.moderate).toFixed(4)),
      },
      heavy: {
        baseline: Number(p.heavy.toFixed(4)),
        current: Number(q.heavy.toFixed(4)),
        delta: Number((q.heavy - p.heavy).toFixed(4)),
      },
    };

    const maxDelta = Math.max(
      Math.abs(deltas.fluid.delta),
      Math.abs(deltas.moderate.delta),
      Math.abs(deltas.heavy.delta)
    );

    const severity = this.classifySeverity(psiValue, jsdValue, maxDelta);

    return {
      detected: severity !== 'none',
      severity,
      metrics: {
        psi: Number(psiValue.toFixed(4)),
        jsd: Number(jsdValue.toFixed(4)),
        maxDelta: Number(maxDelta.toFixed(4)),
      },
      distribution: deltas,
      sampleSize,
      generatedAt: new Date().toISOString(),
    };
  }

  static detectDriftFromTelemetry(baselineSamples: RouteTelemetry[], currentSamples: RouteTelemetry[]): DriftReport {
    const baseline = this.aggregateDistribution(baselineSamples);
    const current = this.aggregateDistribution(currentSamples);
    return this.detectDrift(baseline, current, {
      baseline: baselineSamples.length,
      current: currentSamples.length,
    });
  }

  private static classifySeverity(psiValue: number, jsdValue: number, maxDelta: number): DriftReport['severity'] {
    if (psiValue >= 0.5 || jsdValue >= 0.12 || maxDelta >= 0.28) return 'high';
    if (psiValue >= 0.25 || jsdValue >= 0.06 || maxDelta >= 0.18) return 'moderate';
    if (psiValue >= 0.1 || jsdValue >= 0.03 || maxDelta >= 0.1) return 'low';
    return 'none';
  }
}
