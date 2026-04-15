import test from 'node:test';
import assert from 'node:assert/strict';

import { formatAIContextPrefix } from '../../src/service/AI_Service';

test('AI context prefix renders strict fields in a stable order', () => {
  const prefix = formatAIContextPrefix({
    activeTrafficSegments: 4,
    reportedIncidents: 2,
    proneAreas: 3,
    weatherCondition: 'rainy',
    avgResponseTime: 18.5,
  });

  assert.equal(
    prefix,
    '[LIVE: 4 traffic segments congested] [ACTIVE: 2 incidents reported] [PRONE: 3 high-risk zones] [WEATHER: rainy] [RESPONSE: 18.5min avg]'
  );
});
