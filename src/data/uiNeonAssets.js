/** Neon UI pack (MagicPath) — transparent buttons, icons, panels under /assets/ui/neon/ */
import {
  publicAssetUrl,
  resolveBundledAssetSrcCore,
} from '../lib/publicAssetUrl.js';

export const NEON_ASSET_BASE = publicAssetUrl('ui/neon');

/** Resolves mobile WebP paths when `VITE_UI_RASTER_EXT=webp`. */
function bundledUiAsset(relativeUnderAssets) {
  return resolveBundledAssetSrcCore(publicAssetUrl(relativeUnderAssets));
}

/** Neon pack ships as WebP under `public/assets/ui/neon/`. */
const neonFile = (name) => {
  const stem = String(name || '').replace(/\.[^.]+$/, '');
  return publicAssetUrl(`ui/neon/${stem}.webp`);
};

export const NEON_ASSETS = Object.freeze({
  logo: bundledUiAsset('ui/logos/main-logo.png'),
  wallHome: bundledUiAsset('ui/wallpapers/home-page.png'),
  wallGame: bundledUiAsset('ui/wallpapers/in-game.png'),
  btnNeon: neonFile('btn-1.png'),
  btnFire: neonFile('btn-2.png'),
  btnPink: neonFile('btn-3.png'),
  btnSteel: neonFile('btn-4.png'),
  btnPurple: neonFile('btn-purple.png'),
  icons: {
    settings: neonFile('icon-settings.png'),
    trophy: neonFile('icon-trophy.png'),
    help: neonFile('icon-help.png'),
    home: neonFile('icon-home.png'),
    players: neonFile('icon-players.png'),
    cards: neonFile('icon-cards.png'),
    stats: neonFile('icon-stats.png'),
    sound: neonFile('icon-sound.png'),
    shop: neonFile('icon-shop.png'),
  },
  decks: [
    neonFile('deck-flaming-briefs.jpg'),
    neonFile('deck-neon-vortex.jpg'),
    neonFile('deck-starburst.jpg'),
    neonFile('deck-mystery.jpg'),
  ],
});

export function neonThemeVars() {
  const a = NEON_ASSETS;
  const cssUrl = (src) => `url("${String(src || '').replace(/"/g, '\\"')}")`;
  return {
    '--btn-neon': cssUrl(a.btnNeon),
    '--btn-fire': cssUrl(a.btnFire),
    '--btn-pink': cssUrl(a.btnPink),
    '--btn-purple': cssUrl(a.btnPurple),
    '--btn-steel': cssUrl(a.btnSteel),
    '--bar-pink': cssUrl(neonFile('bar-1')),
  };
}

export const MENU_VOCAL_BGM_SRC = publicAssetUrl('audio/music/menu-vocal.mp3');
export const GAME_INSTRUMENTAL_BGM_SRC = publicAssetUrl(
  'audio/music/game-instrumental.mp3',
);

export const ROUND_TYPE_DRAW_COUNT = 2;
export const CATEGORY_DRAW_COUNT = 6;
export const ONLINE_SELECTION_TIMER_SEC = 30;
export const ONLINE_TWO_TRUTHS_INPUT_TIMER_SEC = 60;
export const SELECTION_FLASH_LAST_SEC = 3;

/** Round types removed from player-facing selection (legacy data may still reference these ids). */
export const EXCLUDED_PLAYER_ROUND_TYPE_IDS = new Set(['grill', 'prompt']);
