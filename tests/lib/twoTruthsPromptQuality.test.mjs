import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CATEGORIES,
  CHAIN_REACTION_ROUNDS,
  OFFTOPIC_DEFENSE_ROUNDS,
  SOUND_OFF_ROUNDS,
  MEME_DECODER_ROUNDS,
  TWO_TRUTHS_ONE_FIRE_ROUNDS,
} from '../../src/data/categories.js';
import {
  validateTwoTruthsPromptMain,
  buildTwoTruthsOneFireRoundsForCategory,
  findAmericanismsInTwoTruthsCopy,
  buildTwoTruthsCuratedShortfallReport,
  getCuratedMainsForCategory,
  TWO_TRUTHS_AMERICANISM_RULES,
} from '../../src/data/twoTruthsOneFirePrompts.js';
import { getPerCategoryPoolCountsReport } from '../../src/lib/categoryPerRoundPoolCounts.js';

function benchmarkFor(category) {
  const id = category.id;
  return Math.max(
    (category.prompts || []).length,
    (CHAIN_REACTION_ROUNDS[id] || []).length,
    (OFFTOPIC_DEFENSE_ROUNDS[id] || []).length,
    (SOUND_OFF_ROUNDS[id] || []).length,
    (MEME_DECODER_ROUNDS[id] || []).length,
  );
}

const BAD_EXAMPLES = [
  'Name three comedians from a festival after dark',
  'Name three cities you would not put in the family group chat',
  'Name three superheroes that are chaotic',
  'Name three films that scream this category',
  'Name three roommate arguments',
];

test('validateTwoTruthsPromptMain rejects template-glued and bad patterns', () => {
  for (const main of BAD_EXAMPLES) {
    const err = validateTwoTruthsPromptMain(main);
    assert.ok(err, `expected rejection for: ${main}`);
  }
});

test('validateTwoTruthsPromptMain accepts plain curated-style prompts', () => {
  const good = [
    'Name three martial arts',
    'Name three F1 world champions',
    'Name three Beatles songs',
    'Name three Bond actors',
    "Name three things you'd find in a full English breakfast",
    'Name three films you have seen at the cinema this year',
  ];
  for (const main of good) {
    assert.equal(validateTwoTruthsPromptMain(main), null, main);
  }
});

test('findAmericanismsInTwoTruthsCopy flags common US spellings and terms', () => {
  const samples = [
    ['Name three favorite bands', ['favorite']],
    ['Name three vacation spots', ['vacation']],
    ['Name three roommate rows', ['roommate']],
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

test('no Two Truths main uses “this category” or template tails', () => {
  for (const category of DEFAULT_CATEGORIES) {
    for (const entry of TWO_TRUTHS_ONE_FIRE_ROUNDS[category.id] || []) {
      assert.ok(
        !/\bthis category\b/i.test(entry.main),
        `${category.id}: ${entry.main}`,
      );
      assert.equal(
        validateTwoTruthsPromptMain(entry.main),
        null,
        `${category.id}: ${entry.main}`,
      );
    }
  }
});

test('curated shortfalls are zero (pool meets per-category benchmark)', () => {
  const shortfalls = buildTwoTruthsCuratedShortfallReport(
    DEFAULT_CATEGORIES,
    benchmarkFor,
  ).filter((row) => row.shortfall > 0);
  if (shortfalls.length) {
    const detail = shortfalls
      .map((r) => `${r.categoryId}: need ${r.target}, have ${r.available}`)
      .join('\n');
    assert.fail(`curated banks below benchmark:\n${detail}`);
  }
});

test('every generated Two Truths main passes validation and pools are unique', () => {
  const failures = [];
  for (const category of DEFAULT_CATEGORIES) {
    const pool = TWO_TRUTHS_ONE_FIRE_ROUNDS[category.id] || [];
    const mains = new Set();
    for (const entry of pool) {
      const err = validateTwoTruthsPromptMain(entry.main);
      if (err) failures.push(`${category.id}: ${entry.main} (${err})`);
      if (mains.has(entry.main)) {
        failures.push(`${category.id}: duplicate ${entry.main}`);
      }
      mains.add(entry.main);
    }
  }
  if (failures.length) {
    assert.fail(failures.slice(0, 10).join('\n'));
  }
});

test('Two Truths pools match benchmark size', () => {
  const report = getPerCategoryPoolCountsReport(DEFAULT_CATEGORIES, {
    promptByCategoryId: Object.fromEntries(
      DEFAULT_CATEGORIES.map((c) => [c.id, c.prompts || []]),
    ),
    chainByCategoryId: CHAIN_REACTION_ROUNDS,
    offtopicByCategoryId: OFFTOPIC_DEFENSE_ROUNDS,
    noiseByCategoryId: SOUND_OFF_ROUNDS,
    memeByCategoryId: MEME_DECODER_ROUNDS,
    twoTruthsByCategoryId: TWO_TRUTHS_ONE_FIRE_ROUNDS,
  });
  for (const row of report) {
    const pool = TWO_TRUTHS_ONE_FIRE_ROUNDS[row.categoryId] || [];
    assert.equal(
      pool.length,
      row.benchmarkPoolSize,
      `expected ${row.benchmarkPoolSize} for ${row.categoryId}, got ${pool.length}`,
    );
  }
});

test('freshly built category pools pass validation', () => {
  for (const category of DEFAULT_CATEGORIES.slice(0, 5)) {
    const target = benchmarkFor(category);
    const pool = buildTwoTruthsOneFireRoundsForCategory(category, target, 0);
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

test('curated banks expose enough plain mains per category', () => {
  for (const category of DEFAULT_CATEGORIES) {
    const mains = getCuratedMainsForCategory(category.id);
    assert.ok(mains.length >= 40, `${category.id} only ${mains.length} curated mains`);
    assert.ok(
      mains.every((m) => m.startsWith('Name three ')),
      `${category.id} non-standard main`,
    );
  }
});
