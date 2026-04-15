import type { OptimizedWeights, RiskWeightTrainingData } from './RiskWeightTrainer';

export type FeatureKey = 'hazardFactor' | 'segmentCongestion' | 'responseTimeInverse';

export interface FeatureImportanceRow {
  feature: FeatureKey;
  label: string;
  weight: number;
  normalizedImportance: number;
  direction: 'increases_risk' | 'decreases_risk';
  rationale: string;
}

export interface FeatureImportanceReport {
  generatedAt: string;
  modelAccuracy: number;
  samplesUsed: number;
  recommendation: string;
  topFeature: FeatureKey;
  rows: FeatureImportanceRow[];
}

function toPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export class FeatureImportanceReportService {
  static buildReport(
    weights: OptimizedWeights,
    trainingData: RiskWeightTrainingData[]
  ): FeatureImportanceReport {
    const abs = {
      hazardFactor: Math.abs(weights.alpha),
      segmentCongestion: Math.abs(weights.beta),
      responseTimeInverse: Math.abs(weights.gamma),
    };

    const denom = Math.max(1e-6, abs.hazardFactor + abs.segmentCongestion + abs.responseTimeInverse);

    const rows: FeatureImportanceRow[] = [
      {
        feature: 'hazardFactor' as FeatureKey,
        label: 'Hazard Severity',
        weight: Number(weights.alpha.toFixed(4)),
        normalizedImportance: Number((abs.hazardFactor / denom).toFixed(4)),
        direction: 'increases_risk' as const,
        rationale: 'Higher hazard severity increases predicted risk contribution.',
      },
      {
        feature: 'segmentCongestion' as FeatureKey,
        label: 'Traffic Congestion',
        weight: Number(weights.beta.toFixed(4)),
        normalizedImportance: Number((abs.segmentCongestion / denom).toFixed(4)),
        direction: 'increases_risk' as const,
        rationale: 'Heavier congestion elevates response burden and risk score.',
      },
      {
        feature: 'responseTimeInverse' as FeatureKey,
        label: 'Response Time (Inverse)',
        weight: Number(weights.gamma.toFixed(4)),
        normalizedImportance: Number((abs.responseTimeInverse / denom).toFixed(4)),
        direction: 'decreases_risk' as const,
        rationale: 'Faster response (higher inverse response term) offsets risk growth.',
      },
    ].sort((a, b) => b.normalizedImportance - a.normalizedImportance);

    return {
      generatedAt: new Date().toISOString(),
      modelAccuracy: weights.modelAccuracy,
      samplesUsed: Math.max(weights.samplesUsed, trainingData.length),
      recommendation: weights.recommendation,
      topFeature: rows[0].feature,
      rows,
    };
  }

  static exportAsJSON(report: FeatureImportanceReport): string {
    return JSON.stringify(report, null, 2);
  }

  static exportAsCSV(report: FeatureImportanceReport): string {
    const header = 'feature,label,weight,normalized_importance,direction,rationale';
    const lines = report.rows.map((row) => {
      const escapedRationale = row.rationale.replace(/"/g, '""');
      return [
        row.feature,
        row.label,
        row.weight.toFixed(4),
        row.normalizedImportance.toFixed(4),
        row.direction,
        `"${escapedRationale}"`,
      ].join(',');
    });
    return [header, ...lines].join('\n');
  }

  static exportAsMarkdown(report: FeatureImportanceReport): string {
    const lines: string[] = [];
    lines.push('# ML Feature Importance Report');
    lines.push('');
    lines.push(`Generated: ${report.generatedAt}`);
    lines.push(`Model accuracy: ${report.modelAccuracy.toFixed(1)}%`);
    lines.push(`Samples used: ${report.samplesUsed}`);
    lines.push(`Top feature: ${report.topFeature}`);
    lines.push('');
    lines.push('| Feature | Weight | Importance | Direction |');
    lines.push('|---|---:|---:|---|');

    for (const row of report.rows) {
      lines.push(`| ${row.label} | ${row.weight.toFixed(4)} | ${toPct(row.normalizedImportance)} | ${row.direction} |`);
    }

    lines.push('');
    lines.push('## Recommendation');
    lines.push(report.recommendation);
    lines.push('');
    lines.push('## Notes');
    for (const row of report.rows) {
      lines.push(`- ${row.label}: ${row.rationale}`);
    }

    return lines.join('\n');
  }
}
