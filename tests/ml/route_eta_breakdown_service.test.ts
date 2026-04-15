import test from 'node:test';
import assert from 'node:assert/strict';

import { RouteEtaBreakdownService } from '../../src/service/RouteEtaBreakdownService';

test('ETA breakdown keeps layers explicit and additive', () => {
  const breakdown = RouteEtaBreakdownService.calculate(
    8,
    { fluid: 2, moderate: 3, heavy: 3 },
    0.19
  );

  assert.ok(breakdown.baseTravelMinutes > 0);
  assert.ok(breakdown.trafficPenaltyMinutes >= 0);
  assert.ok(breakdown.curvaturePenaltyMinutes >= 0);
  assert.ok(breakdown.urbanDelayMinutes >= 0);
  assert.equal(
    breakdown.totalMinutes,
    Math.max(1, Math.round(
      breakdown.baseTravelMinutes +
      breakdown.trafficPenaltyMinutes +
      breakdown.curvaturePenaltyMinutes +
      breakdown.urbanDelayMinutes
    ))
  );
});

test('ETA breakdown snapshot remains stable', () => {
  const breakdown = RouteEtaBreakdownService.calculate(
    8,
    { fluid: 2, moderate: 3, heavy: 3 },
    0.19
  );

  assert.deepEqual(
    {
      base: Number(breakdown.baseTravelMinutes.toFixed(3)),
      traffic: Number(breakdown.trafficPenaltyMinutes.toFixed(3)),
      curvature: Number(breakdown.curvaturePenaltyMinutes.toFixed(3)),
      urban: Number(breakdown.urbanDelayMinutes.toFixed(3)),
      total: breakdown.totalMinutes,
    },
    {
      base: 20.406,
      traffic: 3.92,
      curvature: 1.672,
      urban: 3.26,
      total: 29,
    }
  );
});
