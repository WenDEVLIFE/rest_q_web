import test from 'node:test';
import assert from 'node:assert/strict';

import type { RouteTelemetry } from '../../src/service/RouteXAI_Service';
import { RouteThresholdTuner } from '../../src/service/RouteThresholdTuner';

function telemetry(seed: number): RouteTelemetry {
  return {
    totalDistanceKm: 4 + seed * 0.5,
    estimatedMinutes: 10 + seed,
    trafficEntropy: 0.3 + seed * 0.07,
    graphFrictionIndex: 1.2 + seed * 0.25,
    spectralCongestionEnergy: 0.5 + seed * 0.08,
    reliabilityIndex: Math.max(0.1, 0.92 - seed * 0.06),
    segmentCount: 8 + seed,
    statusBreakdownKm: { fluid: 1.2, moderate: 2.1, heavy: 0.7 },
    segments: [],
    formulas: {
      eta: 'x',
      friction: 'x',
      entropy: 'x',
      spectral: 'x',
    },
  };
}

test('Threshold tuner returns defaults when samples are insufficient', () => {
  const thresholds = RouteThresholdTuner.tuneThresholds([telemetry(1), telemetry(2)]);
  const defaults = RouteThresholdTuner.defaultThresholds();

  assert.equal(thresholds.friction.low, defaults.friction.low);
  assert.equal(thresholds.entropy.high, defaults.entropy.high);
  assert.equal(thresholds.sampleSize, 0);
});

test('Threshold tuner generates ordered thresholds on sufficient samples', () => {
  const samples = Array.from({ length: 12 }, (_, i) => telemetry(i + 1));
  const thresholds = RouteThresholdTuner.tuneThresholds(samples);

  assert.equal(thresholds.sampleSize, 12);
  assert.ok(thresholds.friction.high > thresholds.friction.low);
  assert.ok(thresholds.entropy.high > thresholds.entropy.low);
  assert.ok(thresholds.reliability.high > thresholds.reliability.low);
});

test('Metric classification bands are stable', () => {
  const samples = Array.from({ length: 15 }, (_, i) => telemetry(i + 1));
  const thresholds = RouteThresholdTuner.tuneThresholds(samples);

  const lowRisk = telemetry(1);
  const highRisk = telemetry(14);

  const lowBands = RouteThresholdTuner.classifyMetrics(lowRisk, thresholds);
  const highBands = RouteThresholdTuner.classifyMetrics(highRisk, thresholds);

  assert.equal(lowBands.friction, 'low');
  assert.equal(highBands.friction, 'high');
  assert.equal(lowBands.reliability, 'high');
  assert.equal(highBands.reliability, 'low');
});

test('Threshold tuning snapshot remains stable', () => {
  const samples = Array.from({ length: 10 }, (_, i) => telemetry(i + 1));
  const thresholds = RouteThresholdTuner.tuneThresholds(samples);

  const snapshot = {
    friction: thresholds.friction,
    entropy: thresholds.entropy,
    reliability: thresholds.reliability,
    sampleSize: thresholds.sampleSize,
  };

  assert.deepEqual(snapshot, {
    friction: { low: 0.368, high: 0.398 },
    entropy: { low: 0.591, high: 0.843 },
    reliability: { low: 0.455, high: 0.671 },
    sampleSize: 10,
  });
});
