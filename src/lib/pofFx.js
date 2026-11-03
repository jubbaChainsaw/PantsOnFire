import {
  GAME_INSTRUMENTAL_BGM_SRC,
  MENU_VOCAL_BGM_SRC,
} from '../data/uiNeonAssets.js';

const KEY = 'pof-settings';
const LEGACY_KEY = 'imposter-audio-settings-v1';

const DEFAULTS = {
  sfx: true,
  music: true,
  haptics: true,
  mic: true,
  musicVol: 60,
  sfxVol: 80,
  voiceChat: true,
};

export function loadFx() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
    return {
      ...DEFAULTS,
      music: legacy.musicEnabled ?? raw.music ?? DEFAULTS.music,
      sfx: legacy.sfxEnabled ?? raw.sfx ?? DEFAULTS.sfx,
      ...raw,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveFx(settings) {
  const next = { ...loadFx(), ...settings };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({
        musicEnabled: Boolean(next.music),
        sfxEnabled: Boolean(next.sfx),
      }),
    );
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new CustomEvent('pof-fx', { detail: next }));
  music.apply(next);
  return next;
}

export const HAPTIC = {
  tap: 12,
  yourTurn: [60, 40, 60],
  lastSeconds: [30, 70, 30, 70, 30],
  autoPick: [120, 60, 40],
  win: [80, 50, 80, 50, 220],
};

function postNativeHaptic(pattern) {
  try {
    const payload = JSON.stringify({ type: 'POF_HAPTIC', pattern });
    window.ReactNativeWebView?.postMessage?.(payload);
  } catch {
    /* not in WebView */
  }
}

export function vibrate(pattern) {
  if (!loadFx().haptics) return;
  postNativeHaptic(pattern);
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

let lastTap = 0;
export function tapFx() {
  const now = Date.now();
  if (now - lastTap < 80) return;
  lastTap = now;
  vibrate(HAPTIC.tap);
  music.unlock();
}

export const fx = {
  yourTurn: () => {
    vibrate(HAPTIC.yourTurn);
  },
  lastSeconds: () => {
    vibrate(HAPTIC.lastSeconds);
  },
  autoPick: () => {
    vibrate(HAPTIC.autoPick);
  },
  win: () => {
    vibrate(HAPTIC.win);
  },
};

const music = (() => {
  let el = null;
  let track = 'theme';
  let wants = 0;
  let unlocked = false;

  const lvl = () => (track === 'game' ? 0.55 : 1);
  const vol = () => {
    const s = loadFx();
    return s.music ? (s.musicVol / 100) * lvl() : 0;
  };

  const srcForTrack = () =>
    track === 'game' ? GAME_INSTRUMENTAL_BGM_SRC : MENU_VOCAL_BGM_SRC;

  const start = () => {
    const url = srcForTrack();
    if (!url) return;
    if (el && el.dataset.src !== url) {
      el.pause();
      el = null;
    }
    if (!el) {
      el = new Audio(url);
      el.dataset.src = url;
      el.loop = true;
      el.preload = 'auto';
    }
    el.volume = vol();
    if (el.paused && vol() > 0) void el.play().catch(() => {});
  };

  const stop = () => {
    try {
      el?.pause();
    } catch {
      /* ignore */
    }
  };

  return {
    want(on, t) {
      if (on && t) track = t;
      wants = Math.max(0, wants + (on ? 1 : -1));
      if (wants && unlocked && vol() > 0) start();
      if (!wants) stop();
    },
    unlock() {
      unlocked = true;
      if (wants && vol() > 0) start();
    },
    apply(s) {
      const v = s.music ? (s.musicVol / 100) * lvl() : 0;
      if (el) el.volume = v;
      if (v === 0) stop();
      else if (wants && unlocked) start();
    },
    setTrack(t) {
      track = t;
      if (el && el.dataset.src !== srcForTrack()) {
        el.pause();
        el = null;
      }
      if (wants && unlocked && vol() > 0) start();
    },
    get playing() {
      return Boolean(el && !el.paused);
    },
  };
})();

export { music };

export function syncMusicForScreen(screen) {
  const menuScreens = new Set([
    'home',
    'setup',
    'online-setup',
    'online-join',
    'settings',
    'store',
    'account-gate',
    'development-progress',
    'friends',
    'persona',
  ]);
  const gameScreens = new Set([
    'game-intro',
    'rules',
    'round-type-choice',
    'category-choice',
    'host-intro',
    'reveal',
    'discussion',
    'voting',
    'liar-reveal',
    'results',
    'final',
    'online-lobby-created',
    'online-lobby-waiting',
  ]);
  if (menuScreens.has(screen)) {
    music.setTrack('theme');
    music.want(true, 'theme');
  } else if (gameScreens.has(screen)) {
    music.setTrack('game');
    music.want(true, 'game');
  } else {
    music.want(false);
  }
}
