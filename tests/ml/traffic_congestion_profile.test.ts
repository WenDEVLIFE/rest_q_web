import test from 'node:test';
import assert from 'node:assert/strict';

import type { RouteSegmentTelemetry } from '../../src/service/RouteXAI_Service';
import { TrafficCongestionProfileService } from '../../src/service/TrafficCongestionProfileService';

function sample(trafficStatus: RouteSegmentTelemetry['trafficStatus'], congestionWeight: number): RouteSegmentTelemetry {
  return {
    index: 0,
    start: [[15.0286, 120.6898][0], [15.0286, 120.6898][1]] as [number, number],
    end: [[15.0386, 120.6998][0], [15.0386, 120.6998][1]] as [number, number],
    midpoint: [15.0336, 120.6948],
    distanceKm: 1.2,
    bearingDeg: 45,
    trafficStatus,
    speedKmh: trafficStatus === 'heavy' ? 16 : trafficStatus === 'moderate' ? 28 : 44,
    congestionWeight,
    curvaturePenalty: 0.08,
    frictionCost: 0.25,
  };
}

test('Default congestion profile matches existing weight table', () => {
  const profile = TrafficCongestionProfileService.defaultProfile();

  assert.deepEqual(profile, {
    fluid: 0.22,
    moderate: 0.56,
    heavy: 0.92,
    tunedAt: new Date(0).toISOString(),
    sampleSize: 0,
  });
});

test('Derived congestion profile is ordered and data-driven', () => {
  const samples = [
    sample('fluid', 0.18), sample('fluid', 0.21), sample('fluid', 0.24),
    sample('moderate', 0.47), sample('moderate', 0.56), sample('moderate', 0.6),
    sample('heavy', 0.81), sample('heavy', 0.88), sample('heavy', 0.94),
  ];

  const profile = TrafficCongestionProfileService.deriveProfile(samples);

  assert.equal(profile.sampleSize, 9);
  assert.ok(profile.fluid < profile.moderate);
  assert.ok(profile.moderate < profile.heavy);
});

test('Congestion profile snapshot remains stable', () => {
  const samples = [
    sample('fluid', 0.19), sample('fluid', 0.22), sample('fluid', 0.23),
    sample('moderate', 0.5), sample('moderate', 0.56), sample('moderate', 0.59),
    sample('heavy', 0.83), sample('heavy', 0.89), sample('heavy', 0.91),
  ];

  const profile = TrafficCongestionProfileService.deriveProfile(samples);

  assert.deepEqual(
    {
      fluid: profile.fluid,
      moderate: profile.moderate,
      heavy: profile.heavy,
      sampleSize: profile.sampleSize,
    },
    {
      fluid: 0.22,
      moderate: 0.56,
      heavy: 0.89,
      sampleSize: 9,
    }
  );
});
