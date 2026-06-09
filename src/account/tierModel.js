import { DLC_THEME_PACKS, normalizeUnlockedThemePackIds } from '../data/themeCatalog';

const DLC_BUNDLE_NAMES_LIST = DLC_THEME_PACKS.map((p) => p.name).join(', ');

export const TIER_FIBBER = 'fibber';
export const TIER_LOCAL_LIAR = 'local_liar';
export const TIER_SUSPECT = 'suspect';
export const TIER_HOST_MOST = 'host_most';

export const TIER_RANK = {
  [TIER_FIBBER]: 0,
  [TIER_LOCAL_LIAR]: 1,
  [TIER_SUSPECT]: 2,
  [TIER_HOST_MOST]: 3,
};

/** @typedef {{ tierId: string, name: string, priceLabel: string, upgradeHint?: string, bullets: string[] }} TierProduct */

/** @type {TierProduct[]} */
export const SUBSCRIPTION_TIERS = [
  {
    tierId: TIER_FIBBER,
    name: 'Fibber',
    priceLabel: 'Free',
    bullets: ['Join online lobbies that someone else has created.'],
  },
  {
    tierId: TIER_LOCAL_LIAR,
    name: 'Local Liar',
    priceLabel: '99p',
    upgradeHint: 'Includes everything in Fibber.',
    bullets: [
      'Create local pass-the-phone games.',
      'Includes the five core themes.',
    ],
  },
  {
    tierId: TIER_SUSPECT,
    name: 'Suspect',
    priceLabel: '£1.99',
    upgradeHint: '£1.00 upgrade if you already own Local Liar.',
    bullets: [
      'Create online lobbies.',
      'Five core themes included.',
      'All future new base categories and prompts as they ship.',
    ],
  },
  {
    tierId: TIER_HOST_MOST,
    name: 'Host with the Most',
    priceLabel: '£6.99',
    upgradeHint: 'Previous tier price is deducted when you upgrade in the real store.',
    bullets: [
      'Every DLC theme bundle (themes, personas, tailored host dialogue).',
      `Includes all ${DLC_THEME_PACKS.length} bundles: ${DLC_BUNDLE_NAMES_LIST}.`,
      'Full category editor (custom categories and prompt pairs).',
      'All future DLC packs at no extra charge.',
    ],
  },
];

export const ADDON_TWIST_TRUTH = {
  id: 'twist-truth',
  name: 'Twist the Truth',
  priceLabel: '99p',
  description: 'Unlocks the advanced category editor on its own (without Host with the Most).',
};

export const DLC_STORE_BLURB =
  'DLC packs add three themed experiences each (host, card decks, personas, tailored dialogue) for 99p per pack. Host with the Most includes every pack.';

/**
 * @param {{ tierId?: string, addonTwistTruth?: boolean } | null | undefined} session
 */
export function computeEntitlements(session) {
  if (!session || !session.tierId) {
    return {
      signedIn: false,
      canJoinOnlineLobby: false,
      canCreateLocalGame: false,
      canCreateOnlineLobby: false,
      futureCategoriesBundle: false,
      allDlcIncluded: false,
      categoryEditorAdmin: false,
    };
  }
  const rank = TIER_RANK[session.tierId] ?? 0;
  const hostOrAddonEditor = rank >= TIER_RANK[TIER_HOST_MOST] || Boolean(session.addonTwistTruth);
  return {
    signedIn: true,
    canJoinOnlineLobby: true,
    canCreateLocalGame: rank >= TIER_RANK[TIER_LOCAL_LIAR],
    canCreateOnlineLobby: rank >= TIER_RANK[TIER_SUSPECT],
    futureCategoriesBundle: rank >= TIER_RANK[TIER_SUSPECT],
    allDlcIncluded: rank >= TIER_RANK[TIER_HOST_MOST],
    categoryEditorAdmin: hostOrAddonEditor,
  };
}

/**
 * Theme picker: Host with the Most includes every DLC pack id; others use purchased pack ids.
 * @param {{ tierId?: string, unlockedThemePackIds?: string[] } | null | undefined} session
 * @param {string[]} devicePackIds legacy / merged pack ids from UI state
 */
export function effectiveUnlockedThemePackIds(session, devicePackIds = []) {
  const merged = normalizeUnlockedThemePackIds(devicePackIds);
  if (!session) return merged;
  if (session.tierId === TIER_HOST_MOST) {
    return normalizeUnlockedThemePackIds(DLC_THEME_PACKS.map((pack) => pack.id));
  }
  return normalizeUnlockedThemePackIds([
    ...new Set([...(session.unlockedThemePackIds || []), ...merged]),
  ]);
}
