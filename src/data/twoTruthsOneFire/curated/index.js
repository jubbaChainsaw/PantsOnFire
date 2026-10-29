/** Curated “Name three …” phrase tails for Two Truths One Fire (UK English). */
import { PHRASES as sports } from './categories/sports.js';
import { PHRASES as food } from './categories/food.js';
import { PHRASES as movies } from './categories/movies.js';
import { PHRASES as music } from './categories/music.js';
import { PHRASES as places } from './categories/places.js';
import { PHRASES as games } from './categories/games.js';
import { PHRASES as animals } from './categories/animals.js';
import { PHRASES as weird } from './categories/weird.js';
import { PHRASES as jobs } from './categories/jobs.js';
import { PHRASES as celebrities } from './categories/celebrities.js';
import { PHRASES as tech } from './categories/tech.js';
import { PHRASES as tv } from './categories/tv.js';
import { PHRASES as anime } from './categories/anime.js';
import { PHRASES as cartoons } from './categories/cartoons.js';
import { PHRASES as comic_books_manga } from './categories/comic-books-manga.js';
import { PHRASES as historical_figures } from './categories/historical-figures.js';
import { PHRASES as art } from './categories/art.js';
import { PHRASES as books } from './categories/books.js';
import { PHRASES as nerd_culture } from './categories/nerd-culture.js';
import { PHRASES as toys } from './categories/toys.js';
import { PHRASES as wrestling } from './categories/wrestling.js';
import { PHRASES as ufc } from './categories/ufc.js';
import { PHRASES as motorsport } from './categories/motorsport.js';
import { PHRASES as hobbies } from './categories/hobbies.js';
import { PHRASES as brands } from './categories/brands.js';
import { PHRASES as science } from './categories/science.js';
import { PHRASES as party } from './categories/party.js';
import { PHRASES as internet_slang } from './categories/internet-slang.js';
import { PHRASES as memes_viral } from './categories/memes-viral.js';
import { PHRASES as travel_disasters } from './categories/travel-disasters.js';
import { PHRASES as fashion_fails } from './categories/fashion-fails.js';
import { PHRASES as dating_bios } from './categories/dating-bios.js';
import { PHRASES as school_uni } from './categories/school-uni.js';
import { PHRASES as conspiracy_lite } from './categories/conspiracy-lite.js';
import { PHRASES as mythical_creatures } from './categories/mythical-creatures.js';
import { PHRASES as cars_motors } from './categories/cars-motors.js';
import { PHRASES as roommate_chaos } from './categories/roommate-chaos.js';
import { PHRASES as childhood_nostalgia } from './categories/childhood-nostalgia.js';
import { PHRASES as mobile_apps } from './categories/mobile-apps.js';
import { PHRASES as board_game_lore } from './categories/board-game-lore.js';
import { PHRASES as superstitions } from './categories/superstitions.js';
import { PHRASES as festivals_holidays } from './categories/festivals-holidays.js';
import { PHRASES as pic_mix } from './categories/pic-mix.js';
import { PHRASES as theatre } from './categories/theatre.js';
import { PHRASES as musicals } from './categories/musicals.js';
import { PHRASES as eurovision } from './categories/eurovision.js';
import { PHRASES as girl_bands_vs_boy_bands } from './categories/girl-bands-vs-boy-bands.js';
import { PHRASES as comedy } from './categories/comedy.js';
import { PHRASES as game_shows } from './categories/game-shows.js';
import { PHRASES as horror } from './categories/horror.js';

export const CURATED_PHRASES_BY_CATEGORY = {
  'sports': sports,
  'food': food,
  'movies': movies,
  'music': music,
  'places': places,
  'games': games,
  'animals': animals,
  'weird': weird,
  'jobs': jobs,
  'celebrities': celebrities,
  'tech': tech,
  'tv': tv,
  'anime': anime,
  'cartoons': cartoons,
  'comic-books-manga': comic_books_manga,
  'historical-figures': historical_figures,
  'art': art,
  'books': books,
  'nerd-culture': nerd_culture,
  'toys': toys,
  'wrestling': wrestling,
  'ufc': ufc,
  'motorsport': motorsport,
  'hobbies': hobbies,
  'brands': brands,
  'science': science,
  'party': party,
  'internet-slang': internet_slang,
  'memes-viral': memes_viral,
  'travel-disasters': travel_disasters,
  'fashion-fails': fashion_fails,
  'dating-bios': dating_bios,
  'school-uni': school_uni,
  'conspiracy-lite': conspiracy_lite,
  'mythical-creatures': mythical_creatures,
  'cars-motors': cars_motors,
  'roommate-chaos': roommate_chaos,
  'childhood-nostalgia': childhood_nostalgia,
  'mobile-apps': mobile_apps,
  'board-game-lore': board_game_lore,
  'superstitions': superstitions,
  'festivals-holidays': festivals_holidays,
  'pic-mix': pic_mix,
  'theatre': theatre,
  'musicals': musicals,
  'eurovision': eurovision,
  'girl-bands-vs-boy-bands': girl_bands_vs_boy_bands,
  'comedy': comedy,
  'game-shows': game_shows,
  'horror': horror,
};

export function getCuratedPhraseCount(categoryId) {
  const phrases = CURATED_PHRASES_BY_CATEGORY[categoryId];
  return Array.isArray(phrases) ? phrases.length : 0;
}
