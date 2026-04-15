import test from 'node:test';
import assert from 'node:assert/strict';

import { RouteOptionEtaService } from '../../src/service/RouteOptionEtaService';

test('route option ETA returns cached value when confidence is present', () => {
  const eta = RouteOptionEtaService.estimate({
    distKm: 6.8,
    traffic: 'moderate',
    etaMinutes: 19,
    confidence: 72,
  });

  assert.equal(eta, 19);
});

test('route option ETA uses fallback math only when needed', () => {
  const eta = RouteOptionEtaService.estimate({
    distKm: 6.8,
    traffic: 'moderate',
    etaMinutes: 19,
    confidence: 0,
  });

  assert.equal(eta, 27);
});
