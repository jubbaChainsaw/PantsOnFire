import test from 'node:test';
import assert from 'node:assert/strict';
import { drawTurnOptions } from '../../src/lib/turnDraw.js';

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

test('100 draws always satisfy turn draw rules', () => {
  for (let i = 0; i < 100; i += 1) {
    const { roundTypeOptions, categoryOptions } = drawTurnOptions(fakeCategories);
    assert.ok(roundTypeOptions.length <= 2 && roundTypeOptions.length >= 1);
    assert.equal(categoryOptions.length, 6);
    assert.ok(!roundTypeOptions.some((r) => r.id === 'grill'));
  }
});
