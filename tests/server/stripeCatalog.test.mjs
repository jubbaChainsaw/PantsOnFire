import test from 'node:test';
import assert from 'node:assert/strict';
import { stripePurchaseToEntitlementPatch } from '../../server/stripeCatalog.js';

test('stripePurchaseToEntitlementPatch maps tier and dlc', () => {
  assert.deepEqual(stripePurchaseToEntitlementPatch('tier', 'suspect'), {
    tierId: 'suspect',
    source: 'stripe',
  });
  assert.deepEqual(stripePurchaseToEntitlementPatch('addon', 'twist_truth'), {
    addonTwistTruth: true,
    source: 'stripe',
  });
  assert.deepEqual(stripePurchaseToEntitlementPatch('dlc', 'ye-olde-baloney'), {
    unlockedThemePackIds: ['ye-olde-baloney'],
    source: 'stripe',
  });
});
