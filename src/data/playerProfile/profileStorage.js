import {
  PLAYER_PROFILE_STORAGE_KEY,
  mergePlayerProfiles,
  normalizePlayerProfile,
} from './profileModel.js';

function readJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function readLocalPlayerProfile() {
  return normalizePlayerProfile(readJson(PLAYER_PROFILE_STORAGE_KEY, null));
}

export function writeLocalPlayerProfile(profile) {
  writeJson(PLAYER_PROFILE_STORAGE_KEY, normalizePlayerProfile(profile));
}

export function mergeRemotePlayerProfile(remoteProfile) {
  const local = readLocalPlayerProfile();
  const merged = mergePlayerProfiles(local, remoteProfile);
  writeLocalPlayerProfile(merged);
  return merged;
}
