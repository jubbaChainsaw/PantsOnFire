import test from 'node:test';
import assert from 'node:assert/strict';
import {
  drawTurnOptions,
  drawCategoriesForRoundChoice,
  drawRandomCategorySubset,
  getCategoriesForRoundType,
} from '../../src/lib/turnDraw.js';
import { CATEGORY_DRAW_COUNT } from '../../src/data/uiNeonAssets.js';
import { EXCLUDED_PLAYER_ROUND_TYPE_IDS } from '../../src/data/uiNeonAssets.js';

const SAMPLE_CATEGORIES = [
  { id: 'movies', name: 'Movies' },
  { id: 'food', name: 'Food' },
  { id: 'animals', name: 'Animals' },
];

test('drawCategoriesForRoundChoice returns exactly six unique when pool is large enough', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({
    id: `cat-${i}`,
    name: `Category ${i}`,
  }));
  for (let i = 0; i < 50; i += 1) {
    const drawn = drawCategoriesForRoundChoice(many, 'chain');
    assert.equal(drawn.length, CATEGORY_DRAW_COUNT);
    assert.equal(new Set(drawn.map((c) => c.id)).size, CATEGORY_DRAW_COUNT);
  }
});

test('drawCategoriesForRoundChoice returns all when fewer than six eligible', () => {
  const few = SAMPLE_CATEGORIES;
  const drawn = drawCategoriesForRoundChoice(few, 'chain');
  assert.equal(drawn.length, few.length);
});

test('drawRandomCategorySubset fills to target after deduping duplicate ids in pool', () => {
  const pool = [
    { id: 'a', name: 'A' },
    { id: 'a', name: 'A dup' },
    { id: 'b', name: 'B' },
    { id: 'c', name: 'C' },
    { id: 'd', name: 'D' },
    { id: 'e', name: 'E' },
    { id: 'f', name: 'F' },
    { id: 'g', name: 'G' },
  ];
  const drawn = drawRandomCategorySubset(pool, 6);
  assert.equal(drawn.length, 6);
  assert.equal(new Set(drawn.map((c) => c.id)).size, 6);
});

test('getCategoriesForRoundType returns full sorted pool', () => {
  const many = Array.from({ length: 20 }, (_, i) => ({
    id: `cat-${i}`,
    name: `Category ${i}`,
  }));
  const full = getCategoriesForRoundType(many, 'chain');
  assert.equal(full.length, many.length);
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
