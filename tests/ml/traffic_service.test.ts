import test from 'node:test';
import assert from 'node:assert/strict';

import { TrafficService, type TrafficSegment } from '../../src/service/Traffic_Service';

const now = new Date('2026-04-16T08:00:00.000Z');

function segment(overrides: Partial<TrafficSegment> = {}): TrafficSegment {
  return {
    name: 'Synthetic Segment',
    path: [[15.0286, 120.6898], [15.0386, 120.6998]],
    status: 'moderate',
    speedKmh: 25,
    congestionLevel: 0.5,
    confidence: 0.8,
    source: 'hybrid',
    lastUpdated: now,
    ...overrides,
  };
}

test('TSRE returns stable output for normal live telemetry', () => {
  const result = TrafficService.calculateTSRE(
    4.2,
    [segment(), segment({ speedKmh: 32, congestionLevel: 0.35, confidence: 0.84 })],
    false,
    false,
    [12, 14, 13],
    { telemetryStatus: 'live', telemetryAgeMinutes: 2 }
  );

  assert.ok(result.estimatedMinutes > 0);
  assert.ok(result.confidence >= 0 && result.confidence <= 100);
  assert.equal(result.anomaly?.detected, false);
});

test('TSRE degraded telemetry confidence is lower than live confidence', () => {
  const live = TrafficService.calculateTSRE(
    5,
    [segment({ confidence: 0.9 }), segment({ confidence: 0.88 })],
    false,
    false,
    [16, 18, 17],
    { telemetryStatus: 'live', telemetryAgeMinutes: 1 }
  );

  const degraded = TrafficService.calculateTSRE(
    5,
    [segment({ confidence: 0.9 }), segment({ confidence: 0.88 })],
    false,
    false,
    [16, 18, 17],
    { telemetryStatus: 'degraded', telemetryAgeMinutes: 35 }
  );

  assert.ok(degraded.confidence < live.confidence);
});

test('TSRE offline fallback still provides bounded confidence', () => {
  const result = TrafficService.calculateTSRE(
    6,
    [],
    true,
    false,
    [],
    { telemetryStatus: 'offline' }
  );

  assert.ok(result.estimatedMinutes > 0);
  assert.ok(result.confidence >= 5 && result.confidence <= 75);
});

test('TSRE anomaly detector flags and corrects inflated ETA', () => {
  const longPath: [number, number][] = [
    [15.00, 120.60],
    [15.00, 121.10],
  ];

  const outlier = TrafficService.calculateTSRE(
    5,
    [segment({ path: longPath, speedKmh: 1, congestionLevel: 0.1, confidence: 0.9 })],
    false,
    false,
    [14, 15, 16],
    { telemetryStatus: 'live' }
  );

  assert.equal(outlier.anomaly?.detected, true);
  assert.ok((outlier.anomaly?.correctedMinutes || 0) < (outlier.anomaly?.rawMinutes || 0));
});

test('TSRE scenario snapshots remain stable', () => {
  const scenarios = [
    {
      name: 'urban-live-balanced',
      result: TrafficService.calculateTSRE(
        3.5,
        [segment({ speedKmh: 30, congestionLevel: 0.3, confidence: 0.86 })],
        false,
        false,
        [11, 12, 13],
        { telemetryStatus: 'live', telemetryAgeMinutes: 3 }
      ),
      expected: {
        estimatedMinutes: 11,
        confidence: 83,
        anomalyDetected: false,
      },
    },
    {
      name: 'offline-incident-fallback',
      result: TrafficService.calculateTSRE(
        4,
        [],
        true,
        false,
        [],
        { telemetryStatus: 'offline' }
      ),
      expected: {
        estimatedMinutes: 25,
        confidence: 42,
        anomalyDetected: false,
      },
    },
  ];

  for (const scenario of scenarios) {
    assert.equal(scenario.result.estimatedMinutes, scenario.expected.estimatedMinutes, scenario.name);
    assert.equal(scenario.result.confidence, scenario.expected.confidence, scenario.name);
    assert.equal(Boolean(scenario.result.anomaly?.detected), scenario.expected.anomalyDetected, scenario.name);
  }
});
