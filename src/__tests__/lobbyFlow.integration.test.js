// @vitest-environment node
/**
 * Integration test for the full online lobby lifecycle against the in-memory store:
 * create → join → ready → start → round phases → vote → results → next round.
 *
 * This exercises the same store code paths the HTTP routes call, without
 * needing a running server.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createInMemoryLobbyStore, toClientSnapshot } from '../../server/storage/lobbyStore.js';

async function setupStartedLobby() {
  const store = createInMemoryLobbyStore({ sessionTokenTtlMs: 60_000 });

  const created = await store.createLobby({
    hostPlayer: { name: 'Alice', clientId: 'client-a', isHost: true },
    hostName: 'Alice',
    maxPlayers: 6,
    settings: { winCondition: 'rounds', roundsPerPlayer: 2 },
  });
  const code = created.lobby.code;

  const bob = await store.upsertPlayer(code, { name: 'Bob', clientId: 'client-b' });
  const carol = await store.upsertPlayer(code, { name: 'Carol', clientId: 'client-c' });

  // Track tokens per player id — they rotate on ready/start/vote calls.
  const tokens = {
    [created.player.id]: created.sessionToken,
    [bob.player.id]: bob.sessionToken,
    [carol.player.id]: carol.sessionToken,
  };

  for (const playerId of Object.keys(tokens)) {
    const result = await store.setPlayerReady(code, playerId, tokens[playerId], true);
    expect(result.error).toBeUndefined();
    tokens[playerId] = result.sessionToken;
  }

  const startResult = await store.startLobby(code, 'client-a', tokens[created.player.id]);
  expect(startResult.error).toBeUndefined();
  tokens[created.player.id] = startResult.sessionToken;

  return { store, code, tokens, hostId: created.player.id };
}

describe('full lobby flow (in-memory store)', () => {
  let store, code, tokens, hostId;

  beforeEach(async () => {
    ({ store, code, tokens, hostId } = await setupStartedLobby());
  });

  it('starts with an authoritative first round in host-intro phase', async () => {
    const lobby = await store.getLobby(code);
    expect(lobby.status).toBe('started');
    expect(lobby.activeRound).toBeTruthy();
    expect(lobby.activeRound.phase).toBe('host-intro');
    expect(lobby.activeRound.roundNumber).toBe(1);
    expect(lobby.activeRound.imposterIds).toHaveLength(1);
    // Every player has a private prompt assigned
    expect(Object.keys(lobby.activeRound.promptsByPlayerId)).toHaveLength(3);
  });

  it('client snapshot never leaks private prompts or votes', async () => {
    const lobby = await store.getLobby(code);
    const snapshot = toClientSnapshot(lobby);
    expect(snapshot.activeRound.promptsByPlayerId).toBeUndefined();
    expect(snapshot.activeRound.votesByPlayerId).toBeUndefined();
    expect(snapshot.activeRound.mediaByPlayerId).toBeUndefined();
  });

  it('private round view shows the correct prompt per player', async () => {
    const lobby = await store.getLobby(code);
    const round = lobby.activeRound;
    for (const playerId of Object.keys(tokens)) {
      const view = await store.getPlayerRoundView(code, playerId, tokens[playerId]);
      expect(view.error).toBeUndefined();
      const isLiar = round.imposterIds.includes(playerId);
      expect(view.round.isImposter).toBe(isLiar);
      expect(view.round.prompt).toBe(isLiar ? round.imposterPrompt : round.commonPrompt);
    }
  });

  it('walks phases host-intro → reveal → discussion → voting, then votes resolve the round', async () => {
    // Advance: host-intro → reveal
    let result = await store.advanceRoundPhase(code, hostId, tokens[hostId]);
    expect(result.error).toBeUndefined();
    tokens[hostId] = result.sessionToken;
    expect(result.round.phase).toBe('reveal');

    // reveal → discussion
    result = await store.advanceRoundPhase(code, hostId, tokens[hostId]);
    tokens[hostId] = result.sessionToken;
    expect(result.round.phase).toBe('discussion');

    // discussion → voting
    result = await store.advanceRoundPhase(code, hostId, tokens[hostId]);
    tokens[hostId] = result.sessionToken;
    expect(result.round.phase).toBe('voting');

    // Everyone votes for the liar
    const lobby = await store.getLobby(code);
    const liarId = lobby.activeRound.imposterIds[0];
    const playerIds = Object.keys(tokens);
    for (const playerId of playerIds) {
      // A player cannot vote for themselves; the liar votes for someone else.
      const targetId = playerId === liarId ? playerIds.find((id) => id !== liarId) : liarId;
      const voteResult = await store.submitRoundVote(code, playerId, targetId, tokens[playerId]);
      expect(voteResult.error).toBeUndefined();
      tokens[playerId] = voteResult.sessionToken;
    }

    // All votes in → round auto-resolves to liar-reveal with a resolution
    const finalLobby = await store.getLobby(code);
    expect(finalLobby.activeRound.phase).toBe('liar-reveal');
    expect(finalLobby.activeRound.resolution).toBeTruthy();
    expect(finalLobby.activeRound.resolution.imposterCaught).toBe(true);

    // Voters who found the liar earned a point; the caught liar earned none
    const liar = finalLobby.players.find((p) => p.id === liarId);
    expect(liar.score).toBe(0);
    for (const player of finalLobby.players) {
      if (player.id !== liarId) {
        expect(player.score).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('rejects voting before the voting phase', async () => {
    const playerIds = Object.keys(tokens);
    const voter = playerIds[0];
    const target = playerIds[1];
    const result = await store.submitRoundVote(code, voter, target, tokens[voter]);
    expect(result.error).toBe('voting-not-active');
  });

  it('rejects a self-vote', async () => {
    // Walk to voting phase first
    for (let i = 0; i < 3; i++) {
      const r = await store.advanceRoundPhase(code, hostId, tokens[hostId]);
      tokens[hostId] = r.sessionToken;
    }
    const result = await store.submitRoundVote(code, hostId, hostId, tokens[hostId]);
    expect(result.error).toBe('vote-target-invalid');
  });

  it('host can create the next round after results', async () => {
    // Walk phases to voting and complete voting
    for (let i = 0; i < 3; i++) {
      const r = await store.advanceRoundPhase(code, hostId, tokens[hostId]);
      tokens[hostId] = r.sessionToken;
    }
    const lobby = await store.getLobby(code);
    const liarId = lobby.activeRound.imposterIds[0];
    const playerIds = Object.keys(tokens);
    for (const playerId of playerIds) {
      const targetId = playerId === liarId ? playerIds.find((id) => id !== liarId) : liarId;
      const v = await store.submitRoundVote(code, playerId, targetId, tokens[playerId]);
      tokens[playerId] = v.sessionToken;
    }

    // liar-reveal → results
    const advanced = await store.advanceRoundPhase(code, hostId, tokens[hostId]);
    expect(advanced.error).toBeUndefined();
    tokens[hostId] = advanced.sessionToken;
    expect(advanced.round.phase).toBe('results');

    // Host creates round 2
    const next = await store.createNextRound(code, 'client-a', tokens[hostId]);
    expect(next.error).toBeUndefined();
    expect(next.round.roundNumber).toBe(2);
    expect(next.round.phase).toBe('host-intro');
  });

  it('non-host cannot start a lobby or create rounds', async () => {
    const nonHostId = Object.keys(tokens).find((id) => id !== hostId);
    const startAttempt = await store.startLobby(code, 'client-b', tokens[nonHostId]);
    expect(startAttempt.error).toBe('host-only');
    const roundAttempt = await store.createNextRound(code, 'client-b', tokens[nonHostId]);
    expect(roundAttempt.error).toBe('host-only');
  });

  it('recent prompt keys prevent immediate prompt repeats across rounds', async () => {
    const lobby = await store.getLobby(code);
    expect(lobby.recentPromptKeys).toContain(lobby.activeRound.promptKey);
  });

  it('removing players below minimum ends a started lobby with a winner', async () => {
    const playerIds = Object.keys(tokens);
    const removed = await store.removePlayer(code, playerIds[2]);
    expect(removed.lobby.status).toBe('ended');
    expect(removed.lobby.endedReason).toBe('insufficient-players');
    expect(removed.lobby.endedWinnerId).toBeTruthy();
  });
});
