import { normalizePlayerProfile } from '../src/data/playerProfile/profileModel.js';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pof_player_profiles (
  user_id TEXT PRIMARY KEY,
  profile_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

function rowFromDb(record) {
  if (!record) return undefined;
  const raw = record.profile_json;
  const profile =
    raw && typeof raw === 'object'
      ? raw
      : typeof raw === 'string'
        ? JSON.parse(raw)
        : {};
  return normalizePlayerProfile(profile);
}

export async function ensurePoFPlayerProfileSchema(pool) {
  if (!pool) return;
  await pool.query(SCHEMA_SQL);
}

export function createPostgresPlayerProfileStore(pool) {
  return {
    async get(userId) {
      const id = String(userId || '').trim();
      if (!id) return undefined;
      const res = await pool.query(
        `SELECT profile_json FROM pof_player_profiles WHERE user_id = $1`,
        [id],
      );
      return rowFromDb(res.rows[0]);
    },
    async set(userId, profile) {
      const id = String(userId || '').trim();
      if (!id) return;
      const normalized = normalizePlayerProfile(profile);
      await pool.query(
        `INSERT INTO pof_player_profiles (user_id, profile_json, updated_at)
         VALUES ($1, $2::jsonb, now())
         ON CONFLICT (user_id) DO UPDATE SET
           profile_json = EXCLUDED.profile_json,
           updated_at = now()`,
        [id, JSON.stringify(normalized)],
      );
      return normalized;
    },
  };
}
