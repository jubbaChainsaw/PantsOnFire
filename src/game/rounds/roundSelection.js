// E1 — pure round-selection helpers extracted verbatim from src/App.jsx.
// No React, no browser APIs, no game-content imports beyond round-type metadata.
// Behaviour must remain identical to the original App.jsx implementation.
import { PASS_THE_PHONE_ROUND_TYPES } from '../../data/roundTypes.js';

export const NO_CATEGORY_SELECTION_ROUND_TYPE_IDS = new Set(['noise', 'nameblame']);

export function shuffle(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getGrillQuestionsPerPlayer(playerCount) {
  if (!playerCount || playerCount < 1) return 1;
  return Math.max(1, Math.round(20 / playerCount));
}

export function assignChainCardForPlayer(deck, index, fallbackLabel, fallbackTopic) {
  if (!deck || !deck.length) return `${fallbackLabel}: ${fallbackTopic}`;
  return `${fallbackLabel}: ${deck[index % deck.length]}`;
}

export function applyPicturePackSelection(
  promptOptions,
  selectedRoundTypeId,
  enabledPicturePacks,
  picturePackWeights,
  enabledPictureReleaseChannels,
  picturePackReleaseChannelsById,
) {
  if (selectedRoundTypeId !== 'picture') return promptOptions;
  const enabled = promptOptions.filter((item) => {
    const packId = item.prompt?.picturePackId;
    const releaseChannel =
      picturePackReleaseChannelsById?.[packId] || 'unknown';
    const channelEnabled =
      enabledPictureReleaseChannels?.[releaseChannel] !== false;
    return enabledPicturePacks[packId] !== false && channelEnabled;
  });
  const source = enabled.length ? enabled : promptOptions;
  const atLeastOnePositiveWeight = source.some((item) => {
    const packId = item.prompt?.picturePackId;
    const weight = Math.max(0, Number(picturePackWeights?.[packId] ?? 1));
    return weight > 0;
  });
  const weighted = source.flatMap((item) => {
    const packId = item.prompt?.picturePackId;
    const weight = Math.max(0, Number(picturePackWeights?.[packId] ?? 1));
    const copies = Math.min(
      8,
      atLeastOnePositiveWeight ? Math.round(weight) : 1,
    );
    if (copies <= 0) return [];
    return Array.from({ length: copies }, () => item);
  });
  return weighted.length ? weighted : source;
}

export function isPictureOnlyCategory(categoryId) {
  return categoryId === 'pic-mix';
}

export function usesNoCategorySelection(roundTypeId = '') {
  return NO_CATEGORY_SELECTION_ROUND_TYPE_IDS.has(
    String(roundTypeId || '').trim(),
  );
}

export function categoriesAllowedForRoundType(categories, roundTypeId) {
  if (!Array.isArray(categories)) return [];
  const selectedType = String(roundTypeId || '');
  if (usesNoCategorySelection(selectedType)) return categories;
  if (selectedType === 'picture') return categories;
  return categories.filter((category) => !isPictureOnlyCategory(category?.id));
}

export function hasAllowedCategoriesForRoundType(categories, roundTypeId) {
  return categoriesAllowedForRoundType(categories, roundTypeId).length > 0;
}

export function getCompatibleRoundTypes(
  categories,
  { excludeRoundTypeId = null } = {},
) {
  return PASS_THE_PHONE_ROUND_TYPES.filter(
    (roundType) => roundType.id !== excludeRoundTypeId,
  ).filter((roundType) =>
    hasAllowedCategoriesForRoundType(categories, roundType.id),
  );
}

export function pickCompatibleRoundTypeId(
  categories,
  { excludeRoundTypeId = null } = {},
) {
  const compatibleRoundTypes = getCompatibleRoundTypes(categories, {
    excludeRoundTypeId,
  });
  if (compatibleRoundTypes.length) return pickRandom(compatibleRoundTypes).id;
  const fallbackRoundType = pickRandom(PASS_THE_PHONE_ROUND_TYPES);
  return fallbackRoundType?.id || null;
}
