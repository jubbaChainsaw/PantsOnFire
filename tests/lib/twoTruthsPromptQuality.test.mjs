import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES, TWO_TRUTHS_ONE_FIRE_ROUNDS } from '../../src/data/categories.js';
import {
  validateTwoTruthsPromptMain,
  buildTwoTruthsOneFireRoundsForCategory,
  findAmericanismsInTwoTruthsCopy,
  detectTwoTruthsTopicRedundancy,
  getTwoTruthsTopicNounsForCategory,
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
    ['Name three martial arts', 'martial arts'],
    ['Name three comfort foods you would rate as the worst', 'comfort foods'],
    ['Name three bands you would rate as the best', 'bands'],
  ];
  for (const [main, topic] of good) {
    assert.equal(validateTwoTruthsPromptMain(main, { topic }), null, main);
  }
});

test('validateTwoTruthsPromptMain rejects placeholders, redundancy, and flatmate fixes', () => {
  assert.ok(
    validateTwoTruthsPromptMain('Name three films that scream this category'),
  );
  assert.ok(
    validateTwoTruthsPromptMain('Name three flatmate arguments', { topic: 'flatmate arguments' }) === null,
  );
  assert.ok(validateTwoTruthsPromptMain('Name three roommate arguments'));
  assert.ok(
    detectTwoTruthsTopicRedundancy(
      'childhood games',
      'Name three childhood games from your childhood',
    ),
  );
  assert.ok(
    validateTwoTruthsPromptMain('Name three childhood games from your childhood', {
      topic: 'childhood games',
    }),
  );
  assert.ok(
    validateTwoTruthsPromptMain('Name three bands you would pitch as a collab', {
      topic: 'bands',
    }),
  );
});

test('findAmericanismsInTwoTruthsCopy flags common US spellings and terms', () => {
  const samples = [
    ['Name three favorite movies', ['favorite', 'movies']],
    ['Name three vacation spots', ['vacation']],
    ['Name three candies from childhood', ['candy']],
    ['Name three soccer teams', ['soccer']],
    ['Name three playoff moments', ['playoff']],
    ['Name three roommate rows', ['roommate']],
    ['Name three music collabs', ['collab']],
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

test('no Two Truths main uses “this category”', () => {
  for (const category of DEFAULT_CATEGORIES) {
    for (const entry of TWO_TRUTHS_ONE_FIRE_ROUNDS[category.id] || []) {
      assert.ok(
        !/\bthis category\b/i.test(entry.main),
        `${category.id}: ${entry.main}`,
      );
    }
  }
});

test('every generated Two Truths main passes validation', () => {
  const failures = [];
  for (const category of DEFAULT_CATEGORIES) {
    const pool = TWO_TRUTHS_ONE_FIRE_ROUNDS[category.id] || [];
    const topics = getTwoTruthsTopicNounsForCategory(category);
    for (const entry of pool) {
      const topic = topics.find((t) => entry.main.startsWith(`Name three ${t}`));
      if (!topic) {
        failures.push(`${category.id}: could not resolve topic for ${entry.main}`);
        continue;
      }
      const err = validateTwoTruthsPromptMain(entry.main, { topic });
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
    const topics = getTwoTruthsTopicNounsForCategory(category);
    for (const entry of pool) {
      const topic = topics.find((t) => entry.main.startsWith(`Name three ${t}`));
      assert.ok(topic, entry.main);
      assert.equal(validateTwoTruthsPromptMain(entry.main, { topic }), null, entry.main);
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
