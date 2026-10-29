/**
 * Authoritative content-pack catalog for entitlement checks and downloads.
 * Public free packs may also appear in public/content-packs/manifest.json (no paid zip URLs).
 */

export const CONTENT_PACK_ACCESS = {
  PUBLIC: 'public',
  PROTECTED: 'protected',
};

/** @typedef {'free'|'paid'} ContentPackTier */
/** @typedef {'public'|'protected'} ContentPackAccess */

export const PUBLIC_CORE_PACKS = [
  {
    id: 'core-murder-mystery',
    name: 'Murder Mystery',
    themeSlug: 'murder-mystery',
    tier: 'free',
    access: CONTENT_PACK_ACCESS.PUBLIC,
    zipFile: 'core-murder-mystery-v1.zip',
  },
  {
    id: 'core-pirates',
    name: 'Pirates',
    themeSlug: 'pirates',
    tier: 'free',
    access: CONTENT_PACK_ACCESS.PUBLIC,
    zipFile: 'core-pirates-v1.zip',
  },
  {
    id: 'core-cops-and-robbers',
    name: 'Cops and Robbers',
    themeSlug: 'gangsters',
    tier: 'free',
    access: CONTENT_PACK_ACCESS.PUBLIC,
    zipFile: 'core-cops-and-robbers-v1.zip',
  },
  {
    id: 'core-ghosts-and-ghouls',
    name: 'Ghosts and Ghouls',
    themeSlug: 'ghosts-and-ghouls',
    tier: 'free',
    access: CONTENT_PACK_ACCESS.PUBLIC,
    zipFile: 'core-ghosts-and-ghouls-v1.zip',
  },
];

export const PROTECTED_DLC_PACKS = [
  {
    id: 'dlc-ye-olde-baloney',
    entitlementPackId: 'ye-olde-baloney',
    name: 'Ye Olde Baloney',
    themeSlugs: ['vikings', 'gladiators', 'medieval'],
    tier: 'paid',
    access: CONTENT_PACK_ACCESS.PROTECTED,
    unlockSource: 'store',
    zipFile: 'dlc-ye-olde-baloney-v1.zip',
  },
  {
    id: 'dlc-myth-taken-identity',
    entitlementPackId: 'myth-taken-identity',
    name: 'Myth-Taken Identity',
    themeSlugs: ['royalty', 'mythology-gods-and-legends', 'time-travelers'],
    tier: 'paid',
    access: CONTENT_PACK_ACCESS.PROTECTED,
    unlockSource: 'store',
    zipFile: 'dlc-myth-taken-identity-v1.zip',
  },
  {
    id: 'dlc-licence-to-fib',
    entitlementPackId: 'licence-to-fib',
    name: 'Licence to Fib',
    themeSlugs: ['ninjas', 'spies', 'cyberpunk'],
    tier: 'paid',
    access: CONTENT_PACK_ACCESS.PROTECTED,
    unlockSource: 'store',
    zipFile: 'dlc-licence-to-fib-v1.zip',
  },
  {
    id: 'dlc-fever-dream-1',
    entitlementPackId: 'fever-dream-1',
    name: 'Fever Dream I',
    themeSlugs: ['fever-dream-1'],
    tier: 'paid',
    access: CONTENT_PACK_ACCESS.PROTECTED,
    unlockSource: 'referral',
    requiredThemeName: 'Fever Dream Vol. 1',
    zipFile: 'dlc-fever-dream-1-v1.zip',
  },
  {
    id: 'dlc-fever-dream-2',
    entitlementPackId: 'fever-dream-2',
    name: 'Fever Dream II',
    themeSlugs: ['fever-dream-2'],
    tier: 'paid',
    access: CONTENT_PACK_ACCESS.PROTECTED,
    unlockSource: 'referral',
    requiredThemeName: 'Fever Dream Vol. 2',
    zipFile: 'dlc-fever-dream-2-v1.zip',
  },
];

export const ALL_CONTENT_PACKS = [...PUBLIC_CORE_PACKS, ...PROTECTED_DLC_PACKS];

const BY_ID = Object.fromEntries(ALL_CONTENT_PACKS.map((pack) => [pack.id, pack]));

export function getContentPackById(packId) {
  return BY_ID[String(packId || '').trim()] || null;
}

export function resolveContentPackFilePath(pack, rootDir) {
  const root = String(rootDir || '').trim();
  if (!root || !pack) return null;
  const subdir = pack.access === CONTENT_PACK_ACCESS.PUBLIC ? 'public' : 'protected';
  return `${root.replace(/\/+$/, '')}/${subdir}/${pack.zipFile}`;
}
