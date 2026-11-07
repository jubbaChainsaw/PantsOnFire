const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pof_referral_codes (
  user_id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  inviter_device_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pof_referral_codes_code_idx ON pof_referral_codes (code);

CREATE TABLE IF NOT EXISTS pof_referral_signups (
  invitee_user_id TEXT PRIMARY KEY,
  inviter_user_id TEXT NOT NULL,
  code TEXT NOT NULL,
  invitee_device_id TEXT,
  signed_up_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  conversion_source TEXT
);

CREATE INDEX IF NOT EXISTS pof_referral_signups_inviter_idx
  ON pof_referral_signups (inviter_user_id);
`;

function normalizeDeviceIds(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((id) => String(id || '').trim()).filter(Boolean))].slice(0, 32);
}

function randomReferralCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function ensurePoFReferralSchema(pool) {
  if (!pool) return;
  await pool.query(SCHEMA_SQL);
}

export function createPostgresReferralStore(pool) {
  return {
    async getCodeRowByUserId(userId) {
      const id = String(userId || '').trim();
      if (!id) return null;
      const res = await pool.query(
        `SELECT user_id, code, inviter_device_ids, created_at
         FROM pof_referral_codes WHERE user_id = $1`,
        [id],
      );
      return res.rows[0] || null;
    },
    async getCodeRowByCode(code) {
      const normalized = String(code || '').trim().toUpperCase();
      if (!normalized) return null;
      const res = await pool.query(
        `SELECT user_id, code, inviter_device_ids, created_at
         FROM pof_referral_codes WHERE code = $1`,
        [normalized],
      );
      return res.rows[0] || null;
    },
    async createCodeRow(userId, code, deviceId) {
      const id = String(userId || '').trim();
      const devices = deviceId ? [String(deviceId).trim()] : [];
      await pool.query(
        `INSERT INTO pof_referral_codes (user_id, code, inviter_device_ids)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (user_id) DO NOTHING`,
        [id, code, JSON.stringify(devices)],
      );
      return this.getCodeRowByUserId(id);
    },
    async registerInviterDevice(userId, deviceId) {
      const id = String(userId || '').trim();
      const device = String(deviceId || '').trim();
      if (!id || !device) return;
      const row = await this.getCodeRowByUserId(id);
      if (!row) return;
      const merged = normalizeDeviceIds([...(row.inviter_device_ids || []), device]);
      await pool.query(
        `UPDATE pof_referral_codes SET inviter_device_ids = $2::jsonb WHERE user_id = $1`,
        [id, JSON.stringify(merged)],
      );
    },
    async insertSignup(payload) {
      const invitee = String(payload.inviteeUserId || '').trim();
      const inviter = String(payload.inviterUserId || '').trim();
      const code = String(payload.code || '').trim().toUpperCase();
      const deviceId = String(payload.inviteeDeviceId || '').trim() || null;
      if (!invitee || !inviter || !code) return { ok: false, error: 'invalid-payload' };
      try {
        await pool.query(
          `INSERT INTO pof_referral_signups
            (invitee_user_id, inviter_user_id, code, invitee_device_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (invitee_user_id) DO NOTHING`,
          [invitee, inviter, code, deviceId],
        );
        return { ok: true };
      } catch (err) {
        return { ok: false, error: String(err?.message || err) };
      }
    },
    async getSignupByInvitee(inviteeUserId) {
      const id = String(inviteeUserId || '').trim();
      if (!id) return null;
      const res = await pool.query(
        `SELECT invitee_user_id, inviter_user_id, code, invitee_device_id,
                signed_up_at, converted_at, conversion_source
         FROM pof_referral_signups WHERE invitee_user_id = $1`,
        [id],
      );
      return res.rows[0] || null;
    },
    async countInvitesForInviter(inviterUserId) {
      const id = String(inviterUserId || '').trim();
      const res = await pool.query(
        `SELECT
           COUNT(*)::int AS invited,
           COUNT(converted_at)::int AS converted
         FROM pof_referral_signups WHERE inviter_user_id = $1`,
        [id],
      );
      const row = res.rows[0] || { invited: 0, converted: 0 };
      return { invited: row.invited || 0, converted: row.converted || 0 };
    },
    async markConverted(inviteeUserId, source) {
      const id = String(inviteeUserId || '').trim();
      const res = await pool.query(
        `UPDATE pof_referral_signups
         SET converted_at = COALESCE(converted_at, now()),
             conversion_source = COALESCE(conversion_source, $2)
         WHERE invitee_user_id = $1 AND converted_at IS NULL
         RETURNING inviter_user_id`,
        [id, String(source || 'purchase').trim()],
      );
      return { rows: res.rows || [] };
    },
    async getSignupForConversion(inviteeUserId) {
      const signup = await this.getSignupByInvitee(inviteeUserId);
      if (!signup || signup.converted_at) return null;
      return signup;
    },
  };
}

export function createMemoryReferralStore() {
  const codesByUser = new Map();
  const codesByCode = new Map();
  const signupsByInvitee = new Map();

  return {
    async getCodeRowByUserId(userId) {
      return codesByUser.get(String(userId || '').trim()) || null;
    },
    async getCodeRowByCode(code) {
      return codesByCode.get(String(code || '').trim().toUpperCase()) || null;
    },
    async createCodeRow(userId, code, deviceId) {
      const id = String(userId || '').trim();
      if (codesByUser.has(id)) return codesByUser.get(id);
      const row = {
        user_id: id,
        code: String(code).trim().toUpperCase(),
        inviter_device_ids: deviceId ? [String(deviceId).trim()] : [],
        created_at: new Date().toISOString(),
      };
      codesByUser.set(id, row);
      codesByCode.set(row.code, row);
      return row;
    },
    async registerInviterDevice(userId, deviceId) {
      const row = await this.getCodeRowByUserId(userId);
      if (!row) return;
      row.inviter_device_ids = normalizeDeviceIds([
        ...(row.inviter_device_ids || []),
        deviceId,
      ]);
    },
    async insertSignup(payload) {
      const invitee = String(payload.inviteeUserId || '').trim();
      if (signupsByInvitee.has(invitee)) return { ok: true, duplicate: true };
      signupsByInvitee.set(invitee, {
        invitee_user_id: invitee,
        inviter_user_id: String(payload.inviterUserId || '').trim(),
        code: String(payload.code || '').trim().toUpperCase(),
        invitee_device_id: String(payload.inviteeDeviceId || '').trim() || null,
        signed_up_at: new Date().toISOString(),
        converted_at: null,
        conversion_source: null,
      });
      return { ok: true };
    },
    async getSignupByInvitee(inviteeUserId) {
      return signupsByInvitee.get(String(inviteeUserId || '').trim()) || null;
    },
    async countInvitesForInviter(inviterUserId) {
      const id = String(inviterUserId || '').trim();
      let invited = 0;
      let converted = 0;
      for (const row of signupsByInvitee.values()) {
        if (row.inviter_user_id !== id) continue;
        invited += 1;
        if (row.converted_at) converted += 1;
      }
      return { invited, converted };
    },
    async markConverted(inviteeUserId, source) {
      const row = signupsByInvitee.get(String(inviteeUserId || '').trim());
      if (!row || row.converted_at) return { rows: [] };
      row.converted_at = new Date().toISOString();
      row.conversion_source = String(source || 'purchase').trim();
      return { rows: [{ inviter_user_id: row.inviter_user_id }] };
    },
    async getSignupForConversion(inviteeUserId) {
      const signup = await this.getSignupByInvitee(inviteeUserId);
      if (!signup || signup.converted_at) return null;
      return signup;
    },
  };
}

export { randomReferralCode, normalizeDeviceIds };
