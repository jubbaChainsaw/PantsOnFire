// E3 — Grill 'Em judging logic extracted verbatim from src/App.jsx.
// No React, no browser APIs, no content imports. Behaviour must remain
// identical to the original App.jsx implementation.

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

export function collectTagsFromText(text) {
  const normalized = String(text || "").toLowerCase();
  const tags = new Set();
  Object.entries(GRILL_TAG_KEYWORDS).forEach(([tag, keywords]) => {
    if (keywords.some((keyword) => normalized.includes(keyword))) tags.add(tag);
  });
  return tags;
}
export function inferTargetTags(targetRaw = "", targetPrompt = "") {
  const tags = collectTagsFromText(`${targetRaw} ${targetPrompt}`);
  if (
    /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$/.test(String(targetRaw || "").trim())
  )
    tags.add("person");
  if (/^The\s+[A-Z]/.test(String(targetRaw || "").trim())) tags.add("band");
  return tags;
}
export function inferQuestionTags(question = "") {
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
export const GRILL_YES_VARIANTS = [
  "Yes.",
  "Yep.",
  "Absolutely yes.",
  "Correct.",
  "Spot on.",
];
export const GRILL_NO_VARIANTS = [
  "No.",
  "Nah.",
  "Nope.",
  "Negative.",
  "Not a chance.",
];
export const GRILL_MAYBE_VARIANTS = [
  "Possibly.",
  "Maybe.",
  "Could be.",
  "Not impossible.",
  "Hard maybe.",
];
export const GRILL_KIND_OF_VARIANTS = [
  "Kind of.",
  "Sort of.",
  "In a way.",
  "Depends how you see it.",
  "Close-ish.",
];
export const GRILL_NOT_APPLICABLE_VARIANTS = [
  "Not really applicable.",
  "Not the right angle.",
  "That does not map cleanly.",
  "Not quite relevant.",
];
export const GRILL_CHEAT_WARNING_VARIANTS = [
  "Cheeky cheat detected. Naughty naughty, good try... guess again.",
  "Sneaky move. I am not giving hints, so have another guess.",
  "Nice try, cheat. No hints from me. Guess again.",
];
export const GRILL_CHEAT_PENALTY_VARIANTS = [
  "You did it again, filthy cheat. Point deducted and you are disqualified for this round.",
  "Second sneaky request detected. You lose a point and you are out of this round.",
  "Naughty naughty... again. Minus one point, and you are disqualified this round.",
];
export const GRILL_CORRECT_GUESS_VARIANTS = [
  "Bingo. Correct guess.",
  "Yes. You got it exactly right.",
  "Spot on. That is the answer.",
];
export const GRILL_LIAR_CORRECT_GUESS_VARIANTS = [
  "Correct... but filthy cheat behavior from a liar. Minus one.",
  "You guessed it, liar. Sneaky and shameless. Minus one point.",
  "Right answer, wrong morals. Liar penalty applied: minus one.",
];

export function pickVariant(options = [], fallback = "") {
  if (!Array.isArray(options) || options.length === 0) return fallback;
  return options[Math.floor(Math.random() * options.length)] || fallback;
}

export function normalizeForGuess(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isHintOrAnswerRequest(question = "") {
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
