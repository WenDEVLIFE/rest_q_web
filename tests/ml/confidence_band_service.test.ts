import test from 'node:test';
import assert from 'node:assert/strict';

import { ConfidenceBandService } from '../../src/service/ConfidenceBandService';

test('Default confidence bands match existing interpretation thresholds', () => {
  const thresholds = ConfidenceBandService.defaultThresholds();

  assert.deepEqual(thresholds, {
    low: 50,
    high: 75,
    tunedAt: new Date(0).toISOString(),
    sampleSize: 0,
  });
});

test('Confidence classification maps low, moderate, and high correctly', () => {
  const thresholds = ConfidenceBandService.defaultThresholds();

  assert.equal(ConfidenceBandService.classify(32, thresholds), 'low');
  assert.equal(ConfidenceBandService.classify(63, thresholds), 'moderate');
  assert.equal(ConfidenceBandService.classify(91, thresholds), 'high');
});

test('Derived confidence thresholds remain ordered', () => {
  const thresholds = ConfidenceBandService.deriveThresholds([42, 45, 48, 52, 60, 68, 74, 81, 88]);

  assert.equal(thresholds.sampleSize, 9);
  assert.ok(thresholds.high > thresholds.low);
});

test('Confidence band snapshot remains stable', () => {
  const thresholds = ConfidenceBandService.deriveThresholds([42, 45, 48, 52, 60, 68, 74, 81, 88]);

  assert.deepEqual(
    {
      low: thresholds.low,
      high: thresholds.high,
      sampleSize: thresholds.sampleSize,
      labelHigh: ConfidenceBandService.label(88, thresholds),
      labelLow: ConfidenceBandService.label(32, thresholds),
    },
    {
      low: 45,
      high: 74,
      sampleSize: 9,
      labelHigh: 'High confidence',
      labelLow: 'Low confidence',
    }
  );
});
