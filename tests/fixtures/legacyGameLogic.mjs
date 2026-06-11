// Frozen, verbatim copy of the pre-extraction App.jsx implementations of
// buildLocalRound, calculateRoundResolutionLocal, applyGrillRoundDataToRound,
// and the Grill 'Em judge — including their internal helpers. This is the
// baseline the parity tests compare the extracted modules against, to prove the
// E1/E2/E3 extraction did not change behaviour.
//
// buildLocalRound originally read its prompt pools / banned-word helpers from
// module imports; here they are injected via `categoryData` exactly as the
// extracted core does, so the two run on identical inputs. Everything else is
// copied character-for-character from the original source.

// --- helpers (verbatim) ---------------------------------------------------
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
function getGrillQuestionsPerPlayer(playerCount) {
  if (!playerCount || playerCount < 1) return 1;
  return Math.max(1, Math.round(20 / playerCount));
}
function assignChainCardForPlayer(deck, index, fallbackLabel, fallbackTopic) {
  if (!deck || !deck.length) return `${fallbackLabel}: ${fallbackTopic}`;
  return `${fallbackLabel}: ${deck[index % deck.length]}`;
}
function applyPicturePackSelection(
  promptOptions,
  selectedRoundTypeId,
  enabledPicturePacks,
  picturePackWeights,
  enabledPictureReleaseChannels,
  picturePackReleaseChannelsById,
) {
  if (selectedRoundTypeId !== "picture") return promptOptions;
  const enabled = promptOptions.filter((item) => {
    const packId = item.prompt?.picturePackId;
    const releaseChannel =
      picturePackReleaseChannelsById?.[packId] || "unknown";
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
const NO_CATEGORY_SELECTION_ROUND_TYPE_IDS = new Set(["noise", "nameblame"]);
function usesNoCategorySelection(roundTypeId = "") {
  return NO_CATEGORY_SELECTION_ROUND_TYPE_IDS.has(
    String(roundTypeId || "").trim(),
  );
}

// --- E1: buildLocalRound (verbatim body, data injected) -------------------
export function buildLocalRound(
  categoryData,
  ROUND_TYPES,
  PASS_THE_PHONE_ROUND_TYPES,
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

// --- E2: scoring (verbatim) -----------------------------------------------
export function calculateRoundResolutionLocal(players, round, votesByPlayerId = {}) {
  const validPlayerIds = new Set(players.map((player) => player.id));
  const normalizedVotes = Object.fromEntries(
    Object.entries(votesByPlayerId || {}).filter(([voterId, targetId]) => {
      if (!validPlayerIds.has(voterId)) return false;
      if (!targetId || !validPlayerIds.has(targetId)) return false;
      return voterId !== targetId;
    }),
  );
  const tally = {};
  Object.values(normalizedVotes).forEach((targetId) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });
  const liarIds = round?.imposterIds || [];
  const topVotes = Math.max(0, ...Object.values(tally));
  const caughtLiars = liarIds.filter(
    (id) => (tally[id] || 0) > 0 && (tally[id] || 0) === topVotes,
  );
  const imposterCaught =
    liarIds.length > 0 ? caughtLiars.length === liarIds.length : false;
  const isGrillRound = round?.roundTypeId === "grill";
  const grillData =
    round?.grillData && typeof round.grillData === "object"
      ? round.grillData
      : {};
  const grillScoreAdjustments =
    grillData?.scoreAdjustmentsByPlayerId &&
    typeof grillData.scoreAdjustmentsByPlayerId === "object"
      ? grillData.scoreAdjustmentsByPlayerId
      : {};
  const grillGuessWinnerId = String(grillData?.guessWinnerId || "").trim();
  const roundGains = {};
  const roundBreakdown = {};
  const nextPlayers = players.map((player) => {
    let gain = 0;
    let voteHit = 0;
    let liarSurvived = 0;
    let grillTeamBonus = 0;
    let grillLiarSwing = 0;
    let grillGuessBonus = 0;
    let grillCheatPenalty = 0;
    if (liarIds.includes(normalizedVotes[player.id])) {
      gain += 1;
      voteHit = 1;
    }
    if (liarIds.includes(player.id) && !imposterCaught) {
      gain += 2;
      liarSurvived = 2;
    }
    if (isGrillRound) {
      if (imposterCaught) {
        gain += 2;
        grillTeamBonus = 2;
      } else if (liarIds.includes(player.id)) {
        gain += 2;
        grillLiarSwing = 2;
      } else {
        gain -= 1;
        grillLiarSwing = -1;
      }
      const extraAdjustment = Number(grillScoreAdjustments[player.id] || 0);
      if (Number.isFinite(extraAdjustment) && extraAdjustment !== 0) {
        gain += extraAdjustment;
        if (player.id === grillGuessWinnerId) {
          grillGuessBonus = extraAdjustment;
        } else if (extraAdjustment < 0) {
          grillCheatPenalty += extraAdjustment;
        }
      }
    }
    roundGains[player.id] = gain;
    roundBreakdown[player.id] = {
      voteHit,
      liarSurvived,
      grillTeamBonus,
      grillLiarSwing,
      grillGuessBonus,
      grillCheatPenalty,
    };
    return {
      ...player,
      score: Math.max(0, Number(player.score || 0) + gain),
    };
  });
  return {
    normalizedVotes,
    tally,
    imposterCaught,
    roundGains,
    roundBreakdown,
    nextPlayers,
  };
}

export function applyGrillRoundDataToRound(round, grillData = {}, players = []) {
  if (!round || round.roundTypeId !== "grill") return round;
  const playerIds = new Set((players || []).map((player) => player.id));
  const normalizedGrillData =
    grillData && typeof grillData === "object" ? grillData : {};
  const scoreAdjustmentsByPlayerId =
    normalizedGrillData.scoreAdjustmentsByPlayerId &&
    typeof normalizedGrillData.scoreAdjustmentsByPlayerId === "object"
      ? normalizedGrillData.scoreAdjustmentsByPlayerId
      : {};
  const sanitizedAdjustments = Object.fromEntries(
    Object.entries(scoreAdjustmentsByPlayerId)
      .filter(([playerId, value]) => {
        if (!playerIds.has(playerId)) return false;
        const numeric = Number(value);
        return Number.isFinite(numeric) && numeric !== 0;
      })
      .map(([playerId, value]) => [playerId, Number(value)]),
  );
  const disqualifiedPlayerIds = Array.isArray(
    normalizedGrillData.disqualifiedPlayerIds,
  )
    ? normalizedGrillData.disqualifiedPlayerIds
        .map((value) => String(value || "").trim())
        .filter((value) => value && playerIds.has(value))
    : [];
  const guessWinnerId = String(normalizedGrillData.guessWinnerId || "").trim();
  const normalizedGuessWinnerId =
    guessWinnerId && playerIds.has(guessWinnerId) ? guessWinnerId : "";
  return {
    ...round,
    grillData: {
      ...(round.grillData || {}),
      ...normalizedGrillData,
      disqualifiedPlayerIds,
      scoreAdjustmentsByPlayerId: sanitizedAdjustments,
      guessWinnerId: normalizedGuessWinnerId,
      endedByCorrectGuess: Boolean(normalizedGrillData.endedByCorrectGuess),
    },
  };
}

// --- E3: Grill 'Em judge (verbatim) ---------------------------------------
const GRILL_TAG_KEYWORDS = {
  person: [
    "person",
    "human",
    "celebrity",
    "singer",
    "rapper",
    "actor",
    "actress",
    "footballer",
    "artist",
  ],
  band: ["band", "group", "musician", "song", "album"],
  location: [
    "location",
    "place",
    "city",
    "country",
    "town",
    "village",
    "capital",
    "region",
  ],
  landmark: [
    "landmark",
    "monument",
    "tower",
    "bridge",
    "museum",
    "opera",
    "castle",
    "statue",
  ],
  animal: ["animal", "mammal", "bird", "fish", "pet", "wild"],
  food: ["food", "drink", "meal", "snack", "dessert", "edible", "eat", "taste"],
  vehicle: [
    "vehicle",
    "car",
    "plane",
    "aircraft",
    "train",
    "bike",
    "motorcycle",
    "boat",
  ],
  movie: ["movie", "film", "series", "show", "tv"],
  object: ["object", "thing", "device", "tech", "gadget"],
};
const BRITISH_MALE_VOICE_NAME_HINTS = [
  "daniel",
  "george",
  "thomas",
  "oliver",
  "arthur",
  "gordon",
  "malcolm",
  "male",
  "uk english male",
];
const BRITISH_FEMALE_VOICE_NAME_HINTS = [
  "female",
  "susan",
  "hazel",
  "serena",
  "siri",
  "karen",
  "zira",
];
function collectTagsFromText(text) {
  const normalized = String(text || "").toLowerCase();
  const tags = new Set();
  Object.entries(GRILL_TAG_KEYWORDS).forEach(([tag, keywords]) => {
    if (keywords.some((keyword) => normalized.includes(keyword))) tags.add(tag);
  });
  return tags;
}
function inferTargetTags(targetRaw = "", targetPrompt = "") {
  const tags = collectTagsFromText(`${targetRaw} ${targetPrompt}`);
  if (
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$/.test(String(targetRaw || "").trim())
  )
    tags.add("person");
  if (/^The\s+[A-Z]/.test(String(targetRaw || "").trim())) tags.add("band");
  return tags;
}
function inferQuestionTags(question = "") {
  return collectTagsFromText(question);
}
export function pickBritishMaleVoice(voices = []) {
  const britishVoices = voices.filter((voice) =>
    /en-GB/i.test(voice?.lang || ""),
  );
  if (!britishVoices.length) return null;
  const lowerName = (voice) => String(voice?.name || "").toLowerCase();
  const explicitMale = britishVoices.find((voice) =>
    BRITISH_MALE_VOICE_NAME_HINTS.some((hint) =>
      lowerName(voice).includes(hint),
    ),
  );
  if (explicitMale) return explicitMale;
  const filtered = britishVoices.find(
    (voice) =>
      !BRITISH_FEMALE_VOICE_NAME_HINTS.some((hint) =>
        lowerName(voice).includes(hint),
      ),
  );
  return filtered || britishVoices[0];
}
const GRILL_YES_VARIANTS = [
  "Yes.",
  "Yep.",
  "Absolutely yes.",
  "Correct.",
  "Spot on.",
];
const GRILL_NO_VARIANTS = [
  "No.",
  "Nah.",
  "Nope.",
  "Negative.",
  "Not a chance.",
];
const GRILL_MAYBE_VARIANTS = [
  "Possibly.",
  "Maybe.",
  "Could be.",
  "Not impossible.",
  "Hard maybe.",
];
const GRILL_KIND_OF_VARIANTS = [
  "Kind of.",
  "Sort of.",
  "In a way.",
  "Depends how you see it.",
  "Close-ish.",
];
const GRILL_NOT_APPLICABLE_VARIANTS = [
  "Not really applicable.",
  "Not the right angle.",
  "That does not map cleanly.",
  "Not quite relevant.",
];
const GRILL_CHEAT_WARNING_VARIANTS = [
  "Cheeky cheat detected. Naughty naughty, good try... guess again.",
  "Sneaky move. I am not giving hints, so have another guess.",
  "Nice try, cheat. No hints from me. Guess again.",
];
function pickVariant(options = [], fallback = "") {
  if (!Array.isArray(options) || options.length === 0) return fallback;
  return options[Math.floor(Math.random() * options.length)] || fallback;
}
const GRILL_CORRECT_GUESS_VARIANTS = [
  "Bingo. Correct guess.",
  "Yes. You got it exactly right.",
  "Spot on. That is the answer.",
];
function normalizeForGuess(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function isHintOrAnswerRequest(question = "") {
  const asked = normalizeForGuess(question);
  if (!asked) return false;
  const hintPatterns = [
    /\b(hint|clue)\b/,
    /\b(answer|give the answer|tell me the answer|what is the answer)\b/,
    /\b(reveal it|say it|tell me what it is|what is it exactly)\b/,
  ];
  return hintPatterns.some((pattern) => pattern.test(asked));
}
export function evaluateGrillQuestion(question = "", round = {}) {
  const asked = normalizeForGuess(question);
  if (!asked) {
    return {
      answer: pickVariant(
        GRILL_NOT_APPLICABLE_VARIANTS,
        "Not really applicable.",
      ),
      isCorrectGuess: false,
      isCheatRequest: false,
    };
  }
  if (isHintOrAnswerRequest(asked)) {
    return {
      answer: pickVariant(
        GRILL_CHEAT_WARNING_VARIANTS,
        "No hints from me. Guess again.",
      ),
      isCorrectGuess: false,
      isCheatRequest: true,
    };
  }

  const targetRaw = String(round?.main || "").trim();
  const targetCore = targetRaw.includes(":")
    ? targetRaw.split(":").slice(1).join(":").trim()
    : targetRaw;
  const targetPrompt = String(round?.aiPrompt || "");
  const targetNormalized = normalizeForGuess(targetCore || targetRaw);
  const targetTokens = [
    ...new Set(
      targetNormalized.split(/\s+/).filter((token) => token.length >= 3),
    ),
  ];

  const hasGuessIntent =
    /\b(is it|is this|is that|could it be|my guess|answer is|it is|it s|its)\b/.test(
      asked,
    );
  const fullTargetMatch = targetNormalized && asked.includes(targetNormalized);
  const tokenGuessMatch =
    targetTokens.length > 1 &&
    targetTokens.every((token) => asked.includes(token));
  const isCorrectGuess = Boolean(
    fullTargetMatch || (hasGuessIntent && tokenGuessMatch),
  );
  if (isCorrectGuess) {
    return {
      answer: pickVariant(GRILL_CORRECT_GUESS_VARIANTS, "Correct."),
      isCorrectGuess: true,
      isCheatRequest: false,
    };
  }

  const targetTags = inferTargetTags(targetRaw, targetPrompt);
  const questionTags = inferQuestionTags(asked);
  const hasTaggedQuestion = questionTags.size > 0;
  const hasTagOverlap = [...questionTags].some((tag) => targetTags.has(tag));
  if (hasTaggedQuestion && hasTagOverlap) {
    return {
      answer: pickVariant(GRILL_YES_VARIANTS, "Yes."),
      isCorrectGuess: false,
      isCheatRequest: false,
    };
  }
  if (hasTaggedQuestion && !hasTagOverlap) {
    return {
      answer: pickVariant(GRILL_NO_VARIANTS, "No."),
      isCorrectGuess: false,
      isCheatRequest: false,
    };
  }
  if (/\b(is it|does it|can it|would it)\b/.test(asked)) {
    return {
      answer: pickVariant(GRILL_MAYBE_VARIANTS, "Possibly."),
      isCorrectGuess: false,
      isCheatRequest: false,
    };
  }
  if (/\b(where|when|which|who)\b/.test(asked)) {
    return {
      answer: pickVariant(GRILL_KIND_OF_VARIANTS, "Kind of."),
      isCorrectGuess: false,
      isCheatRequest: false,
    };
  }
  return {
    answer: pickVariant(
      GRILL_NOT_APPLICABLE_VARIANTS,
      "Not really applicable.",
    ),
    isCorrectGuess: false,
    isCheatRequest: false,
  };
}
