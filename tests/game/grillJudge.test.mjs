import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateGrillQuestion,
  GRILL_CHEAT_WARNING_VARIANTS,
  GRILL_CORRECT_GUESS_VARIANTS,
  GRILL_KIND_OF_VARIANTS,
  GRILL_MAYBE_VARIANTS,
  GRILL_NO_VARIANTS,
  GRILL_NOT_APPLICABLE_VARIANTS,
  GRILL_YES_VARIANTS,
  isHintOrAnswerRequest,
  normalizeForGuess,
  pickBritishMaleVoice,
  pickVariant,
} from '../../src/game/grillJudge/grillJudge.js';
import {
  evaluateGrillQuestion as legacyEvaluateGrillQuestion,
  pickBritishMaleVoice as legacyPickBritishMaleVoice,
} from '../fixtures/legacyGameLogic.mjs';
import { withSeededRandom } from '../support/seededRandom.mjs';

const ROUND = {
  main: 'Person: David Attenborough',
  aiPrompt: 'A famous wildlife presenter and broadcaster',
};

test('normalizeForGuess lowercases and strips punctuation', () => {
  assert.equal(normalizeForGuess("  Is it... DAVID Attenborough?! "), 'is it david attenborough');
  assert.equal(normalizeForGuess(null), '');
});

test('isHintOrAnswerRequest detects hint and answer fishing', () => {
  assert.ok(isHintOrAnswerRequest('give me a hint'));
  assert.ok(isHintOrAnswerRequest('what is the answer'));
  assert.ok(isHintOrAnswerRequest('just say it'));
  assert.ok(!isHintOrAnswerRequest('is it an animal?'));
  assert.ok(!isHintOrAnswerRequest(''));
});

test('empty question -> not applicable, not a cheat, not a guess', () => {
  const result = evaluateGrillQuestion('', ROUND);
  assert.ok(GRILL_NOT_APPLICABLE_VARIANTS.includes(result.answer));
  assert.equal(result.isCorrectGuess, false);
  assert.equal(result.isCheatRequest, false);
});

test('hint requests are flagged as cheats', () => {
  const result = evaluateGrillQuestion('come on, give me a clue', ROUND);
  assert.equal(result.isCheatRequest, true);
  assert.equal(result.isCorrectGuess, false);
  assert.ok(GRILL_CHEAT_WARNING_VARIANTS.includes(result.answer));
});

test('full target match is a correct guess (target after the colon)', () => {
  const result = evaluateGrillQuestion('Is it David Attenborough?', ROUND);
  assert.equal(result.isCorrectGuess, true);
  assert.equal(result.isCheatRequest, false);
  assert.ok(GRILL_CORRECT_GUESS_VARIANTS.includes(result.answer));
});

test('guess intent with all target tokens is a correct guess', () => {
  const result = evaluateGrillQuestion('my guess: attenborough, david', ROUND);
  assert.equal(result.isCorrectGuess, true);
});

test('the word "answer" trips the cheat detector even inside a guess', () => {
  // Pre-existing behaviour: hint/answer detection runs before guess matching,
  // so "final answer" phrasing is treated as answer-fishing.
  const result = evaluateGrillQuestion(
    'my guess: attenborough, david — final answer',
    ROUND,
  );
  assert.equal(result.isCheatRequest, true);
  assert.equal(result.isCorrectGuess, false);
});

test('mentioning target tokens WITHOUT guess intent or full match is not a guess', () => {
  // Tokens out of order, no guess-intent phrase, and not a full-string match.
  const result = evaluateGrillQuestion('attenborough david', ROUND);
  assert.equal(result.isCorrectGuess, false);
});

test('tag overlap answers yes; tag mismatch answers no', () => {
  // 'person' question vs a person-tagged target ("Person:" prefix + presenter prompt).
  const yes = evaluateGrillQuestion('is it a famous person?', ROUND);
  assert.ok(GRILL_YES_VARIANTS.includes(yes.answer), `expected yes, got "${yes.answer}"`);
  const no = evaluateGrillQuestion('is it some kind of food?', ROUND);
  assert.ok(GRILL_NO_VARIANTS.includes(no.answer), `expected no, got "${no.answer}"`);
});

test('untagged is-it questions get a maybe; where/when/which/who get kind-of', () => {
  const maybe = evaluateGrillQuestion('is it expensive?', ROUND);
  assert.ok(GRILL_MAYBE_VARIANTS.includes(maybe.answer), `got "${maybe.answer}"`);
  const kindOf = evaluateGrillQuestion('where would I find one?', ROUND);
  assert.ok(GRILL_KIND_OF_VARIANTS.includes(kindOf.answer), `got "${kindOf.answer}"`);
});

test('statements with no signal get a not-applicable answer', () => {
  const result = evaluateGrillQuestion('hello there friend', ROUND);
  assert.ok(GRILL_NOT_APPLICABLE_VARIANTS.includes(result.answer));
});

test('pickVariant returns the fallback for empty pools and a member otherwise', () => {
  assert.equal(pickVariant([], 'fallback'), 'fallback');
  assert.equal(pickVariant(undefined, 'fallback'), 'fallback');
  for (let seed = 1; seed <= 10; seed += 1) {
    const picked = withSeededRandom(seed, () => pickVariant(['a', 'b', 'c'], 'z'));
    assert.ok(['a', 'b', 'c'].includes(picked));
  }
});

test('pickBritishMaleVoice prefers en-GB male-hinted voices and avoids female hints', () => {
  const voices = [
    { name: 'Google US English', lang: 'en-US' },
    { name: 'Hazel', lang: 'en-GB' },
    { name: 'Daniel (Enhanced)', lang: 'en-GB' },
  ];
  assert.equal(pickBritishMaleVoice(voices).name, 'Daniel (Enhanced)');
  const noMaleHint = [
    { name: 'Hazel', lang: 'en-GB' },
    { name: 'Blandford', lang: 'en-GB' },
  ];
  assert.equal(pickBritishMaleVoice(noMaleHint).name, 'Blandford');
  const onlyFemale = [{ name: 'Hazel', lang: 'en-GB' }];
  assert.equal(pickBritishMaleVoice(onlyFemale).name, 'Hazel');
  assert.equal(pickBritishMaleVoice([{ name: 'Anna', lang: 'de-DE' }]), null);
  assert.equal(pickBritishMaleVoice([]), null);
});

test('pre-existing quirk: names containing "Female" match the "male" hint substring', () => {
  // 'female'.includes('male') is true, so a "UK English Female" voice wins the
  // explicit-male search when it appears before a genuinely male voice. The
  // extraction preserves this behaviour verbatim; flagged in the review notes.
  const voices = [
    { name: 'Google UK English Female', lang: 'en-GB' },
    { name: 'Daniel (Enhanced)', lang: 'en-GB' },
  ];
  assert.equal(pickBritishMaleVoice(voices).name, 'Google UK English Female');
});

const PARITY_QUESTIONS = [
  '',
  'give me a hint',
  'tell me the answer right now',
  'Is it David Attenborough?',
  'my guess: attenborough, david',
  'is it a famous person?',
  'is it some kind of food?',
  'is it expensive?',
  'where would I find one?',
  'who is it then',
  'hello there friend',
  'does it live in the wild?',
  'is it a movie or a tv show?',
];

const PARITY_ROUNDS = [
  ROUND,
  { main: 'Landmark: Eiffel Tower', aiPrompt: 'A famous monument in a capital city' },
  { main: 'Pizza', aiPrompt: 'A popular food' },
  { main: '', aiPrompt: '' },
];

test('PARITY: extracted grill judge matches the legacy App.jsx implementation', () => {
  for (const round of PARITY_ROUNDS) {
    for (const question of PARITY_QUESTIONS) {
      for (let seed = 1; seed <= 6; seed += 1) {
        const actual = withSeededRandom(seed, () => evaluateGrillQuestion(question, round));
        const expected = withSeededRandom(seed, () =>
          legacyEvaluateGrillQuestion(question, round),
        );
        assert.deepEqual(
          actual,
          expected,
          `grill parity failed for q="${question}" target="${round.main}" seed=${seed}`,
        );
      }
    }
  }
});

test('PARITY: extracted pickBritishMaleVoice matches the legacy implementation', () => {
  const voiceSets = [
    [],
    [{ name: 'Google US English', lang: 'en-US' }],
    [
      { name: 'Google UK English Female', lang: 'en-GB' },
      { name: 'Daniel', lang: 'en-GB' },
      { name: 'Hazel', lang: 'en-GB' },
    ],
    [
      { name: 'Serena', lang: 'en-GB' },
      { name: 'Blandford', lang: 'en-GB' },
    ],
  ];
  for (const voices of voiceSets) {
    assert.deepEqual(pickBritishMaleVoice(voices), legacyPickBritishMaleVoice(voices));
  }
});
