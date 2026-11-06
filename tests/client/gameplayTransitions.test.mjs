/**
 * ENHC0025 — targeted gameplay/scoring transition checks (pure logic, no DOM).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTwoTruthsRoundResolution,
  normalizeTwoTruthsVotes,
} from '../../src/lib/twoTruthsOneFire.js';

const players = [
  { id: 'a', name: 'A', score: 0 },
  { id: 'b', name: 'B', score: 0 },
  { id: 'c', name: 'C', score: 0 },
];

const round = {
  roundTypeId: 'twotruths',
  twoTruthsData: {
    presentationsByPlayerId: {
      a: { items: ['x', 'y', 'z'], lieIndex: 1, burnedOut: false },
      b: { items: ['p', 'q', 'r'], lieIndex: 0, burnedOut: false },
      c: { items: ['m', 'n', 'o'], lieIndex: 2, burnedOut: false },
    },
    submissionsByPlayerId: {},
  },
};

test('Two Truths: zero votes yields zero score delta', () => {
  const res = calculateTwoTruthsRoundResolution(players, round, {});
  for (const p of players) {
    assert.equal(res.roundGains[p.id], 0);
  }
});

test('Two Truths: partial vote matrix still scores available picks', () => {
  const votes = {
    b: { a: 1, c: 2 },
    c: { a: 1, b: 0 },
  };
  const res = calculateTwoTruthsRoundResolution(players, round, votes);
  assert.ok(typeof res.roundGains.a === 'number');
  assert.ok(typeof res.nextPlayers[0].score === 'number');
});

test('Two Truths: normalizeTwoTruthsVotes drops self-votes and invalid indices', () => {
  const raw = {
    a: { b: 1, c: 99, a: 0 },
    bogus: { b: 0 },
  };
  const norm = normalizeTwoTruthsVotes(raw, players);
  assert.equal(norm.bogus, undefined);
  assert.equal(norm.a?.a, undefined);
  assert.equal(norm.a?.b, 1);
  assert.equal(norm.a?.c, undefined);
});
