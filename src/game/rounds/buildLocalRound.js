// E1 — production wrapper that supplies the real game content to the pure
// round-generation core. App.jsx imports `buildLocalRound` from here; the
// signature and behaviour are identical to the original App.jsx function.
import {
  BANNED_WORD_BANK,
  CHAIN_REACTION_ROUNDS,
  GRILL_EM_ROUNDS,
  MEDIA_ROUNDS,
  NAME_AND_BLAME_ROUNDS,
  OFFTOPIC_DEFENSE_ROUNDS,
  OPINION_ROUNDS,
  SOUND_CLUES_ROUNDS,
  sanitizeBannedWords,
} from '../../data/categories.js';
import { buildLocalRoundWithData } from './buildLocalRoundCore.js';

const CATEGORY_DATA = {
  CHAIN_REACTION_ROUNDS,
  NAME_AND_BLAME_ROUNDS,
  SOUND_CLUES_ROUNDS,
  OFFTOPIC_DEFENSE_ROUNDS,
  OPINION_ROUNDS,
  MEDIA_ROUNDS,
  GRILL_EM_ROUNDS,
  BANNED_WORD_BANK,
  sanitizeBannedWords,
};

export function buildLocalRound(...args) {
  return buildLocalRoundWithData(CATEGORY_DATA, ...args);
}
