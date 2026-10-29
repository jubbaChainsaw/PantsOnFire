import Stripe from 'stripe';
import { resolveStripePriceId } from './stripeCatalog.js';

const TIER_FIBBER = 'fibber';
const TIER_LOCAL_LIAR = 'local_liar';
const TIER_SUSPECT = 'suspect';
const TIER_HOST_MOST = 'host_most';

/** Display labels aligned with Stripe test/live Price amounts (GBP). */
export const DEFAULT_PRICE_LABELS = {
  [`tier:${TIER_LOCAL_LIAR}`]: '£2.99',
  [`tier:${TIER_SUSPECT}`]: '£4.99',
  [`tier:${TIER_HOST_MOST}`]: '£9.99',
  'addon:twist_truth': '£1.99',
  'dlc:pack': '£2.99',
};

function loadDisplayJson() {
  const raw = String(process.env.STRIPE_CATALOG_DISPLAY_JSON || '').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function formatPriceLabel(unitAmount, currency) {
  const amount = Number(unitAmount);
  if (!Number.isFinite(amount)) return '';
  const cur = String(currency || 'gbp').toLowerCase();
  if (cur === 'gbp') {
    if (amount < 100) return `${amount}p`;
    const pounds = amount / 100;
    return pounds % 1 === 0 ? `£${pounds.toFixed(0)}` : `£${pounds.toFixed(2)}`;
  }
  return `${(amount / 100).toFixed(2)} ${cur.toUpperCase()}`;
}

function getStripe() {
  const key = String(process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' });
}

async function labelForSku(stripe, sku, kind, productId) {
  const overrides = loadDisplayJson();
  if (overrides[sku]) return String(overrides[sku]).trim();
  if (DEFAULT_PRICE_LABELS[sku]) return DEFAULT_PRICE_LABELS[sku];

  const priceId = resolveStripePriceId(kind, productId);
  if (!stripe || !priceId) {
    if (kind === 'dlc') return DEFAULT_PRICE_LABELS['dlc:pack'];
    return '';
  }
  try {
    const price = await stripe.prices.retrieve(priceId);
    const label = formatPriceLabel(price.unit_amount, price.currency);
    return label || DEFAULT_PRICE_LABELS[sku] || '';
  } catch {
    if (kind === 'dlc') return DEFAULT_PRICE_LABELS['dlc:pack'];
    return DEFAULT_PRICE_LABELS[sku] || '';
  }
}

/**
 * @returns {Promise<{ tiers: Record<string,string>, addonTwistTruth: string, dlcPack: string }>}
 */
export async function buildBillingCatalog() {
  const stripe = getStripe();
  const [localLiar, suspect, hostMost, twist, dlcSample] = await Promise.all([
    labelForSku(stripe, `tier:${TIER_LOCAL_LIAR}`, 'tier', TIER_LOCAL_LIAR),
    labelForSku(stripe, `tier:${TIER_SUSPECT}`, 'tier', TIER_SUSPECT),
    labelForSku(stripe, `tier:${TIER_HOST_MOST}`, 'tier', TIER_HOST_MOST),
    labelForSku(stripe, 'addon:twist_truth', 'addon', 'twist_truth'),
    labelForSku(stripe, 'dlc:pack', 'dlc', 'ye-olde-baloney'),
  ]);
  return {
    tiers: {
      [TIER_FIBBER]: 'Free',
      [TIER_LOCAL_LIAR]: localLiar,
      [TIER_SUSPECT]: suspect,
      [TIER_HOST_MOST]: hostMost,
    },
    addonTwistTruth: twist,
    dlcPack: dlcSample,
  };
}
