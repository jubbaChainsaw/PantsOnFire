import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES, TWO_TRUTHS_ONE_FIRE_ROUNDS } from '../../src/data/categories.js';
import {
  validateTwoTruthsPromptMain,
  buildTwoTruthsOneFireRoundsForCategory,
  findAmericanismsInTwoTruthsCopy,
  TWO_TRUTHS_AMERICANISM_RULES,
} from '../../src/data/twoTruthsOneFirePrompts.js';

const BAD_EXAMPLES = [
  'Name three all-time favorite underrated music that instantly date you',
  'Name three underrated overrated bands',
  'Pick three films you love',
  'Name three music that instantly date you',
  'Name three iconic music moments you grew up with',
];

test('validateTwoTruthsPromptMain rejects known bad patterns', () => {
  for (const main of BAD_EXAMPLES) {
    const err = validateTwoTruthsPromptMain(main);
    assert.ok(err, `expected rejection for: ${main}`);
  }
});

test('validateTwoTruthsPromptMain accepts clean Name three prompts', () => {
  const good = [
    'Name three bands that instantly date you',
    'Name three comfort foods you would put on a meme starter kit',
    'Name three Eurovision staging gimmicks from your childhood',
  ];
  for (const main of good) {
    assert.equal(validateTwoTruthsPromptMain(main), null, main);
  }
});

test('findAmericanismsInTwoTruthsCopy flags common US spellings and terms', () => {
  const samples = [
    ['Name three favorite movies', ['favorite', 'movies']],
    ['Name three vacation spots', ['vacation']],
    ['Name three candies from childhood', ['candy']],
    ['Name three soccer teams', ['soccer']],
    ['Name three playoff moments', ['playoff']],
    ['Name three colour palettes', []],
  ];
  for (const [line, expected] of samples) {
    const hits = findAmericanismsInTwoTruthsCopy(line);
    for (const id of expected) {
      assert.ok(hits.includes(id), `${line} should hit ${id}, got ${hits}`);
    }
    if (!expected.length) {
      assert.equal(hits.length, 0, line);
    }
  }
  assert.ok(TWO_TRUTHS_AMERICANISM_RULES.length >= 15);
});

test('no Americanisms in generated Two Truths mains or preview labels', () => {
  const failures = [];
  for (const category of DEFAULT_CATEGORIES) {
    const pool = TWO_TRUTHS_ONE_FIRE_ROUNDS[category.id] || [];
    for (const entry of pool) {
      for (const field of [entry.main, entry.previewLabel]) {
        const hits = findAmericanismsInTwoTruthsCopy(field);
        if (hits.length) {
          failures.push(`${category.id}: ${field} (${hits.join(', ')})`);
        }
      }
    }
  }
  if (failures.length) {
    assert.fail(failures.slice(0, 10).join('\n'));
  }
});

test('every generated Two Truths main passes validation', () => {
  const failures = [];
  for (const category of DEFAULT_CATEGORIES) {
    const pool = TWO_TRUTHS_ONE_FIRE_ROUNDS[category.id] || [];
    for (const entry of pool) {
      const err = validateTwoTruthsPromptMain(entry.main);
      if (err) failures.push(`${category.id}: ${entry.main} (${err})`);
    }
  }
  if (failures.length) {
    assert.fail(failures.slice(0, 8).join('\n'));
  }
});

test('freshly built category pools pass validation', () => {
  for (const category of DEFAULT_CATEGORIES.slice(0, 5)) {
    const pool = buildTwoTruthsOneFireRoundsForCategory(category, 40, 10);
    for (const entry of pool) {
      assert.equal(validateTwoTruthsPromptMain(entry.main), null, entry.main);
    }
  }
});

test('print 20 random Two Truths prompt samples', () => {
  const allMains = [];
  for (const category of DEFAULT_CATEGORIES) {
    for (const entry of TWO_TRUTHS_ONE_FIRE_ROUNDS[category.id] || []) {
      allMains.push(`[${category.id}] ${entry.main}`);
    }
  }
  assert.ok(allMains.length > 100);
  const samples = [];
  for (let i = 0; i < 20; i += 1) {
    samples.push(allMains[Math.floor(Math.random() * allMains.length)]);
  }
  console.log('\n--- 20 random Two Truths prompts ---\n' + samples.join('\n') + '\n');
});
