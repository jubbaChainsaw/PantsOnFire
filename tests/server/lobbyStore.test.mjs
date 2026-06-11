import test from 'node:test';
import assert from 'node:assert/strict';
import { createInMemoryLobbyStore, toClientSnapshot } from '../../server/storage/lobbyStore.js';

const HOUR_MS = 1000 * 60 * 60;

function makeStore(overrides = {}) {
  return createInMemoryLobbyStore({ sessionTokenTtlMs: HOUR_MS, ...overrides });
}

async function makeLobbyWithPlayers(store, playerCount = 3) {
  const created = await store.createLobby({
    hostName: 'Hosty',
    hostPlayer: { name: 'Hosty', clientId: 'client-host' },
  });
  const code = created.lobby.code;
  const members = [
    { player: created.player, sessionToken: created.sessionToken, clientId: 'client-host' },
  ];
  for (let i = 1; i < playerCount; i += 1) {
    const joined = await store.upsertPlayer(code, {
      name: `Player ${i + 1}`,
      clientId: `client-${i + 1}`,
    });
    assert.equal(joined.error, undefined);
    members.push({
      player: joined.player,
      sessionToken: joined.sessionToken,
      clientId: `client-${i + 1}`,
    });
  }
  return { code, members };
}

async function readyAllAndStart(store, code, members) {
  for (const member of members) {
    const result = await store.setPlayerReady(code, member.player.id, member.sessionToken, true);
    assert.equal(result.error, undefined, `ready failed: ${result.error}`);
    member.sessionToken = result.sessionToken;
  }
  const host = members[0];
  const started = await store.startLobby(code, host.clientId, host.sessionToken);
  assert.equal(started.error, undefined, `start failed: ${started.error}`);
  host.sessionToken = started.sessionToken;
  return started;
}

test('createLobby issues server-generated code and strong session token', async () => {
  const store = makeStore();
  const created = await store.createLobby({
    hostName: 'Hosty',
    hostPlayer: { name: 'Hosty', clientId: 'client-host' },
  });
  assert.match(created.lobby.code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(created.player.isHost, true);
  assert.ok(created.sessionToken.length >= 24, 'session token should be long');
  assert.match(created.sessionToken, /^sess-/);
});

test('join cannot self-assign host status or a starting score', async () => {
  const store = makeStore();
  const { code } = await makeLobbyWithPlayers(store, 1);
  const joined = await store.upsertPlayer(code, {
    name: 'Sneaky',
    clientId: 'client-sneaky',
    isHost: true,
    score: 999,
  });
  assert.equal(joined.error, undefined);
  assert.equal(joined.player.isHost, false);
  assert.equal(joined.player.score, 0);
});

test('join cannot reclaim another player seat without their session token', async () => {
  const store = makeStore();
  const { code, members } = await makeLobbyWithPlayers(store, 3);
  const victim = members[1];
  const hijack = await store.upsertPlayer(code, {
    name: 'Hijacker',
    clientId: victim.clientId,
  });
  assert.equal(hijack.error, 'client-id-in-use');
  const lobby = await store.getLobby(code);
  const seat = lobby.players.find((p) => p.clientId === victim.clientId);
  assert.equal(seat.name, victim.player.name, 'victim seat must be untouched');
});

test('join cannot reclaim the host seat by sending the host clientId', async () => {
  const store = makeStore();
  const { code, members } = await makeLobbyWithPlayers(store, 3);
  const host = members[0];
  const hijack = await store.upsertPlayer(code, {
    name: 'Fake Host',
    clientId: host.clientId,
    isHost: true,
  });
  assert.equal(hijack.error, 'client-id-in-use');
});

test('join with a valid session token reclaims the seat and rotates the token', async () => {
  const store = makeStore();
  const { code, members } = await makeLobbyWithPlayers(store, 3);
  const member = members[1];
  const reclaimed = await store.upsertPlayer(
    code,
    { name: 'New Name', clientId: member.clientId },
    member.sessionToken
  );
  assert.equal(reclaimed.error, undefined);
  assert.equal(reclaimed.player.id, member.player.id, 'seat identity preserved');
  assert.equal(reclaimed.player.name, 'New Name');
  assert.notEqual(reclaimed.sessionToken, member.sessionToken, 'token must rotate');
});

test('join with a colliding player id gets a fresh server id', async () => {
  const store = makeStore();
  const { code, members } = await makeLobbyWithPlayers(store, 3);
  const victim = members[1];
  const joined = await store.upsertPlayer(code, {
    id: victim.player.id,
    name: 'Collider',
    clientId: 'client-collider',
  });
  assert.equal(joined.error, undefined);
  assert.notEqual(joined.player.id, victim.player.id);
  const lobby = await store.getLobby(code);
  assert.equal(lobby.players.length, 4, 'victim must not be displaced');
});

test('lobby enforces max players', async () => {
  const store = makeStore();
  const created = await store.createLobby({
    hostName: 'Hosty',
    hostPlayer: { name: 'Hosty', clientId: 'client-host' },
    maxPlayers: 3,
  });
  const code = created.lobby.code;
  await store.upsertPlayer(code, { name: 'P2', clientId: 'c2' });
  await store.upsertPlayer(code, { name: 'P3', clientId: 'c3' });
  const overflow = await store.upsertPlayer(code, { name: 'P4', clientId: 'c4' });
  assert.equal(overflow.error, 'lobby-full');
});

test('start requires the host session token and generates a round with one liar', async () => {
  const store = makeStore();
  const { code, members } = await makeLobbyWithPlayers(store, 3);
  for (const member of members) {
    const result = await store.setPlayerReady(code, member.player.id, member.sessionToken, true);
    member.sessionToken = result.sessionToken;
  }
  const badStart = await store.startLobby(code, 'client-host', 'sess-bogus');
  assert.equal(badStart.error, 'token-rotation-required');

  const started = await store.startLobby(code, 'client-host', members[0].sessionToken);
  assert.equal(started.error, undefined);
  const lobby = await store.getLobby(code);
  assert.equal(lobby.status, 'started');
  const round = lobby.activeRound;
  assert.ok(round, 'round must exist');
  assert.equal(round.imposterIds.length, 1);
  const liarId = round.imposterIds[0];
  for (const player of lobby.players) {
    const expected = player.id === liarId ? round.imposterPrompt : round.commonPrompt;
    assert.equal(round.promptsByPlayerId[player.id], expected);
  }
});

test('public snapshots never leak liar identity or prompts before reveal', async () => {
  const store = makeStore();
  const { code, members } = await makeLobbyWithPlayers(store, 3);
  await readyAllAndStart(store, code, members);
  const lobby = await store.getLobby(code);
  const snapshot = toClientSnapshot(lobby);
  const publicRound = snapshot.activeRound;
  assert.ok(publicRound, 'round should be present in snapshot');
  assert.equal(publicRound.imposterIds, undefined, 'liar ids must be hidden');
  assert.equal(publicRound.imposterPrompt, undefined, 'imposter prompt must be hidden');
  assert.equal(publicRound.commonPrompt, undefined, 'common prompt must be hidden');
  assert.equal(publicRound.promptsByPlayerId, undefined);
  assert.equal(publicRound.mediaByPlayerId, undefined);
  assert.equal(publicRound.votesByPlayerId, undefined);
});

test('private round view requires the matching session token', async () => {
  const store = makeStore();
  const { code, members } = await makeLobbyWithPlayers(store, 3);
  await readyAllAndStart(store, code, members);
  const member = members[1];
  const other = members[2];

  const missing = await store.getPlayerRoundView(code, member.player.id, '');
  assert.equal(missing.error, 'session-token-required');

  const crossed = await store.getPlayerRoundView(code, member.player.id, other.sessionToken);
  assert.equal(crossed.error, 'invalid-session-token');

  const view = await store.getPlayerRoundView(code, member.player.id, member.sessionToken);
  assert.equal(view.error, undefined);
  assert.ok(view.round.prompt, 'player should receive a prompt');
  const lobby = await store.getLobby(code);
  const isLiar = lobby.activeRound.imposterIds.includes(member.player.id);
  assert.equal(view.round.isImposter, isLiar);
});

test('voting flow: validation, server scoring, and reveal-phase disclosure', async () => {
  const store = makeStore();
  const { code, members } = await makeLobbyWithPlayers(store, 3);
  await readyAllAndStart(store, code, members);

  const advance = async (member) => {
    const result = await store.advanceRoundPhase(code, member.player.id, member.sessionToken);
    assert.equal(result.error, undefined, `advance failed: ${result.error}`);
    member.sessionToken = result.sessionToken;
    return result;
  };

  const early = await store.submitRoundVote(
    code,
    members[0].player.id,
    members[1].player.id,
    members[0].sessionToken
  );
  assert.equal(early.error, 'voting-not-active');

  await advance(members[0]); // host-intro -> reveal
  await advance(members[0]); // reveal -> discussion
  await advance(members[0]); // discussion -> voting

  const selfVote = await store.submitRoundVote(
    code,
    members[0].player.id,
    members[0].player.id,
    members[0].sessionToken
  );
  assert.equal(selfVote.error, 'vote-target-invalid');

  const ghostVote = await store.submitRoundVote(
    code,
    members[0].player.id,
    'opl-not-a-member',
    members[0].sessionToken
  );
  assert.equal(ghostVote.error, 'vote-target-invalid');

  let lobby = await store.getLobby(code);
  const liarId = lobby.activeRound.imposterIds[0];
  const liar = members.find((m) => m.player.id === liarId);
  const innocents = members.filter((m) => m.player.id !== liarId);

  // Everyone votes for the liar; the liar votes for an innocent.
  for (const member of innocents) {
    const result = await store.submitRoundVote(code, member.player.id, liarId, member.sessionToken);
    assert.equal(result.error, undefined, `vote failed: ${result.error}`);
    member.sessionToken = result.sessionToken;
  }
  const liarResult = await store.submitRoundVote(
    code,
    liar.player.id,
    innocents[0].player.id,
    liar.sessionToken
  );
  assert.equal(liarResult.error, undefined);
  liar.sessionToken = liarResult.sessionToken;
  assert.equal(liarResult.votingComplete, true);

  lobby = await store.getLobby(code);
  const round = lobby.activeRound;
  assert.equal(round.phase, 'liar-reveal');
  assert.equal(round.resolution.imposterCaught, true);
  for (const member of innocents) {
    assert.equal(round.resolution.roundGains[member.player.id], 1, 'correct vote earns 1');
  }
  assert.equal(round.resolution.roundGains[liarId], 0, 'caught liar earns nothing');

  // At reveal the public round may (and must) disclose the liar.
  const snapshot = toClientSnapshot(lobby);
  assert.deepEqual(snapshot.activeRound.imposterIds, [liarId]);
});

test('resume rotates the session token and invalidates the old one', async () => {
  const store = makeStore();
  const { code, members } = await makeLobbyWithPlayers(store, 3);
  const member = members[1];
  const resumed = await store.resumePlayer(code, member.sessionToken, member.clientId);
  assert.equal(resumed.error, undefined);
  assert.notEqual(resumed.sessionToken, member.sessionToken);
  const replay = await store.resumePlayer(code, member.sessionToken, member.clientId);
  assert.equal(replay.error, 'invalid-session-token');
});

test('expired session tokens are rejected', async () => {
  const store = makeStore({ sessionTokenTtlMs: -1 });
  const created = await store.createLobby({
    hostName: 'Hosty',
    hostPlayer: { name: 'Hosty', clientId: 'client-host' },
  });
  const resumed = await store.resumePlayer(created.lobby.code, created.sessionToken, 'client-host');
  assert.equal(resumed.error, 'lobby-session-expired');
});
