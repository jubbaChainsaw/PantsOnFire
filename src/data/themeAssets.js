export const THEME_ASSETS = {
  Default: {
    characterCard: '/assets/themes/default/characters/presenter.png',
    iconSheet: '/assets/themes/default/icons/icons-sheet.png',
    uiBanner: '/assets/themes/default/ui/banner.png',
    promptCardFront: '/assets/themes/default/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/default/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/default/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/default/cards/prompt-back-18.svg',
  },
  Gangsters: {
    characterCard: '/assets/themes/gangsters/characters/presenter.png',
    iconSheet: '/assets/themes/gangsters/icons/icons-sheet.png',
    uiBanner: '/assets/themes/gangsters/ui/banner.png',
    promptCardFront: '/assets/themes/gangsters/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/gangsters/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/gangsters/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/gangsters/cards/prompt-back-18.svg',
  },
  Monsters: {
    characterCard: '/assets/themes/monsters/characters/presenter.png',
    iconSheet: '/assets/themes/monsters/icons/icons-sheet.png',
    uiBanner: '/assets/themes/monsters/ui/banner.png',
    promptCardFront: '/assets/themes/monsters/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/monsters/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/monsters/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/monsters/cards/prompt-back-18.svg',
  },
  'Rock Stars': {
    characterCard: '/assets/themes/rock-stars/characters/presenter.png',
    iconSheet: '/assets/themes/rock-stars/icons/icons-sheet.png',
    uiBanner: '/assets/themes/rock-stars/ui/banner.png',
    promptCardFront: '/assets/themes/rock-stars/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/rock-stars/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/rock-stars/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/rock-stars/cards/prompt-back-18.svg',
  },
  Aliens: {
    characterCard: '/assets/themes/aliens/characters/presenter.png',
    iconSheet: '/assets/themes/aliens/icons/icons-sheet.png',
    uiBanner: '/assets/themes/aliens/ui/banner.png',
    promptCardFront: '/assets/themes/aliens/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/aliens/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/aliens/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/aliens/cards/prompt-back-18.svg',
  },
  Royalty: {
    characterCard: '/assets/themes/royalty/characters/presenter.png',
    iconSheet: '/assets/themes/royalty/icons/icons-sheet.png',
    uiBanner: '/assets/themes/royalty/ui/banner.png',
    promptCardFront: '/assets/themes/royalty/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/royalty/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/royalty/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/royalty/cards/prompt-back-18.svg',
  },
  Medical: {
    characterCard: '/assets/themes/medical/characters/presenter.png',
    iconSheet: '/assets/themes/medical/icons/icons-sheet.png',
    uiBanner: '/assets/themes/medical/ui/banner.png',
    promptCardFront: '/assets/themes/medical/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/medical/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/medical/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/medical/cards/prompt-back-18.svg',
  },
  Wrestlers: {
    characterCard: '/assets/themes/wrestlers/characters/presenter.png',
    iconSheet: '/assets/themes/wrestlers/icons/icons-sheet.png',
    uiBanner: '/assets/themes/wrestlers/ui/banner.png',
    promptCardFront: '/assets/themes/wrestlers/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/wrestlers/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/wrestlers/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/wrestlers/cards/prompt-back-18.svg',
  },
  GrillEm: {
    characterCard: '/assets/themes/grillem/characters/presenter.png',
    iconSheet: '/assets/themes/grillem/icons/icons-sheet.png',
    uiBanner: '/assets/themes/grillem/ui/banner.png',
    promptCardFront: '/assets/themes/default/cards/prompt-front.svg',
    promptCardBack: '/assets/themes/default/cards/prompt-back.svg',
    adultPromptCardFront: '/assets/themes/default/cards/prompt-front-18.svg',
    adultPromptCardBack: '/assets/themes/default/cards/prompt-back-18.svg',
  },
};

export const ROUND_TYPE_CARD_FRONT_BY_ID = {
  prompt: '/assets/themes/default/cards/prompt-front-prompt.svg',
  opinion: '/assets/themes/default/cards/prompt-front-opinion.svg',
  picture: '/assets/themes/default/cards/prompt-front-picture.svg',
  grill: '/assets/themes/default/cards/prompt-front-grill.svg',
};

export function getThemeAssets(themeName = 'Default') {
  const selected = THEME_ASSETS[themeName] || THEME_ASSETS.Default;
  return {
    ...THEME_ASSETS.Default,
    ...selected,
  };
}
