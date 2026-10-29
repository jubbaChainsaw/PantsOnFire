import {
  CATEGORY_DRAW_COUNT,
  EXCLUDED_PLAYER_ROUND_TYPE_IDS,
  ROUND_TYPE_DRAW_COUNT,
} from '../data/uiNeonAssets.js';
import { PASS_THE_PHONE_ROUND_TYPES } from '../data/roundTypes.js';

export function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function categoriesAllowedForRoundType(categories, roundTypeId) {
  if (!Array.isArray(categories)) return [];
  const selectedType = String(roundTypeId || '');
  if (selectedType === 'noise' || selectedType === 'nameblame' || selectedType === 'pairs') return categories;
  if (selectedType === 'picture') return categories;
  return categories.filter((category) => category?.id !== 'pic-mix');
}

function hasAllowedCategoriesForRoundType(categories, roundTypeId) {
  return categoriesAllowedForRoundType(categories, roundTypeId).length > 0;
}

export function getPlayerSelectableRoundTypes(
  categories,
  { excludeRoundTypeId = null } = {},
) {
  return PASS_THE_PHONE_ROUND_TYPES.filter(
    (roundType) => !EXCLUDED_PLAYER_ROUND_TYPE_IDS.has(roundType.id),
  )
    .filter((roundType) => roundType.id !== excludeRoundTypeId)
    .filter((roundType) =>
      hasAllowedCategoriesForRoundType(categories, roundType.id),
    );
}

function unionCategoriesForRoundTypes(categories, roundTypeIds) {
  const ids = roundTypeIds.length ? roundTypeIds : ['prompt'];
  const sets = ids.map((id) => categoriesAllowedForRoundType(categories, id));
  const byId = new Map();
  sets.forEach((list) => {
    list.forEach((cat) => {
      if (cat?.id) byId.set(cat.id, cat);
    });
  });
  return [...byId.values()];
}

export function drawTurnOptions(activeCategories, { excludeRoundTypeId = null } = {}) {
  const roundTypes = getPlayerSelectableRoundTypes(activeCategories, {
    excludeRoundTypeId,
  });
  const fallbackRoundTypes = roundTypes.length
    ? roundTypes
    : getPlayerSelectableRoundTypes(activeCategories);
  const shuffled = shuffle(fallbackRoundTypes);
  const roundTypeOptions = [];
  const seenRoundTypeIds = new Set();
  for (const roundType of shuffled) {
    const id = roundType?.id;
    if (!id || seenRoundTypeIds.has(id)) continue;
    if (EXCLUDED_PLAYER_ROUND_TYPE_IDS.has(id)) continue;
    seenRoundTypeIds.add(id);
    roundTypeOptions.push(roundType);
    if (roundTypeOptions.length >= ROUND_TYPE_DRAW_COUNT) break;
  }
  const roundTypeIds = roundTypeOptions.map((t) => t.id);
  const pool = unionCategoriesForRoundTypes(activeCategories, roundTypeIds);
  const categoryOptions = drawRandomCategorySubset(pool, CATEGORY_DRAW_COUNT);
  return { roundTypeOptions, categoryOptions };
}

function dedupeCategoriesById(categories) {
  const byId = new Map();
  for (const category of categories || []) {
    if (!category?.id || byId.has(category.id)) continue;
    byId.set(category.id, category);
  }
  return [...byId.values()];
}

/**
 * Up to `count` unique random categories from `pool`. Fills from the remainder if the
 * first shuffle pass yields fewer than `target` (e.g. duplicate ids in input).
 */
export function drawRandomCategorySubset(pool, count = CATEGORY_DRAW_COUNT) {
  const eligible = dedupeCategoriesById(pool);
  const target = Math.min(count, eligible.length);
  if (target === 0) return [];

  const shuffled = shuffle(eligible);
  const picked = [];
  const seen = new Set();
  for (const category of shuffled) {
    if (!category?.id || seen.has(category.id)) continue;
    seen.add(category.id);
    picked.push(category);
    if (picked.length >= target) break;
  }
  if (picked.length < target) {
    for (const category of eligible) {
      if (!category?.id || seen.has(category.id)) continue;
      seen.add(category.id);
      picked.push(category);
      if (picked.length >= target) break;
    }
  }
  return picked;
}

/** Six random eligible categories for the category choice screen (pof-enh-1). */
export function drawCategoriesForRoundChoice(activeCategories, roundTypeId) {
  return drawRandomCategorySubset(
    getCategoriesForRoundType(activeCategories, roundTypeId),
    CATEGORY_DRAW_COUNT,
  );
}

/** All enabled categories valid for a round type (sorted for stable UI). */
export function getCategoriesForRoundType(activeCategories, roundTypeId) {
  const pool = categoriesAllowedForRoundType(activeCategories, roundTypeId);
  return [...pool].sort((a, b) =>
    String(a?.name || '').localeCompare(String(b?.name || ''), 'en-GB'),
  );
}

export function pickRandomFromShown(categoryOptions) {
  if (!categoryOptions?.length) return null;
  return categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
}
