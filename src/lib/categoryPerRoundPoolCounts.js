/**
 * Per-category prompt pool sizes for modes that draw from category-scoped banks.
 * Global-only modes (nameblame, opinion, etc.) are excluded.
 */
export const PER_CATEGORY_CONTENT_ROUND_TYPES = [
  { id: 'prompt', label: 'Hot Seat (prompt)' },
  { id: 'chain', label: 'Chain Reaction' },
  { id: 'offtopic', label: 'Off Topic Defense' },
  { id: 'noise', label: 'Sound Off (per-category bank)' },
  { id: 'meme', label: 'Meme Decoder (data only)' },
  { id: 'twotruths', label: 'Two Truths, One Fire' },
];

export function getPerCategoryPoolCountsForCategory(categoryId, pools) {
  const id = String(categoryId || '').trim();
  const promptCount = pools.promptByCategoryId?.[id]?.length ?? 0;
  const chainCount = pools.chainByCategoryId?.[id]?.length ?? 0;
  const offtopicCount = pools.offtopicByCategoryId?.[id]?.length ?? 0;
  const noiseCount = pools.noiseByCategoryId?.[id]?.length ?? 0;
  const memeCount = pools.memeByCategoryId?.[id]?.length ?? 0;
  const twoTruthsCount = pools.twoTruthsByCategoryId?.[id]?.length ?? 0;

  const otherModeCounts = {
    prompt: promptCount,
    chain: chainCount,
    offtopic: offtopicCount,
    noise: noiseCount,
    meme: memeCount,
  };

  const benchmark = Math.max(0, ...Object.values(otherModeCounts));

  return {
    categoryId: id,
    counts: {
      ...otherModeCounts,
      twotruths: twoTruthsCount,
    },
    benchmarkPoolSize: benchmark,
  };
}

export function getPerCategoryPoolCountsReport(categories, pools) {
  return (categories || []).map((category) => ({
    categoryId: category.id,
    categoryName: category.name,
    ...getPerCategoryPoolCountsForCategory(category.id, pools),
  }));
}

export function assertTwoTruthsPoolsMeetBenchmark(report) {
  const failures = [];
  for (const row of report) {
    const { categoryId, counts, benchmarkPoolSize } = row;
    if (counts.twotruths < benchmarkPoolSize) {
      failures.push({
        categoryId,
        twotruths: counts.twotruths,
        benchmarkPoolSize,
        counts,
      });
    }
  }
  return failures;
}
