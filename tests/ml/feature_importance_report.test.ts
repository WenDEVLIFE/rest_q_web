import test from 'node:test';
import assert from 'node:assert/strict';

import type { OptimizedWeights, RiskWeightTrainingData } from '../../src/service/RiskWeightTrainer';
import { FeatureImportanceReportService } from '../../src/service/FeatureImportanceReportService';

function trainingSample(id: number): RiskWeightTrainingData {
  return {
    incidentId: `inc-${id}`,
    hazardFactor: 0.7,
    segmentCongestion: 0.6,
    responseTimeMin: 12,
    actuallyHighRisk: id % 2 === 0,
    timestamp: new Date('2026-04-16T00:00:00.000Z'),
  };
}

test('Feature importance report ranks top feature by normalized importance', () => {
  const weights: OptimizedWeights = {
    alpha: 0.45,
    beta: 0.35,
    gamma: 0.2,
    modelAccuracy: 88.4,
    samplesUsed: 24,
    trainingDate: new Date('2026-04-16T00:00:00.000Z'),
    recommendation: 'Production-ready.',
  };

  const report = FeatureImportanceReportService.buildReport(weights, [trainingSample(1), trainingSample(2)]);

  assert.equal(report.topFeature, 'hazardFactor');
  assert.equal(report.rows[0].feature, 'hazardFactor');
  assert.ok(report.rows[0].normalizedImportance >= report.rows[1].normalizedImportance);
});

test('Feature importance exports produce JSON/CSV/Markdown content', () => {
  const weights: OptimizedWeights = {
    alpha: 0.4,
    beta: 0.4,
    gamma: 0.2,
    modelAccuracy: 81.2,
    samplesUsed: 16,
    trainingDate: new Date('2026-04-16T00:00:00.000Z'),
    recommendation: 'Collect more samples.',
  };
  const report = FeatureImportanceReportService.buildReport(weights, [trainingSample(1)]);

  const asJson = FeatureImportanceReportService.exportAsJSON(report);
  const asCsv = FeatureImportanceReportService.exportAsCSV(report);
  const asMd = FeatureImportanceReportService.exportAsMarkdown(report);

  assert.ok(asJson.includes('"topFeature"'));
  assert.ok(asCsv.startsWith('feature,label,weight,normalized_importance,direction,rationale'));
  assert.ok(asMd.includes('# ML Feature Importance Report'));
  assert.ok(asMd.includes('| Feature | Weight | Importance | Direction |'));
});

test('Feature importance snapshot remains stable', () => {
  const weights: OptimizedWeights = {
    alpha: 0.51,
    beta: 0.31,
    gamma: 0.18,
    modelAccuracy: 90.5,
    samplesUsed: 32,
    trainingDate: new Date('2026-04-16T00:00:00.000Z'),
    recommendation: 'Good signal stability.',
  };

  const report = FeatureImportanceReportService.buildReport(weights, [trainingSample(1), trainingSample(2), trainingSample(3)]);

  const snapshot = {
    topFeature: report.topFeature,
    rows: report.rows.map((r) => ({
      feature: r.feature,
      weight: r.weight,
      normalizedImportance: r.normalizedImportance,
    })),
    samplesUsed: report.samplesUsed,
  };

  assert.deepEqual(snapshot, {
    topFeature: 'hazardFactor',
    rows: [
      { feature: 'hazardFactor', weight: 0.51, normalizedImportance: 0.51 },
      { feature: 'segmentCongestion', weight: 0.31, normalizedImportance: 0.31 },
      { feature: 'responseTimeInverse', weight: 0.18, normalizedImportance: 0.18 },
    ],
    samplesUsed: 32,
  });
});
