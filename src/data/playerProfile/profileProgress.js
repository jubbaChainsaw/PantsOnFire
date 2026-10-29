import { ACHIEVEMENT_DEFINITIONS } from './achievements.js';
import {
  createEmptyPlayerProfile,
  normalizePlayerProfile,
  uniqueRoundTypesPlayedCount,
  uniqueThemesPlayedCount,
} from './profileModel.js';
import { toCanonicalThemeName } from '../themeAliases.js';

function metricValue(profile, metric) {
  const stats = profile?.stats || {};
  switch (metric) {
    case 'gamesPlayed':
      return stats.gamesPlayed || 0;
    case 'gamesHosted':
      return stats.gamesHosted || 0;
    case 'timesLiar':
      return stats.timesLiar || 0;
    case 'timesLiarNotCaught':
      return stats.timesLiarNotCaught || 0;
    case 'timesLiarCaught':
      return stats.timesLiarCaught || 0;
    case 'timesAccusedInnocent':
      return stats.timesAccusedInnocent || 0;
    case 'votesCorrect':
      return stats.votesCorrect || 0;
    case 'votesIncorrect':
      return stats.votesIncorrect || 0;
    case 'uniqueThemesPlayed':
      return uniqueThemesPlayedCount(profile);
    case 'uniqueRoundTypesPlayed':
      return uniqueRoundTypesPlayedCount(profile);
    default:
      return Number(profile?.achievementProgress?.[metric] || 0);
  }
}

export function applyAchievementRewards(profile, achievement) {
  const next = normalizePlayerProfile(profile);
  if (!achievement?.reward) return next;
  if (achievement.reward.type === 'defaultBack' && achievement.reward.slug) {
    next.unlockedDefaultBackSlugs = [
      ...new Set([...next.unlockedDefaultBackSlugs, achievement.reward.slug]),
    ];
  }
  if (achievement.reward.type === 'themeName' && achievement.reward.themeName) {
    const canonical = toCanonicalThemeName(achievement.reward.themeName);
    next.achievementUnlockedThemeNames = [
      ...new Set([...next.achievementUnlockedThemeNames, canonical]),
    ];
  }
  return next;
}

export function evaluateAchievements(profile) {
  const base = normalizePlayerProfile(profile);
  const newlyUnlocked = [];
  let next = base;
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (next.unlockedAchievementIds.includes(def.id)) continue;
    const current = metricValue(next, def.metric);
    next.achievementProgress = {
      ...next.achievementProgress,
      [def.id]: Math.max(Number(next.achievementProgress[def.id] || 0), current),
    };
    if (current >= def.target) {
      next.unlockedAchievementIds = [...next.unlockedAchievementIds, def.id];
      next = applyAchievementRewards(next, def);
      newlyUnlocked.push(def);
    }
  }
  return { profile: normalizePlayerProfile(next), newlyUnlocked };
}

export function achievementProgressFor(profile, achievement) {
  const current = metricValue(profile, achievement.metric);
  const target = Math.max(1, Number(achievement.target) || 1);
  return {
    current: Math.min(current, target),
    target,
    ratio: Math.min(1, current / target),
    unlocked: (profile?.unlockedAchievementIds || []).includes(achievement.id),
  };
}

export function recordHostedGame(profile) {
  const next = normalizePlayerProfile(profile);
  next.stats.gamesHosted += 1;
  const evaluated = evaluateAchievements(next);
  return {
    profile: evaluated.profile,
    newlyUnlockedAchievements: evaluated.newlyUnlocked,
  };
}

export function recordRoundOutcome(profile, payload = {}) {
  const {
    players = [],
    round = null,
    resolution = null,
    attribution = 'device',
    onlinePlayerId = '',
    personaInGameName = '',
  } = payload;
  if (!round || !resolution) {
    return {
      profile: normalizePlayerProfile(profile),
      newlyUnlockedAchievements: [],
    };
  }
  const next = normalizePlayerProfile(profile);
  const liarIds = new Set(round.imposterIds || []);
  const tally = resolution.tally || {};
  const normalizedVotes = resolution.normalizedVotes || {};
  const themeName = toCanonicalThemeName(payload.themeName || 'Default');
  const roundTypeId = String(round.roundTypeId || 'prompt');

  const attributedPlayerIds =
    attribution === 'online' && onlinePlayerId
      ? [onlinePlayerId]
      : players.map((player) => player.id);

  for (const playerId of attributedPlayerIds) {
    const player = players.find((entry) => entry.id === playerId);
    if (!player) continue;
    const voteTarget = normalizedVotes[playerId];
    if (voteTarget) {
      if (liarIds.has(voteTarget)) {
        next.stats.votesCorrect += 1;
      } else {
        next.stats.votesIncorrect += 1;
      }
    }
    if (liarIds.has(playerId)) {
      next.stats.timesLiar += 1;
      if (resolution.imposterCaught) {
        next.stats.timesLiarCaught += 1;
      } else {
        next.stats.timesLiarNotCaught += 1;
      }
    } else if ((tally[playerId] || 0) > 0) {
      next.stats.timesAccusedInnocent += 1;
    }
  }

  next.stats.themesPlayed[themeName] =
    (Number(next.stats.themesPlayed[themeName] || 0) || 0) + 1;
  next.stats.roundTypesPlayed[roundTypeId] =
    (Number(next.stats.roundTypesPlayed[roundTypeId] || 0) || 0) + 1;

  const evaluated = evaluateAchievements(next);
  return {
    profile: evaluated.profile,
    newlyUnlockedAchievements: evaluated.newlyUnlocked,
  };
}

export function recordCompletedGame(profile, payload = {}) {
  const {
    themeName = 'Default',
    mode = 'local',
    role = 'host',
    won = false,
    onlinePlayerId = '',
    personaInGameName = '',
    players = [],
  } = payload;
  let next = normalizePlayerProfile(profile);
  next.stats.gamesPlayed += 1;
  if (won) next.stats.gamesWon += 1;
  const canonicalTheme = toCanonicalThemeName(themeName);
  next.stats.themesPlayed[canonicalTheme] =
    (Number(next.stats.themesPlayed[canonicalTheme] || 0) || 0) + 1;

  const entry = {
    id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dateIso: new Date().toISOString(),
    themeName: canonicalTheme,
    mode,
    role,
    result: won ? 'won' : 'played',
    playerLabel:
      mode === 'online'
        ? personaInGameName || 'You'
        : 'Pass-the-phone table',
  };
  next.recentGames = [entry, ...(next.recentGames || [])].slice(0, 20);

  const evaluated = evaluateAchievements(next);
  return {
    profile: evaluated.profile,
    newlyUnlockedAchievements: evaluated.newlyUnlocked,
  };
}

export function emptyProfile() {
  return createEmptyPlayerProfile();
}
