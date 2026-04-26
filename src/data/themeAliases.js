const THEME_ALIAS_MAP = {
  Victorian: 'Murder Mystery',
  'Murder Mystery': 'Murder Mystery',
  Spies: 'Cops and Robbers',
  Cowboys: 'Cops and Robbers',
  Gangsters: 'Cops and Robbers',
  'Cops and Robbers': 'Cops and Robbers',
  Monsters: 'Ghosts and Ghouls',
  'Ghosts and Ghouls': 'Ghosts and Ghouls',
};

export function toCanonicalThemeName(themeName = 'Default') {
  return THEME_ALIAS_MAP[themeName] || themeName;
}

