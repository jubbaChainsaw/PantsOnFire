import { createClient } from 'redis';
import { createInMemoryLobbyStore, createRedisLobbyStore } from './lobbyStore.js';

function parseRedisUrl() {
  const raw = String(process.env.REDIS_URL || process.env.LOBBY_REDIS_URL || '').trim();
  return raw || null;
}

export async function createLobbyStore({
  sessionTokenTtlMs,
} = {}) {
  const redisUrl = parseRedisUrl();
  if (!redisUrl) {
    const store = createInMemoryLobbyStore({
      sessionTokenTtlMs,
    });
    return {
      store,
      kind: 'memory',
      close: store.shutdown,
    };
  }

  const client = createClient({ url: redisUrl });
  client.on('error', (error) => {
    // eslint-disable-next-line no-console
    console.error('[lobby-store][redis] client error', error);
  });
  await client.connect();

  const store = createRedisLobbyStore({
    redis: client,
    keyPrefix: String(process.env.LOBBY_REDIS_KEY_PREFIX || 'pof:lobby').trim() || 'pof:lobby',
    sessionTokenTtlMs,
  });
  return {
    store,
    kind: 'redis',
    close: store.shutdown,
  };
}
