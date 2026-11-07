const BLOCKS_STORAGE_KEY = 'pof-blocked-player-keys-v1';

export function readLocalBlockedPlayerKeys() {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = JSON.parse(window.localStorage.getItem(BLOCKS_STORAGE_KEY) || '[]');
    return new Set(
      (Array.isArray(raw) ? raw : [])
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean),
    );
  } catch {
    return new Set();
  }
}

export function writeLocalBlockedPlayerKeys(keys) {
  if (typeof window === 'undefined') return;
  const list = [...new Set((keys || []).map((k) => String(k || '').trim().toLowerCase()).filter(Boolean))];
  window.localStorage.setItem(BLOCKS_STORAGE_KEY, JSON.stringify(list));
}

export function blockPlayerKeyLocally(playerKey) {
  const key = String(playerKey || '').trim().toLowerCase();
  if (!key) return readLocalBlockedPlayerKeys();
  const next = readLocalBlockedPlayerKeys();
  next.add(key);
  writeLocalBlockedPlayerKeys([...next]);
  return next;
}

export function unblockPlayerKeyLocally(playerKey) {
  const key = String(playerKey || '').trim().toLowerCase();
  const next = readLocalBlockedPlayerKeys();
  next.delete(key);
  writeLocalBlockedPlayerKeys([...next]);
  return next;
}

export function moderationKeyForPlayer(player) {
  const id = String(player?.id || '').trim();
  if (id) return id.toLowerCase();
  const name = String(player?.name || '').trim().toLowerCase();
  return name ? `name:${name}` : '';
}

export function isPlayerBlocked(player, blockedKeys) {
  const set = blockedKeys instanceof Set ? blockedKeys : readLocalBlockedPlayerKeys();
  const key = moderationKeyForPlayer(player);
  if (!key) return false;
  return set.has(key);
}
