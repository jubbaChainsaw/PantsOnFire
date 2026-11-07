const STORAGE_KEY = 'pof-store-sections-v1';

const DEFAULTS = {
  access: true,
  themes: false,
  addons: false,
};

export function readStoreSectionPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return { ...DEFAULTS };
    return {
      access: raw.access !== false,
      themes: Boolean(raw.themes),
      addons: Boolean(raw.addons),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeStoreSectionPrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULTS, ...prefs }));
  } catch {
    /* ignore */
  }
}
