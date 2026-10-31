const REPORTS_SCHEMA = `
CREATE TABLE IF NOT EXISTS pof_moderation_reports (
  id TEXT PRIMARY KEY,
  lobby_code TEXT NOT NULL,
  reporter_player_id TEXT NOT NULL,
  reporter_auth_user_id TEXT,
  reported_player_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  note TEXT,
  chat_context JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pof_moderation_reports_created_idx ON pof_moderation_reports (created_at DESC);
`;

const BLOCKS_SCHEMA = `
CREATE TABLE IF NOT EXISTS pof_player_blocks (
  blocker_user_id TEXT NOT NULL,
  blocked_player_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_user_id, blocked_player_key)
);
`;

const DELETION_REQUESTS_SCHEMA = `
CREATE TABLE IF NOT EXISTS pof_account_deletion_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function ensureModerationSchema(pool) {
  if (!pool) return;
  await pool.query(REPORTS_SCHEMA);
  await pool.query(BLOCKS_SCHEMA);
  await pool.query(DELETION_REQUESTS_SCHEMA);
}

export function createModerationStore(pool) {
  const memoryReports = [];
  const memoryBlocks = new Map();
  const memoryDeletionRequests = [];

  return {
    async saveReport(row) {
      const record = {
        id: newId('rep'),
        lobbyCode: String(row.lobbyCode || '').toUpperCase(),
        reporterPlayerId: String(row.reporterPlayerId || ''),
        reporterAuthUserId: String(row.reporterAuthUserId || ''),
        reportedPlayerId: String(row.reportedPlayerId || ''),
        reason: String(row.reason || 'other'),
        note: String(row.note || '').slice(0, 500),
        chatContext: Array.isArray(row.chatContext) ? row.chatContext : [],
        createdAt: new Date().toISOString(),
      };
      if (pool) {
        await pool.query(
          `INSERT INTO pof_moderation_reports
           (id, lobby_code, reporter_player_id, reporter_auth_user_id, reported_player_id, reason, note, chat_context)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
          [
            record.id,
            record.lobbyCode,
            record.reporterPlayerId,
            record.reporterAuthUserId || null,
            record.reportedPlayerId,
            record.reason,
            record.note || null,
            JSON.stringify(record.chatContext),
          ],
        );
      } else {
        memoryReports.push(record);
      }
      return record;
    },

    async listBlocks(blockerUserId) {
      const id = String(blockerUserId || '').trim();
      if (!id) return [];
      if (pool) {
        const res = await pool.query(
          `SELECT blocked_player_key FROM pof_player_blocks WHERE blocker_user_id = $1`,
          [id],
        );
        return res.rows.map((row) => String(row.blocked_player_key || '')).filter(Boolean);
      }
      return [...(memoryBlocks.get(id) || new Set())];
    },

    async addBlock(blockerUserId, blockedPlayerKey) {
      const blocker = String(blockerUserId || '').trim();
      const blocked = String(blockedPlayerKey || '').trim().toLowerCase();
      if (!blocker || !blocked) return [];
      if (pool) {
        await pool.query(
          `INSERT INTO pof_player_blocks (blocker_user_id, blocked_player_key)
           VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [blocker, blocked],
        );
        return this.listBlocks(blocker);
      }
      const set = memoryBlocks.get(blocker) || new Set();
      set.add(blocked);
      memoryBlocks.set(blocker, set);
      return [...set];
    },

    async removeBlock(blockerUserId, blockedPlayerKey) {
      const blocker = String(blockerUserId || '').trim();
      const blocked = String(blockedPlayerKey || '').trim().toLowerCase();
      if (!blocker || !blocked) return [];
      if (pool) {
        await pool.query(
          `DELETE FROM pof_player_blocks WHERE blocker_user_id = $1 AND blocked_player_key = $2`,
          [blocker, blocked],
        );
        return this.listBlocks(blocker);
      }
      const set = memoryBlocks.get(blocker);
      if (set) set.delete(blocked);
      return this.listBlocks(blocker);
    },

    async saveDeletionRequest({ email, note }) {
      const record = {
        id: newId('delreq'),
        email: String(email || '').trim().toLowerCase(),
        note: String(note || '').slice(0, 1000),
        createdAt: new Date().toISOString(),
      };
      if (pool) {
        await pool.query(
          `INSERT INTO pof_account_deletion_requests (id, email, note) VALUES ($1,$2,$3)`,
          [record.id, record.email, record.note || null],
        );
      } else {
        memoryDeletionRequests.push(record);
      }
      return record;
    },
  };
}
