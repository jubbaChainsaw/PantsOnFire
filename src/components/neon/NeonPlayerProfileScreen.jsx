import { useMemo, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { ACHIEVEMENT_DEFINITIONS } from '../../data/playerProfile/achievements.js';
import {
  REFERRAL_SECRET_THEME_UNLOCKS,
  referralConvertedProgress,
  referralSecretThemeUnlocked,
} from '../../data/referralSecretThemes.js';
import {
  achievementProgressFor,
} from '../../data/playerProfile/profileProgress.js';
import {
  deckCollectionCounts,
  listDefaultUnlockableBacks,
} from '../../data/playerProfile/deckCatalog.js';
import {
  favoriteThemeName,
  profileWinRate,
} from '../../data/playerProfile/profileModel.js';
import { resolveBundledAssetSrc } from '../../lib/publicAssetUrl.js';
import { defaultClassicBackSrc } from '../../data/playerProfile/deckCatalog.js';
import { getThemeCardAssets } from '../../data/themeAssets.js';

const TABS = [
  { id: 'stats', label: 'Stats' },
  { id: 'history', label: 'History' },
  { id: 'decks', label: 'Decks' },
  { id: 'achievements', label: 'Achievements' },
];

function StatTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
      <div className="pof-heading text-2xl text-yellow-200">{value}</div>
      <div className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-white/55">
        {label}
      </div>
    </div>
  );
}

export default function NeonPlayerProfileScreen({
  onBack,
  profile,
  unlockedAltCardThemeKeys = [],
  onSelectDefaultBack,
  referralSummary = null,
  cloudSignedIn = false,
}) {
  const [tab, setTab] = useState('stats');
  const stats = profile?.stats || {};
  const deckCounts = useMemo(
    () => deckCollectionCounts(profile, unlockedAltCardThemeKeys),
    [profile, unlockedAltCardThemeKeys],
  );
  const unlockableBacks = listDefaultUnlockableBacks();
  const unlockedBackSlugs = new Set(profile?.unlockedDefaultBackSlugs || []);
  const referralStats = referralSummary?.stats || {};
  const inviteUrl = referralSummary?.inviteUrl || '';

  async function copyInviteLink() {
    if (!inviteUrl || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      /* ignore */
    }
  }

  async function shareInviteLink() {
    if (!inviteUrl || typeof navigator === 'undefined') return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pants on Fire',
          text: 'Join me on Pants on Fire — find the liar!',
          url: inviteUrl,
        });
        return;
      } catch {
        /* fall through */
      }
    }
    await copyInviteLink();
  }

  return (
    <div
      className="pof-shell min-h-[100dvh] px-3 pb-8 pt-3"
      data-testid="player-profile-screen"
    >
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="pof-btn pof-focus inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-sm text-white"
            onClick={onBack}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex-1 text-center">
            <div className="pof-heading text-xs tracking-[0.32em] text-cyan-200/85">
              Player profile
            </div>
            <h1 className="pof-heading mt-1 text-2xl text-yellow-200">Your fibber file</h1>
          </div>
          <div className="w-[4.5rem]" />
        </div>

        <div
          className="mt-4 flex flex-wrap justify-center gap-2"
          data-testid="profile-tab-bar"
        >
          {TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              data-testid={`profile-tab-${entry.id}`}
              className={`pof-heading rounded-full border px-3 py-1.5 text-[0.65rem] tracking-wide ${
                tab === entry.id
                  ? 'border-yellow-300/70 bg-yellow-400/20 text-yellow-100'
                  : 'border-white/15 bg-black/30 text-white/75'
              }`}
              onClick={() => setTab(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {tab === 'stats' && (
          <div className="mt-5 space-y-4" data-testid="profile-stats-panel">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Games played" value={stats.gamesPlayed || 0} />
              <StatTile label="Games hosted" value={stats.gamesHosted || 0} />
              <StatTile label="Win rate" value={`${profileWinRate(profile)}%`} />
              <StatTile label="Favourite theme" value={favoriteThemeName(profile)} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatTile label="Times liar" value={stats.timesLiar || 0} />
              <StatTile label="Liar not caught" value={stats.timesLiarNotCaught || 0} />
              <StatTile label="Liar caught" value={stats.timesLiarCaught || 0} />
              <StatTile label="Accused innocent" value={stats.timesAccusedInnocent || 0} />
              <StatTile label="Votes correct" value={stats.votesCorrect || 0} />
              <StatTile label="Votes wrong" value={stats.votesIncorrect || 0} />
            </div>
            {onSelectDefaultBack ? (
              <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-4">
                <div className="pof-heading text-sm text-fuchsia-100">
                  Default theme card back
                </div>
                <p className="mt-1 text-xs text-white/65">
                  Host pick for Default theme games (Classic or unlocked backs).
                </p>
                <div
                  className="mt-3 flex flex-wrap gap-2"
                  data-testid="default-back-picker"
                >
                  <button
                    type="button"
                    data-testid="default-back-classic"
                    className={`rounded-xl border p-1 ${
                      profile?.selectedDefaultBackSlug === 'classic'
                        ? 'border-yellow-300'
                        : 'border-white/15'
                    }`}
                    onClick={() => onSelectDefaultBack('classic')}
                  >
                    <img
                      src={resolveBundledAssetSrc(defaultClassicBackSrc())}
                      alt=""
                      className="h-16 w-11 object-cover rounded-lg"
                    />
                  </button>
                  {unlockableBacks.map((back) => {
                    const unlocked = unlockedBackSlugs.has(back.slug);
                    return (
                      <button
                        key={back.slug}
                        type="button"
                        data-testid={`default-back-${back.slug}${unlocked ? '' : '-locked'}`}
                        disabled={!unlocked}
                        className={`rounded-xl border p-1 ${
                          profile?.selectedDefaultBackSlug === back.slug
                            ? 'border-yellow-300'
                            : 'border-white/15'
                        } ${unlocked ? '' : 'opacity-45'}`}
                        onClick={() => unlocked && onSelectDefaultBack(back.slug)}
                        title={unlocked ? back.name : 'Unlock via achievements'}
                      >
                        <img
                          src={resolveBundledAssetSrc(back.src)}
                          alt=""
                          className="h-16 w-11 object-cover rounded-lg grayscale-[0.35]"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {tab === 'history' && (
          <div className="mt-5" data-testid="profile-history-panel">
            {(profile?.recentGames || []).length === 0 ? (
              <p className="text-center text-sm text-white/60">No games logged yet.</p>
            ) : (
              <ul className="space-y-2">
                {profile.recentGames.map((game) => (
                  <li
                    key={game.id}
                    className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="pof-heading text-cyan-100">{game.themeName}</span>
                      <span className="text-xs text-white/50">
                        {new Date(game.dateIso).toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      {game.mode} · {game.role} · {game.result}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === 'decks' && (
          <div className="mt-5" data-testid="profile-decks-panel">
            <div className="pof-heading text-center text-sm text-emerald-200">
              Decks {deckCounts.unlocked}/{deckCounts.total}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {deckCounts.entries.map((entry) => (
                <div
                  key={entry.id}
                  data-testid={`deck-entry-${entry.id}`}
                  className={`rounded-xl border p-1 text-center ${
                    entry.isUnlocked
                      ? 'border-white/15 bg-black/25'
                      : 'border-white/10 bg-black/40 opacity-50'
                  }`}
                  title={entry.unlockHint}
                >
                  <img
                    src={resolveBundledAssetSrc(entry.src)}
                    alt=""
                    className="mx-auto h-16 w-11 rounded-lg object-cover"
                  />
                  <div className="mt-1 text-[0.55rem] leading-tight text-white/70">
                    {entry.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'achievements' && (
          <div className="mt-5 space-y-3" data-testid="profile-achievements-panel">
            {REFERRAL_SECRET_THEME_UNLOCKS.map((entry) => {
              const themeUnlocked = referralSecretThemeUnlocked(profile, entry.themeName);
              const progress = referralConvertedProgress(
                referralStats,
                entry.conversionsRequired,
              );
              const showShare = cloudSignedIn && !themeUnlocked;
              const thumbSrc = themeUnlocked
                ? getThemeCardAssets(entry.themeName).promptCardBackClassic
                : entry.pack.mysteryIcon;
              return (
                <div
                  key={entry.id}
                  data-testid={`achievement-row-${entry.id}`}
                  className={`rounded-2xl border p-3 ${
                    themeUnlocked
                      ? 'border-emerald-300/40 bg-emerald-500/10'
                      : 'border-violet-300/30 bg-black/35'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={resolveBundledAssetSrc(thumbSrc)}
                      alt=""
                      className={`h-14 w-10 shrink-0 rounded-lg object-cover ${
                        themeUnlocked ? '' : 'opacity-90'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="pof-heading text-sm text-yellow-200">
                            {themeUnlocked ? entry.themeName : entry.achievementTitle}
                          </div>
                          {!themeUnlocked ? (
                            <p className="mt-1 text-xs text-white/65">
                              Friends must sign up with your invite link, then make their first
                              paid upgrade or purchase.
                            </p>
                          ) : null}
                        </div>
                        {themeUnlocked ? (
                          <span className="pof-heading shrink-0 text-[0.6rem] text-emerald-200">
                            Unlocked
                          </span>
                        ) : (
                          <span className="pof-heading shrink-0 text-[0.6rem] text-violet-200">
                            ?
                          </span>
                        )}
                      </div>
                      {!themeUnlocked ? (
                        <>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full bg-gradient-to-r from-violet-400 to-fuchsia-300"
                              style={{ width: `${Math.round(progress.ratio * 100)}%` }}
                            />
                          </div>
                          <div className="mt-1 text-[0.62rem] text-white/50">
                            {progress.current}/{progress.target} friends upgraded
                          </div>
                        </>
                      ) : null}
                      {showShare ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="pof-btn pof-focus rounded-full border border-fuchsia-300/45 bg-fuchsia-500/15 px-3 py-1 text-xs text-fuchsia-100"
                            data-testid={`referral-share-${entry.pack.id}`}
                            onClick={() => shareInviteLink()}
                          >
                            Share my invite link
                          </button>
                          <button
                            type="button"
                            className="pof-btn pof-focus rounded-full border border-white/20 px-3 py-1 text-xs text-white"
                            data-testid={`referral-copy-${entry.pack.id}`}
                            onClick={() => copyInviteLink()}
                          >
                            Copy link
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            {ACHIEVEMENT_DEFINITIONS.map((achievement) => {
              const progress = achievementProgressFor(profile, achievement);
              return (
                <div
                  key={achievement.id}
                  data-testid={`achievement-row-${achievement.id}`}
                  className={`rounded-2xl border p-3 ${
                    progress.unlocked
                      ? 'border-emerald-300/40 bg-emerald-500/10'
                      : 'border-white/10 bg-black/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="pof-heading text-sm text-yellow-200">
                        {achievement.name}
                      </div>
                      <p className="mt-1 text-xs text-white/70">{achievement.description}</p>
                    </div>
                    {progress.unlocked ? (
                      <span className="pof-heading text-[0.6rem] text-emerald-200">Unlocked</span>
                    ) : null}
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-fuchsia-400 to-yellow-300"
                      style={{ width: `${Math.round(progress.ratio * 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[0.62rem] text-white/50">
                    {progress.current}/{progress.target}
                    {achievement.reward?.type === 'defaultBack'
                      ? ` · Reward: ${achievement.reward.slug} card back`
                      : achievement.reward?.type === 'themeName'
                        ? ` · Reward: ${achievement.reward.themeName} theme`
                        : ''}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
