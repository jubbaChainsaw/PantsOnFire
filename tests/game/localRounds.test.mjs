import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ROUND_TYPES,
  PASS_THE_PHONE_ROUND_TYPES,
} from '../../src/data/roundTypes.js';
import { buildLocalRoundWithData } from '../../src/game/rounds/buildLocalRoundCore.js';
import {
  applyPicturePackSelection,
  categoriesAllowedForRoundType,
  getCompatibleRoundTypes,
  getGrillQuestionsPerPlayer,
  hasAllowedCategoriesForRoundType,
  isPictureOnlyCategory,
  pickCompatibleRoundTypeId,
  usesNoCategorySelection,
} from '../../src/game/rounds/roundSelection.js';
import { buildLocalRound as legacyBuildLocalRound } from '../fixtures/legacyGameLogic.mjs';
import { withSeededRandom } from '../support/seededRandom.mjs';

// Synthetic content shared by the extracted code and the frozen legacy copy.
// Both call sanitizeBannedWords identically, so a simple deterministic
// implementation is sufficient for behaviour and parity checks.
function sanitizeBannedWords(categoryName, hint, main, imposter, words) {
  const forbidden = new Set(
    `${categoryName} ${hint} ${main} ${imposter}`
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean),
  );
  return (words || [])
    .filter((word) => !forbidden.has(String(word || '').toLowerCase()))
    .slice(0, 5);
}

const CATEGORY_DATA = {
  CHAIN_REACTION_ROUNDS: {
    sports: [
      {
        hint: 'Chain Hint',
        main: 'Football',
        imposter: 'Rugby',
        mainWords: ['goalpost', 'keeper', 'corner'],
        imposterWords: ['scrum', 'lineout'],
      },
    ],
  },
  NAME_AND_BLAME_ROUNDS: [
    { hint: 'Blame Hint', main: 'Most likely to nap', imposter: 'Most likely to snore' },
    { hint: 'Blame Hint 2', main: 'Most likely to sing', imposter: 'Most likely to dance' },
  ],
  SOUND_CLUES_ROUNDS: [
    { hint: 'Noise Hint', main: 'Cat', imposter: 'Dog' },
  ],
  OFFTOPIC_DEFENSE_ROUNDS: {
    sports: [
      { hint: 'Offtopic Hint', main: 'Defend pizza', imposter: 'Defend salad' },
    ],
  },
  OPINION_ROUNDS: [
    { hint: 'Opinion Hint', main: 'Pineapple belongs on pizza', imposter: 'unused-imposter' },
  ],
  MEDIA_ROUNDS: {
    picture: [
      {
        hint: 'Picture Hint',
        main: 'Lighthouse',
        imposter: 'Windmill',
        picturePackId: 'pack-a',
        mainImageSrc: '/img/main-a.png',
        imposterImageSrc: '/img/imposter-a.png',
      },
      {
        hint: 'Picture Hint B',
        main: 'Castle',
        imposter: 'Fort',
        picturePackId: 'pack-b',
        mainImageSrc: '/img/main-b.png',
        imposterImageSrc: '/img/imposter-b.png',
      },
    ],
    sound: [{ hint: 'Sound Hint', main: 'Thunder', imposter: 'Fireworks' }],
    video: [{ hint: 'Video Hint', main: 'Parkour', imposter: 'Gymnastics' }],
  },
  GRILL_EM_ROUNDS: [
    {
      hint: 'Grill Hint',
      main: 'Person: David Attenborough',
      imposter: 'unused',
      aiPrompt: 'A famous wildlife presenter',
    },
  ],
  BANNED_WORD_BANK: {
    'prompt::sports::0': ['stadium', 'referee', 'basketball'],
  },
  sanitizeBannedWords,
};

const SPORTS_CATEGORY = {
  id: 'sports',
  name: 'Sports',
  emoji: '🏅',
  prompts: [
    { hint: 'Sports Showdown', main: 'Basketball', imposter: 'Baseball' },
    { hint: 'Sports Showdown', main: 'Tennis', imposter: 'Badminton' },
  ],
};

const PLAYERS = [
  { id: 'p1', name: 'Ava' },
  { id: 'p2', name: 'Ben' },
  { id: 'p3', name: 'Cleo' },
  { id: 'p4', name: 'Dan' },
];

function buildRound(roundTypeId, overrides = {}) {
  const {
    players = PLAYERS,
    category = SPORTS_CATEGORY,
    roundNumber = 1,
    liarCount = 1,
    recentPromptKeys = [],
    grillSettings = { micEnabled: true, ttsEnabled: true },
    adultMode = false,
    picturePackConfig = {
      enabledPacks: {},
      weights: {},
      enabledReleaseChannels: {},
      releaseChannelsByPackId: {},
    },
    seed = 1234,
  } = overrides;
  return withSeededRandom(seed, () =>
    buildLocalRoundWithData(
      CATEGORY_DATA,
      players,
      category,
      roundNumber,
      liarCount,
      recentPromptKeys,
      roundTypeId,
      grillSettings,
      adultMode,
      picturePackConfig,
    ),
  );
}

const ALL_PTP_IDS = PASS_THE_PHONE_ROUND_TYPES.map((roundType) => roundType.id);

test('round types referenced by the test data exist in ROUND_TYPES', () => {
  for (const id of ALL_PTP_IDS) {
    assert.ok(ROUND_TYPES[id], `ROUND_TYPES missing ${id}`);
  }
});

test('buildLocalRound produces a valid round for every pass-the-phone round type', () => {
  for (const roundTypeId of ALL_PTP_IDS) {
    const round = buildRound(roundTypeId, { seed: 99 });
    assert.ok(round, `round null for ${roundTypeId}`);
    assert.equal(round.roundTypeId, roundTypeId);
    assert.equal(round.roundNumber, 1);
    assert.equal(round.imposterIds.length, 1, `expected 1 liar for ${roundTypeId}`);
    const liarId = round.imposterIds[0];
    assert.ok(PLAYERS.some((player) => player.id === liarId), 'liar must be a player');
    assert.equal(Object.keys(round.promptsByPlayerId).length, PLAYERS.length);
    for (const player of PLAYERS) {
      assert.ok(round.promptsByPlayerId[player.id], `prompt missing for ${player.id} in ${roundTypeId}`);
    }
  }
});

test('prompt rounds give the liar the imposter prompt and everyone else the main prompt', () => {
  const round = buildRound('prompt', { seed: 7 });
  const liarId = round.imposterIds[0];
  for (const player of PLAYERS) {
    const expected = player.id === liarId ? round.imposterPrompt : round.commonPrompt;
    assert.equal(round.promptsByPlayerId[player.id], expected);
  }
});

test('opinion rounds give everyone the same prompt and a null imposter prompt', () => {
  const round = buildRound('opinion', { seed: 7 });
  assert.equal(round.imposterPrompt, null);
  for (const player of PLAYERS) {
    assert.equal(round.promptsByPlayerId[player.id], round.commonPrompt);
  }
});

test('grill rounds give the liar the aiPrompt and others the interrogation instruction', () => {
  const round = buildRound('grill', { seed: 7 });
  const liarId = round.imposterIds[0];
  for (const player of PLAYERS) {
    if (player.id === liarId) {
      assert.equal(round.promptsByPlayerId[player.id], round.aiPrompt);
    } else {
      assert.equal(
        round.promptsByPlayerId[player.id],
        'Interrogate the AI to discover the hidden prompt.',
      );
    }
  }
  assert.equal(round.grillData.questionsPerPlayer, getGrillQuestionsPerPlayer(PLAYERS.length));
  assert.equal(round.grillData.micEnabled, true);
  assert.equal(round.grillData.endedByCorrectGuess, false);
});

test('chain rounds hand out anchor links to truth-tellers and decoy links to the liar', () => {
  const round = buildRound('chain', { seed: 7 });
  const liarId = round.imposterIds[0];
  for (const player of PLAYERS) {
    const card = round.promptsByPlayerId[player.id];
    if (player.id === liarId) {
      assert.match(card, /^Decoy link: /);
    } else {
      assert.match(card, /^Anchor link: /);
    }
  }
});

test('picture rounds assign per-player media with the imposter image for the liar', () => {
  const round = buildRound('picture', { seed: 7 });
  const liarId = round.imposterIds[0];
  for (const player of PLAYERS) {
    const src = round.mediaByPlayerId[player.id];
    assert.ok(src, 'every player gets an image');
    if (player.id === liarId) {
      assert.match(src, /imposter/);
    } else {
      assert.match(src, /main/);
    }
  }
});

test('non-picture rounds have empty mediaByPlayerId', () => {
  const round = buildRound('prompt', { seed: 7 });
  assert.deepEqual(round.mediaByPlayerId, {});
});

test('noise and nameblame ignore the provided category', () => {
  for (const roundTypeId of ['noise', 'nameblame']) {
    const round = buildRound(roundTypeId, { seed: 7 });
    assert.equal(round.categoryId, 'global');
    assert.ok(usesNoCategorySelection(roundTypeId));
  }
});

test('liar count is clamped to players.length - 1', () => {
  const round = buildRound('prompt', { liarCount: 10, seed: 7 });
  assert.equal(round.imposterIds.length, PLAYERS.length - 1);
  const uniqueLiars = new Set(round.imposterIds);
  assert.equal(uniqueLiars.size, round.imposterIds.length, 'liars must be distinct');
});

test('recent prompt keys are avoided when alternatives exist', () => {
  for (let seed = 1; seed <= 25; seed += 1) {
    const round = buildRound('prompt', {
      recentPromptKeys: ['prompt::sports::0'],
      seed,
    });
    assert.equal(round.promptKey, 'prompt::sports::1');
  }
});

test('when every prompt is recent the round still builds', () => {
  const round = buildRound('prompt', {
    recentPromptKeys: ['prompt::sports::0', 'prompt::sports::1'],
    seed: 7,
  });
  assert.ok(round);
  assert.match(round.promptKey, /^prompt::sports::/);
});

test('banned words come from the bank via sanitizeBannedWords', () => {
  for (let seed = 1; seed <= 25; seed += 1) {
    const round = buildRound('prompt', { recentPromptKeys: ['prompt::sports::1'], seed });
    assert.equal(round.promptKey, 'prompt::sports::0');
    assert.deepEqual(round.bannedWords, ['stadium', 'referee']);
  }
});

test('adult-only prompts are filtered out unless adultMode is on', () => {
  const adultData = {
    ...CATEGORY_DATA,
    OPINION_ROUNDS: [
      { hint: 'Family', main: 'Cats or dogs?', imposter: 'x' },
      { hint: 'Spicy', main: 'Adults only question', imposter: 'x', adultOnly: true },
    ],
  };
  for (let seed = 1; seed <= 30; seed += 1) {
    const round = withSeededRandom(seed, () =>
      buildLocalRoundWithData(adultData, PLAYERS, SPORTS_CATEGORY, 1, 1, [], 'opinion'),
    );
    assert.equal(round.isAdultPrompt, false, `seed ${seed} selected an adult prompt`);
  }
  const adultOnlyData = {
    ...CATEGORY_DATA,
    OPINION_ROUNDS: [
      { hint: 'Spicy', main: 'Adults only question', imposter: 'x', adultOnly: true },
    ],
  };
  const blocked = withSeededRandom(1, () =>
    buildLocalRoundWithData(adultOnlyData, PLAYERS, SPORTS_CATEGORY, 1, 1, [], 'opinion'),
  );
  assert.equal(blocked, null, 'all-adult pool with adultMode=false must yield null');
  const allowed = withSeededRandom(1, () =>
    buildLocalRoundWithData(
      adultOnlyData,
      PLAYERS,
      SPORTS_CATEGORY,
      1,
      1,
      [],
      'opinion',
      { micEnabled: true, ttsEnabled: true },
      true,
    ),
  );
  assert.ok(allowed);
  assert.equal(allowed.isAdultPrompt, true);
});

test('picture pack selection respects enabled flags, channels and weights', () => {
  const options = [
    { key: 'a', prompt: { picturePackId: 'pack-a' } },
    { key: 'b', prompt: { picturePackId: 'pack-b' } },
  ];
  // Non-picture round types pass through untouched.
  assert.equal(applyPicturePackSelection(options, 'prompt', {}, {}, {}, {}), options);
  // Disabled pack is filtered out.
  const filtered = applyPicturePackSelection(options, 'picture', { 'pack-b': false }, {}, {}, {});
  assert.deepEqual(filtered.map((item) => item.key), ['a']);
  // Disabled release channel is filtered out.
  const channelFiltered = applyPicturePackSelection(
    options,
    'picture',
    {},
    {},
    { dlc: false },
    { 'pack-b': 'dlc', 'pack-a': 'base' },
  );
  assert.deepEqual(channelFiltered.map((item) => item.key), ['a']);
  // Weights duplicate entries (capped at 8 copies).
  const weighted = applyPicturePackSelection(options, 'picture', {}, { 'pack-a': 3, 'pack-b': 1 }, {}, {});
  assert.equal(weighted.filter((item) => item.key === 'a').length, 3);
  assert.equal(weighted.filter((item) => item.key === 'b').length, 1);
  // If everything is filtered out, fall back to the full pool.
  const fallback = applyPicturePackSelection(
    options,
    'picture',
    { 'pack-a': false, 'pack-b': false },
    {},
    {},
    {},
  );
  assert.deepEqual(fallback, options);
});

test('category / round-type compatibility helpers', () => {
  const categories = [
    SPORTS_CATEGORY,
    { id: 'pic-mix', name: 'Pic Mix', emoji: '🖼️', prompts: [] },
  ];
  assert.ok(isPictureOnlyCategory('pic-mix'));
  assert.ok(!isPictureOnlyCategory('sports'));
  // pic-mix is hidden for prompt rounds but allowed for picture rounds.
  assert.deepEqual(
    categoriesAllowedForRoundType(categories, 'prompt').map((category) => category.id),
    ['sports'],
  );
  assert.deepEqual(
    categoriesAllowedForRoundType(categories, 'picture').map((category) => category.id),
    ['sports', 'pic-mix'],
  );
  assert.ok(hasAllowedCategoriesForRoundType(categories, 'prompt'));
  assert.ok(!hasAllowedCategoriesForRoundType([], 'prompt'));
  const compatible = getCompatibleRoundTypes(categories, { excludeRoundTypeId: 'prompt' });
  assert.ok(!compatible.some((roundType) => roundType.id === 'prompt'));
  for (let seed = 1; seed <= 10; seed += 1) {
    const picked = withSeededRandom(seed, () => pickCompatibleRoundTypeId(categories));
    assert.ok(ALL_PTP_IDS.includes(picked));
  }
  // No compatible categories at all -> falls back to any pass-the-phone type.
  const fallbackPick = withSeededRandom(3, () => pickCompatibleRoundTypeId([]));
  assert.ok(ALL_PTP_IDS.includes(fallbackPick));
});

test('PARITY: extracted buildLocalRound matches the legacy App.jsx implementation', () => {
  const picturePackConfig = {
    enabledPacks: { 'pack-b': false },
    weights: { 'pack-a': 2 },
    enabledReleaseChannels: {},
    releaseChannelsByPackId: { 'pack-a': 'base', 'pack-b': 'dlc' },
  };
  const scenarios = [];
  for (const roundTypeId of [...ALL_PTP_IDS, null]) {
    for (const liarCount of [1, 2]) {
      for (const adultMode of [false, true]) {
        scenarios.push({ roundTypeId, liarCount, adultMode });
      }
    }
  }
  for (const { roundTypeId, liarCount, adultMode } of scenarios) {
    for (let seed = 1; seed <= 12; seed += 1) {
      const actual = withSeededRandom(seed, () =>
        buildLocalRoundWithData(
          CATEGORY_DATA,
          PLAYERS,
          SPORTS_CATEGORY,
          3,
          liarCount,
          ['prompt::sports::1'],
          roundTypeId,
          { micEnabled: false, ttsEnabled: true },
          adultMode,
          picturePackConfig,
        ),
      );
      const expected = withSeededRandom(seed, () =>
        legacyBuildLocalRound(
          CATEGORY_DATA,
          ROUND_TYPES,
          PASS_THE_PHONE_ROUND_TYPES,
          PLAYERS,
          SPORTS_CATEGORY,
          3,
          liarCount,
          ['prompt::sports::1'],
          roundTypeId,
          { micEnabled: false, ttsEnabled: true },
          adultMode,
          picturePackConfig,
        ),
      );
      assert.deepEqual(
        actual,
        expected,
        `parity failed for type=${roundTypeId} liars=${liarCount} adult=${adultMode} seed=${seed}`,
      );
    }
  }
});
