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
  getPerCategoryPoolCountsReport,
  assertTwoTruthsPoolsMeetBenchmark,
} from '../../src/lib/categoryPerRoundPoolCounts.js';

const promptByCategoryId = Object.fromEntries(
  DEFAULT_CATEGORIES.map((category) => [category.id, category.prompts || []]),
);

const report = getPerCategoryPoolCountsReport(DEFAULT_CATEGORIES, {
  promptByCategoryId,
  chainByCategoryId: CHAIN_REACTION_ROUNDS,
  offtopicByCategoryId: OFFTOPIC_DEFENSE_ROUNDS,
  noiseByCategoryId: SOUND_OFF_ROUNDS,
  memeByCategoryId: MEME_DECODER_ROUNDS,
  twoTruthsByCategoryId: TWO_TRUTHS_ONE_FIRE_ROUNDS,
});

test('every category Two Truths pool is at least as large as other per-category mode pools', () => {
  const failures = assertTwoTruthsPoolsMeetBenchmark(report);
  if (failures.length) {
    const detail = failures
      .slice(0, 5)
      .map(
        (f) =>
          `${f.categoryId}: twotruths=${f.twotruths}, need>=${f.benchmarkPoolSize}`,
      )
      .join('; ');
    assert.fail(
      `${failures.length} categories below benchmark (first: ${detail})`,
    );
  }
  assert.equal(failures.length, 0);
});

test('Two Truths pools match the per-category benchmark size with unique mains', () => {
  for (const row of report) {
    const pool = TWO_TRUTHS_ONE_FIRE_ROUNDS[row.categoryId] || [];
    assert.equal(
      pool.length,
      row.benchmarkPoolSize,
      `expected ${row.benchmarkPoolSize} prompts for ${row.categoryId}`,
    );
    const mains = new Set(pool.map((entry) => entry.main));
    assert.equal(
      mains.size,
      pool.length,
      `duplicate mains in Two Truths pool for ${row.categoryId}`,
    );
  }
});

test('per-category pool count report (for documentation)', () => {
  const lines = report.map((row) => {
    const c = row.counts;
    return `${row.categoryId}: prompt=${c.prompt} chain=${c.chain} offtopic=${c.offtopic} noise=${c.noise} meme=${c.meme} twotruths=${c.twotruths} benchmark=${row.benchmarkPoolSize}`;
  });
  // Printed on failure or verbose runs; keeps counts discoverable in CI logs.
  assert.ok(lines.length === DEFAULT_CATEGORIES.length);
  if (process.env.POF_LOG_POOL_COUNTS === '1') {
    console.log(lines.join('\n'));
  }
});
