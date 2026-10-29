import { ULTIMATE_LIAR_THEME_NAME } from './referralConstants.js';
import { randomReferralCode } from './pofReferralStore.js';
import { normalizePlayerProfile } from '../src/data/playerProfile/profileModel.js';

function deviceIdsFromRow(row) {
  const raw = row?.inviter_device_ids;
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

async function ensureReferralCode(referralStore, userId, deviceId) {
  let row = await referralStore.getCodeRowByUserId(userId);
  if (row) {
    if (deviceId) {
      await referralStore.registerInviterDevice(userId, deviceId);
      row = await referralStore.getCodeRowByUserId(userId);
    }
    return row;
  }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = randomReferralCode();
    const existing = await referralStore.getCodeRowByCode(code);
    if (existing) continue;
    row = await referralStore.createCodeRow(userId, code, deviceId);
    if (row) return row;
  }
  throw new Error('referral-code-generation-failed');
}

export async function getReferralSummary(referralStore, userId, deviceId) {
  const row = await ensureReferralCode(referralStore, userId, deviceId);
  const stats = await referralStore.countInvitesForInviter(userId);
  return {
    code: row.code,
    stats,
  };
}

export async function attributeReferralSignup(referralStore, {
  inviteeUserId,
  code,
  inviteeDeviceId,
}) {
  const invitee = String(inviteeUserId || '').trim();
  const normalizedCode = String(code || '').trim().toUpperCase();
  const deviceId = String(inviteeDeviceId || '').trim();
  if (!invitee || !normalizedCode) {
    return { ok: false, error: 'invalid-payload' };
  }

  const existing = await referralStore.getSignupByInvitee(invitee);
  if (existing) {
    return { ok: true, alreadyAttributed: true };
  }

  const codeRow = await referralStore.getCodeRowByCode(normalizedCode);
  if (!codeRow) {
    return { ok: false, error: 'invalid-code' };
  }

  const inviterUserId = String(codeRow.user_id || '').trim();
  if (!inviterUserId) {
    return { ok: false, error: 'invalid-code' };
  }
  if (inviterUserId === invitee) {
    return { ok: false, error: 'self-referral' };
  }

  const inviterDevices = deviceIdsFromRow(codeRow);
  if (deviceId && inviterDevices.includes(deviceId)) {
    return { ok: false, error: 'self-referral-device' };
  }

  const insertResult = await referralStore.insertSignup({
    inviteeUserId: invitee,
    inviterUserId,
    code: normalizedCode,
    inviteeDeviceId: deviceId,
  });
  if (!insertResult.ok) {
    return { ok: false, error: insertResult.error || 'insert-failed' };
  }
  return { ok: true, inviterUserId };
}

export async function rewardInviterUltimateLiar(playerProfileStore, inviterUserId) {
  if (!playerProfileStore || !inviterUserId) return null;
  const prev = normalizePlayerProfile(
    await Promise.resolve(playerProfileStore.get(inviterUserId)),
  );
  const themes = new Set(prev.achievementUnlockedThemeNames || []);
  if (themes.has(ULTIMATE_LIAR_THEME_NAME)) {
    return prev;
  }
  themes.add(ULTIMATE_LIAR_THEME_NAME);
  const next = normalizePlayerProfile({
    ...prev,
    achievementUnlockedThemeNames: [...themes],
    referralUnlockToastPending: true,
  });
  await Promise.resolve(playerProfileStore.set(inviterUserId, next));
  return next;
}

export async function processInviteeFirstPaidPurchase(
  { referralStore, playerProfileStore },
  inviteeUserId,
  source,
) {
  const invitee = String(inviteeUserId || '').trim();
  if (!invitee) return { ok: false, error: 'missing-user' };
  const signup = await referralStore.getSignupForConversion(invitee);
  if (!signup) return { ok: true, skipped: 'no-pending-referral' };

  const markResult = await referralStore.markConverted(invitee, source);
  const inviterUserId =
    markResult?.rows?.[0]?.inviter_user_id || signup.inviter_user_id;
  if (!inviterUserId) return { ok: false, error: 'missing-inviter' };

  await rewardInviterUltimateLiar(playerProfileStore, inviterUserId);
  return { ok: true, inviterUserId, inviteeUserId: invitee };
}

export function createReferralHooks({ referralStore, playerProfileStore }) {
  return {
    async onInviteeFirstPaidPurchase(inviteeUserId, source) {
      return processInviteeFirstPaidPurchase(
        { referralStore, playerProfileStore },
        inviteeUserId,
        source,
      );
    },
  };
}
