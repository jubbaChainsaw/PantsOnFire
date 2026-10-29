export const PLAYER_PROFILE_STORAGE_KEY = 'imposter-player-profile-v1';

export const PROFILE_VERSION = 1;

export function createEmptyPlayerProfile() {
  return {
    version: PROFILE_VERSION,
    stats: {
      gamesPlayed: 0,
      gamesHosted: 0,
      gamesWon: 0,
      timesLiar: 0,
      timesLiarNotCaught: 0,
      timesLiarCaught: 0,
      timesAccusedInnocent: 0,
      votesCorrect: 0,
      votesIncorrect: 0,
      themesPlayed: {},
      roundTypesPlayed: {},
    },
    recentGames: [],
    achievementProgress: {},
    unlockedAchievementIds: [],
    unlockedDefaultBackSlugs: [],
    achievementUnlockedThemeNames: [],
    selectedDefaultBackSlug: 'classic',
  };
}

export function normalizePlayerProfile(raw) {
  const base = createEmptyPlayerProfile();
  if (!raw || typeof raw !== 'object') return base;
  const stats = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
  return {
    version: PROFILE_VERSION,
    stats: {
      gamesPlayed: Math.max(0, Number(stats.gamesPlayed) || 0),
      gamesHosted: Math.max(0, Number(stats.gamesHosted) || 0),
      gamesWon: Math.max(0, Number(stats.gamesWon) || 0),
      timesLiar: Math.max(0, Number(stats.timesLiar) || 0),
      timesLiarNotCaught: Math.max(0, Number(stats.timesLiarNotCaught) || 0),
      timesLiarCaught: Math.max(0, Number(stats.timesLiarCaught) || 0),
      timesAccusedInnocent: Math.max(0, Number(stats.timesAccusedInnocent) || 0),
      votesCorrect: Math.max(0, Number(stats.votesCorrect) || 0),
      votesIncorrect: Math.max(0, Number(stats.votesIncorrect) || 0),
      themesPlayed:
        stats.themesPlayed && typeof stats.themesPlayed === 'object'
          ? { ...stats.themesPlayed }
          : {},
      roundTypesPlayed:
        stats.roundTypesPlayed && typeof stats.roundTypesPlayed === 'object'
          ? { ...stats.roundTypesPlayed }
          : {},
    },
    recentGames: Array.isArray(raw.recentGames)
      ? raw.recentGames.slice(0, 20)
      : [],
    achievementProgress:
      raw.achievementProgress && typeof raw.achievementProgress === 'object'
        ? { ...raw.achievementProgress }
        : {},
    unlockedAchievementIds: Array.isArray(raw.unlockedAchievementIds)
      ? [...new Set(raw.unlockedAchievementIds.map(String))]
      : [],
    unlockedDefaultBackSlugs: Array.isArray(raw.unlockedDefaultBackSlugs)
      ? [...new Set(raw.unlockedDefaultBackSlugs.map(String))]
      : [],
    achievementUnlockedThemeNames: Array.isArray(raw.achievementUnlockedThemeNames)
      ? [...new Set(raw.achievementUnlockedThemeNames.map(String))]
      : [],
    selectedDefaultBackSlug:
      String(raw.selectedDefaultBackSlug || 'classic').trim() || 'classic',
  };
}

export function mergePlayerProfiles(local, remote) {
  const a = normalizePlayerProfile(local);
  const b = normalizePlayerProfile(remote);
  const themesPlayed = { ...a.stats.themesPlayed };
  Object.entries(b.stats.themesPlayed || {}).forEach(([key, val]) => {
    themesPlayed[key] = Math.max(Number(themesPlayed[key] || 0), Number(val) || 0);
  });
  const roundTypesPlayed = { ...a.stats.roundTypesPlayed };
  Object.entries(b.stats.roundTypesPlayed || {}).forEach(([key, val]) => {
    roundTypesPlayed[key] = Math.max(
      Number(roundTypesPlayed[key] || 0),
      Number(val) || 0,
    );
  });
  const achievementProgress = { ...a.achievementProgress };
  Object.entries(b.achievementProgress || {}).forEach(([key, val]) => {
    achievementProgress[key] = Math.max(
      Number(achievementProgress[key] || 0),
      Number(val) || 0,
    );
  });
  const mergedRecent = [...a.recentGames];
  for (const entry of b.recentGames || []) {
    if (!mergedRecent.some((x) => x?.id === entry?.id)) {
      mergedRecent.push(entry);
    }
  }
  mergedRecent.sort((x, y) => String(y?.dateIso || '').localeCompare(String(x?.dateIso || '')));
  return normalizePlayerProfile({
    ...a,
    stats: {
      gamesPlayed: Math.max(a.stats.gamesPlayed, b.stats.gamesPlayed),
      gamesHosted: Math.max(a.stats.gamesHosted, b.stats.gamesHosted),
      gamesWon: Math.max(a.stats.gamesWon, b.stats.gamesWon),
      timesLiar: Math.max(a.stats.timesLiar, b.stats.timesLiar),
      timesLiarNotCaught: Math.max(a.stats.timesLiarNotCaught, b.stats.timesLiarNotCaught),
      timesLiarCaught: Math.max(a.stats.timesLiarCaught, b.stats.timesLiarCaught),
      timesAccusedInnocent: Math.max(
        a.stats.timesAccusedInnocent,
        b.stats.timesAccusedInnocent,
      ),
      votesCorrect: Math.max(a.stats.votesCorrect, b.stats.votesCorrect),
      votesIncorrect: Math.max(a.stats.votesIncorrect, b.stats.votesIncorrect),
      themesPlayed,
      roundTypesPlayed,
    },
    recentGames: mergedRecent.slice(0, 20),
    achievementProgress,
    unlockedAchievementIds: [
      ...new Set([
        ...a.unlockedAchievementIds,
        ...b.unlockedAchievementIds,
      ]),
    ],
    unlockedDefaultBackSlugs: [
      ...new Set([
        ...a.unlockedDefaultBackSlugs,
        ...b.unlockedDefaultBackSlugs,
      ]),
    ],
    achievementUnlockedThemeNames: [
      ...new Set([
        ...a.achievementUnlockedThemeNames,
        ...b.achievementUnlockedThemeNames,
      ]),
    ],
    selectedDefaultBackSlug: a.selectedDefaultBackSlug || b.selectedDefaultBackSlug,
  });
}

export function profileWinRate(profile) {
  const played = profile?.stats?.gamesPlayed || 0;
  if (!played) return 0;
  return Math.round(((profile.stats.gamesWon || 0) / played) * 100);
}

export function favoriteThemeName(profile) {
  const map = profile?.stats?.themesPlayed || {};
  let best = 'Default';
  let bestCount = 0;
  Object.entries(map).forEach(([name, count]) => {
    const n = Number(count) || 0;
    if (n > bestCount) {
      best = name;
      bestCount = n;
    }
  });
  return bestCount ? best : '—';
}

export function uniqueThemesPlayedCount(profile) {
  return Object.values(profile?.stats?.themesPlayed || {}).filter(
    (n) => Number(n) > 0,
  ).length;
}

export function uniqueRoundTypesPlayedCount(profile) {
  return Object.values(profile?.stats?.roundTypesPlayed || {}).filter(
    (n) => Number(n) > 0,
  ).length;
}
