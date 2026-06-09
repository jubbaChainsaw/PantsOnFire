// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { scoreRoundServer } from '../../server/storage/lobbyStore.js';

function makePlayers(names) {
  return names.map((name, i) => ({ id: `p${i + 1}`, name, score: 0 }));
}

function makeRound(liarIds, roundTypeId = 'prompt') {
  return { imposterIds: liarIds, roundTypeId };
}

describe('scoreRoundServer', () => {
  it('voters who correctly voted for the liar get 1 point', () => {
    const players = makePlayers(['Alice', 'Bob', 'Carol', 'Dave']);
    const liarId = 'p1';
    const round = makeRound([liarId]);
    const votes = { p2: liarId, p3: liarId, p4: 'p2' };
    const { nextPlayers } = scoreRoundServer(players, round, votes);
    const bob = nextPlayers.find((p) => p.id === 'p2');
    const carol = nextPlayers.find((p) => p.id === 'p3');
    expect(bob.score).toBe(1);
    expect(carol.score).toBe(1);
  });

  it('liar gets 2 survival points when not caught', () => {
    const players = makePlayers(['Alice', 'Bob', 'Carol', 'Dave']);
    const liarId = 'p1';
    const round = makeRound([liarId]);
    // No one votes for the liar → liar survives
    const votes = { p2: 'p3', p3: 'p4', p4: 'p2' };
    const { nextPlayers, imposterCaught } = scoreRoundServer(players, round, votes);
    expect(imposterCaught).toBe(false);
    const alice = nextPlayers.find((p) => p.id === liarId);
    expect(alice.score).toBe(2);
  });

  it('liar does NOT get survival points when caught', () => {
    const players = makePlayers(['Alice', 'Bob', 'Carol', 'Dave']);
    const liarId = 'p1';
    const round = makeRound([liarId]);
    // Everyone votes for the liar → liar is caught
    const votes = { p2: liarId, p3: liarId, p4: liarId };
    const { nextPlayers, imposterCaught } = scoreRoundServer(players, round, votes);
    expect(imposterCaught).toBe(true);
    const alice = nextPlayers.find((p) => p.id === liarId);
    expect(alice.score).toBe(0);
  });

  it('scores never go below 0', () => {
    const players = makePlayers(['Alice', 'Bob', 'Carol']).map((p) => ({ ...p, score: 0 }));
    const liarId = 'p1';
    // Grill round where liar is caught → liar gets grillLiarSwing penalty removed
    const round = {
      ...makeRound([liarId], 'grill'),
      grillData: { guessWinnerId: '', disqualifiedPlayerIds: [] },
    };
    const votes = { p2: liarId, p3: liarId };
    const { nextPlayers } = scoreRoundServer(players, round, votes);
    for (const player of nextPlayers) {
      expect(player.score).toBeGreaterThanOrEqual(0);
    }
  });

  it('imposterCaught is false when liar receives fewer votes than the top vote-getter', () => {
    const players = makePlayers(['Alice', 'Bob', 'Carol', 'Dave']);
    const liarId = 'p1';
    const round = makeRound([liarId]);
    // p3 gets 2 votes (top), liar p1 gets only 1 vote — not caught
    const votes = { p2: 'p3', p3: 'p3', p4: liarId };
    const { imposterCaught } = scoreRoundServer(players, round, votes);
    expect(imposterCaught).toBe(false);
  });

  it('handles empty votes gracefully', () => {
    const players = makePlayers(['Alice', 'Bob', 'Carol']);
    const round = makeRound(['p1']);
    const { nextPlayers, imposterCaught } = scoreRoundServer(players, round, {});
    expect(imposterCaught).toBe(false);
    for (const p of nextPlayers) {
      expect(p.score).toBeGreaterThanOrEqual(0);
    }
  });
});
