import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPresentationsFromSubmissions,
  calculateTwoTruthsRoundResolution,
  handleTwoTruthsTimeout,
  shuffleLiePresentation,
} from '../../src/lib/twoTruthsOneFire.js';

test('shuffleLiePresentation permutes items and tracks lie index', () => {
  const seenOrders = new Set();
  for (let i = 0; i < 40; i += 1) {
    const { items, lieIndex } = shuffleLiePresentation(['A', 'B', 'C'], 1);
    assert.deepEqual([...items].sort(), ['A', 'B', 'C']);
    assert.equal(items[lieIndex], 'B');
    seenOrders.add(items.join('|'));
  }
  assert.ok(seenOrders.size > 1, 'expected multiple shuffle permutations');
});

test('handleTwoTruthsTimeout auto-marks lie when three items filled', () => {
  const result = handleTwoTruthsTimeout({
    items: ['one', 'two', 'three'],
    lieIndex: null,
    randomLieIndex: () => 2,
  });
  assert.equal(result.action, 'auto-submit');
  assert.deepEqual(result.submission.items, ['one', 'two', 'three']);
  assert.equal(result.submission.lieIndex, 2);
});

test('handleTwoTruthsTimeout burns out incomplete entries', () => {
  const result = handleTwoTruthsTimeout({
    items: ['only one', '', ''],
    lieIndex: 0,
  });
  assert.equal(result.action, 'burn-out');
  assert.equal(result.submission.burnedOut, true);
});

test('calculateTwoTruthsRoundResolution scores voters and authors', () => {
  const players = [
    { id: 'a', name: 'A', score: 0 },
    { id: 'b', name: 'B', score: 0 },
    { id: 'c', name: 'C', score: 0 },
  ];
  const round = {
    roundTypeId: 'twotruths',
    twoTruthsData: {
      submissionsByPlayerId: {
        a: { items: ['t1', 't2', 'lie'], lieIndex: 2, burnedOut: false },
        b: { items: ['x', 'y', 'z'], lieIndex: 0, burnedOut: false },
        c: { items: ['p', 'q', 'r'], lieIndex: 1, burnedOut: false },
      },
      presentationsByPlayerId: buildPresentationsFromSubmissions({
        a: { items: ['t1', 't2', 'lie'], lieIndex: 2, burnedOut: false },
        b: { items: ['lie', 'y', 'z'], lieIndex: 0, burnedOut: false },
        c: { items: ['p', 'lie', 'r'], lieIndex: 1, burnedOut: false },
      }),
    },
  };
  const votes = {
    b: { a: 2, c: 1 },
    c: { a: 2, b: 0 },
    a: { b: 0, c: 1 },
  };
  const resolution = calculateTwoTruthsRoundResolution(players, round, votes);
  assert.equal(resolution.roundGains.b >= 1, true);
  assert.equal(resolution.roundGains.a >= 1, true);
});
