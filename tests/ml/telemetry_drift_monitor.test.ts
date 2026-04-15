import test from 'node:test';
import assert from 'node:assert/strict';

import type { RouteTelemetry } from '../../src/service/RouteXAI_Service';
import { TelemetryDriftMonitor } from '../../src/service/TelemetryDriftMonitor';

function sample(fluid: number, moderate: number, heavy: number): RouteTelemetry {
  return {
    totalDistanceKm: fluid + moderate + heavy,
    estimatedMinutes: 12,
    trafficEntropy: 0.7,
    graphFrictionIndex: 2,
    spectralCongestionEnergy: 0.4,
    reliabilityIndex: 0.75,
    segmentCount: 12,
    statusBreakdownKm: { fluid, moderate, heavy },
    segments: [],
    formulas: { eta: 'x', friction: 'x', entropy: 'x', spectral: 'x' },
  };
}

test('Drift monitor reports none for stable distributions', () => {
  const baseline = [sample(3, 5, 2), sample(4, 4, 2), sample(3, 4, 3)];
  const current = [sample(3, 5, 2), sample(4, 4, 2), sample(3, 4, 3)];

  const report = TelemetryDriftMonitor.detectDriftFromTelemetry(baseline, current);

  assert.equal(report.detected, false);
  assert.equal(report.severity, 'none');
  assert.ok(report.metrics.psi < 0.01);
});

test('Drift monitor reports moderate/high when heavy share shifts strongly', () => {
  const baseline = [sample(5, 4, 1), sample(4, 5, 1), sample(5, 4, 1)];
  const current = [sample(1, 4, 5), sample(1, 5, 4), sample(1, 4, 5)];

  const report = TelemetryDriftMonitor.detectDriftFromTelemetry(baseline, current);

  assert.equal(report.detected, true);
  assert.ok(report.severity === 'moderate' || report.severity === 'high');
  assert.ok(report.metrics.maxDelta >= 0.2);
});

test('Drift monitor snapshot remains stable', () => {
  const baseline = [sample(6, 3, 1), sample(5, 4, 1), sample(6, 3, 1), sample(5, 4, 1)];
  const current = [sample(3, 4, 3), sample(2, 4, 4), sample(3, 3, 4), sample(2, 4, 4)];

  const report = TelemetryDriftMonitor.detectDriftFromTelemetry(baseline, current);

  assert.deepEqual(
    {
      detected: report.detected,
      severity: report.severity,
      psi: report.metrics.psi,
      jsd: report.metrics.jsd,
      maxDelta: report.metrics.maxDelta,
      fluidDelta: report.distribution.fluid.delta,
      heavyDelta: report.distribution.heavy.delta,
    },
    {
      detected: true,
      severity: 'high',
      psi: 0.6017,
      jsd: 0.0714,
      maxDelta: 0.3,
      fluidDelta: -0.3,
      heavyDelta: 0.275,
    }
  );
});
