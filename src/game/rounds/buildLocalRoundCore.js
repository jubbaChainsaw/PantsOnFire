// E1 — local round generation extracted verbatim from src/App.jsx.
//
// The original `buildLocalRound` read its prompt pools and banned-word helpers
// from `src/data/categories.js` module imports. That data module uses
// extensionless relative imports throughout, which only Vite resolves, so it
// cannot be loaded by the dependency-free `node --test` runner.
//
// To keep the round-generation algorithm testable without changing behaviour,
// the content data is passed in as `categoryData` (a seam, not a rewrite): the
// function body below is byte-for-byte identical to the original, with the only
// change being that the nine content identifiers are destructured from
// `categoryData` instead of being module-level imports. The production wrapper
// in `./buildLocalRound.js` supplies the real `categories.js` exports, so the
// app's runtime behaviour is unchanged.
import { ROUND_TYPES, PASS_THE_PHONE_ROUND_TYPES } from '../../data/roundTypes.js';
import {
  applyPicturePackSelection,
  assignChainCardForPlayer,
  getGrillQuestionsPerPlayer,
  pickRandom,
  shuffle,
  usesNoCategorySelection,
} from './roundSelection.js';

export function buildLocalRoundWithData(
  categoryData,
  players,
  category,
  roundNumber,
  liarCount = 1,
  recentPromptKeys = [],
  selectedRoundTypeId = null,
  grillSettings = { micEnabled: true, ttsEnabled: true },
  adultMode = false,
  picturePackConfig = {
    enabledPacks: {},
    weights: {},
    enabledReleaseChannels: {},
    releaseChannelsByPackId: {},
  },
) {
  const {
    CHAIN_REACTION_ROUNDS,
    NAME_AND_BLAME_ROUNDS,
    SOUND_CLUES_ROUNDS,
    OFFTOPIC_DEFENSE_ROUNDS,
    OPINION_ROUNDS,
    MEDIA_ROUNDS,
    GRILL_EM_ROUNDS,
    BANNED_WORD_BANK,
    sanitizeBannedWords,
  } = categoryData;
  const selectedRoundType = selectedRoundTypeId
    ? ROUND_TYPES[selectedRoundTypeId]
    : pickRandom(PASS_THE_PHONE_ROUND_TYPES);
  const effectiveCategory = usesNoCategorySelection(selectedRoundType?.id)
    ? {
        id: "global",
        name: selectedRoundType?.name || "Global",
        emoji: "🎯",
      }
    : category;
  let promptOptions = [];

  if (selectedRoundType.id === "prompt") {
    promptOptions = (effectiveCategory.prompts || []).map((prompt, index) => ({
      prompt,
      key: `prompt::${effectiveCategory.id}::${index}`,
    }));
  } else if (selectedRoundType.id === "chain") {
    promptOptions = (CHAIN_REACTION_ROUNDS[effectiveCategory.id] || []).map(
      (prompt, index) => ({
        prompt,
        key: `chain::${effectiveCategory.id}::${index}`,
      }),
    );
  } else if (selectedRoundType.id === "nameblame") {
    promptOptions = NAME_AND_BLAME_ROUNDS.map((prompt, index) => ({
      prompt,
      key: `nameblame::global::${index}`,
    }));
  } else if (selectedRoundType.id === "noise") {
    promptOptions = SOUND_CLUES_ROUNDS.map((prompt, index) => ({
      prompt,
      key: `noise::global::${index}`,
    }));
  } else if (selectedRoundType.id === "offtopic") {
    promptOptions = (OFFTOPIC_DEFENSE_ROUNDS[effectiveCategory.id] || []).map(
      (prompt, index) => ({
        prompt,
        key: `offtopic::${effectiveCategory.id}::${index}`,
      }),
    );
  } else if (selectedRoundType.id === "opinion") {
    promptOptions = OPINION_ROUNDS.map((prompt, index) => ({
      prompt,
      key: `opinion::global::${index}`,
    }));
  } else if (selectedRoundType.id === "grill") {
    promptOptions = GRILL_EM_ROUNDS.map((prompt, index) => ({
      prompt,
      key: `grill::global::${index}`,
    }));
  } else {
    promptOptions = (MEDIA_ROUNDS[selectedRoundType.id] || []).map(
      (prompt, index) => ({
        prompt,
        key: `${selectedRoundType.id}::global::${index}`,
      }),
    );
  }
  promptOptions = applyPicturePackSelection(
    promptOptions,
    selectedRoundType.id,
    picturePackConfig.enabledPacks,
    picturePackConfig.weights,
    picturePackConfig.enabledReleaseChannels,
    picturePackConfig.releaseChannelsByPackId,
  );

  const ageFilteredOptions = adultMode
    ? promptOptions
    : promptOptions.filter((item) => !item.prompt?.adultOnly);
  if (!ageFilteredOptions.length) return null;
  const filteredOptions = ageFilteredOptions.filter(
    (item) => !recentPromptKeys.includes(item.key),
  );
  const selected = pickRandom(
    filteredOptions.length ? filteredOptions : ageFilteredOptions,
  );
  const liarIds = shuffle(players)
    .slice(0, Math.max(1, Math.min(liarCount, players.length - 1)))
    .map((p) => p.id);
  const bannedWords = sanitizeBannedWords(
    effectiveCategory.name,
    selected.prompt.hint,
    selected.prompt.main,
    selected.prompt.imposter,
    BANNED_WORD_BANK[selected.key] || [],
  );
  const truthDeck = shuffle(selected.prompt.mainWords || []);
  const liarDeck = shuffle(selected.prompt.imposterWords || []);
  let truthCursor = 0;
  let liarCursor = 0;
  const mediaByPlayerId =
    selectedRoundType.id === "picture"
      ? Object.fromEntries(
          players.map((player) => [
            player.id,
            liarIds.includes(player.id)
              ? selected.prompt.imposterImageSrc || null
              : selected.prompt.mainImageSrc || null,
          ]),
        )
      : {};

  return {
    roundNumber,
    roundTypeId: selectedRoundType.id,
    roundTypeName: selectedRoundType.name,
    roundTypeTagline: selectedRoundType.tagline,
    categoryId: effectiveCategory.id,
    categoryLabel: effectiveCategory.name,
    categoryEmoji: effectiveCategory.emoji,
    promptKey: selected.key,
    hint: selected.prompt.hint,
    commonPrompt: selected.prompt.main,
    imposterPrompt:
      selectedRoundType.id === "opinion" ? null : selected.prompt.imposter,
    aiPrompt: selected.prompt.aiPrompt || null,
    mediaPreviewLabel: selected.prompt.previewLabel || null,
    mediaPackId: selected.prompt.picturePackId || null,
    isAdultPrompt: Boolean(selected.prompt.adultOnly),
    bannedWords,
    mode: "classic",
    imposterIds: liarIds,
    chooserId: pickRandom(players).id,
    leaderId: pickRandom(players).id,
    grillData: {
      questionsPerPlayer: getGrillQuestionsPerPlayer(players.length),
      micEnabled: grillSettings.micEnabled ?? true,
      ttsEnabled: grillSettings.ttsEnabled ?? true,
      transcript: [],
      askedCounts: {},
      cheatStrikesByPlayerId: {},
      disqualifiedPlayerIds: [],
      scoreAdjustmentsByPlayerId: {},
      guessWinnerId: "",
      endedByCorrectGuess: false,
    },
    mediaByPlayerId,
    promptsByPlayerId: Object.fromEntries(
      players.map((player) => {
        if (selectedRoundType.id === "opinion")
          return [player.id, selected.prompt.main];
        if (selectedRoundType.id === "grill")
          return [
            player.id,
            liarIds.includes(player.id)
              ? selected.prompt.aiPrompt
              : "Interrogate the AI to discover the hidden prompt.",
          ];
        if (selectedRoundType.id === "chain") {
          if (liarIds.includes(player.id)) {
            const value = assignChainCardForPlayer(
              liarDeck,
              liarCursor,
              "Decoy link",
              selected.prompt.imposter,
            );
            liarCursor += 1;
            return [player.id, value];
          }
          const value = assignChainCardForPlayer(
            truthDeck,
            truthCursor,
            "Anchor link",
            selected.prompt.main,
          );
          truthCursor += 1;
          return [player.id, value];
        }
        return [
          player.id,
          liarIds.includes(player.id)
            ? selected.prompt.imposter
            : selected.prompt.main,
        ];
      }),
    ),
  };
}
