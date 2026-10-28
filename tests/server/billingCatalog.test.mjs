import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PRICE_LABELS, buildBillingCatalog } from '../../server/billingCatalog.js';

test('DEFAULT_PRICE_LABELS match Stripe test GBP amounts', () => {
  assert.equal(DEFAULT_PRICE_LABELS['tier:local_liar'], '£2.99');
  assert.equal(DEFAULT_PRICE_LABELS['tier:suspect'], '£4.99');
  assert.equal(DEFAULT_PRICE_LABELS['tier:host_most'], '£9.99');
  assert.equal(DEFAULT_PRICE_LABELS['addon:twist_truth'], '£1.99');
  assert.equal(DEFAULT_PRICE_LABELS['dlc:pack'], '£2.99');
});

test('buildBillingCatalog returns tier labels without Stripe', async () => {
  const catalog = await buildBillingCatalog();
  assert.equal(catalog.tiers.local_liar, '£2.99');
  assert.equal(catalog.addonTwistTruth, '£1.99');
});
