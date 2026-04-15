export type ConfidenceBand = 'low' | 'moderate' | 'high';

export interface ConfidenceBandThresholds {
  low: number;
  high: number;
  tunedAt: string;
  sampleSize: number;
}

const DEFAULT_THRESHOLDS: ConfidenceBandThresholds = {
  low: 50,
  high: 75,
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
  return Number(Math.max(min, Math.min(max, value)).toFixed(1));
}

export class ConfidenceBandService {
  static defaultThresholds(): ConfidenceBandThresholds {
    return { ...DEFAULT_THRESHOLDS };
  }

  static deriveThresholds(samples: number[]): ConfidenceBandThresholds {
    const clean = samples.filter((value) => Number.isFinite(value));
    if (clean.length < 6) {
      return this.defaultThresholds();
    }

    const low = clamp(median(clean.slice(0, Math.max(1, Math.floor(clean.length * 0.4)))), 20, 65);
    const high = clamp(median(clean.slice(Math.floor(clean.length * 0.55))), low + 5, 95);

    return {
      low: Math.min(low, high - 5),
      high: Math.max(high, low + 5),
      tunedAt: new Date().toISOString(),
      sampleSize: clean.length,
    };
  }

  static classify(value: number, thresholds: ConfidenceBandThresholds = DEFAULT_THRESHOLDS): ConfidenceBand {
    const percent = Math.max(0, Math.min(100, value));
    if (percent >= thresholds.high) return 'high';
    if (percent >= thresholds.low) return 'moderate';
    return 'low';
  }

  static label(value: number, thresholds?: ConfidenceBandThresholds): string {
    const band = this.classify(value, thresholds);
    return band === 'high' ? 'High confidence' : band === 'moderate' ? 'Moderate confidence' : 'Low confidence';
  }
}
