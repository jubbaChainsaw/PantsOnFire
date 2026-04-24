export const THEME_ASSETS = {
  Default: {
    characterCard: '/assets/themes/default/characters/presenter.png',
    iconSheet: '/assets/themes/default/icons/icons-sheet.png',
    uiBanner: '/assets/themes/default/ui/banner.png',
  },
  Gangsters: {
    characterCard: '/assets/themes/gangsters/characters/presenter.png',
    iconSheet: '/assets/themes/gangsters/icons/icons-sheet.png',
    uiBanner: '/assets/themes/gangsters/ui/banner.png',
  },
  Monsters: {
    characterCard: '/assets/themes/monsters/characters/presenter.png',
    iconSheet: '/assets/themes/monsters/icons/icons-sheet.png',
    uiBanner: '/assets/themes/monsters/ui/banner.png',
  },
  'Rock Stars': {
    characterCard: '/assets/themes/rock-stars/characters/presenter.png',
    iconSheet: '/assets/themes/rock-stars/icons/icons-sheet.png',
    uiBanner: '/assets/themes/rock-stars/ui/banner.png',
  },
  Aliens: {
    characterCard: '/assets/themes/aliens/characters/presenter.png',
    iconSheet: '/assets/themes/aliens/icons/icons-sheet.png',
    uiBanner: '/assets/themes/aliens/ui/banner.png',
  },
  Royalty: {
    characterCard: '/assets/themes/royalty/characters/presenter.png',
    iconSheet: '/assets/themes/royalty/icons/icons-sheet.png',
    uiBanner: '/assets/themes/royalty/ui/banner.png',
  },
  Medical: {
    characterCard: '/assets/themes/medical/characters/presenter.png',
    iconSheet: '/assets/themes/medical/icons/icons-sheet.png',
    uiBanner: '/assets/themes/medical/ui/banner.png',
  },
  Wrestlers: {
    characterCard: '/assets/themes/wrestlers/characters/presenter.png',
    iconSheet: '/assets/themes/wrestlers/icons/icons-sheet.png',
    uiBanner: '/assets/themes/wrestlers/ui/banner.png',
  },
  GrillEm: {
    characterCard: '/assets/themes/grillem/characters/presenter.png',
    iconSheet: '/assets/themes/grillem/icons/icons-sheet.png',
    uiBanner: '/assets/themes/grillem/ui/banner.png',
  },
  Cyberpunk: {
    characterCard: '/assets/themes/cyberpunk/characters/presenter.svg',
    iconSheet: '/assets/themes/cyberpunk/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/cyberpunk/ui/banner.svg',
  },
  Vikings: {
    characterCard: '/assets/themes/vikings/characters/presenter.svg',
    iconSheet: '/assets/themes/vikings/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/vikings/ui/banner.svg',
  },
  Ninjas: {
    characterCard: '/assets/themes/ninjas/characters/presenter.svg',
    iconSheet: '/assets/themes/ninjas/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/ninjas/ui/banner.svg',
  },
  'Detectives Noir': {
    characterCard: '/assets/themes/detectives-noir/characters/presenter.svg',
    iconSheet: '/assets/themes/detectives-noir/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/detectives-noir/ui/banner.svg',
  },
  'Mythology (Gods & Legends)': {
    characterCard: '/assets/themes/mythology-gods-legends/characters/presenter.svg',
    iconSheet: '/assets/themes/mythology-gods-legends/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/mythology-gods-legends/ui/banner.svg',
  },
  'Post-Apocalypse': {
    characterCard: '/assets/themes/post-apocalypse/characters/presenter.svg',
    iconSheet: '/assets/themes/post-apocalypse/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/post-apocalypse/ui/banner.svg',
  },
  Carnival: {
    characterCard: '/assets/themes/carnival/characters/presenter.svg',
    iconSheet: '/assets/themes/carnival/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/carnival/ui/banner.svg',
  },
  'Wizards & Witches': {
    characterCard: '/assets/themes/wizards-witches/characters/presenter.svg',
    iconSheet: '/assets/themes/wizards-witches/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/wizards-witches/ui/banner.svg',
  },
  'Time Travelers': {
    characterCard: '/assets/themes/time-travelers/characters/presenter.svg',
    iconSheet: '/assets/themes/time-travelers/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/time-travelers/ui/banner.svg',
  },
  Gladiators: {
    characterCard: '/assets/themes/gladiators/characters/presenter.svg',
    iconSheet: '/assets/themes/gladiators/icons/icons-sheet.svg',
    uiBanner: '/assets/themes/gladiators/ui/banner.svg',
  },
};

export function getThemeAssets(themeName = 'Default') {
  return THEME_ASSETS[themeName] || THEME_ASSETS.Default;
}
