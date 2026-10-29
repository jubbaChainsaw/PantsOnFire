import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { newUserId } from './pofAuthJwt.js';

const scryptAsync = promisify(scrypt);

const memoryUsersByEmail = new Map();
const memoryUsersById = new Map();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeDisplayName(name) {
  return String(name || '').trim();
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(String(password || ''), salt, 64);
  return `scrypt:${salt.toString('base64')}:${Buffer.from(derived).toString('base64')}`;
}

async function verifyPassword(password, encoded) {
  const raw = String(encoded || '');
  const parts = raw.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'base64');
  const expected = Buffer.from(parts[2], 'base64');
  const derived = await scryptAsync(String(password || ''), salt, 64);
  const actual = Buffer.from(derived);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pof_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pof_accounts_email_lower_idx ON pof_accounts (lower(email));
`;

/**
 * @param {import('pg').Pool | null} pool
 */
export async function ensurePoFAccountSchema(pool) {
  if (!pool) return;
  await pool.query(SCHEMA_SQL);
}

/**
 * @param {import('pg').Pool | null} pool
 */
export function createPoFAccountStore(pool) {
  const usePg = Boolean(pool);

  return {
    async createAccount({ email, password, displayName }) {
      const normalizedEmail = normalizeEmail(email);
      const name = normalizeDisplayName(displayName);
      const pass = String(password || '');
      if (!normalizedEmail || !normalizedEmail.includes('@')) {
        return { ok: false, error: 'invalid-email' };
      }
      if (pass.length < 8) {
        return { ok: false, error: 'password-too-short' };
      }
      if (name.length < 2) {
        return { ok: false, error: 'display-name-too-short' };
      }
      const id = newUserId();
      const passwordHash = await hashPassword(pass);
      if (usePg) {
        try {
          await pool.query(
            `INSERT INTO pof_accounts (id, email, display_name, password_hash)
             VALUES ($1, $2, $3, $4)`,
            [id, normalizedEmail, name, passwordHash],
          );
        } catch (err) {
          if (String(err?.code) === '23505') {
            return { ok: false, error: 'email-in-use' };
          }
          throw err;
        }
      } else {
        if (memoryUsersByEmail.has(normalizedEmail)) {
          return { ok: false, error: 'email-in-use' };
        }
        const row = {
          id,
          email: normalizedEmail,
          displayName: name,
          passwordHash,
        };
        memoryUsersByEmail.set(normalizedEmail, row);
        memoryUsersById.set(id, row);
      }
      return {
        ok: true,
        user: { id, email: normalizedEmail, displayName: name },
      };
    },

    async authenticate({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      const pass = String(password || '');
      if (!normalizedEmail || !pass) {
        return { ok: false, error: 'invalid-credentials' };
      }
      let row;
      if (usePg) {
        const res = await pool.query(
          `SELECT id, email, display_name, password_hash
           FROM pof_accounts WHERE lower(email) = lower($1) LIMIT 1`,
          [normalizedEmail],
        );
        row = res.rows[0];
      } else {
        row = memoryUsersByEmail.get(normalizedEmail);
      }
      if (!row) return { ok: false, error: 'invalid-credentials' };
      const ok = await verifyPassword(pass, row.password_hash || row.passwordHash);
      if (!ok) return { ok: false, error: 'invalid-credentials' };
      return {
        ok: true,
        user: {
          id: String(row.id),
          email: String(row.email || normalizedEmail),
          displayName: String(row.display_name || row.displayName || ''),
        },
      };
    },

    async getUserById(userId) {
      const id = String(userId || '').trim();
      if (!id) return null;
      if (usePg) {
        const res = await pool.query(
          `SELECT id, email, display_name FROM pof_accounts WHERE id = $1 LIMIT 1`,
          [id],
        );
        const row = res.rows[0];
        if (!row) return null;
        return {
          id: String(row.id),
          email: String(row.email || ''),
          displayName: String(row.display_name || ''),
        };
      }
      const row = memoryUsersById.get(id);
      if (!row) return null;
      return {
        id: row.id,
        email: row.email,
        displayName: row.displayName,
      };
    },
  };
}
