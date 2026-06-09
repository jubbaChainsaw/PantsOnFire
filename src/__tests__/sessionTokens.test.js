// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { createInMemoryLobbyStore } from '../../server/storage/lobbyStore.js';

describe('session tokens', () => {
  it('issues a session token when a lobby is created', async () => {
    const store = createInMemoryLobbyStore();
    const result = await store.createLobby({
      hostPlayer: { name: 'Alice', clientId: 'c1', isHost: true },
      hostName: 'Alice',
      maxPlayers: 6,
      settings: {},
    });
    expect(result.sessionToken).toBeTruthy();
    expect(typeof result.sessionToken).toBe('string');
    expect(result.sessionToken.length).toBeGreaterThan(10);
  });

  it('rotates session token on resumePlayer', async () => {
    const store = createInMemoryLobbyStore({ sessionTokenTtlMs: 60_000 });
    const { lobby, sessionToken: firstToken } = await store.createLobby({
      hostPlayer: { name: 'Alice', clientId: 'c1', isHost: true },
      hostName: 'Alice',
      maxPlayers: 6,
      settings: {},
    });
    const resume = await store.resumePlayer(lobby.code, firstToken, 'c1');
    expect(resume.sessionToken).toBeTruthy();
    expect(resume.sessionToken).not.toBe(firstToken);
  });

  it('rejects expired session tokens', async () => {
    const store = createInMemoryLobbyStore({ sessionTokenTtlMs: 1 });
    const { lobby, sessionToken } = await store.createLobby({
      hostPlayer: { name: 'Alice', clientId: 'c1', isHost: true },
      hostName: 'Alice',
      maxPlayers: 6,
      settings: {},
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const resume = await store.resumePlayer(lobby.code, sessionToken, 'c1');
    expect(resume.error).toBe('lobby-session-expired');
  });

  it('rejects invalid session tokens', async () => {
    const store = createInMemoryLobbyStore();
    const { lobby } = await store.createLobby({
      hostPlayer: { name: 'Alice', clientId: 'c1', isHost: true },
      hostName: 'Alice',
      maxPlayers: 6,
      settings: {},
    });
    const resume = await store.resumePlayer(lobby.code, 'sess-invalid-token', 'c1');
    expect(resume.error).toBe('invalid-session-token');
  });

  it('token rotates on setPlayerReady', async () => {
    const store = createInMemoryLobbyStore({ sessionTokenTtlMs: 60_000 });
    const { lobby, player, sessionToken } = await store.createLobby({
      hostPlayer: { name: 'Alice', clientId: 'c1', isHost: true },
      hostName: 'Alice',
      maxPlayers: 6,
      settings: {},
    });
    const result = await store.setPlayerReady(lobby.code, player.id, sessionToken, true);
    expect(result.sessionToken).toBeTruthy();
    expect(result.sessionToken).not.toBe(sessionToken);
  });
});
