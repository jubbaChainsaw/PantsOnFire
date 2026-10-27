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

function categoriesAllowedForRoundType(categories, roundTypeId) {
  if (!Array.isArray(categories)) return [];
  const selectedType = String(roundTypeId || '');
  if (selectedType === 'noise' || selectedType === 'nameblame') return categories;
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
  const categoryOptions = shuffle(pool).slice(
    0,
    Math.min(CATEGORY_DRAW_COUNT, pool.length),
  );
  return { roundTypeOptions, categoryOptions };
}

export function pickRandomFromShown(categoryOptions) {
  if (!categoryOptions?.length) return null;
  return categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
}
