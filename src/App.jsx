import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Users, EyeOff, Trophy, TimerReset, PlusCircle, Vote,
  SkipForward, Star, Flame, Dice6, Minus, Settings, ShoppingBag, Play,
  ChevronUp, ChevronDown, SlidersHorizontal, CheckCircle2, XCircle,
  Wifi, KeyRound, Copy, Mic, MicOff, Radio,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog';
import { Switch } from './components/ui/switch';
import { PASS_THE_PHONE_ROUND_TYPES, ROUND_TYPES } from './data/roundTypes';
import { THEME_META } from './data/themes';
import { getThemeAssets } from './data/themeAssets';
import { NAME_POOLS, randomNameFromTheme } from './data/names';
import { COPY_BANK, createCopyPicker } from './data/gameTextContent';
import {
  DEFAULT_CATEGORIES,
  OPINION_ROUNDS,
  MEDIA_ROUNDS,
  GRILL_EM_ROUNDS,
  BANNED_WORD_BANK,
  sanitizeBannedWords,
} from './data/categories';
import { PICTURE_DLC_MANIFESTS } from './data/pictureDlcManifests';
import {
  createLobbyTransport,
  createLobbyOnServer,
  createOnlinePlayer,
  joinLobbyOnServer,
  leaveLobbyOnServer,
  resumeLobbySessionOnServer,
  startLobbyOnServer,
  toGamePlayers,
} from './online/lobbyTransport';

const LOGO_SRC = '/assets/images/logo.png';
const FLAME_SRC = '/assets/images/flame-placeholder.svg';
const HEARTBEAT_SFX_SRC = '/assets/sfx/heartbeat.mp3';
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const ONLINE_VOICE_ACTIVE_SCREENS = new Set(['discussion', 'grill', 'round-type-choice', 'category-choice', 'results']);
const ONLINE_CONNECTION_ACTIVE_SCREENS = new Set(['online-lobby-created', 'online-lobby-waiting']);

function shuffle(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function createPlayers(count = 3) {
  return Array.from({ length: count }, (_, i) => ({ id: `p-${Date.now()}-${i + 1}`, name: `Player ${i + 1}`, score: 0 }));
}
function getStored(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}
function setStored(key, value) { if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(value)); }
function getOrCreatePersistentClientId() {
  if (typeof window === 'undefined') return `ocl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const storageKey = 'imposter-online-client-id-v1';
  const existing = String(window.localStorage.getItem(storageKey) || '').trim();
  if (existing) return existing;
  const created = `ocl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(storageKey, created);
  return created;
}
function getStoredOnlineSession() {
  return getStored('imposter-online-session-v1', null);
}
function setStoredOnlineSession(session) {
  if (!session) {
    if (typeof window !== 'undefined') window.localStorage.removeItem('imposter-online-session-v1');
    return;
  }
  setStored('imposter-online-session-v1', session);
}
function normalizeStoredOnlineSession(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const lobbyCode = String(raw.lobbyCode || '').trim().toUpperCase();
  const playerId = String(raw.playerId || '').trim();
  const role = raw.role === 'host' ? 'host' : (raw.role === 'player' ? 'player' : '');
  if (!lobbyCode || !playerId || !role) return null;
  const sessionToken = String(raw.sessionToken || '').trim();
  return {
    lobbyCode,
    role,
    playerId,
    playerName: String(raw.playerName || '').trim(),
    hostName: String(raw.hostName || '').trim(),
    sessionToken: sessionToken || '',
  };
}
function mapLobbyErrorToMessage(error, fallback = 'Unable to complete online lobby request.') {
  const code = error?.code || error?.payload?.error || '';
  if (code === 'lobby-not-found') return 'Lobby not found. Ask the host to regenerate and share a fresh code.';
  if (code === 'lobby-already-started') return 'This lobby already started. Ask the host for a new code.';
  if (code === 'session-token-required') return 'Session token missing. Rejoin the lobby from a fresh code.';
  if (code === 'invalid-session-token') return 'Session expired or invalid. Rejoin the lobby from a fresh code.';
  if (code === 'lobby-session-expired' || code === 'session-player-missing') return 'Session expired because this player left the lobby.';
  if (code === 'host-only') return 'Only the host can start this lobby.';
  if (code === 'not-enough-players') return `Need at least ${MIN_PLAYERS} players before starting.`;
  if (code === 'player-id-required') return 'Unable to leave lobby: missing player identity.';
  return fallback;
}
function getCombinedCategories(customCategories) { return [...DEFAULT_CATEGORIES, ...customCategories]; }
function getGrillQuestionsPerPlayer(playerCount) {
  if (!playerCount || playerCount < 1) return 1;
  return Math.max(1, Math.round(20 / playerCount));
}

function generateLobbyCode(length = 6) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function normalizePackWeights(rawWeights = {}, manifests = []) {
  const result = {};
  manifests.forEach((manifest) => {
    const id = manifest?.id;
    if (!id) return;
    const fallback = manifest.releaseChannel === 'base' ? 3 : 1;
    const value = Number(rawWeights?.[id]);
    result[id] = Number.isFinite(value) && value >= 0 ? value : fallback;
  });
  return result;
}

function normalizeEnabledPicturePacks(rawEnabled = {}, manifests = []) {
  const result = {};
  manifests.forEach((manifest) => {
    const id = manifest?.id;
    if (!id) return;
    const enabledByManifest = manifest.enabled !== false;
    result[id] = rawEnabled?.[id] === undefined ? enabledByManifest : Boolean(rawEnabled[id]);
  });
  return result;
}

function normalizeEnabledPictureReleaseChannels(raw = {}, manifests = []) {
  const channels = new Set(
    manifests
      .map((manifest) => manifest?.releaseChannel || 'unknown')
      .filter(Boolean)
  );
  const result = {};
  channels.forEach((channel) => {
    result[channel] = raw?.[channel] === undefined ? true : Boolean(raw[channel]);
  });
  return result;
}

function isVoiceEnabledForScreen(screen) {
  return ONLINE_VOICE_ACTIVE_SCREENS.has(screen);
}

function applyPicturePackSelection(
  promptOptions,
  selectedRoundTypeId,
  enabledPicturePacks,
  picturePackWeights,
  enabledPictureReleaseChannels,
  picturePackReleaseChannelsById
) {
  if (selectedRoundTypeId !== 'picture') return promptOptions;
  const enabled = promptOptions.filter((item) => {
    const packId = item.prompt?.picturePackId;
    const releaseChannel = picturePackReleaseChannelsById?.[packId] || 'unknown';
    const channelEnabled = enabledPictureReleaseChannels?.[releaseChannel] !== false;
    return enabledPicturePacks[packId] !== false && channelEnabled;
  });
  const source = enabled.length ? enabled : promptOptions;
  const atLeastOnePositiveWeight = source.some((item) => {
    const packId = item.prompt?.picturePackId;
    const weight = Math.max(0, Number(picturePackWeights?.[packId] ?? 1));
    return weight > 0;
  });
  const weighted = source.flatMap((item) => {
    const packId = item.prompt?.picturePackId;
    const weight = Math.max(0, Number(picturePackWeights?.[packId] ?? 1));
    const copies = Math.min(8, atLeastOnePositiveWeight ? Math.round(weight) : 1);
    if (copies <= 0) return [];
    return Array.from({ length: copies }, () => item);
  });
  return weighted.length ? weighted : source;
}

function buildRound(
  players,
  category,
  roundNumber,
  liarCount = 1,
  recentPromptKeys = [],
  mode = 'classic',
  selectedRoundTypeId = null,
  grillSettings = { micEnabled: true, ttsEnabled: true },
  adultMode = false,
  picturePackConfig = {
    enabledPacks: {},
    weights: {},
    enabledReleaseChannels: {},
    releaseChannelsByPackId: {},
  }
) {
  const selectedRoundType = selectedRoundTypeId
    ? ROUND_TYPES[selectedRoundTypeId]
    : pickRandom(PASS_THE_PHONE_ROUND_TYPES);
  let promptOptions = [];

  if (selectedRoundType.id === 'prompt') {
    promptOptions = (category.prompts || []).map((prompt, index) => ({ prompt, key: `prompt::${category.id}::${index}` }));
  } else if (selectedRoundType.id === 'opinion') {
    promptOptions = OPINION_ROUNDS.map((prompt, index) => ({ prompt, key: `opinion::global::${index}` }));
  } else if (selectedRoundType.id === 'grill') {
    promptOptions = GRILL_EM_ROUNDS.map((prompt, index) => ({ prompt, key: `grill::global::${index}` }));
  } else {
    promptOptions = (MEDIA_ROUNDS[selectedRoundType.id] || []).map((prompt, index) => ({ prompt, key: `${selectedRoundType.id}::global::${index}` }));
  }
  promptOptions = applyPicturePackSelection(
    promptOptions,
    selectedRoundType.id,
    picturePackConfig.enabledPacks,
    picturePackConfig.weights,
    picturePackConfig.enabledReleaseChannels,
    picturePackConfig.releaseChannelsByPackId
  );

  const ageFilteredOptions = adultMode ? promptOptions : promptOptions.filter((item) => !item.prompt?.adultOnly);
  if (!ageFilteredOptions.length) return null;
  const filteredOptions = ageFilteredOptions.filter((item) => !recentPromptKeys.includes(item.key));
  const selected = pickRandom(filteredOptions.length ? filteredOptions : ageFilteredOptions);
  const liarIds = shuffle(players).slice(0, Math.max(1, Math.min(liarCount, players.length - 1))).map((p) => p.id);
  const bannedWords = sanitizeBannedWords(category.name, selected.prompt.hint, selected.prompt.main, selected.prompt.imposter, BANNED_WORD_BANK[selected.key] || []);
  const mediaByPlayerId = selectedRoundType.id === 'picture'
    ? Object.fromEntries(
      players.map((player) => [
        player.id,
        liarIds.includes(player.id)
          ? (selected.prompt.imposterImageSrc || null)
          : (selected.prompt.mainImageSrc || null),
      ])
    )
    : {};

  return {
    roundNumber,
    roundTypeId: selectedRoundType.id,
    roundTypeName: selectedRoundType.name,
    roundTypeTagline: selectedRoundType.tagline,
    categoryId: category.id,
    categoryLabel: category.name,
    categoryEmoji: category.emoji,
    promptKey: selected.key,
    hint: selected.prompt.hint,
    commonPrompt: selected.prompt.main,
    imposterPrompt: selectedRoundType.id === 'opinion' ? null : selected.prompt.imposter,
    aiPrompt: selected.prompt.aiPrompt || null,
    mediaPreviewLabel: selected.prompt.previewLabel || null,
    mediaPackId: selected.prompt.picturePackId || null,
    isAdultPrompt: Boolean(selected.prompt.adultOnly),
    bannedWords: mode === 'chaos' ? bannedWords : [],
    mode,
    imposterIds: liarIds,
    chooserId: pickRandom(players).id,
    leaderId: pickRandom(players).id,
    grillData: {
      questionsPerPlayer: getGrillQuestionsPerPlayer(players.length),
      micEnabled: grillSettings.micEnabled ?? true,
      ttsEnabled: grillSettings.ttsEnabled ?? true,
      transcript: [],
      askedCounts: {},
    },
    mediaByPlayerId,
    promptsByPlayerId: Object.fromEntries(
      players.map((player) => {
        if (selectedRoundType.id === 'opinion') return [player.id, selected.prompt.main];
        if (selectedRoundType.id === 'grill') return [player.id, liarIds.includes(player.id) ? selected.prompt.aiPrompt : 'Interrogate the AI to discover the hidden prompt.'];
        return [player.id, liarIds.includes(player.id) ? selected.prompt.imposter : selected.prompt.main];
      })
    ),
  };
}

function scoreRound(players, round, votesByPlayerId) {
  const tally = {};
  for (const voterId of Object.keys(votesByPlayerId)) {
    const votedFor = votesByPlayerId[voterId];
    if (!votedFor) continue;
    tally[votedFor] = (tally[votedFor] || 0) + 1;
  }
  const liarIds = round.imposterIds || [];
  const topVotes = Math.max(0, ...Object.values(tally));
  const caughtLiars = liarIds.filter((id) => (tally[id] || 0) > 0 && (tally[id] || 0) === topVotes);
  const imposterCaught = caughtLiars.length === liarIds.length;
  const isGrillRound = round.roundTypeId === 'grill';
  const roundGains = {};
  const roundBreakdown = {};
  const nextPlayers = players.map((player) => {
    let gain = 0;
    let voteHit = 0;
    let liarSurvived = 0;
    let grillTeamBonus = 0;
    let grillLiarSwing = 0;
    if (liarIds.includes(votesByPlayerId[player.id])) {
      gain += 1;
      voteHit = 1;
    }
    if (liarIds.includes(player.id) && !imposterCaught) {
      gain += 2;
      liarSurvived = 2;
    }
    if (isGrillRound) {
      if (imposterCaught) {
        gain += 2;
        grillTeamBonus = 2;
      } else if (liarIds.includes(player.id)) {
        gain += 2;
        grillLiarSwing = 2;
      } else {
        gain -= 1;
        grillLiarSwing = -1;
      }
    }
    roundGains[player.id] = gain;
    roundBreakdown[player.id] = { voteHit, liarSurvived, grillTeamBonus, grillLiarSwing };
    return { ...player, score: Math.max(0, player.score + gain) };
  });
  return { nextPlayers, tally, imposterCaught, roundGains, roundBreakdown };
}

function GlassPanel({ children, className = '' }) {
  return <div className={`backdrop-blur-xl bg-white/8 border border-white/10 shadow-2xl ${className}`}>{children}</div>;
}
function ZanyAccentBurst({ className = '' }) {
  return <div className={`pointer-events-none absolute ${className}`}><div className="relative h-16 w-16"><div className="absolute inset-0 rotate-12 rounded-[30%] bg-fuchsia-500/25 blur-xl" /><div className="absolute left-6 top-0 h-16 w-2 rounded-full bg-yellow-300" /><div className="absolute left-0 top-6 h-16 w-2 rounded-full bg-cyan-300 rotate-90 origin-top-left" /></div></div>;
}
function LightningBolt({ className = '' }) {
  return <div className={`pointer-events-none absolute ${className}`}><div className="text-yellow-300 drop-shadow-[0_0_12px_rgba(255,220,0,0.95)] text-4xl font-black">⚡</div></div>;
}
function TopFrame({ children, theme = 'Default' }) {
  const gradient = THEME_META[theme]?.gradient || THEME_META.Default.gradient;
  return (
    <div className="min-h-screen overflow-hidden text-white bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.10),_transparent_30%),linear-gradient(135deg,#120038_10%,#0028a8_35%,#16003f_60%,#031325_100%)] relative">
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${gradient}`} />
      <ZanyAccentBurst className="left-5 top-12" />
      <ZanyAccentBurst className="right-5 bottom-20 scale-125" />
      <LightningBolt className="left-8 bottom-28" />
      <LightningBolt className="right-8 top-24 -rotate-12" />
      <div className="relative z-10 p-4 md:p-8">{children}</div>
    </div>
  );
}
function ScoreStrip({ players, roundNumber, totalRounds }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <GlassPanel className="rounded-[2rem] p-4 border-fuchsia-400/20 bg-black/25">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div><div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Match progress</div><div className="text-lg font-black text-yellow-300">Round {roundNumber} of {totalRounds}</div></div>
        <div className="flex flex-wrap gap-2">{sorted.map((player, index) => <Badge key={player.id} className="rounded-full bg-black/40 border border-fuchsia-400/30 px-3 py-1.5 text-white">{index === 0 ? '👑 ' : ''}{player.name}: {player.score}</Badge>)}</div>
      </div>
    </GlassPanel>
  );
}
function ThemeArt({ src, alt, className = '' }) {
  if (!src) return null;
  return <img src={src} alt={alt} className={className} onError={(event) => { event.currentTarget.style.display = 'none'; }} />;
}
function RoundTypeLogo({ src, alt, className = '' }) {
  if (!src) return null;
  return <img src={src} alt={alt} className={className} onError={(event) => { event.currentTarget.style.display = 'none'; }} />;
}
const MASCOT_BY_ROUND_TYPE = {
  prompt: { name: 'Captain Spark', face: '🎤', blurb: 'Classic chaos host.' },
  opinion: { name: 'Captain Spark', face: '🎭', blurb: 'Debate instigator.' },
  picture: { name: 'Captain Spark', face: '🖼️', blurb: 'Flash-frame ringmaster.' },
  grill: { name: 'Blaze Byte', face: '🤖', blurb: "AI host for Grill 'Em." },
};
function RoundMascot({ roundTypeId }) {
  const mascot = MASCOT_BY_ROUND_TYPE[roundTypeId] || MASCOT_BY_ROUND_TYPE.prompt;
  return (
    <GlassPanel className="rounded-[1.5rem] p-4 border-cyan-400/20 bg-black/25">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{mascot.face}</div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/55">Host mascot</div>
          <div className="text-lg font-black text-yellow-300">{mascot.name}</div>
          <div className="text-sm text-cyan-200">{mascot.blurb}</div>
        </div>
      </div>
    </GlassPanel>
  );
}
function ThemeIconStrip({ src, alt }) {
  return (
    <ThemeArt
      src={src}
      alt={alt}
      className="w-full rounded-xl border border-white/15 bg-black/20 p-1.5"
    />
  );
}
function HostIntroScreen({ round, stingerLine, onContinue, theme }) {
  const mascot = MASCOT_BY_ROUND_TYPE[round.roundTypeId] || MASCOT_BY_ROUND_TYPE.prompt;
  const themeAssets = getThemeAssets(round.roundTypeId === 'grill' ? 'GrillEm' : theme);
  const introLine = round.roundTypeId === 'grill'
    ? `${mascot.name} is live. Mic up and question the AI.`
    : `${mascot.name} is in the building. Let the chaos begin.`;
  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/20 bg-black/25 text-center overflow-hidden relative">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="space-y-5"
          >
            <div className="text-xs uppercase tracking-[0.35em] text-white/50">Host enters</div>
            <motion.div
              animate={{ scale: [1, 1.06, 1], rotate: [0, -2, 2, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
              className="text-7xl"
            >
              {mascot.face}
            </motion.div>
            <h2 className="text-5xl font-black text-yellow-300">{mascot.name}</h2>
            <p className="text-cyan-200 font-semibold">{introLine}</p>
            <ThemeArt src={themeAssets.characterCard} alt={`${theme} presenter`} className="mx-auto w-full max-w-[260px] rounded-2xl border border-white/15 bg-black/30 p-2" />
            <ThemeIconStrip src={themeAssets.iconSheet} alt={`${theme} icon strip`} />
            {round.roundTypeId === 'grill' && <p className="text-yellow-200 font-semibold">Each player gets {round.grillData?.questionsPerPlayer || 1} questions this round.</p>}
            {stingerLine && <p className="text-white/85 italic">"{stingerLine}"</p>}
            <div className="text-white/70">{round.roundTypeName} • {round.categoryEmoji} {round.categoryLabel}</div>
          </motion.div>
          <Button className="rounded-[1.5rem] h-14 px-8 mt-8 bg-yellow-300 text-zinc-950 border-2 border-white" onClick={onContinue}>
            Start reveal
          </Button>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function RulesSplashScreen({ mode, onContinue, theme, isOnlineMode = false }) {
  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/20 bg-black/25 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">How to Play</div>
          <h2 className="text-4xl font-black mt-3 text-yellow-300">Quick Rules</h2>
          <div className="mt-6 grid gap-3 text-left">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {isOnlineMode
                ? 'Online mode: each player checks prompts on their own device. No phone passing.'
                : 'Pass the phone one player at a time so only that player sees their card.'}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              Give one related clue out loud during discussion, but never say your exact prompt.
            </div>
            {isOnlineMode && (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                Voice party chat is active during clue/discussion phases, then auto-pauses during prompt/instruction phases.
              </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              You cannot use any words from the <span className="font-semibold text-cyan-200">category</span> or <span className="font-semibold text-cyan-200">hint</span> in your clue.
            </div>
            {mode === 'chaos' && <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">Chaos mode: you also cannot say any of the 5 banned words shown on your reveal card.</div>}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Vote for the liar. Correct votes score points. Uncaught liars score extra.</div>
          </div>
          <Button className="rounded-[1.5rem] h-14 px-8 mt-8 bg-yellow-300 text-zinc-950 hover:bg-yellow-200 border-2 border-white" onClick={onContinue}>Start Round One</Button>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function HomeScreen({ onNavigate, homeLine, onlineLobbyLine, adultMode }) {
  const themeAssets = getThemeAssets('Default');
  return (
    <TopFrame theme="Default">
      <div className="min-h-[calc(100vh-2rem)] px-2 flex items-center justify-center">
        <div className="w-full max-w-xl text-center space-y-6">
          {adultMode && <GlassPanel className="rounded-[1.4rem] p-3 border-red-400/30 bg-red-500/15"><div className="text-xs uppercase tracking-[0.25em] text-red-200 font-black">18+ Active</div><div className="text-sm text-red-100/90 mt-1">Adult prompt pack is enabled for this session.</div></GlassPanel>}
          <GlassPanel className="rounded-[2.5rem] p-6 md:p-8 border-fuchsia-400/30 bg-black/30 overflow-hidden relative">
            <img src={LOGO_SRC} alt="Logo placeholder" className="mx-auto w-full max-w-md object-contain" />
            <p className="mt-4 text-white/80 text-sm md:text-base">{homeLine}</p>
            <ThemeArt src={themeAssets.uiBanner} alt="Default theme banner" className="mx-auto mt-4 w-full max-w-md rounded-2xl border border-white/15 bg-black/20" />
            <ThemeIconStrip src={themeAssets.iconSheet} alt="Default icon sheet" />
          </GlassPanel>
          <div className="grid gap-4">
            <Button className="h-16 rounded-[1.8rem] text-lg bg-yellow-300 text-zinc-950 hover:bg-yellow-200 border-2 border-white" onClick={() => onNavigate('setup')}><Play className="mr-2 h-5 w-5" />Setup Game</Button>
            <Button className="h-16 rounded-[1.8rem] text-lg bg-cyan-500/20 text-white hover:bg-cyan-500/30 border border-cyan-300/40" onClick={() => onNavigate('online-setup')}><Wifi className="mr-2 h-5 w-5" />Create Online Lobby</Button>
            <Button className="h-16 rounded-[1.8rem] text-lg bg-indigo-500/15 text-white hover:bg-indigo-500/30 border border-indigo-300/30" onClick={() => onNavigate('online-join')}><KeyRound className="mr-2 h-5 w-5" />Join Online Lobby</Button>
            <Button className="h-16 rounded-[1.8rem] text-lg bg-fuchsia-500/15 text-white hover:bg-fuchsia-500/25 border border-fuchsia-400/30" onClick={() => onNavigate('store')}><ShoppingBag className="mr-2 h-5 w-5" />Store</Button>
            <Button className="h-16 rounded-[1.8rem] text-lg bg-cyan-500/15 text-white hover:bg-cyan-500/25 border border-cyan-400/30" onClick={() => onNavigate('settings')}><Settings className="mr-2 h-5 w-5" />Settings</Button>
          </div>
          <GlassPanel className="rounded-[2rem] p-5 border-white/10 bg-black/25 text-left"><div className="text-xs uppercase tracking-[0.3em] text-white/45">Online lobbies beta</div><div className="mt-2 text-lg font-black text-cyan-300">Per-device prompts + party voice phases</div><div className="mt-2 text-sm text-white/70">{onlineLobbyLine}</div></GlassPanel>
        </div>
      </div>
    </TopFrame>
  );
}
function OnlineLobbySetupScreen({ hostName, setHostName, onBack, onContinue, nameTheme }) {
  const canContinue = hostName.trim().length > 0;
  return (
    <TopFrame theme={nameTheme}>
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/20 bg-black/25">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Online Host Setup</div>
          <h2 className="text-4xl font-black mt-3 text-yellow-300">Create your lobby</h2>
          <p className="text-white/75 mt-2">Set your host name first, then configure full game rules and generate a lobby code.</p>
          <div className="mt-6 space-y-2">
            <Label className="text-white/80">Host display name</Label>
            <div className="flex gap-2">
              <Input value={hostName} onChange={(event) => setHostName(event.target.value)} className="rounded-2xl bg-white/5 border border-white/10 text-white" />
              <Button className="rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-100 px-4" onClick={() => setHostName(randomNameFromTheme(nameTheme, []))}>
                <Dice6 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-[1.4rem] bg-white/5 border border-white/10 px-4 py-2 text-white" onClick={onBack}>Back</Button>
            <Button className="rounded-[1.4rem] bg-yellow-300 text-zinc-950 border-2 border-white px-6 py-2" disabled={!canContinue} onClick={onContinue}>
              Continue to game config
            </Button>
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function OnlineJoinLobbyScreen({ joinCode, setJoinCode, playerName, setPlayerName, onBack, onJoin, joinError = '', nameTheme }) {
  const canJoin = joinCode.trim().length >= 4 && playerName.trim().length > 0;
  return (
    <TopFrame theme={nameTheme}>
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassPanel className="rounded-[2.5rem] p-8 border-indigo-400/25 bg-black/25">
          <div className="text-xs uppercase tracking-[0.35em] text-indigo-200/80">Join Online Lobby</div>
          <h2 className="text-4xl font-black mt-3 text-yellow-300">Enter lobby code</h2>
          <p className="text-white/75 mt-2">Join from your own device. Prompts stay private to your screen.</p>
          <div className="mt-6 grid gap-4">
            <div>
              <Label className="text-white/80">Lobby code</Label>
              <Input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} className="mt-2 rounded-2xl bg-white/5 border border-white/10 text-white uppercase tracking-[0.25em]" />
            </div>
            <div>
              <Label className="text-white/80">Your player name</Label>
              <div className="mt-2 flex gap-2">
                <Input value={playerName} onChange={(event) => setPlayerName(event.target.value)} className="rounded-2xl bg-white/5 border border-white/10 text-white" />
                <Button className="rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-100 px-4" onClick={() => setPlayerName(randomNameFromTheme(nameTheme, []))}>
                  <Dice6 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-[1.4rem] bg-white/5 border border-white/10 px-4 py-2 text-white" onClick={onBack}>Back</Button>
            <Button className="rounded-[1.4rem] bg-yellow-300 text-zinc-950 border-2 border-white px-6 py-2" disabled={!canJoin} onClick={onJoin}>
              Join lobby
            </Button>
          </div>
          {joinError && (
            <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {joinError}
            </div>
          )}
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function OnlineLobbyCodeScreen({ lobbyCode, hostName, players, lobbyStatus, onlineStatusNote = '', onCopyCode, onBack, onStartMatch, nameTheme }) {
  const canStart = players.length >= MIN_PLAYERS && lobbyStatus !== 'started';
  return (
    <TopFrame theme={nameTheme}>
      <div className="mx-auto max-w-4xl space-y-6">
        <GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/25 bg-black/25">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Lobby Generated</div>
          <h2 className="text-4xl font-black mt-3 text-yellow-300">Share this code</h2>
          <p className="text-white/75 mt-2">Host: <span className="font-semibold text-cyan-200">{hostName || 'Host'}</span></p>
          <div className="mt-6 rounded-[1.8rem] border border-cyan-300/40 bg-cyan-500/10 p-5 flex items-center justify-between gap-4">
            <div className="text-4xl font-black tracking-[0.35em] text-cyan-100">{lobbyCode || '------'}</div>
            <Button className="rounded-2xl bg-white/10 border border-white/15 text-white px-4" onClick={onCopyCode}><Copy className="mr-2 h-4 w-4" />Copy</Button>
          </div>
          <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Voice party chat is active during clue/discussion phases, and auto-pauses during instructions + private prompt phases.
          </div>
          <div className="mt-6">
            <div className="text-xs uppercase tracking-[0.25em] text-white/60">
              Connected players ({players.length})
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {players.map((player) => (
                <Badge key={player.id} className="rounded-full bg-white/10 border border-white/10 text-white">{player.name}</Badge>
              ))}
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-[1.4rem] bg-white/5 border border-white/10 px-4 py-2 text-white" onClick={onBack}>Back to home</Button>
            <Button className="rounded-[1.4rem] bg-yellow-300 text-zinc-950 border-2 border-white px-6 py-2" disabled={!canStart} onClick={onStartMatch}>
              {lobbyStatus === 'started' ? 'Match already started' : 'Start online match'}
            </Button>
          </div>
          {onlineStatusNote && (
            <div className="mt-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-xs text-cyan-100">
              {onlineStatusNote}
            </div>
          )}
          {!canStart && lobbyStatus !== 'started' && (
            <div className="mt-3 text-xs text-white/60">
              Need at least {MIN_PLAYERS} players to start.
            </div>
          )}
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function SetupScreen(props) {
  const {
    players, setPlayers, liarCount, setLiarCount, nameTheme, setNameTheme, mode, setMode,
    winCondition, setWinCondition, pointsToWin, setPointsToWin, roundsPerPlayer, setRoundsPerPlayer, enabledCategories, onToggleCategory,
    grillSettings, setGrillSettings, adultMode, categoryCount, onOpenAdmin, onStart, onBack, setupLine, startLabel = 'Start Match', requiredMinPlayers = MIN_PLAYERS,
  } = props;
  const canStart = players.length >= requiredMinPlayers && players.every((p) => p.name.trim().length > 0);
  const maxLiars = Math.max(1, Math.floor(players.length / 2));
  const themeAssets = getThemeAssets(nameTheme);
  const [randomDialogOpen, setRandomDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const themeNames = Object.keys(NAME_POOLS);
  return (
    <TopFrame theme={nameTheme}>
      <div className="mx-auto max-w-7xl space-y-5">
        {adultMode && <GlassPanel className="rounded-[1.4rem] p-3 border-red-400/30 bg-red-500/15"><div className="text-xs uppercase tracking-[0.25em] text-red-200 font-black">18+ Active</div><div className="text-sm text-red-100/90 mt-1">Adult-only prompts and scenarios are enabled.</div></GlassPanel>}
        <ThemeArt src={themeAssets.uiBanner} alt={`${nameTheme} theme banner`} className="w-full rounded-[1.4rem] border border-white/15 bg-black/20" />
        <ThemeIconStrip src={themeAssets.iconSheet} alt={`${nameTheme} icon strip`} />
        <div className="flex items-center justify-between gap-4"><Button className="rounded-[1.4rem] bg-white/5 border border-white/10 px-4 py-2 text-white" onClick={onBack}>Back</Button><div className="text-center"><div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Create Lobby</div><div className="text-white/80 text-sm mt-1">{setupLine}</div></div><div className="w-[72px]" /></div>
        <div className="grid gap-4 md:grid-cols-2"><GlassPanel className="rounded-[2rem] p-5 border-cyan-400/20 bg-black/25"><div className="text-xs uppercase tracking-[0.3em] text-white/50">Players</div><div className="text-5xl font-black text-yellow-300 mt-2">{players.length}</div></GlassPanel><GlassPanel className="rounded-[2rem] p-5 border-orange-400/20 bg-black/25"><div className="text-xs uppercase tracking-[0.3em] text-white/50">Liars</div><div className="text-5xl font-black text-yellow-300 mt-2">{liarCount}</div></GlassPanel></div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="rounded-[2.5rem] p-5 border-fuchsia-400/25 bg-black/25">
            <div className="flex items-center justify-between gap-3 mb-4"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-cyan-300" /><h2 className="text-xl font-black">Player Setup</h2></div><Button className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white" onClick={() => setRandomDialogOpen(true)}><SlidersHorizontal className="mr-2 h-4 w-4 inline" />Random Settings</Button></div>
            <div className="grid gap-3">{players.map((player, index) => <div key={player.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3"><div className="flex items-center justify-between gap-2 mb-2"><Label className="text-white/75 font-semibold">Player {index + 1}</Label><div className="flex gap-2"><Button className="rounded-xl bg-cyan-500/10 border border-cyan-400/20 p-2 text-cyan-100" onClick={() => setPlayers((cur) => cur.map((p) => p.id === player.id ? { ...p, name: randomNameFromTheme(nameTheme, cur.filter((x) => x.id !== player.id).map((x) => x.name)) } : p))}><Dice6 className="h-4 w-4" /></Button><Button className="rounded-xl bg-fuchsia-500/10 border border-fuchsia-400/20 p-2 text-fuchsia-100 disabled:opacity-40" disabled={players.length <= MIN_PLAYERS} onClick={() => setPlayers((cur) => cur.filter((p) => p.id !== player.id))}><Minus className="h-4 w-4" /></Button></div></div><Input value={player.name} onChange={(e) => setPlayers((cur) => cur.map((p) => p.id === player.id ? { ...p, name: e.target.value } : p))} className="rounded-2xl bg-white/5 border border-white/10 text-white" /></div>)}</div>
            <div className="mt-4"><Button className="rounded-[1.5rem] bg-cyan-500/10 border border-cyan-400/20 px-4 py-3 text-cyan-100" disabled={players.length >= MAX_PLAYERS} onClick={() => setPlayers((cur) => [...cur, { id: `p-${Date.now()}-${cur.length + 1}`, name: `Player ${cur.length + 1}`, score: 0 }])}><PlusCircle className="mr-2 h-4 w-4 inline" />Add Player</Button></div>
          </GlassPanel>
          <GlassPanel className="rounded-[2.5rem] p-5 border-yellow-300/20 bg-black/25">
            <div className="flex items-center gap-2 mb-4"><ShieldAlert className="h-5 w-5 text-yellow-300" /><h2 className="text-xl font-black">Rules</h2></div>
            <div className="space-y-4">
              <GlassPanel className="rounded-[1.5rem] p-4 bg-white/5"><div className="flex items-center justify-between"><div><div className="font-semibold">Liar Count</div><div className="text-xs text-white/55 mt-1">Recommended: 1 liar per 4 people.</div></div><div className="flex items-center gap-2"><Button className="rounded-xl bg-white/5 border border-white/10 p-2 text-white" onClick={() => setLiarCount((c) => Math.max(1, c - 1))}><ChevronDown className="h-4 w-4" /></Button><div className="w-14 text-center text-2xl font-black text-yellow-300">{liarCount}</div><Button className="rounded-xl bg-white/5 border border-white/10 p-2 text-white" onClick={() => setLiarCount((c) => Math.min(maxLiars, c + 1))}><ChevronUp className="h-4 w-4" /></Button></div></div></GlassPanel>
              <GlassPanel className="rounded-[1.5rem] p-4 bg-white/5"><div className="font-semibold mb-3">Mode</div><div className="grid grid-cols-2 gap-2"><Button className={`rounded-2xl px-4 py-3 ${mode === 'classic' ? 'bg-yellow-300 text-zinc-950' : 'bg-white/5 border border-white/10 text-white'}`} onClick={() => setMode('classic')}>Classic</Button><Button className={`rounded-2xl px-4 py-3 ${mode === 'chaos' ? 'bg-fuchsia-500 text-white' : 'bg-white/5 border border-white/10 text-white'}`} onClick={() => setMode('chaos')}>Chaos 🔥</Button></div></GlassPanel>
              <GlassPanel className="rounded-[1.5rem] p-4 bg-white/5"><div className="font-semibold mb-3">Game Rules</div><div className="text-xs text-white/55 mb-2">Win condition (choose one)</div><div className="grid grid-cols-2 gap-2"><Button className={`rounded-2xl px-4 py-3 ${winCondition === 'points' ? 'bg-yellow-300 text-zinc-950' : 'bg-white/5 border border-white/10 text-white'}`} onClick={() => setWinCondition('points')}>Points</Button><Button className={`rounded-2xl px-4 py-3 ${winCondition === 'rounds' ? 'bg-fuchsia-500 text-white' : 'bg-white/5 border border-white/10 text-white'}`} onClick={() => setWinCondition('rounds')}>Rounds</Button></div>{winCondition === 'points' ? <><div className="text-xs text-white/55 mt-4 mb-2">Points to win</div><div className="grid grid-cols-3 gap-2">{[10,15,20].map((v) => <Button key={v} className={`rounded-2xl px-4 py-3 ${pointsToWin === v ? 'bg-yellow-300 text-zinc-950' : 'bg-white/5 border border-white/10 text-white'}`} onClick={() => setPointsToWin(v)}>{v}</Button>)}</div></> : <><div className="text-xs text-white/55 mt-4 mb-2">Rounds per player</div><div className="grid grid-cols-3 gap-2">{[1,2,3].map((v) => <Button key={v} className={`rounded-2xl px-4 py-3 ${roundsPerPlayer === v ? 'bg-fuchsia-500 text-white' : 'bg-white/5 border border-white/10 text-white'}`} onClick={() => setRoundsPerPlayer(v)}>{v}</Button>)}</div><div className="text-xs text-cyan-200 mt-3">Total rounds: {players.length * roundsPerPlayer}</div></>}</GlassPanel>
              <GlassPanel className="rounded-[1.5rem] p-4 bg-white/5"><div className="font-semibold mb-3">Grill 'Em Defaults</div><div className="text-xs text-white/55 mb-2">Questions are auto-set each round to target ~20 total questions (based on player count).</div><div className="mt-2 grid grid-cols-2 gap-2"><Button className={`rounded-2xl px-4 py-3 ${grillSettings.micEnabled ? 'bg-emerald-400 text-zinc-950' : 'bg-white/5 border border-white/10 text-white'}`} onClick={() => setGrillSettings((cur) => ({ ...cur, micEnabled: !cur.micEnabled }))}>Mic {grillSettings.micEnabled ? 'On' : 'Off'}</Button><Button className={`rounded-2xl px-4 py-3 ${grillSettings.ttsEnabled ? 'bg-emerald-400 text-zinc-950' : 'bg-white/5 border border-white/10 text-white'}`} onClick={() => setGrillSettings((cur) => ({ ...cur, ttsEnabled: !cur.ttsEnabled }))}>Voice {grillSettings.ttsEnabled ? 'On' : 'Off'}</Button></div><div className="text-xs text-cyan-200 mt-3">Example: 7 players → 3 each, 4 players → 5 each.</div></GlassPanel>
              <GlassPanel className="rounded-[1.5rem] p-4 bg-white/5"><div className="flex items-center justify-between"><div><div className="font-semibold">Category Edit</div><div className="text-xs text-white/55 mt-1">{categoryCount} categories enabled.</div></div><Button className="rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-white" onClick={() => setCategoryDialogOpen(true)}>Edit</Button></div></GlassPanel>
              <div className="grid gap-3 sm:grid-cols-2"><Button className="rounded-[1.5rem] h-14 bg-yellow-300 text-zinc-950 border-2 border-white" onClick={onStart} disabled={!canStart}>{startLabel}</Button><Button className="rounded-[1.5rem] h-14 bg-fuchsia-500/10 border border-fuchsia-400/30 text-white" onClick={onOpenAdmin}>Open Admin</Button></div>
            </div>
          </GlassPanel>
        </div>
      </div>
      <Dialog open={randomDialogOpen}><DialogContent className="max-w-lg rounded-[2rem] bg-[#13002d] p-6 text-white border border-fuchsia-400/20"><DialogHeader><DialogTitle className="text-2xl text-yellow-300">Random Settings</DialogTitle><DialogDescription className="text-white/60">Theme changes names now, with hooks ready for visuals, music and SFX.</DialogDescription></DialogHeader><select value={nameTheme} onChange={(e) => setNameTheme(e.target.value)} className="mt-4 w-full rounded-2xl bg-white/5 border border-white/10 px-3 py-3 text-white">{themeNames.map((theme) => <option key={theme} value={theme} className="text-black">{theme}</option>)}</select><DialogFooter><Button className="rounded-2xl bg-yellow-300 px-4 py-2 text-zinc-950" onClick={() => setRandomDialogOpen(false)}>Done</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={categoryDialogOpen}><DialogContent className="max-w-2xl rounded-[2rem] bg-[#13002d] p-6 text-white border border-fuchsia-400/20"><DialogHeader><DialogTitle className="text-2xl text-yellow-300">Category Edit</DialogTitle><DialogDescription className="text-white/60">Tap categories to enable or disable them for this lobby.</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-2 mt-4">{Object.keys(enabledCategories).map((id) => { const enabled = enabledCategories[id]; const category = DEFAULT_CATEGORIES.find((c) => c.id === id) || { name: id, emoji: '🎲' }; return <button key={id} onClick={() => onToggleCategory(id)} className={enabled ? 'rounded-[1.5rem] p-4 text-left border border-white/20 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20' : 'rounded-[1.5rem] p-4 text-left border border-white/10 bg-white/5 opacity-45'}><div className="flex items-center justify-between gap-3"><div><div className="text-lg font-black">{category.emoji} {category.name}</div><div className="text-xs text-white/60 mt-1">{enabled ? 'Enabled' : 'Disabled'}</div></div>{enabled ? <CheckCircle2 className="h-5 w-5 text-cyan-300" /> : <XCircle className="h-5 w-5 text-white/45" />}</div></button>; })}</div><DialogFooter><Button className="rounded-2xl bg-yellow-300 px-4 py-2 text-zinc-950" onClick={() => setCategoryDialogOpen(false)}>Done</Button></DialogFooter></DialogContent></Dialog>
    </TopFrame>
  );
}
function RevealScreen({ players, currentRevealIndex, round, totalRounds, onNext, passLine, normalLine, liarLine, theme, onlineMode = false, localPlayerName = '' }) {
  const player = players[currentRevealIndex];
  const prompt = round.promptsByPlayerId[player.id];
  const mediaSrc = round.mediaByPlayerId?.[player.id] || null;
  const isLast = currentRevealIndex === players.length - 1;
  const isImposter = (round.imposterIds || []).includes(player.id);
  const [cardFace, setCardFace] = useState('back');
  const [countdownValue, setCountdownValue] = useState(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const themeAssets = getThemeAssets(theme);
  const defaultPromptCards = getThemeAssets('Default');
  const useAdultCardArt = Boolean(round.isAdultPrompt);
  const cardBackSrc = useAdultCardArt
    ? (themeAssets.adultPromptCardBack || defaultPromptCards.adultPromptCardBack)
    : (themeAssets.promptCardBack || defaultPromptCards.promptCardBack);
  const defaultRoundTypeFront = theme === 'Default'
    ? (ROUND_TYPES[round.roundTypeId]?.defaultCardFrontSrc || null)
    : null;
  const cardFrontSrc = useAdultCardArt
    ? (themeAssets.adultPromptCardFront || defaultPromptCards.adultPromptCardFront)
    : (defaultRoundTypeFront || themeAssets.promptCardFront || defaultPromptCards.promptCardFront);
  const roundTypeLogoSrc = ROUND_TYPES[round.roundTypeId]?.logoSrc || null;
  const instructionLine = round.roundTypeId === 'picture'
    ? 'Keep this private. You will reveal a picture prompt.'
    : 'Keep this private. You will reveal your prompt.';

  useEffect(() => {
    if (!isCountingDown) return undefined;
    if (countdownValue === 0) {
      setIsCountingDown(false);
      setCardFace('front');
      return undefined;
    }
    const timer = setTimeout(() => {
      setCountdownValue((value) => (typeof value === 'number' ? value - 1 : 0));
    }, 700);
    return () => clearTimeout(timer);
  }, [isCountingDown, countdownValue]);

  function startRevealCountdown() {
    if (isCountingDown || cardFace === 'front') return;
    setCountdownValue(3);
    setIsCountingDown(true);
  }

  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-3xl space-y-6">
        <ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} />
        <GlassPanel className="rounded-[2.5rem] p-8 text-center border-white/15 bg-black/25">
          <Badge className="rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-white">
            Secret reveal {currentRevealIndex + 1} / {players.length}
          </Badge>
          <h2 className="text-4xl font-black mt-4 text-yellow-300">
            {onlineMode ? `Reveal for ${localPlayerName || player.name}` : `Pass the phone to ${player.name}`}
          </h2>
          <p className="text-cyan-200/90 mt-3 font-medium">{passLine}</p>

          <div className="mt-8 mx-auto w-full max-w-sm [perspective:1200px]">
            <motion.div
              animate={{ rotateY: cardFace === 'front' ? 180 : 0 }}
              transition={{ duration: 0.75, ease: 'easeInOut' }}
              className="relative h-[560px] w-full [transform-style:preserve-3d]"
            >
              <div className="absolute inset-0 overflow-hidden rounded-[2rem] border-2 border-white/25 [backface-visibility:hidden]">
                {cardBackSrc && <img src={cardBackSrc} alt="Prompt card back" className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-black/55" />
                <div className="relative z-10 flex h-full flex-col p-6 text-white">
                  <RoundTypeLogo
                    src={roundTypeLogoSrc}
                    alt={`${round.roundTypeName} logo`}
                    className="mx-auto h-16 w-auto rounded-md border border-white/20 bg-black/25 px-2 py-1"
                  />
                  <div className="text-xs uppercase tracking-[0.3em] text-cyan-200">{round.roundTypeName}</div>
                  <div className="mt-2 text-sm font-semibold text-white/90">Round {round.roundNumber}</div>
                  <div className="mt-5 rounded-2xl border border-white/25 bg-black/35 p-4 text-sm text-white/90">
                    {instructionLine}
                    <div className="mt-2 text-white/70">{round.roundTypeTagline}</div>
                  </div>
                  <div className="mt-auto">
                    <button
                      type="button"
                      onClick={startRevealCountdown}
                      disabled={isCountingDown}
                      className="w-full rounded-xl border border-yellow-200/60 bg-yellow-300/20 py-3 text-xl font-black tracking-[0.2em] text-yellow-100 disabled:opacity-60"
                    >
                      REVEAL
                    </button>
                  </div>
                </div>
                {isCountingDown && typeof countdownValue === 'number' && countdownValue > 0 && (
                  <div className="absolute inset-0 z-20 grid place-items-center bg-black/75">
                    <div className="text-8xl font-black text-yellow-300">{countdownValue}</div>
                  </div>
                )}
              </div>

              <div className={`absolute inset-0 overflow-hidden rounded-[2rem] border-2 [backface-visibility:hidden] [transform:rotateY(180deg)] ${isImposter ? 'border-red-400/60' : 'border-cyan-300/60'}`}>
                {cardFrontSrc && <img src={cardFrontSrc} alt="Prompt card front" className="absolute inset-0 h-full w-full object-cover" />}
                <div className={`absolute inset-0 ${isImposter ? 'bg-red-950/65' : 'bg-slate-950/65'}`} />
                <div className="relative z-10 flex h-full flex-col p-6 text-left text-white">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/75">
                    {round.roundTypeName} • {round.categoryEmoji} {round.categoryLabel}
                  </div>
                  <RoundTypeLogo
                    src={roundTypeLogoSrc}
                    alt={`${round.roundTypeName} logo`}
                    className="mt-3 h-14 w-auto rounded-md border border-white/20 bg-black/25 px-2 py-1"
                  />
                  <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${isImposter ? 'border-orange-300/30 bg-orange-500/10 text-orange-200' : 'border-cyan-300/30 bg-cyan-500/10 text-cyan-200'}`}>
                    {round.hint}
                  </div>
                  {round.mediaPreviewLabel && (
                    <div className="mt-3 rounded-2xl border border-white/20 bg-black/30 p-3 text-sm text-white/80">{round.mediaPreviewLabel}</div>
                  )}
                  {mediaSrc && (
                    <img src={mediaSrc} alt={`${round.hint} visual clue`} className="mt-3 w-full rounded-2xl border border-white/15 bg-black/20" />
                  )}
                  <div className={`mt-4 text-4xl font-black leading-tight ${isImposter ? 'text-yellow-300' : 'text-white'}`}>{prompt}</div>
                  <div className={`mt-3 text-sm font-semibold ${isImposter ? 'text-orange-200' : 'text-cyan-200'}`}>
                    {isImposter ? `🔥 ${liarLine} 🔥` : normalLine}
                  </div>
                  {round.mode === 'chaos' && round.bannedWords.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-red-300">Banned Words</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {round.bannedWords.map((word) => (
                          <span key={word} className="px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 text-xs">{word}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {cardFace === 'front' && (
            <Button className="rounded-[1.5rem] h-16 px-8 mt-7 bg-white/10 border border-white/10 text-white" onClick={onNext}>
              <EyeOff className="mr-2 h-5 w-5 inline" />
              {onlineMode
                ? 'Hide my prompt'
                : (isLast ? 'Start discussion' : `Hide & pass to ${players[currentRevealIndex + 1].name}`)}
            </Button>
          )}
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function GrillEmScreen({ players, round, totalRounds, onContinue, theme }) {
  const AI_ANSWERS = ['Yes', 'No', 'Kind of', 'Not really applicable', 'Possibly'];
  const [question, setQuestion] = useState('');
  const [transcript, setTranscript] = useState(round.grillData?.transcript || []);
  const questionsPerPlayer = round.grillData?.questionsPerPlayer || getGrillQuestionsPerPlayer(players.length);
  const [askedCounts, setAskedCounts] = useState(round.grillData?.askedCounts || {});
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const recognitionRef = useRef(null);
  const activePlayer = players.find((player) => (askedCounts[player.id] || 0) < questionsPerPlayer) || null;
  const allAsked = !activePlayer;
  const speechEnabled = round.grillData?.ttsEnabled !== false;
  const micEnabled = round.grillData?.micEnabled !== false;
  const canUseSpeech =
    speechEnabled &&
    typeof window !== 'undefined' &&
    'speechSynthesis' in window;
  const canUseMic =
    micEnabled &&
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);

  function speak(text) {
    if (!canUseSpeech) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  function toggleMic() {
    if (!canUseMic || allAsked || !activePlayer) return;
    setMicError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!isListening) {
      const startRecognition = () => {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-GB';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;
        recognition.onresult = (event) => {
          const text = event?.results?.[0]?.[0]?.transcript || '';
          if (text) setQuestion(text);
        };
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
          setIsListening(false);
          setMicError(event?.error ? `Mic error: ${event.error}` : 'Mic failed. Try typing your question.');
        };
        recognitionRef.current = recognition;
        setIsListening(true);
        recognition.start();
      };
      if (navigator?.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => startRecognition())
          .catch(() => setMicError('Microphone permission denied. Enable mic access in browser settings.'));
      } else {
        startRecognition();
      }
    } else {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
    }
  }

  function submitQuestion() {
    const trimmed = question.trim();
    if (!trimmed || allAsked || !activePlayer) return;
    const answer = pickRandom(AI_ANSWERS);
    const playerAskedCount = (askedCounts[activePlayer.id] || 0) + 1;
    const nextRow = {
      id: `${Date.now()}-${activePlayer.id}-${playerAskedCount}`,
      player: activePlayer?.name || 'Player',
      question: trimmed,
      answer,
      turn: playerAskedCount,
    };
    setTranscript((cur) => [...cur, nextRow]);
    setAskedCounts((cur) => ({ ...cur, [activePlayer.id]: playerAskedCount }));
    speak(answer);
    setQuestion('');
  }

  return <TopFrame theme={theme}><div className="mx-auto max-w-5xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} /><GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/20 bg-black/25"><div className="text-center"><div className="text-xs uppercase tracking-[0.3em] text-white/50">{round.roundTypeName}</div><h2 className="text-4xl font-black mt-3 text-yellow-300">Interrogate Blaze Byte 🤖</h2><p className="text-cyan-200 mt-3">Each player has <span className="font-black">{questionsPerPlayer}</span> questions this round. Responses stay in short clue mode.</p></div><div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4"><div className="text-sm text-white/70">Current questioner</div><div className="text-2xl font-black text-yellow-300 mt-1">{allAsked ? 'All questions complete' : activePlayer?.name}</div><div className="text-xs text-white/55 mt-2">Questions left: {(players.length * questionsPerPlayer) - players.reduce((acc, p) => acc + Math.min(questionsPerPlayer, askedCounts[p.id] || 0), 0)}</div></div><div className="grid gap-3 mt-4 md:grid-cols-[1fr_auto_auto]"><Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={allAsked ? 'All questions complete' : 'Ask Blaze Byte a question'} className="rounded-2xl bg-white/5 border border-white/10 text-white" disabled={allAsked} />{canUseMic && <Button className={`rounded-2xl px-4 ${isListening ? 'bg-red-500 text-white' : 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-100'}`} onClick={toggleMic} disabled={allAsked}>{isListening ? 'Stop Mic' : 'Use Mic'}</Button>}{!canUseMic && <div className="rounded-2xl px-4 py-3 border border-amber-400/30 bg-amber-500/10 text-amber-200 text-xs">Mic unavailable here. Use typed questions.</div>}<Button className="rounded-2xl px-5 bg-yellow-300 text-zinc-950 border-2 border-white disabled:opacity-40" onClick={submitQuestion} disabled={allAsked || !question.trim()}>Ask AI</Button></div>{micError && <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-red-200 text-sm">{micError}</div>}<div className="mt-6 space-y-3 max-h-[280px] overflow-auto pr-1">{transcript.length === 0 && <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/60">No questions yet.</div>}{transcript.map((row) => <div key={row.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="text-sm text-cyan-200 font-semibold">{row.player} • Q{row.turn}</div><div className="text-white mt-1">{row.question}</div><div className="mt-3 inline-flex rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-sm font-black text-fuchsia-200">Blaze Byte: {row.answer}</div></div>)}</div><div className="mt-6 flex justify-end"><Button className="rounded-[1.5rem] h-14 px-8 bg-yellow-300 text-zinc-950 border-2 border-white" onClick={() => onContinue({ transcript, questionsPerPlayer, askedCounts, micEnabled, ttsEnabled: speechEnabled })} disabled={!allAsked}>Continue to voting</Button></div></GlassPanel></div></TopFrame>;
}
function VoicePartyStatusStrip({ onlineVoiceEnabled, onlineVoiceMuted, setOnlineVoiceMuted, canTalk }) {
  if (!onlineVoiceEnabled) return null;
  return (
    <GlassPanel className="rounded-[1.4rem] p-3 border-cyan-400/20 bg-cyan-500/10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <div className="font-black text-cyan-100 flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Voice Party Chat
          </div>
          <div className="text-xs text-white/75 mt-1">
            {canTalk
              ? 'Live for clue/discussion phases.'
              : 'Muted automatically while instructions/prompts are on screen.'}
          </div>
        </div>
        <Button
          className={`rounded-2xl px-4 py-2 ${
            onlineVoiceMuted
              ? 'bg-red-500/25 border border-red-400/40 text-red-100'
              : 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-100'
          }`}
          disabled={!canTalk}
          onClick={() => setOnlineVoiceMuted((cur) => !cur)}
        >
          {onlineVoiceMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
          {onlineVoiceMuted ? 'Unmute Me' : 'Mute Me'}
        </Button>
      </div>
    </GlassPanel>
  );
}

function DiscussionScreen({ players, round, totalRounds, onContinue, line, theme, onlineVoiceEnabled = false, onlineVoiceMuted = false, setOnlineVoiceMuted = () => {}, canTalk = true }) {
  const roundRule = round.roundTypeId === 'opinion'
    ? "Truth or Twisted: everyone got the same scenario. Liars must ragebait and argue opposite to their natural take."
    : (round.roundTypeId === 'grill'
      ? "Grill 'Em: players ask by microphone and Blaze Byte talks back with AI answers. Liars already saw the hidden prompt and will try to steer the room."
      : 'Give one clue, blend in, and avoid revealing your exact prompt.');
  return <TopFrame theme={theme}><div className="mx-auto max-w-3xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} /><VoicePartyStatusStrip onlineVoiceEnabled={onlineVoiceEnabled} onlineVoiceMuted={onlineVoiceMuted} setOnlineVoiceMuted={setOnlineVoiceMuted} canTalk={canTalk} /><GlassPanel className="rounded-[2.5rem] p-8 text-center border-emerald-400/20 bg-black/25"><Badge className="rounded-full bg-emerald-500/20 border border-emerald-400/20 text-emerald-100 px-4 py-1.5">All prompts delivered</Badge><div className="text-xs uppercase tracking-[0.3em] text-white/50 mt-4">{round.roundTypeName}</div><h2 className="text-4xl font-black mt-3 text-yellow-300">{round.roundTypeTagline}</h2><p className="text-white/75 mt-3 max-w-2xl mx-auto">{line}</p><p className="text-cyan-200 mt-3 max-w-2xl mx-auto font-semibold">{roundRule}</p><Button className="rounded-[1.5rem] h-16 px-8 mt-8 bg-yellow-300 text-zinc-950 border-2 border-white" onClick={onContinue}><SkipForward className="mr-2 h-5 w-5 inline" />Finish discussion and vote</Button></GlassPanel></div></TopFrame>;
}
function VotingScreen({ players, round, totalRounds, votesByPlayerId, setVotesByPlayerId, onSubmitVotes, line, theme, onlineMode = false, onlineVoiceEnabled = false, onlineVoiceMuted = false, setOnlineVoiceMuted = () => {}, canTalk = true }) {
  const leader = players.find((p) => p.id === round.leaderId);
  const completeCount = Object.values(votesByPlayerId).filter(Boolean).length;
  const allComplete = players.every((player) => votesByPlayerId[player.id]);
  const voteInstruction = round.roundTypeId === 'grill'
    ? "Vote for who sounded like they already knew the AI's hidden prompt."
    : 'Vote for who sounded most suspicious.';
  return <TopFrame theme={theme}><div className="mx-auto max-w-5xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} />{onlineMode && <VoicePartyStatusStrip onlineVoiceEnabled={onlineVoiceEnabled} onlineVoiceMuted={onlineVoiceMuted} setOnlineVoiceMuted={setOnlineVoiceMuted} canTalk={canTalk} />}<GlassPanel className="rounded-[2.5rem] p-8 border-fuchsia-400/20 bg-black/25"><div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.3em] text-white/50">{round.roundTypeName}</div><h2 className="text-4xl font-black mt-3 text-yellow-300">{round.roundTypeTagline}</h2><p className="text-white/70 mt-2">{onlineMode ? 'Vote from your own device.' : <>Pass the phone to <span className="font-semibold text-cyan-300">{leader?.name}</span>. </>}{line}</p><p className="text-cyan-200 mt-2 font-semibold">{voteInstruction}</p></div><GlassPanel className="rounded-[1.75rem] p-4 min-w-[220px] border-cyan-400/20 bg-black/20"><div className="text-sm text-white/70">Votes completed</div><div className="text-3xl font-black mt-1 text-yellow-300">{completeCount}/{players.length}</div><Progress value={(completeCount / players.length) * 100} className="mt-3" /></GlassPanel></div><div className="grid gap-4 mt-8 md:grid-cols-2 xl:grid-cols-3">{players.map((voter) => <GlassPanel key={voter.id} className="rounded-[1.75rem] p-4 border-white/10 bg-black/20"><div className="font-black text-lg">{voter.name}</div><div className="text-sm text-white/55 mt-1">Who do they vote for?</div><div className="grid grid-cols-2 gap-2 mt-4">{players.filter((p) => p.id !== voter.id).map((target) => <Button key={target.id} className={`rounded-2xl h-11 ${votesByPlayerId[voter.id] === target.id ? 'bg-yellow-300 text-zinc-950' : 'bg-white/5 border border-white/10 text-white'}`} onClick={() => setVotesByPlayerId((cur) => ({ ...cur, [voter.id]: target.id }))}>{target.name}</Button>)}</div></GlassPanel>)}</div><div className="mt-8 flex justify-end"><Button className="rounded-[1.5rem] h-14 px-8 bg-yellow-300 text-zinc-950 border-2 border-white" disabled={!allComplete} onClick={onSubmitVotes}><Vote className="mr-2 h-5 w-5 inline" />Reveal results</Button></div></GlassPanel></div></TopFrame>;
}
function LiarRevealScreen({ players, round, onComplete, theme }) {
  const liars = players.filter((p) => (round.imposterIds || []).includes(p.id));
  const audioRef = useRef(null);
  useEffect(() => {
    let timer;
    try {
      audioRef.current = new Audio(HEARTBEAT_SFX_SRC);
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    } catch {}
    timer = setTimeout(() => { try { audioRef.current?.pause(); } catch {} onComplete(); }, 3000);
    return () => { clearTimeout(timer); try { audioRef.current?.pause(); } catch {} };
  }, [onComplete]);
  return <TopFrame theme={theme}><div className="mx-auto max-w-3xl space-y-6"><GlassPanel className="rounded-[2.5rem] p-8 md:p-10 border-red-400/25 bg-black/35 text-center overflow-hidden relative"><div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle,_rgba(255,0,80,0.16)_0%,_rgba(255,0,80,0.08)_35%,_transparent_70%)]" /><div className="relative z-10 space-y-6"><div className="text-xs uppercase tracking-[0.35em] text-white/50">Final accusation</div><motion.div initial={{ scale: 0.98, opacity: 0.8 }} animate={{ scale: [1, 1.03, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 1.05, repeat: 2, ease: 'easeInOut' }} className="space-y-4"><div className="text-4xl md:text-6xl font-black text-red-300">{liars.length > 1 ? 'The Liars are......' : 'The Liar was......'}</div><div className="inline-flex flex-wrap justify-center gap-3">{liars.map((player) => <span key={player.id} className="rounded-full border border-red-300/30 bg-red-500/15 px-5 py-2 text-lg md:text-2xl font-black text-yellow-200">🔥 {player.name}</span>)}</div></motion.div><div className="text-sm text-white/65">Hearts pounding. Friendships wobbling. Truth incoming.</div></div></GlassPanel></div></TopFrame>;
}
function ResultsScreen({ players, round, totalRounds, tally, roundGains, roundBreakdown, imposterCaught, onNextRound, onEndGame, resultLine, theme }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const lastRound = round.roundNumber >= totalRounds;
  const roundInfoTitle = round.roundTypeId === 'grill' ? 'AI Hidden Prompt' : 'Liar Prompt';
  const roundInfoValue = round.roundTypeId === 'opinion'
    ? 'Truth or Twisted uses one shared scenario for everyone.'
    : (round.imposterPrompt || round.aiPrompt || 'N/A');

  return <TopFrame theme={theme}><div className="mx-auto max-w-5xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} /><GlassPanel className="rounded-[2.5rem] p-8 border-white/15 bg-black/25"><div className="space-y-6"><div className="text-center space-y-4"><div className="text-xs uppercase tracking-[0.3em] text-white/50">Liar Reveal</div><h2 className="text-5xl md:text-6xl font-black text-red-400">🔥 WHO WAS THE LIAR? 🔥</h2><div className={`text-2xl font-black ${imposterCaught ? 'text-yellow-300' : 'text-fuchsia-400'}`}>{imposterCaught ? 'LIAR EXPOSED 🔥' : 'THE LIAR ESCAPED 😈'}</div><div className="text-white/75">{resultLine}</div></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">{players.map((player) => { const isLiar = (round.imposterIds || []).includes(player.id); const breakdown = roundBreakdown?.[player.id] || { voteHit: 0, liarSurvived: 0, grillTeamBonus: 0, grillLiarSwing: 0 }; return <div key={player.id} className={`relative rounded-[1.5rem] p-4 text-center border transition-all duration-300 ${isLiar ? 'bg-red-500/20 border-red-400 shadow-[0_0_20px_rgba(255,0,0,0.6)] scale-105' : 'bg-white/5 border-white/10'}`}><img src={FLAME_SRC} alt="flame" className={`absolute -top-4 right-2 h-8 w-8 ${isLiar ? 'block' : 'hidden'}`} />{isLiar && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-black rounded-full bg-red-500 text-white">🔥 THE LIAR</div>}<div className={`text-lg font-bold ${isLiar ? 'text-red-300' : 'text-white'}`}>{player.name}</div><div className="text-xs text-white/60 mt-2">{round.promptsByPlayerId[player.id]}</div><div className="mt-3 text-sm font-bold text-cyan-200">+{roundGains?.[player.id] || 0} this round</div><div className="mt-2 text-[11px] text-white/70">Vote hit +{breakdown.voteHit} • Liar survived +{breakdown.liarSurvived}</div>{round.roundTypeId === 'grill' && <div className="mt-1 text-[11px] text-cyan-200">Team bonus +{breakdown.grillTeamBonus} • Swing {breakdown.grillLiarSwing >= 0 ? '+' : ''}{breakdown.grillLiarSwing}</div>}</div>; })}</div><div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]"><div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><GlassPanel className="rounded-[1.75rem] p-5 border-cyan-400/20 bg-black/20"><div className="text-sm text-white/55">Hint / Subcategory</div><div className="text-2xl font-black mt-2">{round.hint}</div><div className="text-xs text-cyan-200 mt-2">{round.roundTypeTagline}</div></GlassPanel><GlassPanel className="rounded-[1.75rem] p-5 border-orange-400/20 bg-black/20"><div className="text-sm text-white/55">{roundInfoTitle}</div><div className="text-2xl font-black mt-2 text-orange-300">{roundInfoValue}</div></GlassPanel></div><GlassPanel className="rounded-[1.75rem] p-5 border-cyan-400/20 bg-black/20"><div className="text-sm text-white/55">Scoring rules</div><div className="mt-2 text-sm text-cyan-100">Correct liar vote: +1 point. Liar survives: +2 points to that liar.</div>{round.roundTypeId === 'grill' && <div className="mt-2 text-xs text-cyan-200">Grill 'Em bonus: if liars are caught, everyone gains +2. If liars survive, liars gain +2 and non-liars lose 1 (floor 0).</div>}</GlassPanel>{round.roundTypeId === 'grill' && (round.grillData?.transcript || []).length > 0 && <GlassPanel className="rounded-[1.75rem] p-5 border-fuchsia-400/20 bg-black/20"><div className="text-sm text-white/55 mb-3">Grill 'Em transcript</div><div className="space-y-2 max-h-56 overflow-auto pr-1">{round.grillData.transcript.map((row) => <div key={row.id} className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-xs text-cyan-200">{row.player} • Q{row.turn}</div><div className="text-sm text-white mt-1">{row.question}</div><div className="text-xs text-fuchsia-200 mt-1">Blaze Byte: {row.answer}</div></div>)}</div></GlassPanel>}{round.mode === 'chaos' && round.bannedWords.length > 0 && <GlassPanel className="rounded-[1.75rem] p-5 border-red-400/20 bg-black/20"><div className="text-sm text-white/55 mb-3">Banned Words</div><div className="flex flex-wrap gap-2">{round.bannedWords.map((word) => <span key={word} className="px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 text-xs">{word}</span>)}</div></GlassPanel>}<GlassPanel className="rounded-[1.75rem] p-5 border-white/10 bg-black/20"><div className="text-sm text-white/55 mb-3">Vote tally</div><div className="grid gap-3 sm:grid-cols-2">{players.map((player) => <div key={player.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3"><span>{player.name}</span><Badge className="rounded-full bg-white/10 border border-white/10 text-white">{tally[player.id] || 0} votes</Badge></div>)}</div></GlassPanel></div><div className="space-y-5"><GlassPanel className="rounded-[1.75rem] p-5 border-yellow-300/20 bg-black/20"><div className="flex items-center gap-2 text-yellow-200"><Trophy className="h-5 w-5" /> Scoreboard</div><div className="space-y-3 mt-4">{ranked.map((player, index) => <div key={player.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between gap-3"><div><div className="text-sm text-white/55">Place {index + 1}</div><div className="font-semibold">{player.name}</div></div><div className="text-right"><div className="text-2xl font-black">{player.score}</div><div className="text-xs text-cyan-200">+{roundGains?.[player.id] || 0} this round</div></div></div>)}</div></GlassPanel>{!lastRound ? <Button className="rounded-[1.5rem] h-14 bg-yellow-300 text-zinc-950 w-full border-2 border-white" onClick={onNextRound}><TimerReset className="mr-2 h-5 w-5 inline" />Start next round</Button> : <Button className="rounded-[1.5rem] h-14 bg-yellow-300 text-zinc-950 w-full border-2 border-white" onClick={onEndGame}><Trophy className="mr-2 h-5 w-5 inline" />View final winner</Button>}</div></div></div></GlassPanel></div></TopFrame>;
}
function FinalScreen({ players, onRestart, line, theme }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  return <TopFrame theme={theme}><div className="mx-auto max-w-4xl space-y-6"><GlassPanel className="rounded-[2.5rem] p-8 text-center border-yellow-300/20 bg-black/25"><div className="text-xs uppercase tracking-[0.3em] text-white/50">Match complete</div><h2 className="text-5xl font-black mt-3 text-yellow-300">Winner: {winner?.name}</h2><p className="text-white/75 mt-3">{line}</p><div className="mt-8 grid gap-4 md:grid-cols-3">{ranked.map((player, index) => <GlassPanel key={player.id} className="rounded-[1.75rem] p-5 border-white/10 bg-black/20"><div className="text-sm text-white/55">Place {index + 1}</div><div className="text-2xl font-black mt-2">{player.name}</div><div className="text-4xl font-black mt-3">{player.score}</div></GlassPanel>)}</div><Button className="rounded-[1.5rem] h-14 px-8 mt-8 bg-yellow-300 text-zinc-950 border-2 border-white" onClick={onRestart}><Star className="mr-2 h-5 w-5 inline" />New match</Button></GlassPanel></div></TopFrame>;
}
function StoreScreen({ onBack, theme }) {
  return <TopFrame theme={theme}><div className="mx-auto max-w-4xl space-y-6"><div className="flex justify-between items-center gap-4"><Button className="rounded-[1.4rem] bg-white/5 border border-white/10 px-4 py-2 text-white" onClick={onBack}>Back</Button><div className="text-center"><div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Store</div><div className="text-white/80 text-sm mt-1">Future monetisation, premium packs, and category tools.</div></div><div className="w-[72px]" /></div><GlassPanel className="rounded-[2.5rem] p-8 border-fuchsia-400/20 bg-black/25"><div className="flex items-center gap-3 mb-4"><ShoppingBag className="h-6 w-6 text-yellow-300" /><h2 className="text-2xl font-black text-yellow-300">Category Editor</h2></div><p className="text-white/75">This is where players will buy premium tools like Category Editor, themed packs, and future prompt expansions.</p></GlassPanel></div></TopFrame>;
}
function SettingsScreen({
  onBack,
  premiumEnabled,
  setPremiumEnabled,
  adultMode,
  setAdultMode,
  theme,
  picturePackManifests,
  enabledPicturePacks,
  setEnabledPicturePacks,
  picturePackWeights,
  setPicturePackWeights,
  enabledPictureReleaseChannels,
  setEnabledPictureReleaseChannels,
  releaseChannelSummary,
}) {
  const [effectsEnabled, setEffectsEnabled] = useState(true);
  const [largeText, setLargeText] = useState(false);
  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-between items-center gap-4">
          <Button className="rounded-[1.4rem] bg-white/5 border border-white/10 px-4 py-2 text-white" onClick={onBack}>Back</Button>
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Settings</div>
            <div className="text-white/80 text-sm mt-1">UI and app behaviour options live here.</div>
          </div>
          <div className="w-[72px]" />
        </div>
        <GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/20 bg-black/25 space-y-5">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 flex items-center justify-between gap-4">
            <div><div className="font-black text-lg">18+ Mode</div><div className="text-sm text-white/60 mt-1">Enables risqué / non-PC prompts for adult groups.</div></div>
            <Switch checked={adultMode} onCheckedChange={setAdultMode} />
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 flex items-center justify-between gap-4">
            <div><div className="font-black text-lg">Premium Mode Toggle</div><div className="text-sm text-white/60 mt-1">Prototype switch for premium/admin features.</div></div>
            <Switch checked={premiumEnabled} onCheckedChange={setPremiumEnabled} />
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 flex items-center justify-between gap-4">
            <div><div className="font-black text-lg">Visual Effects</div><div className="text-sm text-white/60 mt-1">Future hook for motion, glows, and extra juice.</div></div>
            <Switch checked={effectsEnabled} onCheckedChange={setEffectsEnabled} />
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 flex items-center justify-between gap-4">
            <div><div className="font-black text-lg">Large Text</div><div className="text-sm text-white/60 mt-1">Accessibility-focused sizing option placeholder.</div></div>
            <Switch checked={largeText} onCheckedChange={setLargeText} />
          </div>
          <div className="rounded-[1.75rem] border border-cyan-400/25 bg-cyan-500/10 p-5">
            <div className="font-black text-lg text-cyan-100">Picture Release Channels</div>
            <div className="text-sm text-white/70 mt-1">Toggle base vs DLC channels without touching per-pack switches.</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.keys(releaseChannelSummary).map((channel) => (
                <div key={channel} className="rounded-xl border border-white/10 bg-black/20 p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold uppercase tracking-[0.18em] text-xs">{channel}</div>
                    <div className="text-xs text-white/55">{releaseChannelSummary[channel]} packs</div>
                  </div>
                  <Switch
                    checked={enabledPictureReleaseChannels[channel] !== false}
                    onCheckedChange={(next) => setEnabledPictureReleaseChannels((cur) => ({ ...cur, [channel]: next }))}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-fuchsia-400/25 bg-fuchsia-500/10 p-5">
            <div className="font-black text-lg text-yellow-300">Picture Pack Controls</div>
            <div className="text-sm text-white/70 mt-1">Enable packs and set weights to control round frequency.</div>
            <div className="mt-4 space-y-3">
              {picturePackManifests.map((manifest) => {
                const enabled = enabledPicturePacks[manifest.id] !== false;
                const weight = picturePackWeights[manifest.id] ?? 1;
                return (
                  <div key={manifest.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{manifest.label}</div>
                        <div className="text-xs text-white/55">{manifest.id} • {manifest.releaseChannel}</div>
                      </div>
                      <Switch checked={enabled} onCheckedChange={(next) => setEnabledPicturePacks((cur) => ({ ...cur, [manifest.id]: next }))} />
                    </div>
                    <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 items-center">
                      <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Weight</div>
                      <Input
                        type="number"
                        min={0}
                        max={8}
                        step={1}
                        value={weight}
                        onChange={(event) => {
                          const raw = Number(event.target.value);
                          const next = Number.isFinite(raw) ? Math.max(0, Math.min(8, Math.round(raw))) : 1;
                          setPicturePackWeights((cur) => ({ ...cur, [manifest.id]: next }));
                        }}
                        className="w-24 rounded-xl bg-white/5 border border-white/10 text-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function AdminDialog({ open, onOpenChange, premiumEnabled, customCategories, setCustomCategories }) {
  const [categoryName, setCategoryName] = useState('');
  const [mainPrompt, setMainPrompt] = useState('');
  const [imposterPrompt, setImposterPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  useEffect(() => { if (!selectedCategory && customCategories.length) setSelectedCategory(customCategories[0].id); }, [customCategories, selectedCategory]);
  return <Dialog open={open}><DialogContent className="max-w-5xl rounded-[2rem] bg-[#13002d] p-6 text-white border border-fuchsia-400/20"><DialogHeader><DialogTitle className="text-2xl text-yellow-300">Category Admin</DialogTitle><DialogDescription className="text-white/60">Local prototype admin for adding custom categories and prompt pairs.</DialogDescription></DialogHeader><div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] mt-4"><Card className="bg-white/5 border border-white/10 rounded-[1.75rem] p-4"><CardHeader><CardTitle className="text-lg">Create category</CardTitle></CardHeader><CardContent className="space-y-3"><Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="rounded-2xl bg-white/5 border border-white/10 text-white" /><Button className="w-full rounded-2xl bg-yellow-300 px-4 py-2 text-zinc-950" onClick={() => { const name = categoryName.trim(); if (!name) return; const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`; const next = [...customCategories, { id, name, emoji: '✨', prompts: [] }]; setCustomCategories(next); setStored('imposter-custom-categories-v2', next); setSelectedCategory(id); setCategoryName(''); }}>Add category</Button></CardContent></Card><Card className="bg-white/5 border border-white/10 rounded-[1.75rem] p-4"><CardHeader><CardTitle className="text-lg">Add prompt pair</CardTitle><CardDescription className="text-white/55">Structured custom rounds can be extended later. This version keeps simple pairs.</CardDescription></CardHeader><CardContent className="space-y-3">{!premiumEnabled && <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-amber-100 text-sm">Premium mode is off in this prototype.</div>}<div className="grid gap-3 md:grid-cols-2"><Input value={mainPrompt} onChange={(e) => setMainPrompt(e.target.value)} placeholder="Common prompt" className="rounded-2xl bg-white/5 border border-white/10 text-white" /><Input value={imposterPrompt} onChange={(e) => setImposterPrompt(e.target.value)} placeholder="Liar prompt" className="rounded-2xl bg-white/5 border border-white/10 text-white" /></div><Button className="rounded-2xl bg-yellow-300 px-4 py-2 text-zinc-950" disabled={!premiumEnabled || !selectedCategory} onClick={() => { const next = customCategories.map((cat) => cat.id === selectedCategory ? { ...cat, prompts: [...cat.prompts, { hint: 'Custom', main: mainPrompt, imposter: imposterPrompt }] } : cat); setCustomCategories(next); setStored('imposter-custom-categories-v2', next); setMainPrompt(''); setImposterPrompt(''); }}>Add prompt pair</Button></CardContent></Card></div><DialogFooter><Button className="rounded-2xl bg-yellow-300 px-4 py-2 text-zinc-950" onClick={() => onOpenChange(false)}>Done</Button></DialogFooter></DialogContent></Dialog>;
}
export default function App() {
  const HOST_STINGER_COPY_KEYS = {
    prompt: 'hostStingerPrompt',
    opinion: 'hostStingerOpinion',
    picture: 'hostStingerPicture',
    grill: 'hostStingerGrill',
  };
  const [screen, setScreen] = useState('home');
  const [players, setPlayers] = useState(createPlayers(3));
  const [liarCount, setLiarCount] = useState(1);
  const [nameTheme, setNameTheme] = useState('Default');
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [adultMode, setAdultMode] = useState(getStored('imposter-adult-mode-v1', false));
  const [customCategories, setCustomCategories] = useState(getStored('imposter-custom-categories-v2', []));
  const [enabledCategories, setEnabledCategories] = useState(getStored('imposter-enabled-categories-v2', Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.id, true]))));
  const [enabledPicturePacks, setEnabledPicturePacks] = useState(getStored('imposter-enabled-picture-packs-v1', normalizeEnabledPicturePacks({}, PICTURE_DLC_MANIFESTS)));
  const [picturePackWeights, setPicturePackWeights] = useState(getStored('imposter-picture-pack-weights-v1', normalizePackWeights({}, PICTURE_DLC_MANIFESTS)));
  const [enabledPictureReleaseChannels, setEnabledPictureReleaseChannels] = useState(getStored('imposter-enabled-picture-release-channels-v1', normalizeEnabledPictureReleaseChannels({}, PICTURE_DLC_MANIFESTS)));
  const [onlineMode, setOnlineMode] = useState(false);
  const [onlineRole, setOnlineRole] = useState('offline');
  const [lobbyCode, setLobbyCode] = useState('');
  const [onlineHostName, setOnlineHostName] = useState('');
  const [onlinePlayerName, setOnlinePlayerName] = useState('');
  const [joinLobbyCodeInput, setJoinLobbyCodeInput] = useState('');
  const [onlineVoiceEnabled, setOnlineVoiceEnabled] = useState(false);
  const [onlineVoiceMuted, setOnlineVoiceMuted] = useState(false);
  const [onlineLobbyPlayers, setOnlineLobbyPlayers] = useState([]);
  const [onlineLobbyStatus, setOnlineLobbyStatus] = useState('idle');
  const [onlineLobbyError, setOnlineLobbyError] = useState('');
  const [onlineJoinedPlayerId, setOnlineJoinedPlayerId] = useState('');
  const onlineTransportRef = useRef(null);
  const onlineStartedRevisionHandledRef = useRef('');
  const onlineClientIdRef = useRef(getOrCreatePersistentClientId());
  const onlineSessionRef = useRef(getStoredOnlineSession());
  const onlineClientId = onlineClientIdRef.current;
  const [mode, setMode] = useState('classic');
  const [winCondition, setWinCondition] = useState('rounds');
  const [pointsToWin, setPointsToWin] = useState(15);
  const [roundsPerPlayer, setRoundsPerPlayer] = useState(1);
  const [grillSettings, setGrillSettings] = useState({ micEnabled: true, ttsEnabled: true });
  const [roundNumber, setRoundNumber] = useState(1);
  const [currentRoundOwnerIndex, setCurrentRoundOwnerIndex] = useState(0);
  const [previousRoundType, setPreviousRoundType] = useState(null);
  const [roundTypeOptions, setRoundTypeOptions] = useState([]);
  const [selectedRoundType, setSelectedRoundType] = useState(null);
  const [round, setRound] = useState(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [votesByPlayerId, setVotesByPlayerId] = useState({});
  const [tally, setTally] = useState({});
  const [roundGains, setRoundGains] = useState({});
  const [roundBreakdown, setRoundBreakdown] = useState({});
  const [imposterCaught, setImposterCaught] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [recentPromptKeys, setRecentPromptKeys] = useState([]);
  const [pendingResults, setPendingResults] = useState(null);
  const getLine = useMemo(() => createCopyPicker(COPY_BANK), []);
  const [copyState, setCopyState] = useState({ home: COPY_BANK.home[0], setup: COPY_BANK.setup[0], chooser: COPY_BANK.chooser[0], passPhone: COPY_BANK.passPhone[0], revealNormal: COPY_BANK.revealNormal[0], revealLiar: COPY_BANK.revealLiar[0], discussion: COPY_BANK.discussion[0], voting: COPY_BANK.voting[0], result: COPY_BANK.caught[0], winner: COPY_BANK.winner[0], onlineLobby: COPY_BANK.onlineLobby[0], hostStinger: COPY_BANK.hostStingerPrompt[0] });
  const themeMeta = THEME_META[nameTheme] || THEME_META.Default;
  const availablePicturePackManifests = useMemo(
    () => (PICTURE_DLC_MANIFESTS || []),
    []
  );
  const picturePackReleaseChannelsById = useMemo(
    () => Object.fromEntries(availablePicturePackManifests.map((manifest) => [manifest.id, manifest.releaseChannel || 'unknown'])),
    [availablePicturePackManifests]
  );
  const releaseChannelSummary = useMemo(
    () => availablePicturePackManifests.reduce((acc, manifest) => {
      const channel = manifest.releaseChannel || 'unknown';
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {}),
    [availablePicturePackManifests]
  );
  const allCategories = useMemo(() => getCombinedCategories(customCategories), [customCategories]);
  const activeCategories = useMemo(() => allCategories.filter((cat) => enabledCategories[cat.id] !== false), [allCategories, enabledCategories]);
  useEffect(() => setStored('imposter-enabled-categories-v2', enabledCategories), [enabledCategories]);
  useEffect(() => setStored('imposter-custom-categories-v2', customCategories), [customCategories]);
  useEffect(() => setStored('imposter-adult-mode-v1', adultMode), [adultMode]);
  useEffect(() => setStored('imposter-enabled-picture-packs-v1', enabledPicturePacks), [enabledPicturePacks]);
  useEffect(() => setStored('imposter-picture-pack-weights-v1', picturePackWeights), [picturePackWeights]);
  useEffect(() => setStored('imposter-enabled-picture-release-channels-v1', enabledPictureReleaseChannels), [enabledPictureReleaseChannels]);
  useEffect(() => {
    setEnabledPicturePacks((cur) => normalizeEnabledPicturePacks(cur, availablePicturePackManifests));
    setPicturePackWeights((cur) => normalizePackWeights(cur, availablePicturePackManifests));
    setEnabledPictureReleaseChannels((cur) => normalizeEnabledPictureReleaseChannels(cur, availablePicturePackManifests));
  }, [availablePicturePackManifests]);
  useEffect(() => {
    const phaseAllowsVoice = onlineMode && ONLINE_VOICE_ACTIVE_SCREENS.has(screen);
    setOnlineVoiceEnabled(phaseAllowsVoice);
    if (!phaseAllowsVoice) setOnlineVoiceMuted(false);
  }, [onlineMode, screen]);
  useEffect(() => {
    if (screen === 'online-join') {
      setOnlineLobbyError('');
    }
  }, [screen]);
  useEffect(() => {
    const session = onlineSessionRef.current;
    if (!session?.lobbyCode || !session?.playerId || !session?.role || !session?.sessionToken) return;
    if (onlineMode || lobbyCode) return;
    let cancelled = false;
    (async () => {
      try {
        const resumed = await resumeLobbySessionOnServer(session.lobbyCode, {
          playerId: session.playerId,
          sessionToken: session.sessionToken,
          clientId: onlineClientId,
        });
        if (cancelled || !resumed?.lobby) return;
        const normalizedRole = session.role === 'host' ? 'host' : 'player';
        const playersFromSnapshot = Array.isArray(resumed.lobby.players) ? resumed.lobby.players : [];
        const resolvedPlayer = resumed.player || playersFromSnapshot.find((player) => player.id === session.playerId) || null;
        const nextSession = {
          lobbyCode: String(resumed.lobby.code || session.lobbyCode).toUpperCase(),
          role: normalizedRole,
          playerId: resolvedPlayer?.id || session.playerId,
          playerName: resolvedPlayer?.name || session.playerName || '',
          hostName: resumed.lobby.hostName || session.hostName || '',
          sessionToken: resumed.resumeToken || session.sessionToken,
        };
        onlineSessionRef.current = nextSession;
        setStoredOnlineSession(nextSession);
        setOnlineMode(true);
        setOnlineRole(normalizedRole);
        setLobbyCode(nextSession.lobbyCode);
        setOnlineHostName(nextSession.hostName);
        setOnlinePlayerName(nextSession.playerName);
        setOnlineJoinedPlayerId(nextSession.playerId);
        setOnlineLobbyPlayers(playersFromSnapshot);
        setOnlineLobbyStatus(resumed.lobby.status || 'waiting');
        if (playersFromSnapshot.length) {
          setPlayers(toGamePlayers(playersFromSnapshot));
        }
        setScreen(normalizedRole === 'host' ? 'online-lobby-created' : 'online-lobby-waiting');
      } catch (error) {
        if (cancelled) return;
        onlineSessionRef.current = null;
        setStoredOnlineSession(null);
        setOnlineLobbyError(mapLobbyErrorToMessage(error, 'Saved lobby session expired. Rejoin with a fresh lobby code.'));
        setOnlineMode(false);
        setOnlineRole('offline');
        setLobbyCode('');
        setOnlineJoinedPlayerId('');
        setScreen('online-join');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onlineMode, lobbyCode, onlineClientId]);
  useEffect(() => {
    const session = onlineSessionRef.current;
    const shouldKeepTransportAlive = onlineMode || (session && ONLINE_CONNECTION_ACTIVE_SCREENS.has(screen));
    const effectiveLobbyCode = lobbyCode || String(session?.lobbyCode || '').trim().toUpperCase();
    if (!shouldKeepTransportAlive || !effectiveLobbyCode) return undefined;
    const transport = createLobbyTransport({
      lobbyCode: effectiveLobbyCode,
      onSnapshot: (snapshot) => {
        if (!snapshot) {
          setOnlineLobbyPlayers([]);
          setOnlineLobbyStatus('closed');
          if (onlineRole === 'player') {
            setOnlineLobbyError('Lobby closed by host. Enter a new code to rejoin.');
            setOnlineMode(false);
            setOnlineRole('offline');
            setLobbyCode('');
            setOnlineJoinedPlayerId('');
            setScreen('online-join');
          }
          return;
        }
        const snapshotPlayers = Array.isArray(snapshot.players) ? snapshot.players : [];
        setOnlineLobbyPlayers(snapshotPlayers);
        setOnlineLobbyStatus(snapshot.status || 'waiting');
        setOnlineHostName(snapshot.hostName || 'Host');
        if (ONLINE_CONNECTION_ACTIVE_SCREENS.has(screen)) {
          setOnlineLobbyError('Reconnected to lobby sync.');
        } else {
          setOnlineLobbyError('');
        }
        setOnlineJoinedPlayerId((current) => {
          if (current && snapshotPlayers.some((player) => player.id === current)) return current;
          const byClient = snapshotPlayers.find((player) => player.clientId === onlineClientId);
          return byClient?.id || current;
        });
        if (snapshotPlayers.length && (screen === 'online-lobby-created' || screen === 'online-lobby-waiting')) {
          setPlayers(toGamePlayers(snapshotPlayers));
        }
        if (snapshot.status === 'started' && snapshot.startedRevision) {
          if (onlineStartedRevisionHandledRef.current !== snapshot.startedRevision) {
            onlineStartedRevisionHandledRef.current = snapshot.startedRevision;
            const seededPlayers = toGamePlayers(snapshotPlayers);
            if (seededPlayers.length) {
              refreshCopy(['chooser']);
              startGame(seededPlayers);
            }
          }
        }
      },
      onEvent: () => {},
    });
    onlineTransportRef.current = transport;
    transport.syncSnapshot();
    return () => {
      transport.close();
      if (onlineTransportRef.current === transport) {
        onlineTransportRef.current = null;
      }
    };
  }, [onlineMode, lobbyCode, onlineClientId, screen, onlineRole]);
  useEffect(() => setLiarCount((cur) => Math.max(1, Math.min(Math.max(1, Math.floor(players.length / 2)), cur))), [players.length]);
  const themedKey = (key) => {
    if (nameTheme === 'Gangsters') {
      return ({
        revealLiar: 'gangsterRevealLiar',
        discussion: 'gangsterDiscussion',
        voting: 'gangsterVoting',
        caught: 'gangsterCaught',
        escaped: 'gangsterEscaped',
        winner: 'gangsterWinner',
        hostStingerPrompt: 'gangsterHostStingerPrompt',
        hostStingerOpinion: 'gangsterHostStingerOpinion',
        hostStingerPicture: 'gangsterHostStingerPicture',
        hostStingerGrill: 'gangsterHostStingerGrill',
      }[key] || key);
    }
    if (nameTheme === 'Monsters') {
      return ({
        hostStingerPrompt: 'monsterHostStingerPrompt',
        hostStingerOpinion: 'monsterHostStingerOpinion',
        hostStingerPicture: 'monsterHostStingerPicture',
        hostStingerGrill: 'monsterHostStingerGrill',
      }[key] || key);
    }
    if (nameTheme === 'Rock Stars') {
      return ({
        hostStingerPrompt: 'rockHostStingerPrompt',
        hostStingerOpinion: 'rockHostStingerOpinion',
        hostStingerPicture: 'rockHostStingerPicture',
        hostStingerGrill: 'rockHostStingerGrill',
      }[key] || key);
    }
    if (nameTheme === 'Aliens') {
      return ({
        hostStingerPrompt: 'alienHostStingerPrompt',
        hostStingerOpinion: 'alienHostStingerOpinion',
        hostStingerPicture: 'alienHostStingerPicture',
        hostStingerGrill: 'alienHostStingerGrill',
      }[key] || key);
    }
    return key;
  };
  const refreshCopy = (keys) => setCopyState((cur) => ({ ...cur, ...Object.fromEntries(keys.map((key) => [key, getLine(themedKey(key))])) }));
  const totalRounds = winCondition === 'rounds' ? (players.length * roundsPerPlayer) : 99;
  const hasScoreWinner = (list) => winCondition === 'points' && list.some((player) => player.score >= pointsToWin);

  function startGame(seedPlayers = null) {
    const basePlayers = seedPlayers && seedPlayers.length ? seedPlayers : players;
    const options = shuffle(activeCategories).slice(0, Math.min(4, activeCategories.length));
    if (!options.length) return;
    const resetPlayers = basePlayers.map((player) => ({ ...player, score: 0 }));
    setPlayers(resetPlayers);
    setRoundNumber(1); setCurrentRoundOwnerIndex(0); setPreviousRoundType(null); setSelectedRoundType(null); setRoundTypeOptions([]);
    setCategoryOptions(options); setRound({ chooserId: resetPlayers[0]?.id, roundNumber: 1 });
    setRecentPromptKeys([]); setVotesByPlayerId({}); setTally({}); setRoundGains({}); setRoundBreakdown({}); setImposterCaught(false); refreshCopy(['chooser']); setScreen('rules');
  }
  function chooseCategory(categoryId) {
    const category = activeCategories.find((c) => c.id === categoryId); if (!category) return;
    const selectedTypeForRound = roundNumber === 1 ? pickRandom(PASS_THE_PHONE_ROUND_TYPES).id : selectedRoundType;
    const built = buildRound(
      players,
      category,
      roundNumber,
      liarCount,
      recentPromptKeys.slice(-4),
      mode,
      selectedTypeForRound,
      grillSettings,
      adultMode,
      {
        enabledPacks: enabledPicturePacks,
        weights: picturePackWeights,
        enabledReleaseChannels: enabledPictureReleaseChannels,
        releaseChannelsByPackId: picturePackReleaseChannelsById,
      }
    );
    if (!built) return;
    const stingerCopyKey = HOST_STINGER_COPY_KEYS[built.roundTypeId] || HOST_STINGER_COPY_KEYS.prompt;
    setRound(built); setPreviousRoundType(built.roundTypeId); setRecentPromptKeys((cur) => [...cur, built.promptKey]); setRevealIndex(0); setVotesByPlayerId({}); refreshCopy(['passPhone','revealNormal','revealLiar']);
    setCopyState((cur) => ({ ...cur, hostStinger: getLine(themedKey(stingerCopyKey)) }));
    setScreen('host-intro');
  }
  function revealResults() {
    const { nextPlayers, tally: nextTally, imposterCaught: nextCaught, roundGains: nextRoundGains, roundBreakdown: nextRoundBreakdown } = scoreRound(players, round, votesByPlayerId);
    setPlayers(nextPlayers); setTally(nextTally); setRoundGains(nextRoundGains); setRoundBreakdown(nextRoundBreakdown); setImposterCaught(nextCaught); refreshCopy([nextCaught ? 'caught' : 'escaped']);
    setPendingResults({ shouldEndGame: hasScoreWinner(nextPlayers) });
    setScreen('liar-reveal');
  }
  function finishLiarReveal() { if (pendingResults?.shouldEndGame) { refreshCopy(['winner']); setScreen('final'); } else setScreen('results'); setPendingResults(null); }
  function nextRound() {
    const next = roundNumber + 1;
    const nextOwner = (currentRoundOwnerIndex + 1) % players.length;
    const eligibleRoundTypes = PASS_THE_PHONE_ROUND_TYPES.filter((type) => type.id !== previousRoundType);
    const options = shuffle(eligibleRoundTypes).slice(0, Math.min(2, eligibleRoundTypes.length));
    setRoundNumber(next);
    setCurrentRoundOwnerIndex(nextOwner);
    setRoundTypeOptions(options);
    setSelectedRoundType(null);
    setCategoryOptions(shuffle(activeCategories).slice(0, Math.min(4, activeCategories.length)));
    setRound({ chooserId: players[nextOwner]?.id, roundNumber: next });
    refreshCopy(['chooser']);
    setScreen('round-type-choice');
  }
  function endGame() { refreshCopy(['winner']); setScreen('final'); }
  async function leaveOnlineLobby({ nextScreen = 'home' } = {}) {
    const normalizedCode = lobbyCode?.trim().toUpperCase();
    if (normalizedCode) {
      try {
        await leaveLobbyOnServer(normalizedCode, {
          role: onlineRole === 'host' ? 'host' : 'player',
          playerId: onlineJoinedPlayerId || undefined,
        });
      } catch {}
    }
    onlineTransportRef.current?.close();
    onlineTransportRef.current = null;
    onlineStartedRevisionHandledRef.current = '';
    onlineSessionRef.current = null;
    setStoredOnlineSession(null);
    setOnlineMode(false);
    setOnlineRole('offline');
    setLobbyCode('');
    setOnlineLobbyPlayers([]);
    setOnlineLobbyStatus('idle');
    setOnlineLobbyError('');
    setOnlineJoinedPlayerId('');
    setOnlineVoiceEnabled(false);
    setOnlineVoiceMuted(false);
    if (nextScreen === 'home') {
      setOnlineHostName('');
      setOnlinePlayerName('');
      setJoinLobbyCodeInput('');
    }
    setScreen(nextScreen);
  }
  async function createOnlineLobby() {
    const host = (onlineHostName || players[0]?.name || 'Host').trim();
    if (!host) return;
    const hostPlayer = createOnlinePlayer({ name: host, clientId: onlineClientId, isHost: true });
    let snapshot = null;
    let resolvedHostPlayer = hostPlayer;
    let resumeToken = '';
    try {
      const result = await createLobbyOnServer({ hostName: host, hostPlayer });
      snapshot = result?.lobby || null;
      resolvedHostPlayer = result?.player || hostPlayer;
      resumeToken = result?.resumeToken || '';
    } catch {
      setOnlineLobbyError(mapLobbyErrorToMessage(error, 'Unable to create lobby. Check server connection and try again.'));
      return;
    }
    if (!snapshot?.code) {
      setOnlineLobbyError('Unable to create lobby. Check server connection and try again.');
      return;
    }
    onlineStartedRevisionHandledRef.current = '';
    setOnlineMode(true);
    setOnlineRole('host');
    setOnlineHostName(host);
    setOnlinePlayerName(resolvedHostPlayer?.name || host);
    setLobbyCode(snapshot.code);
    setOnlineLobbyPlayers(snapshot.players || []);
    setOnlineLobbyStatus(snapshot.status || 'waiting');
    setOnlineLobbyError('');
    setOnlineJoinedPlayerId(resolvedHostPlayer?.id || hostPlayer.id);
    const session = {
      lobbyCode: snapshot.code,
      role: 'host',
      playerId: resolvedHostPlayer?.id || hostPlayer.id,
      playerName: resolvedHostPlayer?.name || host,
      hostName: host,
      sessionToken: resumeToken,
    };
    onlineSessionRef.current = session;
    setStoredOnlineSession(session);
    setPlayers(toGamePlayers(snapshot.players || []));
    setScreen('online-lobby-created');
  }
  async function joinOnlineLobby() {
    if (!joinLobbyCodeInput.trim() || !onlinePlayerName.trim()) return;
    const normalizedCode = joinLobbyCodeInput.trim().toUpperCase();
    const joiner = createOnlinePlayer({ name: onlinePlayerName.trim(), clientId: onlineClientId });
    let nextSnapshot = null;
    let resolvedPlayer = joiner;
    let resumeToken = '';
    try {
      const result = await joinLobbyOnServer(normalizedCode, joiner);
      nextSnapshot = result?.lobby || null;
      resolvedPlayer = result?.player || joiner;
      resumeToken = result?.resumeToken || '';
    } catch (error) {
      if (error?.code === 'lobby-not-found') {
        setOnlineLobbyError('Lobby not found. Ask the host to regenerate and share a fresh code.');
        return;
      }
      if (error?.code === 'lobby-already-started') {
        setOnlineLobbyError('This lobby already started. Ask the host for a new code.');
        return;
      }
      setOnlineLobbyError(mapLobbyErrorToMessage(error, 'Unable to join lobby right now. Try again in a moment.'));
      return;
    }
    if (!nextSnapshot) {
      setOnlineLobbyError('Unable to join lobby right now. Try again in a moment.');
      return;
    }
    onlineStartedRevisionHandledRef.current = '';
    setOnlineMode(true);
    setOnlineRole('player');
    setLobbyCode(normalizedCode);
    setOnlineHostName(nextSnapshot.hostName || 'Host');
    setOnlinePlayerName(resolvedPlayer.name);
    setOnlineLobbyPlayers(nextSnapshot.players || []);
    setOnlineLobbyStatus(nextSnapshot.status || 'waiting');
    setOnlineLobbyError('');
    setOnlineJoinedPlayerId(resolvedPlayer.id);
    const session = {
      lobbyCode: normalizedCode,
      role: 'player',
      playerId: resolvedPlayer.id,
      playerName: resolvedPlayer.name,
      hostName: nextSnapshot.hostName || 'Host',
      sessionToken: resumeToken,
    };
    onlineSessionRef.current = session;
    setStoredOnlineSession(session);
    setPlayers(toGamePlayers(nextSnapshot.players || []));
    setScreen('online-lobby-waiting');
  }
  async function startOnlineMatch() {
    if (onlineRole !== 'host' || !lobbyCode) return;
    try {
      await startLobbyOnServer(lobbyCode, onlineClientId);
    } catch (error) {
      if (error?.code === 'not-enough-players') {
        setOnlineLobbyError(`Need at least ${MIN_PLAYERS} players before starting.`);
        return;
      }
      if (error?.code === 'host-only') {
        setOnlineLobbyError('Only the host can start this lobby.');
        return;
      }
      if (error?.code === 'lobby-not-found') {
        setOnlineLobbyError('Lobby no longer exists. Create a new one.');
        return;
      }
      setOnlineLobbyError('Unable to start match. Please try again.');
      return;
    }
    onlineTransportRef.current?.syncSnapshot();
  }
  function restartToHome() {
    setPlayers(createPlayers(3)); setLiarCount(1); setNameTheme('Default'); setMode('classic'); setWinCondition('rounds'); setPointsToWin(15); setRoundsPerPlayer(1); setGrillSettings({ micEnabled: true, ttsEnabled: true }); setRound(null); setRoundNumber(1); setCurrentRoundOwnerIndex(0); setPreviousRoundType(null); setRoundTypeOptions([]); setSelectedRoundType(null); setRevealIndex(0); setVotesByPlayerId({}); setTally({}); setRoundGains({}); setRoundBreakdown({}); setImposterCaught(false); setRecentPromptKeys([]); setPendingResults(null); refreshCopy(['home','onlineLobby']);
    if (onlineMode || lobbyCode) {
      void leaveOnlineLobby({ nextScreen: 'home' });
      return;
    }
    setScreen('home');
  }

  return <>
    {screen === 'home' && <HomeScreen onNavigate={(to) => to === 'setup' ? (refreshCopy(['setup']), setScreen('setup')) : setScreen(to)} homeLine={copyState.home} onlineLobbyLine={copyState.onlineLobby} adultMode={adultMode} />}
    {screen === 'setup' && <SetupScreen players={players} setPlayers={setPlayers} liarCount={liarCount} setLiarCount={setLiarCount} nameTheme={nameTheme} setNameTheme={setNameTheme} mode={mode} setMode={setMode} winCondition={winCondition} setWinCondition={setWinCondition} pointsToWin={pointsToWin} setPointsToWin={setPointsToWin} roundsPerPlayer={roundsPerPlayer} setRoundsPerPlayer={setRoundsPerPlayer} grillSettings={grillSettings} setGrillSettings={setGrillSettings} adultMode={adultMode} enabledCategories={enabledCategories} onToggleCategory={(id) => setEnabledCategories((cur) => ({ ...cur, [id]: !cur[id] }))} premiumEnabled={premiumEnabled} setPremiumEnabled={setPremiumEnabled} categoryCount={activeCategories.length} onOpenAdmin={() => setAdminOpen(true)} onStart={startGame} onBack={() => setScreen('home')} setupLine={copyState.setup} />}
    {screen === 'online-setup' && (
      <OnlineLobbySetupScreen
        hostName={onlineHostName}
        setHostName={setOnlineHostName}
        onBack={() => {
          if (onlineMode || lobbyCode) {
            void leaveOnlineLobby({ nextScreen: 'home' });
            return;
          }
          setScreen('home');
        }}
        onContinue={createOnlineLobby}
        nameTheme={nameTheme}
      />
    )}
    {screen === 'online-join' && (
      <OnlineJoinLobbyScreen
        playerName={onlinePlayerName}
        setPlayerName={setOnlinePlayerName}
        joinCode={joinLobbyCodeInput}
        setJoinCode={setJoinLobbyCodeInput}
        nameTheme={nameTheme}
        onBack={() => {
          if (onlineMode || lobbyCode) {
            void leaveOnlineLobby({ nextScreen: 'home' });
            return;
          }
          setScreen('home');
        }}
        onJoin={joinOnlineLobby}
        joinError={onlineLobbyError}
      />
    )}
    {screen === 'online-lobby-created' && (
      <OnlineLobbyCodeScreen
        lobbyCode={lobbyCode}
        hostName={onlineHostName}
        players={onlineLobbyPlayers}
        lobbyStatus={onlineLobbyStatus}
        onCopyCode={() => {
          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(lobbyCode).catch(() => {});
          }
        }}
        onBack={() => { void leaveOnlineLobby({ nextScreen: 'online-setup' }); }}
        onStartMatch={startOnlineMatch}
        nameTheme={nameTheme}
      />
    )}
    {screen === 'online-lobby-waiting' && (
      <TopFrame theme={nameTheme}>
        <div className="mx-auto max-w-3xl space-y-6">
          <GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/25 bg-black/25 text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-white/55">Joined Lobby</div>
            <h2 className="text-4xl font-black mt-3 text-cyan-200">Code: {lobbyCode || '------'}</h2>
            <p className="text-white/75 mt-3">You are connected as <span className="font-black text-yellow-300">{onlinePlayerName}</span>.</p>
            <p className="text-white/65 mt-2">Host will start the match once everyone is in.</p>
            <p className="text-xs text-cyan-100/80 mt-2">Reconnect-safe session active on this device.</p>
            {onlineLobbyError && (
              <div className="mt-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                {onlineLobbyError}
              </div>
            )}
            <div className="mt-5 text-xs uppercase tracking-[0.22em] text-white/55">Connected players ({onlineLobbyPlayers.length})</div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {onlineLobbyPlayers.map((player) => (
                <Badge key={player.id} className="rounded-full bg-white/10 border border-white/10 text-white">{player.name}</Badge>
              ))}
            </div>
            {onlineLobbyStatus === 'started' && (
              <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-100">
                Match is starting...
              </div>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <Button className="rounded-[1.4rem] bg-white/5 border border-white/10 text-white" onClick={() => { void leaveOnlineLobby({ nextScreen: 'online-join' }); }}>Leave Lobby</Button>
            </div>
          </GlassPanel>
        </div>
      </TopFrame>
    )}
    {screen === 'rules' && <RulesSplashScreen mode={mode} onContinue={() => setScreen('category-choice')} theme={nameTheme} isOnlineMode={onlineMode} />}
    {screen === 'round-type-choice' && round && <TopFrame theme={nameTheme}><div className="mx-auto max-w-3xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} /><GlassPanel className="rounded-[2.5rem] p-8 text-center border-fuchsia-400/25 bg-black/25 relative overflow-hidden"><div className="text-xs uppercase tracking-[0.3em] text-white/50">Round owner: {players[currentRoundOwnerIndex]?.name}</div><h2 className="text-4xl font-black mt-3 text-yellow-300">Choose round type</h2><p className="text-white/70 mt-3">Pick one of two options. Previous round type is excluded.</p><div className="grid gap-3 sm:grid-cols-2 mt-8">{roundTypeOptions.map((type) => <div key={type.id} className="space-y-2"><RoundMascot roundTypeId={type.id} /><div className="rounded-[1.5rem] border border-white/20 bg-black/20 p-3"><RoundTypeLogo src={type.logoSrc} alt={`${type.name} logo`} className="mx-auto h-16 w-auto rounded-md border border-white/20 bg-black/25 px-2 py-1" /><ThemeArt src={`/assets/themes/default/cards/prompt-front-${type.id}.svg`} alt={`${type.name} default card front`} className="mx-auto mt-3 h-28 w-auto rounded-xl border border-white/20 bg-black/25 p-1" /><div className="mt-3 text-xs uppercase tracking-[0.2em] text-white/60">Round Type Logo + Default Front Card</div></div><Button className={`rounded-[1.75rem] h-20 text-lg bg-gradient-to-r ${themeMeta.gradient} text-white border-2 border-white/20 shadow-lg w-full`} onClick={() => { setSelectedRoundType(type.id); setScreen('category-choice'); }}>{type.name}</Button></div>)}</div></GlassPanel></div></TopFrame>}
    {screen === 'category-choice' && round && <TopFrame theme={nameTheme}><div className="mx-auto max-w-3xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} /><GlassPanel className="rounded-[2.5rem] p-8 text-center border-fuchsia-400/25 bg-black/25 relative overflow-hidden"><LightningBolt className="right-8 top-6" /><LightningBolt className="left-10 bottom-6" /><div className="text-xs uppercase tracking-[0.3em] text-white/50">Round owner: {players[currentRoundOwnerIndex]?.name}</div><h2 className="text-4xl font-black mt-3 text-yellow-300">Choose the next category</h2><p className="text-white/70 mt-3">{copyState.chooser}</p><div className="grid gap-3 sm:grid-cols-2 mt-8">{categoryOptions.map((category) => <Button key={category.id} className={`rounded-[1.75rem] h-24 text-lg bg-gradient-to-r ${themeMeta.gradient} text-white border-2 border-white/20 shadow-lg`} onClick={() => chooseCategory(category.id)}>{category.emoji} {category.name}</Button>)}</div></GlassPanel></div></TopFrame>}
    {screen === 'host-intro' && round && (
      <HostIntroScreen
        round={round}
        stingerLine={copyState.hostStinger}
        onContinue={() => setScreen('reveal')}
        theme={nameTheme}
      />
    )}
    {screen === 'reveal' && round && (
      <RevealScreen
        key={`${round.promptKey}-${revealIndex}`}
        players={players}
        currentRevealIndex={revealIndex}
        round={round}
        totalRounds={totalRounds}
        onNext={() => revealIndex < players.length - 1 ? setRevealIndex((r) => r + 1) : (round.roundTypeId === 'grill' ? setScreen('grill') : (refreshCopy(['discussion']), setScreen('discussion')))}
        passLine={copyState.passPhone}
        normalLine={copyState.revealNormal}
        liarLine={copyState.revealLiar}
        theme={nameTheme}
        onlineMode={onlineMode}
        localPlayerName={onlinePlayerName}
      />
    )}
    {screen === 'grill' && round && <GrillEmScreen players={players} round={round} totalRounds={totalRounds} onContinue={(grillData) => { setRound((cur) => ({ ...cur, grillData })); setVotesByPlayerId(Object.fromEntries(players.map((p) => [p.id, '']))); refreshCopy(['voting']); setScreen('voting'); }} theme={nameTheme} />}
    {screen === 'discussion' && round && (
      <DiscussionScreen
        players={players}
        round={round}
        totalRounds={totalRounds}
        onContinue={() => {
          setVotesByPlayerId(Object.fromEntries(players.map((p) => [p.id, ''])));
          refreshCopy(['voting']);
          setScreen('voting');
        }}
        line={copyState.discussion}
        theme={nameTheme}
        onlineVoiceEnabled={onlineMode}
        onlineVoiceMuted={onlineVoiceMuted}
        setOnlineVoiceMuted={setOnlineVoiceMuted}
        canTalk={onlineVoiceEnabled}
      />
    )}
    {screen === 'voting' && round && (
      <VotingScreen
        players={players}
        round={round}
        totalRounds={totalRounds}
        votesByPlayerId={votesByPlayerId}
        setVotesByPlayerId={setVotesByPlayerId}
        onSubmitVotes={revealResults}
        line={copyState.voting}
        theme={nameTheme}
        onlineMode={onlineMode}
        onlineVoiceEnabled={onlineMode}
        onlineVoiceMuted={onlineVoiceMuted}
        setOnlineVoiceMuted={setOnlineVoiceMuted}
        canTalk={onlineVoiceEnabled}
      />
    )}
    {screen === 'liar-reveal' && round && <LiarRevealScreen players={players} round={round} onComplete={finishLiarReveal} theme={nameTheme} />}
    {screen === 'results' && round && <ResultsScreen players={players} round={round} totalRounds={totalRounds} tally={tally} roundGains={roundGains} roundBreakdown={roundBreakdown} imposterCaught={imposterCaught} onNextRound={winCondition === 'rounds' && round.roundNumber >= totalRounds ? endGame : nextRound} onEndGame={endGame} resultLine={copyState.result} theme={nameTheme} />}
    {screen === 'final' && <FinalScreen players={players} onRestart={restartToHome} line={copyState.winner} theme={nameTheme} />}
    {screen === 'store' && <StoreScreen onBack={() => setScreen('home')} theme={nameTheme} />}
    {screen === 'settings' && (
      <SettingsScreen
        onBack={() => setScreen('home')}
        premiumEnabled={premiumEnabled}
        setPremiumEnabled={setPremiumEnabled}
        adultMode={adultMode}
        setAdultMode={setAdultMode}
        theme={nameTheme}
        picturePackManifests={availablePicturePackManifests}
        enabledPicturePacks={enabledPicturePacks}
        setEnabledPicturePacks={setEnabledPicturePacks}
        picturePackWeights={picturePackWeights}
        setPicturePackWeights={setPicturePackWeights}
        enabledPictureReleaseChannels={enabledPictureReleaseChannels}
        setEnabledPictureReleaseChannels={setEnabledPictureReleaseChannels}
        releaseChannelSummary={releaseChannelSummary}
      />
    )}
    <AdminDialog open={adminOpen} onOpenChange={setAdminOpen} premiumEnabled={premiumEnabled} customCategories={customCategories} setCustomCategories={setCustomCategories} />
  </>;
}
