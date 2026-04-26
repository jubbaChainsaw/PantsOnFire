import { DLC_THEME_PACKS } from '../themeCatalog';

const ALL_DLC_PACK_IDS = DLC_THEME_PACKS.map((pack) => pack.id);
const VALID_PACK_IDS = new Set(ALL_DLC_PACK_IDS);

// Client-side promo presets for giveaways/marketing campaigns.
// In production, validate codes server-side for revocation/expiry support.
export const THEME_PACK_REDEEM_OFFERS = [
  {
    id: 'promo-history-drop',
    code: 'HISTORY-99',
    packIds: ['worst-liars-in-history'],
    description: 'Giveaway unlock for Worst Liars In History.',
  },
  {
    id: 'promo-case-files',
    code: 'CASEFILES-99',
    packIds: ['high-stakes-cases'],
    description: 'Campaign unlock for High Stakes Cases.',
  },
  {
    id: 'promo-future-fantasy',
    code: 'FANTASY-FUTURE',
    packIds: ['future-and-fantasy'],
    description: 'Creator bundle unlock for Future & Fantasy.',
  },
  {
    id: 'promo-stage-spectacle',
    code: 'SHOWTIME-99',
    packIds: ['stage-and-spectacle'],
    description: 'Event unlock for Stage & Spectacle.',
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
