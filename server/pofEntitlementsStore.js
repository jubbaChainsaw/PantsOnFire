import { defaultEntitlements, mergeEntitlementsRow } from './entitlementsRoutes.js';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pof_entitlements (
  user_id TEXT PRIMARY KEY,
  tier_id TEXT NOT NULL DEFAULT 'fibber',
  addon_twist_truth BOOLEAN NOT NULL DEFAULT false,
  unlocked_theme_pack_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'default'
);
`;

function rowFromDb(record) {
  if (!record) return undefined;
  const rawPacks = record.unlocked_theme_pack_ids;
  const packs = Array.isArray(rawPacks)
    ? rawPacks
    : typeof rawPacks === 'string'
      ? JSON.parse(rawPacks)
      : [];
  return {
    tierId: String(record.tier_id || 'fibber'),
    addonTwistTruth: Boolean(record.addon_twist_truth),
    unlockedThemePackIds: packs,
    updatedAt: record.updated_at ? new Date(record.updated_at).toISOString() : null,
    source: String(record.source || 'default'),
  };
}

function rowToDb(row) {
  const merged = mergeEntitlementsRow(defaultEntitlements(), row || {});
  return {
    tier_id: merged.tierId,
    addon_twist_truth: merged.addonTwistTruth,
    unlocked_theme_pack_ids: JSON.stringify(merged.unlockedThemePackIds || []),
    updated_at: merged.updatedAt || new Date().toISOString(),
    source: merged.source || 'merged',
  };
}

export async function ensurePoFEntitlementsSchema(pool) {
  if (!pool) return;
  await pool.query(SCHEMA_SQL);
}

/**
 * Postgres-backed entitlements when DATABASE_URL is set.
 * @param {import('pg').Pool} pool
 */
export function createPostgresEntitlementsStore(pool) {
  return {
    async get(userId) {
      const id = String(userId || '').trim();
      if (!id) return undefined;
      const res = await pool.query(
        `SELECT tier_id, addon_twist_truth, unlocked_theme_pack_ids, updated_at, source
         FROM pof_entitlements WHERE user_id = $1`,
        [id],
      );
      return rowFromDb(res.rows[0]);
    },
    async set(userId, row) {
      const id = String(userId || '').trim();
      if (!id) return;
      const db = rowToDb(row);
      await pool.query(
        `INSERT INTO pof_entitlements (user_id, tier_id, addon_twist_truth, unlocked_theme_pack_ids, updated_at, source)
         VALUES ($1, $2, $3, $4::jsonb, $5::timestamptz, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           tier_id = EXCLUDED.tier_id,
           addon_twist_truth = EXCLUDED.addon_twist_truth,
           unlocked_theme_pack_ids = EXCLUDED.unlocked_theme_pack_ids,
           updated_at = EXCLUDED.updated_at,
           source = EXCLUDED.source`,
        [
          id,
          db.tier_id,
          db.addon_twist_truth,
          db.unlocked_theme_pack_ids,
          db.updated_at,
          db.source,
        ],
      );
    },
  };
}
