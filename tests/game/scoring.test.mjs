import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGrillRoundDataToRound,
  calculateRoundResolutionLocal,
} from '../../src/game/scoring/roundResolution.js';
import {
  applyGrillRoundDataToRound as legacyApplyGrillRoundDataToRound,
  calculateRoundResolutionLocal as legacyCalculateRoundResolutionLocal,
} from '../fixtures/legacyGameLogic.mjs';
import { scoreRoundServer } from '../../server/storage/lobbyStore.js';

const PLAYERS = [
  { id: 'p1', name: 'Ava', score: 0 },
  { id: 'p2', name: 'Ben', score: 3 },
  { id: 'p3', name: 'Cleo', score: 1 },
  { id: 'p4', name: 'Dan', score: 0 },
];

const PROMPT_ROUND = { roundTypeId: 'prompt', imposterIds: ['p2'] };

test('caught liar: correct voters gain 1, liar gains nothing', () => {
  const votes = { p1: 'p2', p3: 'p2', p4: 'p2', p2: 'p1' };
  const result = calculateRoundResolutionLocal(PLAYERS, PROMPT_ROUND, votes);
  assert.equal(result.imposterCaught, true);
  assert.deepEqual(result.roundGains, { p1: 1, p2: 0, p3: 1, p4: 1 });
  assert.deepEqual(result.tally, { p2: 3, p1: 1 });
  const ben = result.nextPlayers.find((player) => player.id === 'p2');
  assert.equal(ben.score, 3, 'caught liar keeps existing score');
  const ava = result.nextPlayers.find((player) => player.id === 'p1');
  assert.equal(ava.score, 1);
});

test('escaped liar gains 2; nobody else scores', () => {
  const votes = { p1: 'p3', p3: 'p1', p4: 'p3', p2: 'p4' };
  const result = calculateRoundResolutionLocal(PLAYERS, PROMPT_ROUND, votes);
  assert.equal(result.imposterCaught, false);
  assert.deepEqual(result.roundGains, { p1: 0, p2: 2, p3: 0, p4: 0 });
});

test('a liar tied for the top vote count is still caught', () => {
  // p2 (liar) gets 2 votes, p3 gets 2 votes: tie at the top -> caught.
  const votes = { p1: 'p2', p4: 'p2', p2: 'p3', p3: 'p2' };
  const tieVotes = { p1: 'p2', p4: 'p3', p2: 'p3', p3: 'p2' };
  const tied = calculateRoundResolutionLocal(PLAYERS, PROMPT_ROUND, tieVotes);
  assert.equal(tied.tally.p2, 2);
  assert.equal(tied.tally.p3, 2);
  assert.equal(tied.imposterCaught, true);
  const clear = calculateRoundResolutionLocal(PLAYERS, PROMPT_ROUND, votes);
  assert.equal(clear.imposterCaught, true);
});

test('self-votes, unknown voters and unknown targets are dropped', () => {
  const votes = {
    p1: 'p1', // self vote -> dropped
    ghost: 'p2', // unknown voter -> dropped
    p3: 'ghost', // unknown target -> dropped
    p4: 'p2', // valid
  };
  const result = calculateRoundResolutionLocal(PLAYERS, PROMPT_ROUND, votes);
  assert.deepEqual(result.normalizedVotes, { p4: 'p2' });
  assert.deepEqual(result.tally, { p2: 1 });
});

test('scores never drop below zero', () => {
  const grillRound = {
    roundTypeId: 'grill',
    imposterIds: ['p2'],
    grillData: { scoreAdjustmentsByPlayerId: { p1: -5 }, guessWinnerId: '' },
  };
  // Liar escapes: non-liars get -1, p1 additionally -5.
  const votes = { p1: 'p3', p3: 'p1', p4: 'p1', p2: 'p3' };
  const result = calculateRoundResolutionLocal(PLAYERS, grillRound, votes);
  const ava = result.nextPlayers.find((player) => player.id === 'p1');
  assert.equal(result.roundGains.p1, -6);
  assert.equal(ava.score, 0, 'score floors at zero');
});

test('grill round: team bonus when liar caught, swing when escaped', () => {
  const grillRound = { roundTypeId: 'grill', imposterIds: ['p2'], grillData: {} };
  const caughtVotes = { p1: 'p2', p3: 'p2', p4: 'p2', p2: 'p1' };
  const caught = calculateRoundResolutionLocal(PLAYERS, grillRound, caughtVotes);
  assert.equal(caught.imposterCaught, true);
  // Everyone (including the liar) gets the +2 team bonus; voters add +1.
  assert.deepEqual(caught.roundGains, { p1: 3, p2: 2, p3: 3, p4: 3 });
  assert.equal(caught.roundBreakdown.p1.grillTeamBonus, 2);

  const escapedVotes = { p1: 'p3', p3: 'p1', p4: 'p1', p2: 'p3' };
  const escaped = calculateRoundResolutionLocal(PLAYERS, grillRound, escapedVotes);
  assert.equal(escaped.imposterCaught, false);
  // Liar: +2 survive +2 swing; everyone else -1.
  assert.deepEqual(escaped.roundGains, { p1: -1, p2: 4, p3: -1, p4: -1 });
  assert.equal(escaped.roundBreakdown.p2.grillLiarSwing, 2);
  assert.equal(escaped.roundBreakdown.p1.grillLiarSwing, -1);
});

test('grill adjustments: guess winner bonus and cheat penalties in the breakdown', () => {
  const grillRound = {
    roundTypeId: 'grill',
    imposterIds: ['p2'],
    grillData: {
      scoreAdjustmentsByPlayerId: { p3: 2, p4: -1 },
      guessWinnerId: 'p3',
    },
  };
  const votes = { p1: 'p2', p3: 'p2', p4: 'p2', p2: 'p1' };
  const result = calculateRoundResolutionLocal(PLAYERS, grillRound, votes);
  assert.equal(result.roundGains.p3, 5); // +1 vote +2 team +2 guess bonus
  assert.equal(result.roundBreakdown.p3.grillGuessBonus, 2);
  assert.equal(result.roundGains.p4, 2); // +1 vote +2 team -1 cheat
  assert.equal(result.roundBreakdown.p4.grillCheatPenalty, -1);
});

test('applyGrillRoundDataToRound leaves non-grill rounds untouched', () => {
  const round = { roundTypeId: 'prompt', imposterIds: ['p1'] };
  assert.equal(applyGrillRoundDataToRound(round, { guessWinnerId: 'p1' }, PLAYERS), round);
});

test('applyGrillRoundDataToRound sanitizes adjustments, disqualifications and the guess winner', () => {
  const round = { roundTypeId: 'grill', grillData: { transcript: [] } };
  const updated = applyGrillRoundDataToRound(
    round,
    {
      scoreAdjustmentsByPlayerId: {
        p1: 2,
        p2: 0, // zero -> dropped
        ghost: 3, // unknown player -> dropped
        p3: 'oops', // NaN -> dropped
      },
      disqualifiedPlayerIds: ['p4', 'ghost', '', null],
      guessWinnerId: 'ghost',
      endedByCorrectGuess: 1,
    },
    PLAYERS,
  );
  assert.deepEqual(updated.grillData.scoreAdjustmentsByPlayerId, { p1: 2 });
  assert.deepEqual(updated.grillData.disqualifiedPlayerIds, ['p4']);
  assert.equal(updated.grillData.guessWinnerId, '');
  assert.equal(updated.grillData.endedByCorrectGuess, true);
});

const PARITY_SCENARIOS = [
  {
    name: 'caught prompt liar',
    round: PROMPT_ROUND,
    votes: { p1: 'p2', p3: 'p2', p4: 'p2', p2: 'p1' },
  },
  {
    name: 'escaped prompt liar',
    round: PROMPT_ROUND,
    votes: { p1: 'p3', p3: 'p1', p4: 'p3', p2: 'p4' },
  },
  {
    name: 'tied vote',
    round: PROMPT_ROUND,
    votes: { p1: 'p2', p4: 'p3', p2: 'p3', p3: 'p2' },
  },
  {
    name: 'dirty votes',
    round: PROMPT_ROUND,
    votes: { p1: 'p1', ghost: 'p2', p3: 'ghost', p4: 'p2' },
  },
  {
    name: 'two liars',
    round: { roundTypeId: 'prompt', imposterIds: ['p2', 'p3'] },
    votes: { p1: 'p2', p4: 'p3', p2: 'p1', p3: 'p1' },
  },
  {
    name: 'grill caught with adjustments',
    round: {
      roundTypeId: 'grill',
      imposterIds: ['p2'],
      grillData: { scoreAdjustmentsByPlayerId: { p3: 2, p4: -1 }, guessWinnerId: 'p3' },
    },
    votes: { p1: 'p2', p3: 'p2', p4: 'p2', p2: 'p1' },
  },
  {
    name: 'grill escaped with penalty',
    round: {
      roundTypeId: 'grill',
      imposterIds: ['p2'],
      grillData: { scoreAdjustmentsByPlayerId: { p1: -5 }, guessWinnerId: '' },
    },
    votes: { p1: 'p3', p3: 'p1', p4: 'p1', p2: 'p3' },
  },
  {
    name: 'no votes at all',
    round: PROMPT_ROUND,
    votes: {},
  },
];

test('PARITY: extracted scoring matches the legacy App.jsx implementation', () => {
  for (const scenario of PARITY_SCENARIOS) {
    const actual = calculateRoundResolutionLocal(PLAYERS, scenario.round, scenario.votes);
    const expected = legacyCalculateRoundResolutionLocal(PLAYERS, scenario.round, scenario.votes);
    assert.deepEqual(actual, expected, `scoring parity failed: ${scenario.name}`);
  }
});

test('PARITY: extracted applyGrillRoundDataToRound matches the legacy implementation', () => {
  const round = { roundTypeId: 'grill', grillData: { transcript: ['x'] } };
  const grillData = {
    scoreAdjustmentsByPlayerId: { p1: 2, p2: 0, ghost: 3 },
    disqualifiedPlayerIds: ['p4', 'ghost'],
    guessWinnerId: 'p3',
    endedByCorrectGuess: true,
  };
  assert.deepEqual(
    applyGrillRoundDataToRound(round, grillData, PLAYERS),
    legacyApplyGrillRoundDataToRound(round, grillData, PLAYERS),
  );
  const nonGrill = { roundTypeId: 'prompt' };
  assert.deepEqual(
    applyGrillRoundDataToRound(nonGrill, grillData, PLAYERS),
    legacyApplyGrillRoundDataToRound(nonGrill, grillData, PLAYERS),
  );
});

// Drift detector between the client scoring rules and the server-authoritative
// implementation (scoreRoundServer). They intentionally share semantics for
// non-grill rounds: vote hit = +1, escaped liar = +2. Grill scoring is known
// to exist client-side only, so parity is asserted for non-grill rounds.
test('PARITY: client and server scoring agree on non-grill rounds', () => {
  const scenarios = PARITY_SCENARIOS.filter(
    (scenario) => scenario.round.roundTypeId !== 'grill',
  );
  for (const scenario of scenarios) {
    const client = calculateRoundResolutionLocal(PLAYERS, scenario.round, scenario.votes);
    // The server validates votes at submission time, so feed it the
    // client-normalized votes (the shared input shape after validation).
    const server = scoreRoundServer(PLAYERS, scenario.round, client.normalizedVotes);
    assert.deepEqual(server.tally, client.tally, `tally drift: ${scenario.name}`);
    assert.equal(
      server.imposterCaught,
      client.imposterCaught,
      `imposterCaught drift: ${scenario.name}`,
    );
    assert.deepEqual(server.roundGains, client.roundGains, `gains drift: ${scenario.name}`);
    assert.deepEqual(
      server.nextPlayers.map((player) => ({ id: player.id, score: player.score })),
      client.nextPlayers.map((player) => ({ id: player.id, score: player.score })),
      `score drift: ${scenario.name}`,
    );
  }
});
