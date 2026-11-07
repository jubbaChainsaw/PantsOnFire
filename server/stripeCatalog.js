const TIER_FIBBER = 'fibber';
const TIER_LOCAL_LIAR = 'local_liar';
const TIER_SUSPECT = 'suspect';
const TIER_HOST_MOST = 'host_most';

/** @typedef {{ kind: 'tier'|'addon'|'dlc', productId: string, priceId: string }} StripeCatalogEntry */

function envPrice(key) {
  return String(process.env[key] || '').trim();
}

function loadCatalogJson() {
  const raw = String(process.env.STRIPE_CATALOG_JSON || '').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Resolve Stripe Price id for a purchase line.
 * Keys: tier:local_liar, tier:suspect, tier:host_most, addon:twist_truth, dlc:<packId>
 */
export function resolveStripePriceId(kind, productId) {
  const json = loadCatalogJson();
  const sku = `${kind}:${productId}`;
  if (json[sku]) return String(json[sku]).trim();

  const defaults = {
    [`tier:${TIER_LOCAL_LIAR}`]: envPrice('STRIPE_PRICE_TIER_LOCAL_LIAR'),
    [`tier:${TIER_SUSPECT}`]: envPrice('STRIPE_PRICE_TIER_SUSPECT'),
    [`tier:${TIER_HOST_MOST}`]: envPrice('STRIPE_PRICE_TIER_HOST_MOST'),
    'addon:twist_truth': envPrice('STRIPE_PRICE_ADDON_TWIST_TRUTH'),
  };
  if (kind === 'dlc') {
    const perPack = envPrice(`STRIPE_PRICE_DLC_${String(productId).replace(/-/g, '_').toUpperCase()}`);
    if (perPack) return perPack;
    return envPrice('STRIPE_PRICE_DLC_PACK');
  }
  return defaults[sku] || '';
}

export function stripePurchaseToEntitlementPatch(kind, productId) {
  if (kind === 'tier') {
    const tierId = String(productId || '').trim();
    if (!tierId || tierId === TIER_FIBBER) return null;
    return { tierId, source: 'stripe' };
  }
  if (kind === 'addon' && productId === 'twist_truth') {
    return { addonTwistTruth: true, source: 'stripe' };
  }
  if (kind === 'dlc') {
    const packId = String(productId || '').trim();
    if (!packId) return null;
    return { unlockedThemePackIds: [packId], source: 'stripe' };
  }
  return null;
}
