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

function defaultEntitlements() {
  return {
    tierId: TIER_FIBBER,
    addonTwistTruth: false,
    unlockedThemePackIds: [],
    updatedAt: null,
    source: 'default',
  };
}

function mergeEntitlementsRow(prev, next) {
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
function mapRevenueCatEntitlements(activeEntitlementIds) {
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

function collectActiveEntitlementIds(subscriber) {
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

/**
 * Build the entitlement store backed by Supabase when configured, falling back to
 * an in-memory Map for local development.
 *
 * Expected table DDL (run once in Supabase SQL editor):
 *
 *   create table if not exists user_entitlements (
 *     user_id               text primary key,
 *     tier_id               text not null default 'fibber',
 *     addon_twist_truth     boolean not null default false,
 *     unlocked_theme_pack_ids jsonb not null default '[]',
 *     updated_at            timestamptz not null default now(),
 *     source                text not null default 'default'
 *   );
 *
 * See docs/supabase-entitlements-migration.sql for the full migration.
 */
function buildEntitlementStore(supabaseUrl, serviceKey) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (supabaseUrl && serviceKey) {
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    return {
      async get(userId) {
        const { data, error } = await supabase
          .from('user_entitlements')
          .select('tier_id, addon_twist_truth, unlocked_theme_pack_ids, updated_at, source')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) {
          // eslint-disable-next-line no-console
          console.error('[entitlements] supabase get error', error);
          return null;
        }
        if (!data) return null;
        return {
          tierId: data.tier_id,
          addonTwistTruth: data.addon_twist_truth,
          unlockedThemePackIds: Array.isArray(data.unlocked_theme_pack_ids)
            ? data.unlocked_theme_pack_ids
            : [],
          updatedAt: data.updated_at,
          source: data.source,
        };
      },
      async set(userId, row) {
        const { error } = await supabase.from('user_entitlements').upsert(
          {
            user_id: userId,
            tier_id: row.tierId,
            addon_twist_truth: row.addonTwistTruth,
            unlocked_theme_pack_ids: row.unlockedThemePackIds,
            updated_at: row.updatedAt || new Date().toISOString(),
            source: row.source || 'system',
          },
          { onConflict: 'user_id' },
        );
        if (error) {
          // eslint-disable-next-line no-console
          console.error('[entitlements] supabase set error', error);
        }
      },
    };
  }

  if (isProduction) {
    // eslint-disable-next-line no-console
    console.warn(
      '[entitlements] WARNING: Running in production without a persistent entitlement store. ' +
        'Entitlements will be lost on restart. ' +
        'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable Supabase persistence.',
    );
  }

  // In-memory fallback for local development.
  const memStore = new Map();
  return {
    async get(userId) {
      return memStore.get(userId) || null;
    },
    async set(userId, row) {
      memStore.set(userId, row);
    },
  };
}

export function mountEntitlementsRoutes(app, { store } = {}) {
  const supabaseUrl = String(
    process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  ).trim();
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const webhookSecret = String(process.env.REVENUECAT_WEBHOOK_SECRET || '').trim();

  const entitlementStore = store || buildEntitlementStore(supabaseUrl, serviceKey);

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
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data?.user?.id) {
      res.status(401).json({ error: 'invalid-token' });
      return;
    }
    const userId = data.user.id;
    const stored = await entitlementStore.get(userId);
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
    if (auth !== `Bearer ${webhookSecret}`) {
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
    const activeIds = subscriber ? collectActiveEntitlementIds(subscriber) : [];
    const mapped = mapRevenueCatEntitlements(activeIds);
    const prev = (await entitlementStore.get(appUserId)) || defaultEntitlements();
    const next = mergeEntitlementsRow(prev, mapped);
    await entitlementStore.set(appUserId, next);
    res.json({ ok: true, userId: appUserId });
  });

  return { entitlementStore };
}

export { mapRevenueCatEntitlements, mergeEntitlementsRow, defaultEntitlements };
