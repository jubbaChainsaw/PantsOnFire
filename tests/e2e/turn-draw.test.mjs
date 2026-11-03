import test from 'node:test';
import assert from 'node:assert/strict';
import {
  drawTurnOptions,
  getPlayerSelectableRoundTypes,
  pickRandomFromShown,
} from '../../src/lib/turnDraw.js';

const fakeCategories = [
  { id: 'movies', name: 'Movies' },
  { id: 'music', name: 'Music' },
  { id: 'games', name: 'Games' },
  { id: 'sports', name: 'Sports' },
  { id: 'food', name: 'Food' },
  { id: 'tv', name: 'TV' },
  { id: 'books', name: 'Books' },
  { id: 'weird', name: 'Weird' },
];

test('drawTurnOptions returns at most 2 round types and 6 categories', () => {
  const { roundTypeOptions, categoryOptions } = drawTurnOptions(fakeCategories);
  assert.ok(roundTypeOptions.length <= 2);
  assert.ok(categoryOptions.length <= 6);
  assert.ok(roundTypeOptions.length >= 1);
  assert.ok(categoryOptions.length >= 1);
});

test('grill is never offered in player round type draw', () => {
  for (let i = 0; i < 30; i += 1) {
    const { roundTypeOptions } = drawTurnOptions(fakeCategories);
    assert.ok(!roundTypeOptions.some((t) => t.id === 'grill'));
  }
});

test('getPlayerSelectableRoundTypes excludes grill', () => {
  const types = getPlayerSelectableRoundTypes(fakeCategories);
  assert.ok(!types.some((t) => t.id === 'grill'));
});

test('pickRandomFromShown only picks from provided list', () => {
  const shown = fakeCategories.slice(0, 6);
  for (let i = 0; i < 20; i += 1) {
    const pick = pickRandomFromShown(shown);
    assert.ok(shown.some((c) => c.id === pick.id));
  }
});
