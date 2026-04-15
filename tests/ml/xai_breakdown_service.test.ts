import test from 'node:test';
import assert from 'node:assert/strict';

import { XaiBreakdownService } from '../../src/service/XaiBreakdownService';

test('route explanation state is derived outside the modal', () => {
  const state = XaiBreakdownService.buildRouteState({
    distKm: 8,
    etaMinutes: 29,
    traffic: 'moderate',
    incident: false,
    model: {
      totalDistanceKm: 8,
      estimatedMinutes: 29,
      trafficEntropy: 1.12,
      graphFrictionIndex: 15,
      spectralCongestionEnergy: 0.54,
      reliabilityIndex: 0.73,
      segmentCount: 6,
      statusBreakdownKm: { fluid: 2, moderate: 3, heavy: 3 },
      formulas: {
        eta: 'T',
        friction: 'F',
        entropy: 'H',
        spectral: 'E',
      },
      segments: [],
    },
  });

  assert.equal(state.routeDistanceKm, 8);
  assert.equal(state.canonicalEtaMinutes, 29);
  assert.equal(state.baselineMinutes, 20);
  assert.equal(state.congestionPenalty, 4.1);
  assert.equal(state.hazardPenalty, 0);
  assert.equal(state.topologyPenalty, 11.25);
  assert.equal(state.resolvedEtaMinutes, 29);
  assert.equal(state.syntheticReliability, 0.73);
  assert.equal(state.defaultQuestion.includes('congestion, entropy, and friction'), true);
  assert.equal(state.aiPayload.telemetry?.distanceKm, 8);
  assert.equal(state.aiPayload.telemetry?.etaMinutes, 29);
});

test('prone area explanation state is derived outside the modal', () => {
  const state = XaiBreakdownService.buildProneAreaState({
    riskScore: 8.2,
    confidence: 72,
    radius: 600,
    status: 'Unfixed',
    category: 'Flood',
  });

  assert.equal(state.proneAreaRiskScore, 8.2);
  assert.equal(state.proneAreaConfidence, 72);
  assert.equal(state.proneAreaRadius, 600);
  assert.equal(state.proneAreaStatus, 'Unfixed');
  assert.equal(state.proneAreaCategory, 'Flood');
  assert.equal(state.proneAreaStability, 0.518);
  assert.equal(state.proneAreaSeverityIndex, 9.9);
  assert.equal(state.categoryWeight, 0.82);
  assert.equal(state.defaultQuestion.includes('classified high risk'), true);
});
