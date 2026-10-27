import { toCanonicalThemeName } from './themeAliases';
import { THEME_GENERATED_HOST_MEDIA } from './generatedHostMedia';
import { resolveBundledAssetSrc } from '../lib/publicAssetUrl.js';

export const THEME_ASSETS = {
  Default: {
    personaHostIdle: '/assets/themes/default/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/default/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/default/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/default/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/default/icons/icons-sheet.png',
    uiBanner: '/assets/themes/default/ui/banner.png',
    promptCardFront: '/assets/themes/default/cards/prompt-front.png',
    promptCardBack: '/assets/themes/default/cards/prompt-back.png',
    adultPromptCardFront: '/assets/themes/default/cards/prompt-front-18.png',
    adultPromptCardBack: '/assets/themes/default/cards/prompt-back-18.png',
  },
  Pirates: {
    personaHostIdle: '/assets/themes/pirates/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/pirates/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/pirates/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/pirates/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/default/icons/icons-sheet.png',
    uiBanner: '/assets/themes/default/ui/banner.png',
    promptCardFront: '/assets/themes/pirates/cards/prompt-front.png',
    promptCardBack: '/assets/themes/pirates/cards/prompt-back.png',
    adultPromptCardFront: '/assets/themes/pirates/cards/prompt-front-18.png',
    adultPromptCardBack: '/assets/themes/pirates/cards/prompt-back-18.png',
  },
  'Murder Mystery': {
    personaHostIdle: '/assets/themes/murder-mystery/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/murder-mystery/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/murder-mystery/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/murder-mystery/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/default/icons/icons-sheet.png',
    uiBanner: '/assets/themes/default/ui/banner.png',
    promptCardFront: '/assets/themes/default/cards/prompt-front.png',
    promptCardBack: '/assets/themes/default/cards/prompt-back.png',
    adultPromptCardFront: '/assets/themes/default/cards/prompt-front-18.png',
    adultPromptCardBack: '/assets/themes/default/cards/prompt-back-18.png',
  },
  'Cops and Robbers': {
    personaHostIdle: '/assets/themes/gangsters/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/gangsters/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/gangsters/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/gangsters/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/gangsters/icons/icons-sheet.png',
    uiBanner: '/assets/themes/gangsters/ui/banner.png',
    promptCardFront: '/assets/themes/gangsters/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/gangsters/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/gangsters/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/gangsters/cards/prompt-back-18.svg',
  },
  'Ghosts and Ghouls': {
    personaHostIdle: '/assets/themes/ghosts-and-ghouls/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/ghosts-and-ghouls/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/ghosts-and-ghouls/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/ghosts-and-ghouls/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/monsters/icons/icons-sheet.png',
    uiBanner: '/assets/themes/monsters/ui/banner.png',
    promptCardFront: '/assets/themes/monsters/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/monsters/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/monsters/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/monsters/cards/prompt-back-18.svg',
  },
  'Rock Stars': {
    personaHostIdle: '/assets/themes/rock-stars/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/rock-stars/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/rock-stars/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/rock-stars/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/rock-stars/icons/icons-sheet.png',
    uiBanner: '/assets/themes/rock-stars/ui/banner.png',
    promptCardFront: '/assets/themes/rock-stars/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/rock-stars/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/rock-stars/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/rock-stars/cards/prompt-back-18.svg',
  },
  Aliens: {
    personaHostIdle: '/assets/themes/aliens/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/aliens/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/aliens/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/aliens/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/aliens/icons/icons-sheet.png',
    uiBanner: '/assets/themes/aliens/ui/banner.png',
    promptCardFront: '/assets/themes/aliens/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/aliens/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/aliens/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/aliens/cards/prompt-back-18.svg',
  },
  Royalty: {
    personaHostIdle: '/assets/themes/royalty/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/royalty/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/royalty/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/royalty/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/royalty/icons/icons-sheet.png',
    uiBanner: '/assets/themes/royalty/ui/banner.png',
    promptCardFront: '/assets/themes/royalty/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/royalty/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/royalty/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/royalty/cards/prompt-back-18.svg',
  },
  Medical: {
    personaHostIdle: '/assets/themes/medical/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/medical/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/medical/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/medical/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/medical/icons/icons-sheet.png',
    uiBanner: '/assets/themes/medical/ui/banner.png',
    promptCardFront: '/assets/themes/medical/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/medical/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/medical/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/medical/cards/prompt-back-18.svg',
  },
  Wrestlers: {
    personaHostIdle: '/assets/themes/wrestlers/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/wrestlers/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/wrestlers/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/wrestlers/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/wrestlers/icons/icons-sheet.png',
    uiBanner: '/assets/themes/wrestlers/ui/banner.png',
    promptCardFront: '/assets/themes/wrestlers/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/wrestlers/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/wrestlers/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/wrestlers/cards/prompt-back-18.svg',
  },
  GrillEm: {
    personaHostIdle: '/assets/themes/grillem/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/grillem/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/grillem/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/grillem/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/grillem/icons/icons-sheet.png',
    uiBanner: '/assets/themes/grillem/ui/banner.png',
    promptCardFront: '/assets/themes/default/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/default/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/default/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/default/cards/prompt-back-18.svg',
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
  };
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
