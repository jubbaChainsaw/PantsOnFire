import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const TIER_FIBBER = 'fibber';
const TIER_LOCAL_LIAR = 'local_liar';
const TIER_SUSPECT = 'suspect';
const TIER_HOST_MOST = 'host_most';

const TIER_RANK = {
  [TIER_FIBBER]: 0,
  [TIER_LOCAL_LIAR]: 1,
  [TIER_SUSPECT]: 2,
  [TIER_HOST_MOST]: 3,
};

function normalizePackIds(ids) {
  const out = [];
  const seen = new Set();
  for (const raw of Array.isArray(ids) ? ids : []) {
    const id = String(raw || '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function pickHigherTier(a, b) {
  const ra = TIER_RANK[a] ?? 0;
  const rb = TIER_RANK[b] ?? 0;
  return rb > ra ? b : a;
}

export function defaultEntitlements() {
  return {
    tierId: TIER_FIBBER,
    addonTwistTruth: false,
    unlockedThemePackIds: [],
    updatedAt: null,
    source: 'default',
  };
}

export function mergeEntitlementsRow(prev, next) {
  const base = { ...defaultEntitlements(), ...prev };
  return {
    tierId: pickHigherTier(String(base.tierId || TIER_FIBBER), String(next.tierId || TIER_FIBBER)),
    addonTwistTruth: Boolean(base.addonTwistTruth || next.addonTwistTruth),
    unlockedThemePackIds: normalizePackIds([
      ...(base.unlockedThemePackIds || []),
      ...(next.unlockedThemePackIds || []),
    ]),
    updatedAt: new Date().toISOString(),
    source: next.source || base.source || 'merged',
  };
}

/**
 * Map active RevenueCat entitlement identifiers to our row shape.
 * Configure entitlement identifiers in RevenueCat to match these keys, or set
 * REVENUECAT_ENTITLEMENT_TIER_JSON e.g. {"premium_host":"host_most"}.
 */
export function mapRevenueCatEntitlements(activeEntitlementIds) {
  const ids = new Set(
    (Array.isArray(activeEntitlementIds) ? activeEntitlementIds : [])
      .map((id) => String(id || '').trim())
      .filter(Boolean),
  );
  let tierId = TIER_FIBBER;
  let addonTwistTruth = false;
  const unlockedThemePackIds = [];

  let customMap = {};
  const raw = String(process.env.REVENUECAT_ENTITLEMENT_TIER_JSON || '').trim();
  if (raw) {
    try {
      customMap = JSON.parse(raw);
    } catch {
      customMap = {};
    }
  }

  for (const id of ids) {
    if (customMap[id]) {
      const mapped = String(customMap[id] || '').trim();
      if (mapped && TIER_RANK[mapped] != null) {
        tierId = pickHigherTier(tierId, mapped);
      }
      continue;
    }
    if (id === 'host_most' || id === 'host_with_most' || id === 'tier_host_most') {
      tierId = pickHigherTier(tierId, TIER_HOST_MOST);
    } else if (id === 'suspect' || id === 'tier_suspect') {
      tierId = pickHigherTier(tierId, TIER_SUSPECT);
    } else if (id === 'local_liar' || id === 'tier_local_liar') {
      tierId = pickHigherTier(tierId, TIER_LOCAL_LIAR);
    } else if (id === 'twist_truth' || id === 'twist_the_truth') {
      addonTwistTruth = true;
    } else if (id.startsWith('dlc_pack_')) {
      unlockedThemePackIds.push(id.slice('dlc_pack_'.length));
    }
  }

  return {
    tierId,
    addonTwistTruth,
    unlockedThemePackIds: normalizePackIds(unlockedThemePackIds),
    source: 'revenuecat',
  };
}

export function collectActiveEntitlementIds(subscriber) {
  const ents = subscriber?.entitlements || {};
  const ids = [];
  const now = Date.now();
  for (const [key, value] of Object.entries(ents)) {
    if (!value || typeof value !== 'object') continue;
    const expires = value.expires_date;
    if (!expires) {
      ids.push(key);
      continue;
    }
    const t = Date.parse(String(expires));
    if (!Number.isFinite(t) || t > now) ids.push(key);
  }
  return ids;
}

function extractSubscriberFromBody(body) {
  if (!body || typeof body !== 'object') return null;
  if (body.subscriber) return body.subscriber;
  if (body.event?.subscriber) return body.event.subscriber;
  return null;
}

function extractAppUserId(body) {
  if (!body || typeof body !== 'object') return '';
  return String(
    body.app_user_id ||
      body.event?.app_user_id ||
      body.original_app_user_id ||
      body.event?.original_app_user_id ||
      '',
  ).trim();
}

function timingSafeStringEqual(a, b) {
  const bufA = Buffer.from(String(a || ''));
  const bufB = Buffer.from(String(b || ''));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function mountEntitlementsRoutes(app, { store } = {}) {
  // The store may be a Map (dev) or an async get/set adapter (e.g. Redis).
  const entitlementStore = store || new Map();
  const supabaseUrl = String(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  ).trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const webhookSecret = String(process.env.REVENUECAT_WEBHOOK_SECRET || '').trim();
  let adminClient = null;
  function getAdminClient() {
    if (!adminClient) {
      adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return adminClient;
  }

  app.get('/api/me/entitlements', async (req, res) => {
    const token = String(req.headers.authorization || '')
      .replace(/^Bearer\s+/i, '')
      .trim();
    if (!token) {
      res.status(401).json({ error: 'missing-token' });
      return;
    }
    if (!supabaseUrl || !serviceKey) {
      res.status(503).json({ error: 'server-auth-not-configured' });
      return;
    }
    const { data, error } = await getAdminClient().auth.getUser(token);
    if (error || !data?.user?.id) {
      res.status(401).json({ error: 'invalid-token' });
      return;
    }
    const userId = data.user.id;
    const stored = await Promise.resolve(entitlementStore.get(userId));
    const row = stored
      ? mergeEntitlementsRow(defaultEntitlements(), stored)
      : defaultEntitlements();
    res.json({
      tierId: row.tierId,
      addonTwistTruth: row.addonTwistTruth,
      unlockedThemePackIds: row.unlockedThemePackIds,
    });
  });

  app.post('/api/billing/revenuecat', async (req, res) => {
    if (!webhookSecret) {
      res.status(503).json({ error: 'webhook-not-configured' });
      return;
    }
    const auth = String(req.headers.authorization || '').trim();
    if (!timingSafeStringEqual(auth, `Bearer ${webhookSecret}`)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const body = req.body;
    const appUserId = extractAppUserId(body);
    if (!appUserId) {
      res.status(400).json({ error: 'missing-app-user-id' });
      return;
    }
    const subscriber = extractSubscriberFromBody(body);
    if (!subscriber) {
      // Without a subscriber payload we cannot know the full entitlement
      // state; acknowledge so RevenueCat does not retry, but change nothing.
      res.json({ ok: true, userId: appUserId, skipped: 'no-subscriber-payload' });
      return;
    }
    // Replace, don't merge upward: the webhook carries the full active
    // entitlement set, so expirations and refunds must lower access too.
    const mapped = mapRevenueCatEntitlements(collectActiveEntitlementIds(subscriber));
    await Promise.resolve(entitlementStore.set(appUserId, {
      ...mapped,
      updatedAt: new Date().toISOString(),
    }));
    res.json({ ok: true, userId: appUserId });
  });

  return { entitlementStore };
}
