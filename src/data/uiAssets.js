import { DEFAULT_CATEGORIES } from './categories.js';
import { getIanPosterThemeSlug } from './ianPosterThemeVoice.js';

/**
 * Active UI asset pack folder under public/assets/.
 * Served at /assets/<UI_PACK_SLUG>/ (today: `ui` → /assets/ui/).
 *
 * For a future reskin, add e.g. public/assets/ui-v2/ and switch UI_PACK_SLUG
 * (or wire VITE_UI_PACK_SLUG) without moving theme or audio assets.
 */
export const UI_PACK_SLUG = 'ui';

/** Public URL base for the active UI pack. */
export const UI_ASSET_BASE = `/assets/${UI_PACK_SLUG}`;

export const UI_WALLPAPER_HOME_SRC = `${UI_ASSET_BASE}/wallpapers/home-page.png`;
export const UI_WALLPAPER_IN_GAME_SRC = `${UI_ASSET_BASE}/wallpapers/in-game.png`;

export const UI_LOGO_MAIN_SRC = `${UI_ASSET_BASE}/logos/main-logo.png`;
export const UI_LOGO_18PLUS_SRC = `${UI_ASSET_BASE}/logos/logo-18plus.png`;

export const UI_CARD_BASE = `${UI_ASSET_BASE}/cards`;
export const UI_CARD_DEFAULT_FRONT_SRC = `${UI_CARD_BASE}/default-front.png`;
export const UI_CARD_DEFAULT_BACK_SRC = `${UI_CARD_BASE}/default-back.png`;
export const UI_CARD_LIAR_FRONT_SRC = `${UI_CARD_BASE}/liar-front.png`;

/** Themes with themed front/back card art in ui/cards/ */
export const UI_THEMED_CARD_SLUGS = new Set([
  'default',
  'murder-mystery',
  'pirates',
  'cops-and-robbers',
  'ghosts-and-ghouls',
]);

export const UI_CATEGORY_ICON_BASE = `${UI_ASSET_BASE}/categories`;
export const UI_GAME_MODE_ICON_BASE = `${UI_ASSET_BASE}/game-modes`;

export const UI_GAME_MODE_ICON_BY_ID = Object.freeze({
  prompt: `${UI_GAME_MODE_ICON_BASE}/prompt.png`,
  opinion: `${UI_GAME_MODE_ICON_BASE}/opinion.png`,
  picture: `${UI_GAME_MODE_ICON_BASE}/picture.png`,
  nameblame: '/assets/images/round-types/name-and-shame.png',
  noise: `${UI_GAME_MODE_ICON_BASE}/noise.png`,
  chain: `${UI_GAME_MODE_ICON_BASE}/chain.png`,
  grill: `${UI_GAME_MODE_ICON_BASE}/grill.png`,
  sound: `${UI_GAME_MODE_ICON_BASE}/sound.png`,
  video: `${UI_GAME_MODE_ICON_BASE}/video.png`,
});

export const UI_CATEGORY_ICON_BY_ID = Object.freeze(
  Object.fromEntries(
    DEFAULT_CATEGORIES.map((category) => [
      category.id,
      `${UI_CATEGORY_ICON_BASE}/${category.id}.png`,
    ]),
  ),
);

/** Extra category tiles not in DEFAULT_CATEGORIES (setup toggles). */
export const UI_PRIMARY_BUTTON_CLASS =
  'h-16 rounded-[1.9rem] border-2 border-white bg-[#f500c8] text-white text-lg sm:text-xl font-black uppercase tracking-[0.02em] hover:bg-[#ff24d4] shadow-[0_10px_24px_rgba(0,0,0,0.45)]';

export const UI_CUSTOM_CATEGORY_META = [
  { id: 'travel-disasters', name: 'Travel Disasters', iconSrc: `${UI_CATEGORY_ICON_BASE}/travel-disasters.png` },
  { id: 'roommate-chaos', name: 'Roommate Chaos', iconSrc: `${UI_CATEGORY_ICON_BASE}/roommate-chaos.png` },
  { id: 'mobile-apps', name: 'Mobile Apps', iconSrc: `${UI_CATEGORY_ICON_BASE}/mobile-apps.png` },
  { id: 'school-uni', name: 'School / Uni Life', iconSrc: `${UI_CATEGORY_ICON_BASE}/school-uni.png` },
  { id: 'mythical-creatures', name: 'Mythical Creatures', iconSrc: `${UI_CATEGORY_ICON_BASE}/mythical-creatures.png` },
  { id: 'cars-motors', name: 'Cars & Motors', iconSrc: `${UI_CATEGORY_ICON_BASE}/cars-motors.png` },
  { id: 'childhood-nostalgia', name: 'Childhood Nostalgia', iconSrc: `${UI_CATEGORY_ICON_BASE}/childhood-nostalgia.png` },
  { id: 'conspiracy-lite', name: 'Conspiracy Lite', iconSrc: `${UI_CATEGORY_ICON_BASE}/conspiracy-lite.png` },
  { id: 'dating-bios', name: 'Dating App Bios', iconSrc: `${UI_CATEGORY_ICON_BASE}/dating-bios.png` },
  { id: 'board-game-lore', name: 'Board Games', iconSrc: `${UI_CATEGORY_ICON_BASE}/board-game-lore.png` },
  { id: 'internet-slang', name: 'Internet Slang', iconSrc: `${UI_CATEGORY_ICON_BASE}/internet-slang.png` },
  { id: 'memes-viral', name: 'Memes & Viral Moments', iconSrc: `${UI_CATEGORY_ICON_BASE}/memes-viral.png` },
  { id: 'pic-mix', name: 'Pic & Mix', iconSrc: `${UI_CATEGORY_ICON_BASE}/pic-mix.png` },
];

export function getUiThemeSlug(themeName = 'Default') {
  return getIanPosterThemeSlug(themeName);
}

export function getUiCardFrontSrc(themeName = 'Default') {
  const slug = getUiThemeSlug(themeName);
  if (UI_THEMED_CARD_SLUGS.has(slug)) {
    return `${UI_CARD_BASE}/${slug}-front.png`;
  }
  return UI_CARD_DEFAULT_FRONT_SRC;
}

export function getUiCardBackSrc(themeName = 'Default') {
  const slug = getUiThemeSlug(themeName);
  if (UI_THEMED_CARD_SLUGS.has(slug)) {
    return `${UI_CARD_BASE}/${slug}-back.png`;
  }
  return UI_CARD_DEFAULT_BACK_SRC;
}

export function getUiCategoryIconSrc(categoryId = '') {
  const id = String(categoryId || '').trim();
  if (!id) return '';
  return UI_CATEGORY_ICON_BY_ID[id] || '';
}

export function getUiGameModeIconSrc(roundTypeId = 'prompt') {
  const id = String(roundTypeId || 'prompt').trim().toLowerCase();
  if (!id) return UI_GAME_MODE_ICON_BY_ID.prompt;
  if (id === 'offtopic') return UI_GAME_MODE_ICON_BY_ID.prompt;
  return UI_GAME_MODE_ICON_BY_ID[id] || UI_GAME_MODE_ICON_BY_ID.prompt;
}

/** Sources to preload on startup (wallpapers, cards, modes, categories). */
export function listUiPreloadSources() {
  return [
    UI_LOGO_MAIN_SRC,
    UI_LOGO_18PLUS_SRC,
    UI_WALLPAPER_HOME_SRC,
    UI_WALLPAPER_IN_GAME_SRC,
    UI_CARD_DEFAULT_FRONT_SRC,
    UI_CARD_DEFAULT_BACK_SRC,
    UI_CARD_LIAR_FRONT_SRC,
    ...UI_THEMED_CARD_SLUGS.values()
      .filter((slug) => slug !== 'default')
      .flatMap((slug) => [
        `${UI_CARD_BASE}/${slug}-front.png`,
        `${UI_CARD_BASE}/${slug}-back.png`,
      ]),
    ...Object.values(UI_GAME_MODE_ICON_BY_ID),
    ...Object.values(UI_CATEGORY_ICON_BY_ID),
    ...UI_CUSTOM_CATEGORY_META.map((entry) => entry.iconSrc),
  ];
}
