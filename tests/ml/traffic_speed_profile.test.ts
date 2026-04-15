import test from 'node:test';
import assert from 'node:assert/strict';

import type { TrafficSegment } from '../../src/service/RouteXAI_Service';
import { TrafficSpeedProfileService } from '../../src/service/TrafficSpeedProfileService';

function sample(status: TrafficSegment['status'], speedKmh: number): TrafficSegment {
  return {
    name: `${status}-${speedKmh}`,
    path: [[15.0286, 120.6898], [15.0386, 120.6998]],
    status,
    speedKmh,
    congestionLevel: status === 'heavy' ? 0.85 : status === 'moderate' ? 0.5 : 0.2,
    confidence: 0.8,
    source: 'hybrid',
    lastUpdated: new Date('2026-04-16T00:00:00.000Z'),
  };
}

test('Default speed profile matches existing bucket behavior', () => {
  const profile = TrafficSpeedProfileService.defaultProfile();

  assert.deepEqual(profile, {
    fluid: 44,
    moderate: 28,
    heavy: 16,
    tunedAt: new Date(0).toISOString(),
    sampleSize: 0,
  });
});

test('Derived speed profile is ordered and data-driven', () => {
  const samples = [
    sample('fluid', 48), sample('fluid', 46), sample('fluid', 44),
    sample('moderate', 31), sample('moderate', 29), sample('moderate', 27),
    sample('heavy', 18), sample('heavy', 17), sample('heavy', 16),
  ];

  const profile = TrafficSpeedProfileService.deriveProfile(samples);

  assert.equal(profile.sampleSize, 9);
  assert.ok(profile.fluid > profile.moderate);
  assert.ok(profile.moderate > profile.heavy);
});

test('Traffic speed profile snapshot remains stable', () => {
  const samples = [
    sample('fluid', 46), sample('fluid', 45), sample('fluid', 47),
    sample('moderate', 30), sample('moderate', 29), sample('moderate', 28),
    sample('heavy', 18), sample('heavy', 17), sample('heavy', 16),
  ];

  const profile = TrafficSpeedProfileService.deriveProfile(samples);

  assert.deepEqual(
    {
      fluid: profile.fluid,
      moderate: profile.moderate,
      heavy: profile.heavy,
      sampleSize: profile.sampleSize,
    },
    {
      fluid: 46,
      moderate: 29,
      heavy: 17,
      sampleSize: 9,
    }
  );
});
