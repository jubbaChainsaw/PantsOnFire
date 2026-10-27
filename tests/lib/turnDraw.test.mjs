import test from 'node:test';
import assert from 'node:assert/strict';
import {
  drawTurnOptions,
  getCategoriesForRoundType,
} from '../../src/lib/turnDraw.js';
import { CATEGORY_DRAW_COUNT } from '../../src/data/uiNeonAssets.js';
import { EXCLUDED_PLAYER_ROUND_TYPE_IDS } from '../../src/data/uiNeonAssets.js';

const SAMPLE_CATEGORIES = [
  { id: 'movies', name: 'Movies' },
  { id: 'food', name: 'Food' },
  { id: 'animals', name: 'Animals' },
];

test('getCategoriesForRoundType returns full pool not drawTurnOptions sample size', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({
    id: `cat-${i}`,
    name: `Category ${i}`,
  }));
  const full = getCategoriesForRoundType(many, 'chain');
  const { categoryOptions } = drawTurnOptions(many);
  assert.equal(full.length, many.length);
  assert.ok(categoryOptions.length <= CATEGORY_DRAW_COUNT);
  assert.ok(full.length > categoryOptions.length);
});

test('drawTurnOptions returns two distinct round types excluding Hot Seat and Grill', () => {
  const { roundTypeOptions } = drawTurnOptions(SAMPLE_CATEGORIES);
  assert.equal(roundTypeOptions.length, 2);
  const ids = roundTypeOptions.map((type) => type.id);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids) {
    assert.equal(EXCLUDED_PLAYER_ROUND_TYPE_IDS.has(id), false);
  }
});
