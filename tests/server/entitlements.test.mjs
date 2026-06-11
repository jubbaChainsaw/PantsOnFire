import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectActiveEntitlementIds,
  defaultEntitlements,
  mapRevenueCatEntitlements,
  mergeEntitlementsRow,
  mountEntitlementsRoutes,
} from '../../server/entitlementsRoutes.js';

function createAppStub() {
  const handlers = new Map();
  return {
    get: (path, handler) => handlers.set(`GET ${path}`, handler),
    post: (path, handler) => handlers.set(`POST ${path}`, handler),
    handlers,
  };
}

function createResStub() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

test('mapRevenueCatEntitlements maps tiers, addons and dlc packs', () => {
  const mapped = mapRevenueCatEntitlements([
    'tier_suspect',
    'twist_truth',
    'dlc_pack_ye-olde-baloney',
    'dlc_pack_beast-mode-deceit',
  ]);
  assert.equal(mapped.tierId, 'suspect');
  assert.equal(mapped.addonTwistTruth, true);
  assert.deepEqual(mapped.unlockedThemePackIds, ['ye-olde-baloney', 'beast-mode-deceit']);
});

test('mapRevenueCatEntitlements keeps the highest tier', () => {
  const mapped = mapRevenueCatEntitlements(['local_liar', 'host_most']);
  assert.equal(mapped.tierId, 'host_most');
});

test('collectActiveEntitlementIds drops expired entitlements', () => {
  const past = new Date(Date.now() - 1000).toISOString();
  const future = new Date(Date.now() + 1000 * 60).toISOString();
  const ids = collectActiveEntitlementIds({
    entitlements: {
      expired_one: { expires_date: past },
      active_one: { expires_date: future },
      lifetime_one: {},
    },
  });
  assert.deepEqual(ids.sort(), ['active_one', 'lifetime_one']);
});

test('mergeEntitlementsRow keeps the higher tier and unions pack ids', () => {
  const merged = mergeEntitlementsRow(
    { ...defaultEntitlements(), tierId: 'suspect', unlockedThemePackIds: ['a'] },
    { tierId: 'local_liar', unlockedThemePackIds: ['b'], addonTwistTruth: true }
  );
  assert.equal(merged.tierId, 'suspect');
  assert.equal(merged.addonTwistTruth, true);
  assert.deepEqual(merged.unlockedThemePackIds, ['a', 'b']);
});

test('revenuecat webhook replaces entitlement state so downgrades apply', async (t) => {
  process.env.REVENUECAT_WEBHOOK_SECRET = 'test-secret';
  t.after(() => {
    delete process.env.REVENUECAT_WEBHOOK_SECRET;
  });
  const app = createAppStub();
  const store = new Map();
  mountEntitlementsRoutes(app, { store });
  const webhook = app.handlers.get('POST /api/billing/revenuecat');
  const future = new Date(Date.now() + 1000 * 60).toISOString();

  // Purchase event grants host_most.
  let res = createResStub();
  await webhook(
    {
      headers: { authorization: 'Bearer test-secret' },
      body: {
        app_user_id: 'user-1',
        subscriber: { entitlements: { host_most: { expires_date: future } } },
      },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(store.get('user-1').tierId, 'host_most');

  // Expiration event with no active entitlements must downgrade.
  res = createResStub();
  await webhook(
    {
      headers: { authorization: 'Bearer test-secret' },
      body: {
        app_user_id: 'user-1',
        subscriber: { entitlements: {} },
      },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(store.get('user-1').tierId, 'fibber', 'expiry must remove the tier');

  // Events without a subscriber payload are acknowledged but change nothing.
  store.set('user-1', { ...defaultEntitlements(), tierId: 'suspect' });
  res = createResStub();
  await webhook(
    {
      headers: { authorization: 'Bearer test-secret' },
      body: { app_user_id: 'user-1' },
    },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.skipped, 'no-subscriber-payload');
  assert.equal(store.get('user-1').tierId, 'suspect');
});

test('revenuecat webhook rejects bad authorization', async (t) => {
  process.env.REVENUECAT_WEBHOOK_SECRET = 'test-secret';
  t.after(() => {
    delete process.env.REVENUECAT_WEBHOOK_SECRET;
  });
  const app = createAppStub();
  mountEntitlementsRoutes(app, { store: new Map() });
  const webhook = app.handlers.get('POST /api/billing/revenuecat');
  const res = createResStub();
  await webhook(
    {
      headers: { authorization: 'Bearer wrong-secret' },
      body: { app_user_id: 'user-1', subscriber: { entitlements: {} } },
    },
    res
  );
  assert.equal(res.statusCode, 401);
});
