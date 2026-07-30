/**
 * Smoke test for SPF /calculate (no HTTP server required).
 * Run: npm run test:calculate-api
 */
import assert from 'node:assert/strict';
import { handleCalculateBody } from './calculate-api.mjs';
import { calculateSpf } from '../src/calculationCore.js';

const missing = handleCalculateBody({ inputs: {}, locale: 'zh' });
assert.equal(missing.ok, false);
assert.ok(missing.missingInputs.length > 0);

const annual = handleCalculateBody({
  locale: 'en',
  inputs: {
    annualHeatDemand: 1000,
    cop: 3,
    eAuxAnnual: 50,
  },
});
assert.equal(annual.ok, true, annual.message);
assert.ok(Math.abs(annual.results.spf - 1000 / (1000 / 3 + 50)) < 1e-9);

const ota = calculateSpf({
  heatLoadKw: 100,
  annualOperatingHours: 1500,
  estimatedCop: 2.5,
});
assert.equal(ota.ok, true);
assert.equal(ota.results.totalQDemand, 150000);

console.log('test:calculate-api OK', {
  version: annual.version,
  spf: annual.results.spf.toFixed(3),
});
