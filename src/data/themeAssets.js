import { toCanonicalThemeName } from './themeAliases';
import { THEME_GENERATED_HOST_MEDIA } from './generatedHostMedia';

export const THEME_ASSETS = {
  Default: {
    characterCard: '/assets/themes/default/characters/host-idle.png',
    hostIdle: '/assets/themes/default/characters/host-idle.png',
    hostTalk1: '/assets/themes/default/characters/host-talk-1.png',
    hostTalk2: '/assets/themes/default/characters/host-talk-2.png',
    hostTalk3: '/assets/themes/default/characters/host-talk-3.png',
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
    characterCard: '/assets/themes/default/characters/host-idle.png',
    hostIdle: '/assets/themes/default/characters/host-idle.png',
    hostTalk1: '/assets/themes/default/characters/host-talk-1.png',
    hostTalk2: '/assets/themes/default/characters/host-talk-2.png',
    hostTalk3: '/assets/themes/default/characters/host-talk-3.png',
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
    characterCard: '/assets/themes/default/characters/host-idle.png',
    hostIdle: '/assets/themes/default/characters/host-idle.png',
    hostTalk1: '/assets/themes/default/characters/host-talk-1.png',
    hostTalk2: '/assets/themes/default/characters/host-talk-2.png',
    hostTalk3: '/assets/themes/default/characters/host-talk-3.png',
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
    characterCard: '/assets/themes/gangsters/characters/presenter.png',
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
    characterCard: '/assets/themes/monsters/characters/presenter.png',
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
    characterCard: '/assets/themes/rock-stars/characters/presenter.png',
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
    characterCard: '/assets/themes/aliens/characters/presenter.png',
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
    characterCard: '/assets/themes/royalty/characters/presenter.png',
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
    characterCard: '/assets/themes/medical/characters/presenter.png',
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
    characterCard: '/assets/themes/wrestlers/characters/presenter.png',
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
    characterCard: '/assets/themes/grillem/characters/presenter.png',
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
    characterCard: '/assets/themes/cyberpunk/characters/presenter.svg',
    personaHostIdle: '/assets/themes/cyberpunk/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/cyberpunk/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/cyberpunk/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/cyberpunk/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/cyberpunk/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/cyberpunk/ui/banner.svg',
  },
  Vikings: {
    characterCard: '/assets/themes/vikings/characters/presenter.svg',
    personaHostIdle: '/assets/themes/vikings/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/vikings/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/vikings/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/vikings/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/vikings/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/vikings/ui/banner.svg',
  },
  Ninjas: {
    characterCard: '/assets/themes/ninjas/characters/presenter.svg',
    personaHostIdle: '/assets/themes/ninjas/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/ninjas/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/ninjas/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/ninjas/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/ninjas/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/ninjas/ui/banner.svg',
  },
  'Detectives Noir': {
    characterCard: '/assets/themes/detectives-noir/characters/presenter.svg',
    personaHostIdle: '/assets/themes/detectives-noir/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/detectives-noir/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/detectives-noir/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/detectives-noir/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/detectives-noir/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/detectives-noir/ui/banner.svg',
  },
  'Mythology (Gods & Legends)': {
    characterCard: '/assets/themes/mythology-gods-legends/characters/presenter.svg',
    personaHostIdle: '/assets/themes/mythology-gods-legends/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/mythology-gods-legends/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/mythology-gods-legends/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/mythology-gods-legends/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/mythology-gods-legends/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/mythology-gods-legends/ui/banner.svg',
  },
  'Post-Apocalypse': {
    characterCard: '/assets/themes/post-apocalypse/characters/presenter.svg',
    personaHostIdle: '/assets/themes/post-apocalypse/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/post-apocalypse/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/post-apocalypse/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/post-apocalypse/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/post-apocalypse/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/post-apocalypse/ui/banner.svg',
  },
  Carnival: {
    characterCard: '/assets/themes/carnival/characters/presenter.svg',
    personaHostIdle: '/assets/themes/carnival/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/carnival/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/carnival/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/carnival/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/carnival/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/carnival/ui/banner.svg',
  },
  'Wizards & Witches': {
    characterCard: '/assets/themes/wizards-witches/characters/presenter.svg',
    personaHostIdle: '/assets/themes/wizards-witches/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/wizards-witches/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/wizards-witches/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/wizards-witches/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/wizards-witches/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/wizards-witches/ui/banner.svg',
  },
  'Time Travelers': {
    characterCard: '/assets/themes/time-travelers/characters/presenter.svg',
    personaHostIdle: '/assets/themes/time-travelers/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/time-travelers/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/time-travelers/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/time-travelers/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/time-travelers/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/time-travelers/ui/banner.svg',
  },
  Gladiators: {
    characterCard: '/assets/themes/gladiators/characters/presenter.svg',
    personaHostIdle: '/assets/themes/gladiators/hosts/persona-host-idle.png',
    personaHostTalk1: '/assets/themes/gladiators/hosts/persona-host-talk-1.png',
    personaHostTalk2: '/assets/themes/gladiators/hosts/persona-host-talk-2.png',
    personaHostTalk3: '/assets/themes/gladiators/hosts/persona-host-talk-3.png',
    iconSheet: '/assets/themes/gladiators/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/gladiators/ui/banner.svg',
  },
};

function toThemeSlug(themeName = 'Default') {
  return String(themeName || 'default')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildHostTalkingVideoSrc(themeName = 'Default') {
  return `/assets/videos/hosts/${toThemeSlug(themeName)}/talking-placeholder.mp4`;
}

function buildNewUiHostFrame(themeName = 'Default', frameNumber = 1) {
  return `/assets/new-ui/hosts/${toThemeSlug(themeName)}/talk-${String(frameNumber).padStart(2, '0')}.png`;
}

function buildNewUiHostFrames(themeName = 'Default', frameCount = 6) {
  return Array.from({ length: frameCount }, (_, index) => buildNewUiHostFrame(themeName, index + 1));
}

export const ROUND_TYPE_CARD_FRONT_BY_ID = {
  prompt: '/assets/themes/default/cards/prompt-front-prompt.svg',
  opinion: '/assets/themes/default/cards/prompt-front-opinion.svg',
  picture: '/assets/themes/default/cards/prompt-front-picture.svg',
  meme: '/assets/themes/default/cards/prompt-front-meme.svg',
  noise: '/assets/themes/default/cards/prompt-front-noise.svg',
  offtopic: '/assets/themes/default/cards/prompt-front-offtopic.svg',
  grill: '/assets/themes/default/cards/prompt-front-grill.svg',
};

export function getThemeAssets(themeName = 'Default') {
  const canonicalThemeName = toCanonicalThemeName(themeName);
  const selected = THEME_ASSETS[canonicalThemeName] || THEME_ASSETS.Default;
  const generatedDefault = THEME_GENERATED_HOST_MEDIA.Default || {};
  const generatedSelected = THEME_GENERATED_HOST_MEDIA[canonicalThemeName] || {};
  return {
    ...THEME_ASSETS.Default,
    ...generatedDefault,
    ...selected,
    ...generatedSelected,
  };
}

export function getThemeHostAssets(themeName = 'Default') {
  const canonicalThemeName = toCanonicalThemeName(themeName);
  const selected = getThemeAssets(canonicalThemeName);
  const fallback = getThemeAssets('Default');
  const isDefaultTheme = canonicalThemeName === 'Default';
  const hasThemeConfig = Boolean(selected && Object.keys(selected).length);
  const unique = (list = []) => list.filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index);
  const getPersonaTalkFrames = (assetEntry = {}) => unique([
    ...(Array.isArray(assetEntry.personaHostTalkingFrames) ? assetEntry.personaHostTalkingFrames : []),
    assetEntry.personaHostTalk1,
    assetEntry.personaHostTalk2,
    assetEntry.personaHostTalk3,
  ]);
  const getHostTalkFrames = (assetEntry = {}) => {
    const framesFromList = Array.isArray(assetEntry.hostTalkingFrames) ? assetEntry.hostTalkingFrames : [];
    return unique([
      ...framesFromList,
      assetEntry.hostTalk1,
      assetEntry.hostTalk2,
      assetEntry.hostTalk3,
    ]);
  };

  const selectedEntry = hasThemeConfig ? selected : fallback;
  // Critical: never mix persona host frames with generic host frames.
  // Non-default themes are strictly persona-host only (no default host fallback).
  const selectedPersonaFrames = getPersonaTalkFrames(selectedEntry);
  const selectedHostFrames = getHostTalkFrames(selectedEntry);
  const hasPersonaHostConfig = Boolean(
    selectedEntry.personaHostIdle
    || selectedEntry.personaHostTalk1
    || selectedEntry.personaHostTalk2
    || selectedEntry.personaHostTalk3
  );
  const selectedFrames = isDefaultTheme
    ? (selectedPersonaFrames.length ? selectedPersonaFrames : selectedHostFrames)
    : selectedPersonaFrames;
  const selectedIdle = isDefaultTheme
    ? (
      hasPersonaHostConfig
        ? (selectedEntry.personaHostIdle || null)
        : (selectedEntry.hostIdle || selectedEntry.characterCard || null)
    )
    : (selectedEntry.personaHostIdle || null);
  const fallbackPersonaFrames = getPersonaTalkFrames(fallback);
  const fallbackHostFrames = getHostTalkFrames(fallback);
  const fallbackFrames = fallbackPersonaFrames.length ? fallbackPersonaFrames : fallbackHostFrames;
  const fallbackIdle = fallback.personaHostIdle || fallback.hostIdle || fallback.characterCard || null;
  const selectedTalkingFrames = selectedFrames.length
    ? selectedFrames
    : [selectedIdle].filter(Boolean);
  const themedFallbackFrameMap = {
    Default: buildNewUiHostFrames('Default', 9),
    Pirates: buildNewUiHostFrames('Pirates', 6),
    'Murder Mystery': buildNewUiHostFrames('Murder Mystery', 6),
    'Cops and Robbers': buildNewUiHostFrames('Cops and Robbers', 6),
    'Ghosts and Ghouls': buildNewUiHostFrames('Ghosts and Ghouls', 6),
  };
  const themedFallbackFrames = selectedFrames.length
    ? []
    : (themedFallbackFrameMap[canonicalThemeName] || []);
  const themedFallbackIdle = themedFallbackFrames[0] || '';
  const selectedOverlay = selectedEntry.hostOverlay || null;
  const fallbackOverlay = fallback.hostOverlay || null;

  const resolvedIdle = themedFallbackFrames.length
    ? themedFallbackIdle
    : (
      isDefaultTheme
        ? (selectedIdle || fallbackIdle || null)
        : (selectedIdle || null)
    );
  const resolvedTalkingFrames = themedFallbackFrames.length
    ? themedFallbackFrames
    : (
      isDefaultTheme
        ? (
          selectedTalkingFrames.length
            ? selectedTalkingFrames
            : (fallbackFrames.length ? fallbackFrames : [selectedEntry.characterCard || fallback.characterCard].filter(Boolean))
        )
        : selectedTalkingFrames
    );

  return {
    // For non-default themes, never fall back to default host assets.
    idle: resolvedIdle,
    talkingFrames: resolvedTalkingFrames.length
      ? resolvedTalkingFrames
      : [resolvedIdle].filter(Boolean),
    overlay: isDefaultTheme
      ? (selectedOverlay || fallbackOverlay || null)
      : selectedOverlay,
    talkingVideo: themedFallbackFrames.length ? '' : buildHostTalkingVideoSrc(canonicalThemeName),
  };
}
