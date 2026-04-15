import test from 'node:test';
import assert from 'node:assert/strict';

import type { RouteSegmentTelemetry } from '../../src/service/RouteXAI_Service';
import { RouteCurvatureProfileService } from '../../src/service/RouteCurvatureProfileService';

function sample(curvaturePenalty: number, frictionContributionCoefficient: number, speedKmh: number): RouteSegmentTelemetry {
  const distanceKm = 1.2;
  return {
    index: 0,
    start: [15.0286, 120.6898],
    end: [15.0386, 120.6998],
    midpoint: [15.0336, 120.6948],
    distanceKm,
    bearingDeg: 45,
    trafficStatus: 'moderate',
    speedKmh,
    congestionWeight: 0.56,
    curvaturePenalty,
    frictionCost: Number((distanceKm * (0.56 + curvaturePenalty * frictionContributionCoefficient)).toFixed(3)),
  };
}

test('Default curvature profile matches current coefficients', () => {
  const profile = RouteCurvatureProfileService.defaultProfile();

  assert.deepEqual(profile, {
    frictionContributionCoefficient: 0.35,
    turnPenaltyMultiplier: 1.1,
    tunedAt: new Date(0).toISOString(),
    sampleSize: 0,
  });
});

test('Derived curvature profile is bounded and data-driven', () => {
  const samples = [
    sample(0.08, 0.35, 28), sample(0.09, 0.35, 29), sample(0.1, 0.35, 30),
    sample(0.2, 0.35, 26), sample(0.22, 0.35, 25), sample(0.24, 0.35, 24),
    sample(0.35, 0.35, 22), sample(0.3, 0.35, 23), sample(0.28, 0.35, 21),
  ];

  const profile = RouteCurvatureProfileService.deriveProfile(samples);

  assert.equal(profile.sampleSize, 9);
  assert.ok(profile.frictionContributionCoefficient >= 0.1 && profile.frictionContributionCoefficient <= 0.8);
  assert.ok(profile.turnPenaltyMultiplier >= 0.6 && profile.turnPenaltyMultiplier <= 2.0);
});

test('Curvature profile snapshot remains stable', () => {
  const samples = [
    sample(0.08, 0.35, 28), sample(0.09, 0.35, 29), sample(0.1, 0.35, 30),
    sample(0.2, 0.35, 26), sample(0.22, 0.35, 25), sample(0.24, 0.35, 24),
    sample(0.35, 0.35, 22), sample(0.3, 0.35, 23), sample(0.28, 0.35, 21),
  ];

  const profile = RouteCurvatureProfileService.deriveProfile(samples);

  assert.deepEqual(
    {
      frictionContributionCoefficient: profile.frictionContributionCoefficient,
      turnPenaltyMultiplier: profile.turnPenaltyMultiplier,
      sampleSize: profile.sampleSize,
    },
    {
      frictionContributionCoefficient: 0.8,
      turnPenaltyMultiplier: 2,
      sampleSize: 9,
    }
  );
});
