import { DLC_THEME_PACKS } from '../themeCatalog';

const ALL_DLC_PACK_IDS = DLC_THEME_PACKS.map((pack) => pack.id);
const VALID_PACK_IDS = new Set(ALL_DLC_PACK_IDS);

// Client-side promo presets for giveaways/marketing campaigns.
// In production, validate codes server-side for revocation/expiry support.
export const THEME_PACK_REDEEM_OFFERS = [
  {
    id: 'promo-ye-olde',
    code: 'YEOlDE-99',
    packIds: ['ye-olde-baloney'],
    description: 'Giveaway unlock for Ye Olde Baloney.',
  },
  {
    id: 'promo-myth-taken',
    code: 'MYTH-99',
    packIds: ['myth-taken-identity'],
    description: 'Campaign unlock for Myth-Taken Identity.',
  },
  {
    id: 'promo-licence-fib',
    code: 'LICENCE-FIB',
    packIds: ['licence-to-fib'],
    description: 'Creator unlock for Licence to Fib.',
  },
  {
    id: 'promo-glitter',
    code: 'SHOWTIME-99',
    packIds: ['glitter-and-suspects'],
    description: 'Event unlock for Glitter & Suspects.',
  },
  {
    id: 'promo-all-theme-packs',
    code: 'ALL-THEMES-FIRE',
    packIds: ALL_DLC_PACK_IDS,
    description: 'Global campaign unlock for all theme DLC packs.',
  },
];

export function normalizeThemePackRedeemCode(rawCode = '') {
  return String(rawCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const THEME_PACK_REDEEM_OFFER_BY_CODE = Object.fromEntries(
  THEME_PACK_REDEEM_OFFERS.map((offer) => {
    const normalizedCode = normalizeThemePackRedeemCode(offer.code);
    const validPackIds = [...new Set((offer.packIds || []).filter((packId) => VALID_PACK_IDS.has(packId)))];
    return [normalizedCode, {
      ...offer,
      normalizedCode,
      packIds: validPackIds,
    }];
  })
);

export function getThemePackRedeemOffer(rawCode = '') {
  const normalizedCode = normalizeThemePackRedeemCode(rawCode);
  if (!normalizedCode) return null;
  return THEME_PACK_REDEEM_OFFER_BY_CODE[normalizedCode] || null;
}
