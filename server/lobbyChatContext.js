const MAX_MESSAGES_PER_LOBBY = 40;

/** @type {Map<string, Array<Record<string, unknown>>>} */
const messagesByLobbyCode = new Map();

export function appendLobbyChatMessage(code, message) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized || !message) return;
  const list = messagesByLobbyCode.get(normalized) || [];
  list.push(message);
  while (list.length > MAX_MESSAGES_PER_LOBBY) list.shift();
  messagesByLobbyCode.set(normalized, list);
}

export function recentLobbyChatMessages(code, limit = MAX_MESSAGES_PER_LOBBY) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return [];
  const list = messagesByLobbyCode.get(normalized) || [];
  return list.slice(-Math.max(1, Math.min(limit, MAX_MESSAGES_PER_LOBBY)));
}

export function clearLobbyChatContext(code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return;
  messagesByLobbyCode.delete(normalized);
}
