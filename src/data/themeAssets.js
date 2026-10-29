import { toCanonicalThemeName } from './themeAliases';
import { THEME_GENERATED_HOST_MEDIA } from './generatedHostMedia';
import { resolveBundledAssetSrc } from '../lib/publicAssetUrl.js';

export const THEME_ASSETS = {
  Default: {
    personaHostIdle: '/assets/themes/default/hosts/persona-host-intro-poster.png',
    talkingVideoWebm: '/assets/themes/default/hosts/persona-host-talking.webm',
    talkingVideoMp4: '/assets/themes/default/hosts/persona-host-talking.mp4',
    iconSheet: '/assets/themes/default/icons/icons-sheet.png',
    uiBanner: '/assets/themes/default/hosts/persona-host-intro-poster.png',
  },
  Pirates: {
    personaHostIdle: '/assets/themes/pirates/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/pirates/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/pirates/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/pirates/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/default/icons/icons-sheet.png',
    uiBanner: '/assets/themes/default/hosts/persona-host-intro-poster.png',
  },
  'Murder Mystery': {
    personaHostIdle: '/assets/themes/murder-mystery/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/murder-mystery/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/murder-mystery/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/murder-mystery/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/default/icons/icons-sheet.png',
    uiBanner: '/assets/themes/default/hosts/persona-host-intro-poster.png',
  },
  'Cops and Robbers': {
    personaHostIdle: '/assets/themes/gangsters/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/gangsters/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/gangsters/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/gangsters/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/gangsters/icons/icons-sheet.png',
    uiBanner: '/assets/themes/gangsters/hosts/persona-host-idle.png',
  },
  'Ghosts and Ghouls': {
    personaHostIdle: '/assets/themes/ghosts-and-ghouls/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/ghosts-and-ghouls/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/ghosts-and-ghouls/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/ghosts-and-ghouls/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/monsters/icons/icons-sheet.png',
    uiBanner: '/assets/themes/ghosts-and-ghouls/hosts/persona-host-idle.png',
  },
  'Rock Stars': {
    personaHostIdle: '/assets/themes/rock-stars/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/rock-stars/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/rock-stars/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/rock-stars/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/rock-stars/icons/icons-sheet.png',
    uiBanner: '/assets/themes/rock-stars/ui/banner.png',
  },
  Aliens: {
    personaHostIdle: '/assets/themes/aliens/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/aliens/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/aliens/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/aliens/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/aliens/icons/icons-sheet.png',
    uiBanner: '/assets/themes/aliens/ui/banner.png',
  },
  Royalty: {
    personaHostIdle: '/assets/themes/royalty/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/royalty/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/royalty/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/royalty/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/royalty/icons/icons-sheet.png',
    uiBanner: '/assets/themes/royalty/ui/banner.png',
  },
  Medical: {
    personaHostIdle: '/assets/themes/medical/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/medical/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/medical/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/medical/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/medical/icons/icons-sheet.png',
    uiBanner: '/assets/themes/medical/ui/banner.png',
  },
  Wrestlers: {
    personaHostIdle: '/assets/themes/wrestlers/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/wrestlers/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/wrestlers/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/wrestlers/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/wrestlers/icons/icons-sheet.png',
    uiBanner: '/assets/themes/wrestlers/ui/banner.png',
  },
  GrillEm: {
    personaHostIdle: '/assets/themes/grillem/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/grillem/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/grillem/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/grillem/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/grillem/icons/icons-sheet.png',
    uiBanner: '/assets/themes/grillem/ui/banner.png',
  },
  Cyberpunk: {
    personaHostIdle: '/assets/themes/cyberpunk/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/cyberpunk/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/cyberpunk/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/cyberpunk/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/cyberpunk/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/cyberpunk/ui/banner.svg',
  },
  Vikings: {
    personaHostIdle: '/assets/themes/vikings/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/vikings/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/vikings/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/vikings/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/vikings/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/vikings/ui/banner.svg',
  },
  Ninjas: {
    personaHostIdle: '/assets/themes/ninjas/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/ninjas/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/ninjas/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/ninjas/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/ninjas/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/ninjas/ui/banner.svg',
  },
  'Mythology (Gods & Legends)': {
    personaHostIdle: '/assets/themes/mythology-gods-legends/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/mythology-gods-legends/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/mythology-gods-legends/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/mythology-gods-legends/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/mythology-gods-legends/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/mythology-gods-legends/ui/banner.svg',
  },
  'Post-Apocalypse': {
    personaHostIdle: '/assets/themes/post-apocalypse/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/post-apocalypse/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/post-apocalypse/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/post-apocalypse/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/post-apocalypse/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/post-apocalypse/ui/banner.svg',
  },
  Carnival: {
    personaHostIdle: '/assets/themes/carnival/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/carnival/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/carnival/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/carnival/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/carnival/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/carnival/ui/banner.svg',
  },
  'Wizards & Witches': {
    personaHostIdle: '/assets/themes/wizards-witches/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/wizards-witches/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/wizards-witches/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/wizards-witches/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/wizards-witches/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/wizards-witches/ui/banner.svg',
  },
  'Time Travelers': {
    personaHostIdle: '/assets/themes/time-travelers/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/time-travelers/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/time-travelers/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/time-travelers/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/time-travelers/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/time-travelers/ui/banner.svg',
  },
  Gladiators: {
    personaHostIdle: '/assets/themes/gladiators/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/gladiators/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/gladiators/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/gladiators/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/gladiators/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/gladiators/ui/banner.svg',
  },
};

/** Prompt card art per theme (raw theme name first, so aliased themes keep their own cards). */
const THEME_CARD_SLUGS = {
  Default: 'default',
  Pirates: 'pirates',
  Wrestlers: 'wrestlers',
  Victorian: 'murder-mystery',
  Aliens: 'aliens',
  Animals: 'animals',
  Anime: 'anime',
  Carnival: 'carnival',
  Cartoons: 'cartoons',
  'Cops and Robbers': 'cops-and-robbers',
  Cowboys: 'cowboys',
  Cyberpunk: 'cyberpunk',
  'Drag Queens': 'drag-queens',
  'Flying Squad': 'flying-squad',
  Gangsters: 'gangsters',
  'Ghosts and Ghouls': 'ghosts-and-ghouls',
  Gladiators: 'gladiators',
  GrillEm: 'grillem',
  'Law and Order': 'law-and-order',
  Medical: 'medical',
  Medieval: 'medieval',
  Military: 'military',
  Monsters: 'monsters',
  'Murder Mystery': 'murder-mystery',
  'Mythology (Gods & Legends)': 'mythology-gods-legends',
  Ninjas: 'ninjas',
  'Post-Apocalypse': 'post-apocalypse',
  'Rock Stars': 'rock-stars',
  Royalty: 'royalty',
  'Sci-Fi': 'sci-fi',
  Spies: 'spies',
  Sports: 'sports',
  Superheroes: 'superheroes',
  'Time Travelers': 'time-travelers',
  'Under the Sea': 'under-the-sea',
  Vikings: 'vikings',
  'Wizards & Witches': 'wizards-witches',
};

function cardAssetsForSlug(slug) {
  const dir = `/assets/themes/${slug}/cards`;
  return {
    promptCardFrontClassic: `${dir}/prompt-front-classic.png`,
    promptCardBackClassic: `${dir}/prompt-back-classic.png`,
    promptCardFrontAlt: `${dir}/prompt-front-alt.png`,
    promptCardBackAlt: `${dir}/prompt-back-alt.png`,
  };
}

const DEFAULT_THEME_CARD_ASSETS = cardAssetsForSlug('default');

export function getThemeCardAssets(themeName = 'Default') {
  const canonicalThemeName = toCanonicalThemeName(themeName);
  const slug = THEME_CARD_SLUGS[themeName] || THEME_CARD_SLUGS[canonicalThemeName] || THEME_CARD_SLUGS.Default;
  return cardAssetsForSlug(slug);
}

function resolveThemePromptCardPaths(themeName = 'Default', { cardStyle = 'classic' } = {}) {
  const cards = getThemeCardAssets(themeName);
  const useAlt = cardStyle === 'alt';
  const fallback = DEFAULT_THEME_CARD_ASSETS;
  return {
    front: useAlt
      ? cards.promptCardFrontAlt
        || fallback.promptCardFrontAlt
        || cards.promptCardFrontClassic
        || fallback.promptCardFrontClassic
      : cards.promptCardFrontClassic
        || fallback.promptCardFrontClassic
        || cards.promptCardFrontAlt
        || fallback.promptCardFrontAlt,
    back: useAlt
      ? cards.promptCardBackAlt
        || fallback.promptCardBackAlt
        || cards.promptCardBackClassic
        || fallback.promptCardBackClassic
      : cards.promptCardBackClassic
        || fallback.promptCardBackClassic
        || cards.promptCardBackAlt
        || fallback.promptCardBackAlt,
  };
}

/** Themed prompt card faces for round reveal (PNG paths; mobile may rewrite to .webp). */
export function getThemePromptCardFrontSrc(themeName = 'Default', options = {}) {
  return resolveThemePromptCardPaths(themeName, options).front;
}

export function getThemePromptCardBackSrc(themeName = 'Default', options = {}) {
  return resolveThemePromptCardPaths(themeName, options).back;
}

function getGeneratedThemeHostMedia(themeName = 'Default') {
  const canonicalThemeName = toCanonicalThemeName(themeName);
  return (
    THEME_GENERATED_HOST_MEDIA[themeName]
    || THEME_GENERATED_HOST_MEDIA[canonicalThemeName]
    || {}
  );
}

export function getThemeAssets(themeName = 'Default') {
  const canonicalThemeName = toCanonicalThemeName(themeName);
  const selected = THEME_ASSETS[canonicalThemeName] || THEME_ASSETS.Default;
  const generated = getGeneratedThemeHostMedia(canonicalThemeName);
  return {
    ...THEME_ASSETS.Default,
    ...selected,
    ...generated,
    ...getThemeCardAssets(themeName),
  };
}

/** Shop / store card art — prefers bundled banner, else host still shipped in the APK. */
export function getStoreThemeThumbSrc(themeName = 'Default') {
  const assets = getThemeAssets(themeName);
  const banner = String(assets?.uiBanner || '').trim();
  const idle = String(assets?.personaHostIdle || '').trim();
  const fallbackBanner = String(THEME_ASSETS.Default?.uiBanner || '').trim();
  const isPlaceholderBanner = /\/ui\/banner\.(png|jpe?g|webp)$/i.test(banner);
  const pick =
    banner && !isPlaceholderBanner
      ? banner
      : fallbackBanner || idle;
  return resolveBundledAssetSrc(pick);
}

export function getThemeHostAssets(themeName = 'Default') {
  const canonicalThemeName = toCanonicalThemeName(themeName);
  const selected = getThemeAssets(canonicalThemeName);
  const fallback = getThemeAssets('Default');
  const isDefaultTheme = canonicalThemeName === 'Default';
  const unique = (list = []) => list.filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index);
  const getPersonaTalkFrames = (assetEntry = {}) => unique([
    ...(Array.isArray(assetEntry.personaHostTalkingFrames) ? assetEntry.personaHostTalkingFrames : []),
    assetEntry.personaHostTalk1,
    assetEntry.personaHostTalk2,
    assetEntry.personaHostTalk3,
  ]);

  const selectedFrames = getPersonaTalkFrames(selected);
  const selectedIdle = selected.personaHostIdle || null;
  const fallbackFrames = getPersonaTalkFrames(fallback);
  const fallbackIdle = fallback.personaHostIdle || null;
  const selectedTalkingVideoWebm = String(selected.talkingVideoWebm || selected.hostTalkingVideoWebm || '').trim();
  const selectedTalkingVideoMp4 = String(
    selected.talkingVideoMp4 || selected.hostTalkingVideoMp4 || selected.talkingVideo || ''
  ).trim();
  const fallbackTalkingVideoWebm = String(fallback.talkingVideoWebm || fallback.hostTalkingVideoWebm || '').trim();
  const fallbackTalkingVideoMp4 = String(
    fallback.talkingVideoMp4 || fallback.hostTalkingVideoMp4 || fallback.talkingVideo || ''
  ).trim();
  const selectedOverlay = selected.hostOverlay || null;
  const fallbackOverlay = fallback.hostOverlay || null;
  const selectedTalkingFrames = selectedFrames.length
    ? selectedFrames
    : [selectedIdle].filter(Boolean);

  const raw = {
    // For non-default themes, never fall back to default host assets.
    idle: isDefaultTheme ? (selectedIdle || fallbackIdle || null) : selectedIdle,
    talkingFrames: isDefaultTheme
      ? (
        selectedTalkingFrames.length
          ? selectedTalkingFrames
          : (fallbackFrames.length ? fallbackFrames : [fallbackIdle].filter(Boolean))
      )
      : selectedTalkingFrames,
    talkingVideoWebm: isDefaultTheme
      ? (selectedTalkingVideoWebm || fallbackTalkingVideoWebm || '')
      : selectedTalkingVideoWebm,
    talkingVideoMp4: isDefaultTheme
      ? (selectedTalkingVideoMp4 || fallbackTalkingVideoMp4 || '')
      : selectedTalkingVideoMp4,
    talkingVideo: isDefaultTheme
      ? (
        selectedTalkingVideoWebm
        || selectedTalkingVideoMp4
        || fallbackTalkingVideoWebm
        || fallbackTalkingVideoMp4
        || ''
      )
      : (selectedTalkingVideoWebm || selectedTalkingVideoMp4 || ''),
    overlay: isDefaultTheme ? (selectedOverlay || fallbackOverlay || null) : selectedOverlay,
  };
  return {
    idle: resolveBundledAssetSrc(raw.idle),
    talkingFrames: (raw.talkingFrames || [])
      .map((frame) => resolveBundledAssetSrc(frame))
      .filter(Boolean),
    talkingVideoWebm: resolveBundledAssetSrc(raw.talkingVideoWebm),
    talkingVideoMp4: resolveBundledAssetSrc(raw.talkingVideoMp4),
    talkingVideo: resolveBundledAssetSrc(raw.talkingVideo),
    overlay: resolveBundledAssetSrc(raw.overlay),
  };
}
