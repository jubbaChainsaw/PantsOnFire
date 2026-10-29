import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSignedPackDownloadToken,
  verifySignedPackDownloadToken,
} from '../../server/packDownloadSigning.js';
import { userMayDownloadContentPack } from '../../server/contentPackEntitlements.js';
import { defaultEntitlements } from '../../server/entitlementsRoutes.js';

test('signed pack download token round-trips', (t) => {
  process.env.CONTENT_PACK_DOWNLOAD_SECRET = 'test-pack-secret';
  t.after(() => {
    delete process.env.CONTENT_PACK_DOWNLOAD_SECRET;
  });
  const created = createSignedPackDownloadToken({
    userId: 'user-1',
    packId: 'dlc-ye-olde-baloney',
    ttlMs: 60_000,
  });
  assert.ok(created.token);
  const verified = verifySignedPackDownloadToken(created.token);
  assert.equal(verified.userId, 'user-1');
  assert.equal(verified.packId, 'dlc-ye-olde-baloney');
});

test('userMayDownloadContentPack allows public core without auth row', async () => {
  const result = await userMayDownloadContentPack('core-pirates', 'any-user', {
    entitlementStore: new Map(),
  });
  assert.equal(result.ok, true);
  assert.equal(result.pack.id, 'core-pirates');
});

test('userMayDownloadContentPack denies paid pack without entitlement', async () => {
  const store = new Map();
  store.set('user-1', defaultEntitlements());
  const result = await userMayDownloadContentPack('dlc-ye-olde-baloney', 'user-1', {
    entitlementStore: store,
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'forbidden');
});

test('userMayDownloadContentPack allows paid pack when store lists pack id', async () => {
  const store = new Map();
  store.set('user-1', {
    ...defaultEntitlements(),
    unlockedThemePackIds: ['ye-olde-baloney'],
  });
  const result = await userMayDownloadContentPack('dlc-ye-olde-baloney', 'user-1', {
    entitlementStore: store,
  });
  assert.equal(result.ok, true);
});

test('userMayDownloadContentPack allows host_most all protected packs', async () => {
  const store = new Map();
  store.set('vip', {
    ...defaultEntitlements(),
    tierId: 'host_most',
  });
  const result = await userMayDownloadContentPack('dlc-licence-to-fib', 'vip', {
    entitlementStore: store,
  });
  assert.equal(result.ok, true);
});
