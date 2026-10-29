import { defaultEntitlements, mergeEntitlementsRow } from './entitlementsRoutes.js';
import { normalizePlayerProfile } from '../src/data/playerProfile/profileModel.js';
import {
  CONTENT_PACK_ACCESS,
  getContentPackById,
} from './contentPackCatalog.js';
import { syncInviterReferralSecretThemes } from './referralService.js';
import {
  FEVER_DREAM_1_THEME_NAME,
  FEVER_DREAM_2_THEME_NAME,
} from './referralConstants.js';

const TIER_HOST_MOST = 'host_most';

const SECRET_THEME_NAMES = new Set([FEVER_DREAM_1_THEME_NAME, FEVER_DREAM_2_THEME_NAME]);

function normalizePackIds(ids) {
  return [...new Set((ids || []).map((id) => String(id || '').trim()).filter(Boolean))];
}

async function resolveAchievementThemeNames(userId, { profileStore, referralStore } = {}) {
  const profile = normalizePlayerProfile(await Promise.resolve(profileStore?.get(userId)));
  let names = new Set(profile.achievementUnlockedThemeNames || []);
  if (referralStore && profileStore) {
    try {
      const synced = await syncInviterReferralSecretThemes(profileStore, referralStore, userId);
      for (const name of synced?.achievementUnlockedThemeNames || []) {
        if (SECRET_THEME_NAMES.has(name)) names.add(name);
      }
    } catch {
      /* ignore referral sync errors — use profile only */
    }
  }
  return [...names];
}

/**
 * Server-authoritative: may this user download this pack?
 */
export async function userMayDownloadContentPack(
  packId,
  userId,
  { entitlementStore, profileStore, referralStore } = {},
) {
  const pack = getContentPackById(packId);
  if (!pack) return { ok: false, error: 'pack-not-found' };

  if (pack.access === CONTENT_PACK_ACCESS.PUBLIC || pack.tier === 'free') {
    return { ok: true, pack };
  }

  const stored = await Promise.resolve(entitlementStore?.get(userId));
  const entitlements = mergeEntitlementsRow(defaultEntitlements(), stored);
  const unlockedStore = new Set(normalizePackIds(entitlements.unlockedThemePackIds));

  if (entitlements.tierId === TIER_HOST_MOST) {
    return { ok: true, pack };
  }

  const entitlementKey = pack.entitlementPackId || pack.id.replace(/^dlc-/, '');
  if (entitlementKey && unlockedStore.has(entitlementKey)) {
    return { ok: true, pack };
  }

  const achievementThemes = await resolveAchievementThemeNames(userId, {
    profileStore,
    referralStore,
  });
  if (pack.requiredThemeName && achievementThemes.includes(pack.requiredThemeName)) {
    return { ok: true, pack };
  }

  return { ok: false, error: 'forbidden' };
}
