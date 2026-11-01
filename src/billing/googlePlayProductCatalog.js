import { DLC_THEME_PACKS } from '../data/themeCatalog.js';
import {
  TIER_HOST_MOST,
  TIER_LOCAL_LIAR,
  TIER_SUSPECT,
} from '../account/tierModel.js';

/** Google Play base plan id on each subscription (Play Console). */
export const GOOGLE_PLAY_SUBSCRIPTION_BASE_PLAN_ID = 'monthly';

/** @type {Record<string, string>} internal tierId → Play subscription product id */
export const GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_BY_TIER = {
  [TIER_LOCAL_LIAR]: 'local_liar',
  [TIER_SUSPECT]: 'suspect',
  [TIER_HOST_MOST]: 'host_most',
};

export const GOOGLE_PLAY_ADDON_TWIST_TRUTH_PRODUCT_ID = 'twist_truth';

/** Internal pack id (may contain hyphens) → Play one-time product id segment after `dlc_pack_`. */
export function internalPackIdToPlaySlug(packId = '') {
  return String(packId || '')
    .trim()
    .replace(/-/g, '_');
}

/** Full Google Play in-app product id for a DLC pack (internal pack id unchanged in game data). */
export function googlePlayDlcProductIdForPack(internalPackId = '') {
  const slug = internalPackIdToPlaySlug(internalPackId);
  if (!slug) return '';
  return `dlc_pack_${slug}`;
}

/**
 * Resolve internal theme pack id from a store/RevenueCat suffix or full product id.
 * Accepts hyphen ids, underscore slugs, or full `dlc_pack_*` product ids.
 */
export function resolveInternalThemePackIdFromStoreKey(storeKey = '') {
  let key = String(storeKey || '').trim();
  if (!key) return '';
  if (key.startsWith('dlc_pack_')) {
    key = key.slice('dlc_pack_'.length);
  }
  const direct = DLC_THEME_PACKS.find((pack) => pack.id === key);
  if (direct) return direct.id;
  const byPlaySlug = DLC_THEME_PACKS.find(
    (pack) => internalPackIdToPlaySlug(pack.id) === key,
  );
  if (byPlaySlug) return byPlaySlug.id;
  return key.replace(/_/g, '-');
}

/**
 * Map in-app purchase request to Google Play product id.
 * @param {{ kind: 'tier'|'addon'|'dlc', productId: string }} params internal tier id, addon key, or internal pack id
 */
export function googlePlayProductIdForPurchase({ kind = '', productId = '' } = {}) {
  const id = String(productId || '').trim();
  if (!id) return null;
  if (kind === 'tier') {
    return GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_BY_TIER[id] || null;
  }
  if (kind === 'addon') {
    if (id === 'twist_truth' || id === 'twist-truth' || id === 'twistTruth') {
      return GOOGLE_PLAY_ADDON_TWIST_TRUTH_PRODUCT_ID;
    }
    return null;
  }
  if (kind === 'dlc') {
    return googlePlayDlcProductIdForPack(id);
  }
  return null;
}

/** Human-readable mapping table for docs / QA. */
export function listGooglePlayProductMappings() {
  const tiers = Object.entries(GOOGLE_PLAY_SUBSCRIPTION_PRODUCT_BY_TIER).map(
    ([internalTierId, playProductId]) => ({
      kind: 'subscription',
      internalId: internalTierId,
      googlePlayProductId: playProductId,
      basePlanId: GOOGLE_PLAY_SUBSCRIPTION_BASE_PLAN_ID,
    }),
  );
  const addon = {
    kind: 'one_time',
    internalId: 'twist_truth',
    googlePlayProductId: GOOGLE_PLAY_ADDON_TWIST_TRUTH_PRODUCT_ID,
  };
  const dlc = DLC_THEME_PACKS.map((pack) => ({
    kind: 'one_time',
    internalPackId: pack.id,
    googlePlayProductId: googlePlayDlcProductIdForPack(pack.id),
  }));
  return { tiers, addon, dlc };
}
