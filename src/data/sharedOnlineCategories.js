/**
 * Shared online-multiplayer category data.
 *
 * This module is intentionally free of browser-only APIs so it can be imported
 * by both the Vite client bundle and the Node lobby server.
 *
 * The server's `buildAuthoritativeRound` picks a random category from
 * SHARED_ONLINE_CATEGORIES and picks a prompt within it. Using this shared
 * module means the pass-the-phone and online modes draw from the same corpus,
 * preventing data drift.
 */

import { AnimalsPromptRoundData } from './packs/animals/promptRoundData.js';
import { CartoonsPromptRoundData } from './packs/cartoons/promptRoundData.js';
import { CelebritiesPromptRoundData } from './packs/celebrities/promptRoundData.js';
import { ComedyPromptRoundData } from './packs/comedy/promptRoundData.js';
import { FoodPromptRoundData } from './packs/food/promptRoundData.js';
import { GamesPromptRoundData } from './packs/games/promptRoundData.js';
import { HistoricalFiguresPromptRoundData } from './packs/historical-figures/promptRoundData.js';
import { HobbiesPromptRoundData } from './packs/hobbies/promptRoundData.js';
import { JobsPromptRoundData } from './packs/jobs/promptRoundData.js';
import { MoviesPromptRoundData } from './packs/movies/promptRoundData.js';
import { MusicPromptRoundData } from './packs/music/promptRoundData.js';
import { PartyPromptRoundData } from './packs/party/promptRoundData.js';
import { PlacesPromptRoundData } from './packs/places/promptRoundData.js';
import { SciencePromptRoundData } from './packs/science/promptRoundData.js';
import { SportsPromptRoundData } from './packs/sports/promptRoundData.js';
import { TvPromptRoundData } from './packs/tv/promptRoundData.js';

/**
 * Categories available for online authoritative round generation.
 * Each entry must have: { id, name, emoji, prompts: [{hint, main, imposter}] }
 */
export const SHARED_ONLINE_CATEGORIES = [
  AnimalsPromptRoundData,
  CartoonsPromptRoundData,
  CelebritiesPromptRoundData,
  ComedyPromptRoundData,
  FoodPromptRoundData,
  GamesPromptRoundData,
  HistoricalFiguresPromptRoundData,
  HobbiesPromptRoundData,
  JobsPromptRoundData,
  MoviesPromptRoundData,
  MusicPromptRoundData,
  PartyPromptRoundData,
  PlacesPromptRoundData,
  SciencePromptRoundData,
  SportsPromptRoundData,
  TvPromptRoundData,
];

/**
 * Per-prompt banned words. Keys match the format `prompt::<categoryId>::<promptIndex>`.
 * Sourced from the same client-side BANNED_WORD_BANK to ensure consistency.
 */
export const SHARED_ONLINE_BANNED_WORD_BANK = {
  'prompt::sports::0': ['bat', 'pitcher', 'stadium', 'scoreboard', 'coach'],
  'prompt::sports::1': ['referee', 'supporters', 'captain', 'season', 'training'],
  'prompt::sports::2': ['tournament', 'singles', 'doubles', 'umpire', 'grip'],
  'prompt::sports::3': ['champion', 'fitness', 'crowd', 'aggressive', 'professional'],
  'prompt::food::0': ['crispy', 'restaurant', 'delivery', 'toppings', 'stuffed'],
  'prompt::food::1': ['mustard', 'barbecue', 'greasy', 'handheld', 'snack'],
  'prompt::food::2': ['breakfast', 'steaming', 'sugar', 'morning', 'cafe'],
  'prompt::food::3': ['bakery', 'frosting', 'gooey', 'treat', 'party'],
  'prompt::movies::0': ['franchise', 'merchandise', 'funny', 'family', 'adventure'],
  'prompt::movies::1': ['blockbuster', 'director', 'soundtrack', 'suspense', 'iconic'],
  'prompt::movies::2': ['relationship', 'dramatic', 'emotional', 'chemistry', 'memorable'],
  'prompt::movies::3': ['cinematography', 'director', 'ambitious', 'complex', 'masterpiece'],
  'prompt::music::0': ['frontman', 'album', 'touring', 'anthem', 'fans'],
  'prompt::music::1': ['teenage', 'chorus', 'gigs', 'melody', 'mosh'],
  'prompt::music::2': ['intense', 'stage', 'headline', 'riffs', 'chaotic'],
  'prompt::music::3': ['virtuoso', 'concert', 'legendary', 'solo', 'discography'],
  'prompt::places::0': ['capital', 'landmark', 'tourist', 'rainy', 'commute'],
  'prompt::places::1': ['passport', 'museum', 'nightlife', 'language', 'metro'],
  'prompt::places::2': ['queues', 'departure', 'luggage', 'platform', 'delay'],
  'prompt::places::3': ['sand', 'slides', 'crowded', 'suncream', 'towels'],
};
