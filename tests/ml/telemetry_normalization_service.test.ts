import test from 'node:test';
import assert from 'node:assert/strict';

import { TelemetryNormalizationService } from '../../src/service/TelemetryNormalizationService';

test('route telemetry normalization applies policy-driven bands', () => {
  const normalized = TelemetryNormalizationService.normalizeRoute({
    routeDistanceKm: 8,
    canonicalEtaMinutes: 29,
    routeTraffic: 'moderate',
    routeHasIncident: false,
    baselineMinutes: 20,
    congestionPenalty: 4.1,
    hazardPenalty: 0,
    topologyPenalty: 11.25,
    syntheticReliability: 0.73,
  });

  assert.deepEqual(normalized, {
    context: 'route',
    distanceKm: 8,
    etaMinutes: 29,
    trafficClass: 'moderate',
    incidentFlag: false,
    baselineMinutes: 20,
    congestionPenalty: 4.1,
    hazardPenalty: 0,
    topologyPenalty: 11.3,
    reliability: 0.73,
    riskBand: 'steady',
    weatherCondition: 'rainy',
  });
});

test('prone area telemetry normalization applies policy-driven bands', () => {
  const normalized = TelemetryNormalizationService.normalizeProneArea({
    riskScore: 8.2,
    confidence: 72,
    radius: 600,
    status: 'Unfixed',
    category: 'Flood',
    stability: 0.518,
    severityIndex: 9.9,
    categoryWeight: 0.82,
  });

  assert.deepEqual(normalized, {
    context: 'prone_area',
    riskScore: 8.2,
    confidence: 72,
    radiusMeters: 600,
    status: 'Unfixed',
    category: 'Flood',
    stability: 0.518,
    severityIndex: 9.9,
    categoryWeight: 0.82,
    riskBand: 'high',
  });
});
