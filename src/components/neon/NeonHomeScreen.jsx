import { useEffect, useState } from 'react';
import { KeyRound, Lock, Play, Wifi, X } from 'lucide-react';
import { NEON_ASSETS, neonThemeVars } from '../../data/uiNeonAssets.js';
import { resolveBundledAssetSrc } from '../../lib/publicAssetUrl.js';
import { loadFx, music, saveFx, tapFx } from '../../lib/pofFx.js';
import WebPlayerNotice from './WebPlayerNotice.jsx';

const HOME_LINES = [
  'Someone at this table is lying. Find them.',
  'Trust no one. Especially the quiet one.',
  'Liar, liar… you know the rest.',
];

const DECK_PLACEMENTS = [
  ['-left-8 top-[33%] w-24', 0, -14],
  ['-left-6 top-[63%] w-20', 3, 10],
  ['-right-8 top-[38%] w-24', 0, 14],
  ['-right-6 top-[60%] w-20', 0, -8],
  ['left-[4%] -bottom-6 w-24', 0, -22],
  ['left-[34%] -bottom-10 w-20', 2, 8],
  ['right-[6%] -bottom-8 w-24', 1, 18],
];

function IconBtn({ src, label, onClick, pressed }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed || false}
      onClick={onClick}
      className={`pof-iconbtn pof-focus ${pressed ? 'opacity-50' : ''}`}
    >
      <img src={resolveBundledAssetSrc(src)} alt="" />
    </button>
  );
}

export default function NeonHomeScreen({
  onNavigate,
  homeLine,
  joinOnlyMode = false,
  canCreateLocalGame = true,
  canCreateOnlineLobby = true,
}) {
  const [overlay, setOverlay] = useState(null);
  const [multiOpen, setMultiOpen] = useState(false);
  const [muted, setMuted] = useState(() => !loadFx().music);
  const [lineIdx, setLineIdx] = useState(0);
  const line =
    homeLine || HOME_LINES[lineIdx % HOME_LINES.length];

  useEffect(() => {
    music.want(true, 'theme');
    const unlock = () => music.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      music.want(false);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(
      () => setLineIdx((i) => (i + 1) % HOME_LINES.length),
      4000,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onFx = () => setMuted(!loadFx().music);
    window.addEventListener('pof-fx', onFx);
    return () => window.removeEventListener('pof-fx', onFx);
  }, []);

  const toggleSound = () => {
    const s = loadFx();
    const on = !s.music;
    saveFx({ ...s, music: on });
    setMuted(!on);
    tapFx();
  };

  const go = (dest) => {
    tapFx();
    onNavigate(dest);
  };

  const icons = NEON_ASSETS.icons;

  return (
    <div
      className="pof-root relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-[#05010f] text-white"
      style={neonThemeVars()}
    >
      <div
        className="pof-wall absolute inset-0"
        style={{ backgroundImage: `url(${NEON_ASSETS.wallHome})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/55" />
      {DECK_PLACEMENTS.map(([cls, deckIdx, rot], i) => (
        <img
          key={i}
          src={NEON_ASSETS.decks[deckIdx % NEON_ASSETS.decks.length]}
          alt=""
          aria-hidden
          className={`pof-deck pointer-events-none absolute ${cls}`}
          style={{ '--r': `${rot}deg`, animationDelay: `${i * 0.7}s` }}
        />
      ))}

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[28rem] flex-col px-4 pb-10 pt-4">
        <div className="relative flex items-start justify-between">
          <div className="flex flex-col gap-3">
            <IconBtn
              src={icons.settings}
              label="Settings"
              onClick={() => {
                tapFx();
                go('settings');
              }}
            />
            <IconBtn
              src={icons.trophy}
              label="Leaderboard and stats"
              onClick={() => {
                tapFx();
                go('player-profile');
              }}
            />
            <IconBtn
              src={icons.shop}
              label="Shop"
              onClick={() => {
                tapFx();
                go('store');
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <IconBtn
              src={icons.help}
              label="How to play"
              onClick={() => {
                tapFx();
                setOverlay('help');
              }}
            />
            <IconBtn
              src={icons.sound}
              label={muted ? 'Unmute music' : 'Mute music'}
              pressed={muted}
              onClick={toggleSound}
            />
          </div>
          <img
            src={resolveBundledAssetSrc(NEON_ASSETS.logo)}
            alt="Pants On Fire! Find the Liar"
            className="pointer-events-none absolute left-1/2 top-[-0.5rem] w-[19rem] -translate-x-1/2 drop-shadow-[0_0_24px_rgba(255,90,0,0.55)]"
          />
        </div>

        <div className="mt-[11.5rem] flex flex-col items-center">
          <p className="pof-pop pof-body min-h-[1rem] text-center text-xs text-white/85 [text-shadow:0_2px_6px_#000]">
            {line}
          </p>
        </div>

        {joinOnlyMode ? (
          <WebPlayerNotice className="mt-3 w-full" dataTestId="web-player-notice-home" />
        ) : null}

        <nav className="mt-4 flex w-full flex-col gap-2" aria-label="Main menu">
          {!joinOnlyMode && (
            <button
              type="button"
              className="pof-btn pof-btn-fire pof-btn-xl pof-focus"
              disabled={!canCreateLocalGame}
              title={
                !canCreateLocalGame
                  ? 'Upgrade to Local Liar or higher in the store to host local games.'
                  : undefined
              }
              onClick={() => go('setup')}
            >
              <Play className="h-8 w-8 fill-cyan-300 text-cyan-200 drop-shadow-[0_0_8px_#22d3ee]" />
              <span className="text-yellow-200">Play</span>
            </button>
          )}
          {!joinOnlyMode && (
            <>
              <button
                type="button"
                className="pof-btn pof-btn-blue pof-focus"
                aria-expanded={multiOpen}
                onClick={() => {
                  tapFx();
                  setMultiOpen((v) => !v);
                }}
              >
                <img src={icons.players} alt="" className="h-10 w-10" />
                Multiplayer
              </button>
              {multiOpen && (
                <div className="pof-pop flex gap-2 px-3">
                  <button
                    type="button"
                    className="pof-btn pof-btn-steel pof-btn-sm pof-focus px-4 text-base"
                    disabled={!canCreateOnlineLobby}
                    title={
                      !canCreateOnlineLobby
                        ? 'Upgrade to Suspect or higher in the store to create online lobbies.'
                        : undefined
                    }
                    onClick={() => go('online-setup')}
                  >
                    <Wifi className="h-4 w-4" />
                    Create lobby
                  </button>
                  <button
                    type="button"
                    className="pof-btn pof-btn-blue pof-btn-sm pof-focus px-4 text-base"
                    onClick={() => go('online-join')}
                  >
                    <KeyRound className="h-4 w-4" />
                    Join lobby
                  </button>
                </div>
              )}
            </>
          )}
          <button
            type="button"
            className="pof-btn pof-btn-pink pof-focus"
            onClick={() => go('store')}
          >
            <img src={icons.cards} alt="" className="h-10 w-10" />
            Shop
          </button>
          <button
            type="button"
            className="pof-btn pof-btn-purple pof-focus"
            onClick={() => go('development-progress')}
          >
            <img src={icons.stats} alt="" className="h-10 w-10" />
            Stats
          </button>
          {joinOnlyMode && (
            <button
              type="button"
              className="pof-btn pof-btn-blue pof-btn-long pof-focus"
              onClick={() => go('online-join')}
            >
              <KeyRound className="h-4 w-4 shrink-0" />
              Join Online Lobby
            </button>
          )}
        </nav>
        {multiOpen && !canCreateOnlineLobby && (
          <p className="pof-body mt-1 text-center text-[0.65rem] text-white/60">
            <Lock className="mr-1 inline h-3 w-3" />
            Online lobbies need Suspect tier or higher.{' '}
            <button
              type="button"
              onClick={() => go('store')}
              className="pof-focus font-bold text-yellow-300 underline underline-offset-2"
            >
              Upgrade in the Store
            </button>
          </p>
        )}
      </main>

      {overlay === 'help' && (
        <div
          className="pof-pop absolute inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="How to play"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOverlay(null);
          }}
        >
          <div className="pof-glass pof-scroll relative mb-3 max-h-[88vh] w-[calc(100%-1.5rem)] max-w-[420px] overflow-y-auto rounded-3xl p-5">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                tapFx();
                setOverlay(null);
              }}
              className="pof-sq cyan pof-focus absolute right-3 top-3"
            >
              <X size={18} />
            </button>
            <HowToPlay />
          </div>
        </div>
      )}
    </div>
  );
}

const RULES = [
  [
    'Pass the phone',
    'One player at a time sees their card. Online, everyone checks their own device.',
  ],
  [
    'Get your prompt',
    'Truthful players share one prompt. Liars get a different one (or only the category).',
  ],
  [
    'Give clues',
    'Say one related clue out loud without giving away your exact prompt.',
  ],
  [
    'Double Take',
    'Everyone gets a picture and the same brief. Liars see a slightly different image — describe yours without over-sharing.',
  ],
  [
    'Vote for the liar',
    'Correct votes score points. Uncaught liars score extra.',
  ],
];

function HowToPlay() {
  return (
    <div>
      <div className="pof-body text-[0.7rem] uppercase tracking-[0.2em] text-cyan-200">
        How to Play
      </div>
      <h2 className="pof-title mt-1 text-4xl text-yellow-300">Quick Rules</h2>
      <ol className="mt-4 grid gap-2">
        {RULES.map(([title, body], i) => (
          <li
            key={title}
            className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left"
          >
            <span
              className="pof-title flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-fuchsia-400 text-lg text-fuchsia-200 shadow-[0_0_10px_#ff2bd6]"
            >
              {i + 1}
            </span>
            <div>
              <div className="pof-label text-base text-cyan-100">{title}</div>
              <div className="pof-body text-xs text-white/75">{body}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
