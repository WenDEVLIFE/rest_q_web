import test from 'node:test';
import assert from 'node:assert/strict';

import { RouteUrbanDelayProfileService } from '../../src/service/RouteUrbanDelayProfileService';

test('Default urban delay profile matches current constants', () => {
  const profile = RouteUrbanDelayProfileService.defaultProfile();

  assert.deepEqual(profile, {
    baseDelayMinutes: 1.5,
    distanceMultiplier: 0.22,
    capDelayMinutes: 10,
    heavyTrafficBonusMinutes: 0,
    tunedAt: new Date(0).toISOString(),
    sampleSize: 0,
  });
});

test('Derived urban delay profile is bounded and data-driven', () => {
  const profile = RouteUrbanDelayProfileService.deriveProfile([
    { distanceKm: 2.0, observedDelayMinutes: 2.4, trafficIntensity: 'fluid' },
    { distanceKm: 3.1, observedDelayMinutes: 3.8, trafficIntensity: 'moderate' },
    { distanceKm: 4.6, observedDelayMinutes: 5.4, trafficIntensity: 'heavy' },
    { distanceKm: 5.2, observedDelayMinutes: 6.1, trafficIntensity: 'heavy' },
    { distanceKm: 1.4, observedDelayMinutes: 1.9, trafficIntensity: 'fluid' },
    { distanceKm: 2.7, observedDelayMinutes: 3.2, trafficIntensity: 'moderate' },
  ]);

  assert.equal(profile.sampleSize, 6);
  assert.ok(profile.baseDelayMinutes >= 0.5 && profile.baseDelayMinutes <= 4.5);
  assert.ok(profile.distanceMultiplier >= 0.08 && profile.distanceMultiplier <= 0.35);
  assert.ok(profile.capDelayMinutes >= 6 && profile.capDelayMinutes <= 18);
});

test('Urban delay profile snapshot remains stable', () => {
  const profile = RouteUrbanDelayProfileService.deriveProfile([
    { distanceKm: 2.0, observedDelayMinutes: 2.4, trafficIntensity: 'fluid' },
    { distanceKm: 3.1, observedDelayMinutes: 3.8, trafficIntensity: 'moderate' },
    { distanceKm: 4.6, observedDelayMinutes: 5.4, trafficIntensity: 'heavy' },
    { distanceKm: 5.2, observedDelayMinutes: 6.1, trafficIntensity: 'heavy' },
    { distanceKm: 1.4, observedDelayMinutes: 1.9, trafficIntensity: 'fluid' },
    { distanceKm: 2.7, observedDelayMinutes: 3.2, trafficIntensity: 'moderate' },
  ]);

  assert.deepEqual(
    {
      baseDelayMinutes: profile.baseDelayMinutes,
      distanceMultiplier: profile.distanceMultiplier,
      capDelayMinutes: profile.capDelayMinutes,
      heavyTrafficBonusMinutes: profile.heavyTrafficBonusMinutes,
      sampleSize: profile.sampleSize,
    },
    {
      baseDelayMinutes: 1.225,
      distanceMultiplier: 0.143,
      capDelayMinutes: 6,
      heavyTrafficBonusMinutes: 0.667,
      sampleSize: 6,
    }
  );
});
