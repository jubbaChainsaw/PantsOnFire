import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GOOGLE_PLAY_SUBSCRIPTION_BASE_PLAN_ID,
  googlePlayDlcProductIdForPack,
  googlePlayProductIdForPurchase,
  resolveInternalThemePackIdFromStoreKey,
} from '../../src/billing/googlePlayProductCatalog.js';

test('googlePlayProductIdForPurchase maps tiers and DLC without hyphens in Play ids', () => {
  assert.equal(googlePlayProductIdForPurchase({ kind: 'tier', productId: 'local_liar' }), 'local_liar');
  assert.equal(googlePlayProductIdForPurchase({ kind: 'tier', productId: 'suspect' }), 'suspect');
  assert.equal(googlePlayProductIdForPurchase({ kind: 'tier', productId: 'host_most' }), 'host_most');
  assert.equal(
    googlePlayProductIdForPurchase({ kind: 'addon', productId: 'twist_truth' }),
    'twist_truth',
  );
  assert.equal(
    googlePlayDlcProductIdForPack('ye-olde-baloney'),
    'dlc_pack_ye_olde_baloney',
  );
  assert.equal(
    googlePlayProductIdForPurchase({ kind: 'dlc', productId: 'myth-taken-identity' }),
    'dlc_pack_myth_taken_identity',
  );
  assert.equal(
    googlePlayProductIdForPurchase({ kind: 'dlc', productId: 'rank-and-file-mostly-file' }),
    'dlc_pack_rank_and_file_mostly_file',
  );
});

test('resolveInternalThemePackIdFromStoreKey accepts Play slug or full product id', () => {
  assert.equal(
    resolveInternalThemePackIdFromStoreKey('dlc_pack_ye_olde_baloney'),
    'ye-olde-baloney',
  );
  assert.equal(resolveInternalThemePackIdFromStoreKey('ye_olde_baloney'), 'ye-olde-baloney');
  assert.equal(resolveInternalThemePackIdFromStoreKey('ye-olde-baloney'), 'ye-olde-baloney');
});

test('subscription base plan id is monthly', () => {
  assert.equal(GOOGLE_PLAY_SUBSCRIPTION_BASE_PLAN_ID, 'monthly');
});
