/** Neon UI pack (MagicPath) — transparent buttons, icons, panels under /assets/ui/neon/ */
export const NEON_ASSET_BASE = '/assets/ui/neon';

export const NEON_ASSETS = Object.freeze({
  logo: '/assets/ui/logos/main-logo.png',
  wallHome: '/assets/ui/wallpapers/home-page.png',
  wallGame: '/assets/ui/wallpapers/in-game.png',
  btnNeon: `${NEON_ASSET_BASE}/btn-1.png`,
  btnFire: `${NEON_ASSET_BASE}/btn-2.png`,
  btnPink: `${NEON_ASSET_BASE}/btn-3.png`,
  btnSteel: `${NEON_ASSET_BASE}/btn-4.png`,
  btnPurple: `${NEON_ASSET_BASE}/btn-purple.png`,
  icons: {
    settings: `${NEON_ASSET_BASE}/icon-settings.png`,
    trophy: `${NEON_ASSET_BASE}/icon-trophy.png`,
    help: `${NEON_ASSET_BASE}/icon-help.png`,
    home: `${NEON_ASSET_BASE}/icon-home.png`,
    players: `${NEON_ASSET_BASE}/icon-players.png`,
    cards: `${NEON_ASSET_BASE}/icon-cards.png`,
    stats: `${NEON_ASSET_BASE}/icon-stats.png`,
    sound: `${NEON_ASSET_BASE}/icon-sound.png`,
    shop: `${NEON_ASSET_BASE}/icon-shop.png`,
  },
  decks: [
    `${NEON_ASSET_BASE}/deck-flaming-briefs.jpg`,
    `${NEON_ASSET_BASE}/deck-neon-vortex.jpg`,
    `${NEON_ASSET_BASE}/deck-starburst.jpg`,
    `${NEON_ASSET_BASE}/deck-mystery.jpg`,
  ],
});

export function neonThemeVars() {
  const a = NEON_ASSETS;
  return {
    '--btn-neon': `url(${a.btnNeon})`,
    '--btn-fire': `url(${a.btnFire})`,
    '--btn-pink': `url(${a.btnPink})`,
    '--btn-purple': `url(${a.btnPurple})`,
    '--btn-steel': `url(${a.btnSteel})`,
    '--bar-pink': `url(${NEON_ASSET_BASE}/bar-1.png)`,
  };
}

export const MENU_VOCAL_BGM_SRC = '/assets/audio/music/menu-vocal.mp3';
export const GAME_INSTRUMENTAL_BGM_SRC = '/assets/audio/music/game-instrumental.mp3';

export const ROUND_TYPE_DRAW_COUNT = 2;
export const CATEGORY_DRAW_COUNT = 6;
export const ONLINE_SELECTION_TIMER_SEC = 30;
export const ONLINE_TWO_TRUTHS_INPUT_TIMER_SEC = 60;
export const SELECTION_FLASH_LAST_SEC = 3;

/** Round types removed from player-facing selection (legacy data may still reference these ids). */
export const EXCLUDED_PLAYER_ROUND_TYPE_IDS = new Set(['grill', 'prompt']);
