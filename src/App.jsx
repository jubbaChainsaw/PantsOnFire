import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Users, EyeOff, Trophy, TimerReset, PlusCircle, Vote,
  SkipForward, Star, Flame, Dice6, Minus, Settings, ShoppingBag, Play,
  ChevronUp, ChevronDown, CheckCircle2, XCircle,
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
import { getThemeAssets, ROUND_TYPE_CARD_FRONT_BY_ID } from './data/themeAssets';
import { NAME_POOLS, randomNameFromTheme } from './data/names';
import { COPY_BANK, createCopyPicker } from './data/gameTextContent';
import {
  DEFAULT_CATEGORIES,
  CHAIN_REACTION_ROUNDS,
  MEME_DECODER_ROUNDS,
  SOUND_OFF_ROUNDS,
  OFFTOPIC_DEFENSE_ROUNDS,
  OPINION_ROUNDS,
  MEDIA_ROUNDS,
  GRILL_EM_ROUNDS,
  BANNED_WORD_BANK,
  sanitizeBannedWords,
} from './data/categories';
import { PICTURE_DLC_MANIFESTS } from './data/pictureDlcManifests';
import {
  createLobbyTransport,
  createNextRoundOnServer,
  createLobbyOnServer,
  createOnlinePlayer,
  advanceRoundPhaseOnServer,
  submitRoundVotesOnServer,
  joinLobbyOnServer,
  leaveLobbyOnServer,
  readPrivateRoundOnServer,
  resumeLobbySessionOnServer,
  startLobbyOnServer,
  toGamePlayers,
} from './online/lobbyTransport';

const LOGO_SRC = '/assets/images/logo.png';
const FLAME_SRC = '/assets/images/flame-placeholder.svg';
const HEARTBEAT_SFX_SRC = '/assets/sfx/heartbeat.mp3';
const FIRE_CRACKLE_SFX_SRC = '/assets/sfx/fire-crackle.wav';
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const ONLINE_VOICE_ACTIVE_SCREENS = new Set(['discussion', 'grill', 'round-type-choice', 'category-choice', 'results']);
const ONLINE_CONNECTION_ACTIVE_SCREENS = new Set([
  'online-lobby-created',
  'online-lobby-waiting',
  'rules',
  'host-intro',
  'reveal',
  'discussion',
  'grill',
  'voting',
  'liar-reveal',
  'results',
  'final',
]);

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
  if (code === 'session-token-expired') return 'Session expired due to inactivity. Rejoin the lobby from a fresh code.';
  if (code === 'resume-token-missing') return 'Session restore token missing. Rejoin the lobby from a fresh code.';
  if (code === 'lobby-session-expired' || code === 'session-player-missing') return 'Session expired because this player left the lobby.';
  if (code === 'host-only') return 'Only the host can start this lobby.';
  if (code === 'lobby-not-started') return 'Lobby has not started yet.';
  if (code === 'round-not-found') return 'Round data is not ready yet.';
  if (code === 'round-player-missing') return 'Your player slot is no longer active in this lobby.';
  if (code === 'round-phase-not-advanceable') return 'Round cannot advance from the current phase.';
  if (code === 'round-phase-not-voting') return 'Voting is not active yet.';
  if (code === 'vote-target-required') return 'Select a player before submitting your vote.';
  if (code === 'invalid-vote-target') return 'That vote target is invalid for this round.';
  if (code === 'round-generation-failed') return 'Server could not generate a new round. Try again.';
  if (code === 'not-enough-players') return `Need at least ${MIN_PLAYERS} players before starting.`;
  if (code === 'player-id-required') return 'Unable to leave lobby: missing player identity.';
  return fallback;
}
function toClientRoundFromServer(round) {
  if (!round || typeof round !== 'object') return null;
  return {
    ...round,
    promptsByPlayerId: {},
    mediaByPlayerId: {},
  };
}
function getCombinedCategories(customCategories) { return [...DEFAULT_CATEGORIES, ...customCategories]; }
function getGrillQuestionsPerPlayer(playerCount) {
  if (!playerCount || playerCount < 1) return 1;
  return Math.max(1, Math.round(20 / playerCount));
}
function assignChainCardForPlayer(deck, index, fallbackLabel, fallbackTopic) {
  if (!deck || !deck.length) return `${fallbackLabel}: ${fallbackTopic}`;
  return `${fallbackLabel}: ${deck[index % deck.length]}`;
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

function buildLocalRound(
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
  } else if (selectedRoundType.id === 'chain') {
    promptOptions = (CHAIN_REACTION_ROUNDS[category.id] || []).map((prompt, index) => ({ prompt, key: `chain::${category.id}::${index}` }));
  } else if (selectedRoundType.id === 'meme') {
    promptOptions = (MEME_DECODER_ROUNDS[category.id] || []).map((prompt, index) => ({ prompt, key: `meme::${category.id}::${index}` }));
  } else if (selectedRoundType.id === 'noise') {
    promptOptions = (SOUND_OFF_ROUNDS[category.id] || []).map((prompt, index) => ({ prompt, key: `noise::${category.id}::${index}` }));
  } else if (selectedRoundType.id === 'offtopic') {
    promptOptions = (OFFTOPIC_DEFENSE_ROUNDS[category.id] || []).map((prompt, index) => ({ prompt, key: `offtopic::${category.id}::${index}` }));
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
  const truthDeck = shuffle(selected.prompt.mainWords || []);
  const liarDeck = shuffle(selected.prompt.imposterWords || []);
  let truthCursor = 0;
  let liarCursor = 0;
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
        if (selectedRoundType.id === 'chain') {
          if (liarIds.includes(player.id)) {
            const value = assignChainCardForPlayer(liarDeck, liarCursor, 'Decoy link', selected.prompt.imposter);
            liarCursor += 1;
            return [player.id, value];
          }
          const value = assignChainCardForPlayer(truthDeck, truthCursor, 'Anchor link', selected.prompt.main);
          truthCursor += 1;
          return [player.id, value];
        }
        return [player.id, liarIds.includes(player.id) ? selected.prompt.imposter : selected.prompt.main];
      })
    ),
  };
}

function calculateRoundResolutionLocal(players, round, votesByPlayerId = {}) {
  const validPlayerIds = new Set(players.map((player) => player.id));
  const normalizedVotes = Object.fromEntries(
    Object.entries(votesByPlayerId || {}).filter(([voterId, targetId]) => {
      if (!validPlayerIds.has(voterId)) return false;
      if (!targetId || !validPlayerIds.has(targetId)) return false;
      return voterId !== targetId;
    })
  );
  const tally = {};
  Object.values(normalizedVotes).forEach((targetId) => {
    tally[targetId] = (tally[targetId] || 0) + 1;
  });
  const liarIds = round?.imposterIds || [];
  const topVotes = Math.max(0, ...Object.values(tally));
  const caughtLiars = liarIds.filter((id) => (tally[id] || 0) > 0 && (tally[id] || 0) === topVotes);
  const imposterCaught = liarIds.length > 0 ? caughtLiars.length === liarIds.length : false;
  const isGrillRound = round?.roundTypeId === 'grill';
  const roundGains = {};
  const roundBreakdown = {};
  const nextPlayers = players.map((player) => {
    let gain = 0;
    let voteHit = 0;
    let liarSurvived = 0;
    let grillTeamBonus = 0;
    let grillLiarSwing = 0;
    if (liarIds.includes(normalizedVotes[player.id])) {
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
    return {
      ...player,
      score: Math.max(0, Number(player.score || 0) + gain),
    };
  });
  return {
    normalizedVotes,
    tally,
    imposterCaught,
    roundGains,
    roundBreakdown,
    nextPlayers,
  };
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
function TopFrame({ children, theme = 'Default', allowScroll = true }) {
  const gradient = THEME_META[theme]?.gradient || THEME_META.Default.gradient;
  return (
    <div className={`min-h-screen min-h-[100dvh] overflow-x-hidden ${allowScroll ? 'overflow-y-auto' : 'overflow-y-hidden'} text-white relative bg-[linear-gradient(135deg,#14043a_8%,#2d126f_45%,#1d0a51_100%)]`}>
      <div
        className="absolute inset-0 opacity-[0.75] bg-repeat"
        style={{
          backgroundImage: "url('/assets/images/backgrounds/game-tile-pattern.png')",
          backgroundSize: '512px 512px',
        }}
      />
      <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${gradient}`} />
      <ZanyAccentBurst className="left-5 top-12" />
      <ZanyAccentBurst className="right-5 bottom-20 scale-125" />
      <LightningBolt className="left-8 bottom-28" />
      <LightningBolt className="right-8 top-24 -rotate-12" />
      <div
        className="relative z-10 md:p-8"
        style={{
          paddingLeft: '1rem',
          paddingRight: '1rem',
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </div>
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
  prompt: { name: 'Ian Poster', face: '🎤', blurb: 'Classic chaos host.' },
  opinion: { name: 'Ian Poster', face: '🎭', blurb: 'Debate instigator.' },
  picture: { name: 'Ian Poster', face: '🖼️', blurb: 'Flash-frame ringmaster.' },
  meme: { name: 'Ian Poster', face: '🧠', blurb: 'Decode the meme vibe, sniff the fake.' },
  noise: { name: 'Ian Poster', face: '🔊', blurb: 'No words. Pure noise. Maximum suspicion.' },
  offtopic: { name: 'Ian Poster', face: '🛡️', blurb: 'Defend the topic like your life depends on it.' },
  chain: { name: 'Ian Poster', face: '🧩', blurb: 'Connect the clues, expose the break.' },
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
function getThemeHostFrameSources(themeName = 'Default', state = 'idle') {
  const assets = getThemeAssets(themeName);
  const defaultAssets = getThemeAssets('Default');
  const idleFrame =
    assets.hostIdle
    || assets.characterCard
    || defaultAssets.hostIdle
    || defaultAssets.characterCard
    || '';
  const talkingFrames = [
    assets.hostTalk1 || defaultAssets.hostTalk1,
    assets.hostTalk2 || defaultAssets.hostTalk2,
    assets.hostTalk3 || defaultAssets.hostTalk3,
  ].filter(Boolean);
  if (state !== 'talking') return [idleFrame].filter(Boolean);
  if (!talkingFrames.length) return [idleFrame].filter(Boolean);
  return talkingFrames;
}
function useTalkingAnimation({ enabled = false, themeName = 'Default' } = {}) {
  const [talkIndex, setTalkIndex] = useState(0);
  const idleFrames = useMemo(
    () => getThemeHostFrameSources(themeName, 'idle'),
    [themeName]
  );
  const talkingFrames = useMemo(
    () => getThemeHostFrameSources(themeName, 'talking'),
    [themeName]
  );
  useEffect(() => {
    setTalkIndex(0);
  }, [themeName, enabled]);
  useEffect(() => {
    if (!enabled) return undefined;
    if (talkingFrames.length <= 1) return undefined;
    const timer = setInterval(() => {
      setTalkIndex((current) => (current + 1) % talkingFrames.length);
    }, 220);
    return () => clearInterval(timer);
  }, [enabled, talkingFrames.length]);
  if (enabled && talkingFrames.length > 0) {
    return talkingFrames[talkIndex] || talkingFrames[0];
  }
  return idleFrames[0] || '';
}
function getHostAssetGuidelines() {
  return 'Host PNG size: 900×1400 px (2:3 ratio), transparent background, keep key face/torso inside ~70% width and ~80% height safe zone. Provide 4 files per theme: host-idle.png + host-talk-1.png + host-talk-2.png + host-talk-3.png.';
}
const HOST_DIALOGUE_TIMINGS = {
  gameIntroAdvanceMs: 6000,
  roundIntroAdvanceMs: 6000,
  liarRevealAdvanceMs: 6000,
  liarRevealCompleteMs: 6000,
};
function GameIntroScreen({ theme, onContinue, isOnlineMode = false, totalRounds = 1, playerCount = 0 }) {
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();
  const resolvedRoundCount = Math.max(1, Number(totalRounds) || 1);
  const resolvedPlayerCount = Math.max(1, Number(playerCount) || 1);
  const introLines = [
    `${greeting}, and welcome to Pants on Fire! Find the Liar.`,
    "I'm your hostess with the mostest... sorry, I mean I am Host with the Most... Ian Poster.",
    `Through ${resolvedRoundCount} rounds, the ${resolvedPlayerCount} of you will battle it out to find out whose integrity is majorly questionable.`,
    'We will discover who has the poker face of someone chewing a lemon,',
    'and which player could gaslight an electric hob.',
    'Let me explain the rules.',
    'Each round, players get private prompts and give clues without exposing the exact card.',
    'Spot the fake, vote the liar, then climb the leaderboard.',
    isOnlineMode
      ? 'Online lobbies keep prompts private on each device, then sync discussion and voting for everyone.'
      : 'Pass the phone during reveals so each prompt stays private.',
  ];
  const [lineIndex, setLineIndex] = useState(0);
  const isTalking = lineIndex < introLines.length - 1;
  const animatedHostSrc = useTalkingAnimation({ enabled: isTalking, themeName: theme });
  useEffect(() => {
    setLineIndex(0);
  }, [theme, isOnlineMode]);
  useEffect(() => {
    if (lineIndex >= introLines.length - 1) return undefined;
    const timer = setTimeout(() => {
      setLineIndex((current) => Math.min(current + 1, introLines.length - 1));
    }, HOST_DIALOGUE_TIMINGS.gameIntroAdvanceMs);
    return () => clearTimeout(timer);
  }, [lineIndex, introLines.length]);
  const canContinue = lineIndex >= introLines.length - 1;
  return (
    <TopFrame theme={theme} allowScroll={false}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col justify-center">
        <GlassPanel className="rounded-[2.5rem] border-cyan-400/20 bg-black/25 p-6 sm:p-8">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Game intro</div>
            <h2 className="mt-3 text-4xl font-black text-yellow-300">Host briefing</h2>
          </div>
          <div className="relative mx-auto mt-6 w-full max-w-3xl min-h-[240px] sm:min-h-[300px]">
            <ThemeArt
              src={animatedHostSrc}
              alt={`${theme} host Ian Poster`}
              className="pointer-events-none absolute bottom-0 left-0 w-28 sm:w-40 md:w-48"
            />
            <motion.div
              key={`intro-line-${lineIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="ml-[5.5rem] sm:ml-[9.5rem] md:ml-[12rem] h-[10.75rem] sm:h-[11.75rem] pt-2 text-white"
            >
              <div className="relative mx-auto flex h-full max-w-2xl items-center justify-center rounded-[2rem] border-2 border-cyan-200/80 bg-[#1d2376] px-4 py-4 text-center shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
                <div className="absolute -left-3 top-[55%] h-6 w-6 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-cyan-200/80 bg-[#1d2376]" />
                <p className="text-base leading-snug text-white/95 sm:text-lg">{introLines[lineIndex]}</p>
              </div>
            </motion.div>
          </div>
          <div className="mt-7 flex justify-center">
            <Button
              className="h-14 rounded-[1.5rem] border-2 border-white bg-yellow-300 px-8 text-zinc-950"
              onClick={onContinue}
              disabled={!canContinue}
            >
              {canContinue ? 'Continue to category selection' : 'Host is introducing...'}
            </Button>
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function getRoundRuleText(roundTypeId = 'prompt') {
  if (roundTypeId === 'opinion') {
    return 'Truth or Twisted: everyone got the same scenario. Liars must ragebait and argue opposite to their natural take.';
  }
  if (roundTypeId === 'meme') {
    return 'Meme Decoder: explain your meme format and vibe naturally. Liars got a different template and must fake the culture.';
  }
  if (roundTypeId === 'noise') {
    return 'Sound Off: perform your clue as a sound only. No words, no letters, no humming lyrics.';
  }
  if (roundTypeId === 'offtopic') {
    return 'Off Topic Defense: truth players share one scenario. Liars got an irrelevant prompt and must argue like it still fits.';
  }
  if (roundTypeId === 'chain') {
    return 'Chain Reaction: everyone gets one clue card. Liars were fed decoy links, so listen for players describing the wrong chain.';
  }
  if (roundTypeId === 'grill') {
    return "Grill 'Em: players ask by microphone and Blaze Byte talks back with AI answers. Liars already saw the hidden prompt and will try to steer the room.";
  }
  return 'Give one clue, blend in, and avoid revealing your exact prompt.';
}
function getInstructionHostLines(roundTypeId = 'prompt') {
  if (roundTypeId === 'opinion') {
    return [
      'Everyone got the same scenario this round.',
      'If you are the liar, argue the opposite side confidently and do not break character.',
      'Drop one clue during discussion, then vote out whoever sounds fake.',
    ];
  }
  if (roundTypeId === 'picture') {
    return [
      'You will see a private picture-based prompt card.',
      'Describe just enough detail to sound real without revealing your exact prompt.',
      'Watch for players forcing random image details that do not fit.',
    ];
  }
  if (roundTypeId === 'meme') {
    return [
      'This is Meme Decoder. Sell your meme format and vibe naturally.',
      'Liars get a different meme framing and must fake internet confidence.',
      'During voting, target whoever explains too hard or sounds off-style.',
    ];
  }
  if (roundTypeId === 'noise') {
    return [
      'Sound Off means clueing with sound only.',
      'No words, no spelling, no lyric humming. Commit to your sound.',
      'Find the player whose sound feels most disconnected from the round.',
    ];
  }
  if (roundTypeId === 'offtopic') {
    return [
      'Most players share one scenario. Liars receive an off-topic one.',
      'Defend your prompt like it belongs in the same conversation.',
      'Vote for whoever feels persuasive but never fully relevant.',
    ];
  }
  if (roundTypeId === 'chain') {
    return [
      'Chain Reaction gives everyone one clue card tied to a hidden topic.',
      'Liars are fed broken links and must blend into the chain.',
      'Listen for the player whose clue almost fits but never locks in.',
    ];
  }
  if (roundTypeId === 'grill') {
    return [
      "Welcome to Grill 'Em. Ask sharp questions and listen to the AI answers.",
      'Liars already know the hidden prompt and may try to steer the room.',
      'After questioning, vote out whoever sounded too prepared.',
    ];
  }
  return [
    'Classic Hot Seat round. Keep your clue short, natural, and indirect.',
    'Liars have a different prompt and must blend into normal clues.',
    'After discussion, vote for the player who sounds most suspicious.',
  ];
}
function getHostExamplePrompts(roundTypeId = 'prompt') {
  if (roundTypeId === 'picture') {
    return {
      normal: 'Eiffel Tower at sunset',
      liar: 'Great Wall at sunrise',
    };
  }
  if (roundTypeId === 'opinion') {
    return {
      normal: 'Pineapple belongs on pizza',
      liar: 'Pineapple ruins every pizza',
    };
  }
  if (roundTypeId === 'meme') {
    return {
      normal: 'Distracted boyfriend format',
      liar: 'Drake hotline bling format',
    };
  }
  if (roundTypeId === 'noise') {
    return {
      normal: 'A buzzing bee',
      liar: 'A squeaky shopping trolley',
    };
  }
  if (roundTypeId === 'offtopic') {
    return {
      normal: 'Beach holiday plans',
      liar: 'Fixing a broken printer',
    };
  }
  if (roundTypeId === 'chain') {
    return {
      normal: 'Road trip playlist',
      liar: 'Hospital waiting room',
    };
  }
  if (roundTypeId === 'grill') {
    return {
      normal: 'Stonehenge',
      liar: 'Eiffel Tower',
    };
  }
  return {
    normal: 'Street market in Bangkok',
    liar: 'Souk in Marrakech',
  };
}
function resolveCategoryChoiceCardArt(category, themeName = 'Default') {
  const themeAssets = getThemeAssets(themeName);
  const defaultThemeAssets = getThemeAssets('Default');
  const categoryBackCardSrc =
    category?.categoryBackCardSrc
    || category?.categoryCardBackSrc
    || category?.cardBackSrc
    || category?.assets?.categoryBackCardSrc
    || category?.assets?.cardBackSrc
    || null;

  return (
    categoryBackCardSrc
    || defaultThemeAssets.promptCardFront
    || themeAssets.promptCardFront
    || defaultThemeAssets.promptCardBack
    || themeAssets.promptCardBack
    || null
  );
}
function HostIntroScreen({ round, stingerLine, onContinue, theme }) {
  const mascot = MASCOT_BY_ROUND_TYPE[round.roundTypeId] || MASCOT_BY_ROUND_TYPE.prompt;
  const themeAssets = getThemeAssets(round.roundTypeId === 'grill' ? 'GrillEm' : theme);
  const defaultThemeAssets = getThemeAssets('Default');
  const useAdultCardArt = Boolean(round.isAdultPrompt);
  const defaultTypeCardFront = ROUND_TYPE_CARD_FRONT_BY_ID[round.roundTypeId] || null;
  const exampleCardSrc = useAdultCardArt
    ? (themeAssets.adultPromptCardFront || defaultThemeAssets.adultPromptCardFront)
    : (defaultTypeCardFront || themeAssets.promptCardFront || defaultThemeAssets.promptCardFront);
  const examplePrompts = getHostExamplePrompts(round.roundTypeId);
  const normalExamplePrompt = examplePrompts.normal;
  const liarExamplePrompt = examplePrompts.liar;
  const speechSentences = [
    `${round.roundTypeName} round selected.`,
    getRoundRuleText(round.roundTypeId),
    stingerLine || `${mascot.name} is in the building. Let the chaos begin.`,
    'Get ready. Cards are about to flip after the countdown.',
  ].filter(Boolean);
  const [speechIndex, setSpeechIndex] = useState(0);
  const canContinue = speechIndex >= speechSentences.length - 1;
  const isTalking = speechIndex < speechSentences.length - 1;
  const animatedHostSrc = useTalkingAnimation({ enabled: isTalking, themeName: theme });
  const introLine = round.roundTypeId === 'grill'
    ? `${mascot.name} is live. Mic up and question the AI.`
    : `${mascot.name} is in the building. Let the chaos begin.`;
  useEffect(() => {
    setSpeechIndex(0);
  }, [round.id, round.roundNumber, round.roundTypeId]);
  useEffect(() => {
    if (speechIndex >= speechSentences.length - 1) return undefined;
    const timer = setTimeout(() => {
      setSpeechIndex((current) => Math.min(current + 1, speechSentences.length - 1));
    }, HOST_DIALOGUE_TIMINGS.roundIntroAdvanceMs);
    return () => clearTimeout(timer);
  }, [speechIndex, speechSentences.length]);
  return (
    <TopFrame theme={theme} allowScroll={false}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col justify-center">
        <GlassPanel className="relative overflow-hidden rounded-[2.5rem] border-cyan-400/20 bg-black/25 p-6 sm:p-8 text-center">
          <div className="text-xs uppercase tracking-[0.35em] text-white/50">Host enters</div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black text-yellow-300">{mascot.name}</h2>
          <p className="mt-1.5 text-sm sm:text-base font-semibold text-cyan-200">{introLine}</p>
          <div className="relative mt-4 h-[220px] sm:h-[250px] w-full">
            <div className="absolute inset-0 flex items-start justify-center gap-3">
              <div className="relative w-[44%] max-w-[10rem]">
                <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/35 bg-black/35 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-cyan-100">
                  Normal
                </div>
                <div className="relative aspect-[2/3] overflow-hidden rounded-[1.2rem] border border-white/25 shadow-lg">
                  {exampleCardSrc && <img src={exampleCardSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" />}
                  <div className="absolute inset-0 bg-black/25" />
                  <div className="absolute bottom-3 left-3 right-3 text-xs font-black leading-tight text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
                    {normalExamplePrompt}
                  </div>
                </div>
              </div>
              <div className="relative w-[44%] max-w-[10rem]">
                <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-full border border-red-200/60 bg-black/35 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-red-100">
                  Liar
                </div>
                <div className="relative aspect-[2/3] overflow-hidden rounded-[1.2rem] border border-white/25 shadow-lg">
                  {exampleCardSrc && <img src={exampleCardSrc} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain" />}
                  <div className="absolute inset-0 bg-red-900/30" />
                  <div className="absolute bottom-3 left-3 right-3 text-xs font-black leading-tight text-yellow-200 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
                    {liarExamplePrompt}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="relative mx-auto mt-2 w-full max-w-2xl h-[11.5rem] sm:h-[12.5rem]">
            <ThemeArt
              src={animatedHostSrc}
              alt={`${theme} presenter`}
              className="pointer-events-none absolute bottom-0 left-0 w-28 sm:w-36"
            />
            <motion.div
              key={`${round.id || round.roundNumber}-${speechIndex}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="ml-[5.25rem] sm:ml-[8.75rem] h-full p-1 text-white"
            >
              <div className="relative mx-auto flex h-full max-w-xl items-center justify-center rounded-[2rem] border-2 border-cyan-200/80 bg-[#1d2376] px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
                <div className="absolute -left-3 top-[58%] h-6 w-6 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-cyan-200/80 bg-[#1d2376]" />
                <p className="text-base leading-snug sm:text-lg text-white/95">{speechSentences[speechIndex]}</p>
              </div>
            </motion.div>
            {round.roundTypeId === 'grill' && (
              <p className="mt-3 text-xs font-semibold text-yellow-200">
                Each player gets {round.grillData?.questionsPerPlayer || 1} questions this round.
              </p>
            )}
            <div className="mt-3 text-xs text-white/70">{round.roundTypeName} • {round.categoryEmoji} {round.categoryLabel}</div>
          </div>
          <Button
            className="mt-7 h-14 rounded-[1.5rem] border-2 border-white bg-yellow-300 px-8 text-zinc-950"
            onClick={onContinue}
            disabled={!canContinue}
          >
            {canContinue ? 'Deal cards' : 'Host is explaining...'}
          </Button>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function RulesSplashScreen({ mode, onContinue, theme, isOnlineMode = false }) {
  return (
    <TopFrame theme={theme} allowScroll={false}>
      <div className="mx-auto max-w-3xl space-y-6">
        <GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/20 bg-black/25 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">How to Play</div>
          <h2 className="text-4xl font-black mt-3 text-yellow-300">Quick Rules</h2>
          <div className="mt-6 grid gap-3 text-center">
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
  return (
    <TopFrame theme="Default">
      <div className="relative min-h-[calc(100vh-2rem)] px-2 flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,94,0,0.45)_0%,rgba(255,94,0,0.2)_35%,rgba(0,0,0,0)_70%)] animate-pulse" />
          <img src={FLAME_SRC} alt="" aria-hidden="true" className="absolute -bottom-6 left-[6%] h-24 w-24 opacity-80 [animation:home-flame-float_2.4s_ease-in-out_infinite] drop-shadow-[0_0_16px_rgba(255,98,0,0.98)]" />
          <img src={FLAME_SRC} alt="" aria-hidden="true" className="absolute -bottom-8 left-[24%] h-28 w-28 opacity-85 [animation:home-flame-float_2.8s_ease-in-out_0.2s_infinite] drop-shadow-[0_0_16px_rgba(255,98,0,0.98)]" />
          <img src={FLAME_SRC} alt="" aria-hidden="true" className="absolute -bottom-5 left-[44%] h-24 w-24 opacity-80 [animation:home-flame-float_2.2s_ease-in-out_0.35s_infinite] drop-shadow-[0_0_16px_rgba(255,98,0,0.98)]" />
          <img src={FLAME_SRC} alt="" aria-hidden="true" className="absolute -bottom-9 left-[66%] h-28 w-28 opacity-85 [animation:home-flame-float_2.95s_ease-in-out_0.1s_infinite] drop-shadow-[0_0_16px_rgba(255,98,0,0.98)]" />
          <img src={FLAME_SRC} alt="" aria-hidden="true" className="absolute -bottom-6 right-[8%] h-24 w-24 opacity-80 [animation:home-flame-float_2.5s_ease-in-out_0.25s_infinite] drop-shadow-[0_0_16px_rgba(255,98,0,0.98)]" />
        </div>
        <div className="relative z-10 w-full max-w-xl text-center space-y-4">
          {adultMode && <GlassPanel className="rounded-[1.4rem] p-3 border-red-400/30 bg-red-500/15"><div className="text-xs uppercase tracking-[0.25em] text-red-200 font-black">18+ Active</div><div className="text-sm text-red-100/90 mt-1">Adult prompt pack is enabled for this session.</div></GlassPanel>}
          <div className="relative px-2 pt-1">
            <img src={FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute top-3 left-5 h-12 w-12 opacity-85 [animation:home-flame-float_2.1s_ease-in-out_infinite] drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
            <img src={FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute top-8 right-6 h-12 w-12 opacity-85 [animation:home-flame-float_2.45s_ease-in-out_0.2s_infinite] drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
            <img src={LOGO_SRC} alt="Pants On Fire logo" className="mx-auto w-full max-w-lg object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]" />
            <p className="mt-2 text-white/80 text-sm md:text-base">{homeLine}</p>
          </div>
          <div className="grid gap-3">
            <Button className="h-16 rounded-[1.8rem] text-xl sm:text-2xl bg-yellow-300 text-zinc-950 hover:bg-yellow-200 border-2 border-white" onClick={() => onNavigate('setup')}><Play className="mr-2 h-5 w-5" />Setup Game</Button>
            <Button className="h-16 rounded-[1.8rem] text-xl sm:text-2xl bg-cyan-500/20 text-white hover:bg-cyan-500/30 border border-cyan-300/40" onClick={() => onNavigate('online-setup')}><Wifi className="mr-2 h-5 w-5" />Create Online Lobby</Button>
            <Button className="h-16 rounded-[1.8rem] text-xl sm:text-2xl bg-indigo-500/15 text-white hover:bg-indigo-500/30 border border-indigo-300/30" onClick={() => onNavigate('online-join')}><KeyRound className="mr-2 h-5 w-5" />Join Online Lobby</Button>
            <Button className="h-16 rounded-[1.8rem] text-xl sm:text-2xl bg-fuchsia-500/15 text-white hover:bg-fuchsia-500/25 border border-fuchsia-400/30" onClick={() => onNavigate('store')}><ShoppingBag className="mr-2 h-5 w-5" />Store</Button>
            <Button className="h-16 rounded-[1.8rem] text-xl sm:text-2xl bg-cyan-500/15 text-white hover:bg-cyan-500/25 border border-cyan-400/30" onClick={() => onNavigate('settings')}><Settings className="mr-2 h-5 w-5" />Settings</Button>
          </div>
          <GlassPanel className="rounded-[2rem] p-5 border-white/10 bg-black/25 text-center"><div className="text-xs uppercase tracking-[0.3em] text-white/45">Online lobbies beta</div><div className="mt-2 text-lg font-black text-cyan-300">Per-device prompts + party voice phases</div><div className="mt-2 text-sm text-white/70">{onlineLobbyLine}</div></GlassPanel>
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
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const themeNames = Object.keys(NAME_POOLS);
  return (
    <TopFrame theme={nameTheme}>
      <div className="mx-auto max-w-7xl space-y-5">
        {adultMode && (
          <GlassPanel className="rounded-[1.4rem] border-red-400/30 bg-red-500/15 p-3">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-red-200">18+ Active</div>
            <div className="mt-1 text-sm text-red-100/90">Adult-only prompts and scenarios are enabled.</div>
          </GlassPanel>
        )}
        <img
          src={LOGO_SRC}
          alt="Pants On Fire logo"
          className="mx-auto w-full max-w-xl object-contain drop-shadow-[0_10px_28px_rgba(0,0,0,0.65)]"
        />
        <ThemeIconStrip src={themeAssets.iconSheet} alt={`${nameTheme} icon strip`} />
        <div className="flex items-center justify-between gap-4">
          <Button className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-2 text-white" onClick={onBack}>Back</Button>
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Create Lobby</div>
            <div className="mt-1 text-sm text-white/80">{setupLine}</div>
          </div>
          <div className="w-[72px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <GlassPanel className="rounded-[2rem] border-cyan-400/20 bg-black/25 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">Players</div>
            <div className="mt-2 text-5xl font-black text-yellow-300">{players.length}</div>
          </GlassPanel>
          <GlassPanel className="rounded-[2rem] border-orange-400/20 bg-black/25 p-5">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">Liars</div>
            <div className="mt-2 text-5xl font-black text-yellow-300">{liarCount}</div>
          </GlassPanel>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="rounded-[2.5rem] border-fuchsia-400/25 bg-black/25 p-5">
            <div className="mb-4 rounded-[1.7rem] border border-white/15 bg-black/25 p-4">
              <div className="text-xs uppercase tracking-[0.3em] text-cyan-200">Game Theme</div>
              <p className="mt-2 text-sm text-white/75">
                This impacts randomised names, card styling and in game dialog.
              </p>
              <select
                value={nameTheme}
                onChange={(event) => setNameTheme(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-white"
              >
                {themeNames.map((themeName) => (
                  <option key={themeName} value={themeName} className="text-black">
                    {themeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4 flex items-center justify-center gap-2">
              <Users className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-black">Player Setup</h2>
            </div>
            <div className="grid gap-3">
              {players.map((player, index) => (
                <div key={player.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Label className="font-semibold text-white/75">Player {index + 1}</Label>
                    <div className="flex gap-2">
                      <Button
                        className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-2 text-cyan-100"
                        onClick={() => setPlayers((currentPlayers) => currentPlayers.map((item) => (
                          item.id === player.id
                            ? { ...item, name: randomNameFromTheme(nameTheme, currentPlayers.filter((x) => x.id !== player.id).map((x) => x.name)) }
                            : item
                        )))}
                      >
                        <Dice6 className="h-4 w-4" />
                      </Button>
                      <Button
                        className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-2 text-fuchsia-100 disabled:opacity-40"
                        disabled={players.length <= MIN_PLAYERS}
                        onClick={() => setPlayers((currentPlayers) => currentPlayers.filter((item) => item.id !== player.id))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Input
                    value={player.name}
                    onChange={(event) => setPlayers((currentPlayers) => currentPlayers.map((item) => (
                      item.id === player.id ? { ...item, name: event.target.value } : item
                    )))}
                    className="rounded-2xl border border-white/10 bg-white/5 text-white"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-cyan-100"
                disabled={players.length >= MAX_PLAYERS}
                onClick={() => setPlayers((currentPlayers) => [
                  ...currentPlayers,
                  { id: `p-${Date.now()}-${currentPlayers.length + 1}`, name: `Player ${currentPlayers.length + 1}`, score: 0 },
                ])}
              >
                <PlusCircle className="mr-2 inline h-4 w-4" />
                Add Player
              </Button>
            </div>
          </GlassPanel>
          <GlassPanel className="rounded-[2.5rem] border-yellow-300/20 bg-black/25 p-5">
            <div className="mb-4 flex items-center justify-center gap-2">
              <ShieldAlert className="h-5 w-5 text-yellow-300" />
              <h2 className="text-xl font-black">Rules</h2>
            </div>
            <div className="space-y-4">
              <GlassPanel className="rounded-[1.5rem] bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Liar Count</div>
                    <div className="mt-1 text-xs text-white/55">Recommended: 1 liar per 4 people.</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button className="rounded-xl border border-white/10 bg-white/5 p-2 text-white" onClick={() => setLiarCount((count) => Math.max(1, count - 1))}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <div className="w-14 text-center text-2xl font-black text-yellow-300">{liarCount}</div>
                    <Button className="rounded-xl border border-white/10 bg-white/5 p-2 text-white" onClick={() => setLiarCount((count) => Math.min(maxLiars, count + 1))}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </GlassPanel>
              <GlassPanel className="rounded-[1.5rem] bg-white/5 p-4">
                <div className="mb-3 font-semibold">Mode</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button className={`rounded-2xl px-4 py-3 ${mode === 'classic' ? 'bg-yellow-300 text-zinc-950' : 'border border-white/10 bg-white/5 text-white'}`} onClick={() => setMode('classic')}>Classic</Button>
                  <Button className={`rounded-2xl px-4 py-3 ${mode === 'chaos' ? 'bg-fuchsia-500 text-white' : 'border border-white/10 bg-white/5 text-white'}`} onClick={() => setMode('chaos')}>Chaos 🔥</Button>
                </div>
              </GlassPanel>
              <GlassPanel className="rounded-[1.5rem] bg-white/5 p-4">
                <div className="mb-3 font-semibold">Game Rules</div>
                <div className="mb-2 text-xs text-white/55">Win condition (choose one)</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button className={`rounded-2xl px-4 py-3 ${winCondition === 'points' ? 'bg-yellow-300 text-zinc-950' : 'border border-white/10 bg-white/5 text-white'}`} onClick={() => setWinCondition('points')}>Points</Button>
                  <Button className={`rounded-2xl px-4 py-3 ${winCondition === 'rounds' ? 'bg-fuchsia-500 text-white' : 'border border-white/10 bg-white/5 text-white'}`} onClick={() => setWinCondition('rounds')}>Rounds</Button>
                </div>
                {winCondition === 'points' ? (
                  <>
                    <div className="mb-2 mt-4 text-xs text-white/55">Points to win</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[10, 15, 20].map((value) => (
                        <Button
                          key={value}
                          className={`rounded-2xl px-4 py-3 ${pointsToWin === value ? 'bg-yellow-300 text-zinc-950' : 'border border-white/10 bg-white/5 text-white'}`}
                          onClick={() => setPointsToWin(value)}
                        >
                          {value}
                        </Button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2 mt-4 text-xs text-white/55">Rounds per player</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((value) => (
                        <Button
                          key={value}
                          className={`rounded-2xl px-4 py-3 ${roundsPerPlayer === value ? 'bg-fuchsia-500 text-white' : 'border border-white/10 bg-white/5 text-white'}`}
                          onClick={() => setRoundsPerPlayer(value)}
                        >
                          {value}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-cyan-200">Total rounds: {players.length * roundsPerPlayer}</div>
                  </>
                )}
              </GlassPanel>
              <GlassPanel className="rounded-[1.5rem] bg-white/5 p-4">
                <div className="mb-3 font-semibold">Grill 'Em Defaults</div>
                <div className="mb-2 text-xs text-white/55">Questions are auto-set each round to target ~20 total questions (based on player count).</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button className={`rounded-2xl px-4 py-3 ${grillSettings.micEnabled ? 'bg-emerald-400 text-zinc-950' : 'border border-white/10 bg-white/5 text-white'}`} onClick={() => setGrillSettings((current) => ({ ...current, micEnabled: !current.micEnabled }))}>Mic {grillSettings.micEnabled ? 'On' : 'Off'}</Button>
                  <Button className={`rounded-2xl px-4 py-3 ${grillSettings.ttsEnabled ? 'bg-emerald-400 text-zinc-950' : 'border border-white/10 bg-white/5 text-white'}`} onClick={() => setGrillSettings((current) => ({ ...current, ttsEnabled: !current.ttsEnabled }))}>Voice {grillSettings.ttsEnabled ? 'On' : 'Off'}</Button>
                </div>
                <div className="mt-3 text-xs text-cyan-200">Example: 7 players gives 3 each, 4 players gives 5 each.</div>
              </GlassPanel>
              <GlassPanel className="rounded-[1.5rem] bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">Category Edit</div>
                    <div className="mt-1 text-xs text-white/55">{categoryCount} categories enabled.</div>
                  </div>
                  <Button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white" onClick={() => setCategoryDialogOpen(true)}>Edit</Button>
                </div>
              </GlassPanel>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button className="h-14 rounded-[1.5rem] border-2 border-white bg-yellow-300 text-zinc-950" onClick={onStart} disabled={!canStart}>{startLabel}</Button>
                <Button className="h-14 rounded-[1.5rem] border border-fuchsia-400/30 bg-fuchsia-500/10 text-white" onClick={onOpenAdmin}>Open Admin</Button>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
      <Dialog open={categoryDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] border border-fuchsia-400/20 bg-[#13002d] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl text-yellow-300">Category Edit</DialogTitle>
            <DialogDescription className="text-white/60">Tap categories to enable or disable them for this lobby.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Object.keys(enabledCategories).map((id) => {
              const enabled = enabledCategories[id];
              const category = DEFAULT_CATEGORIES.find((item) => item.id === id) || { name: id, emoji: '🎲' };
              return (
                <button
                  key={id}
                  onClick={() => onToggleCategory(id)}
                  className={enabled
                    ? 'rounded-[1.5rem] border border-white/20 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 p-4 text-center'
                    : 'rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-center opacity-45'}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-lg font-black">{category.emoji} {category.name}</div>
                    <div className="text-xs text-white/60">{enabled ? 'Enabled' : 'Disabled'}</div>
                    {enabled ? <CheckCircle2 className="h-5 w-5 text-cyan-300" /> : <XCircle className="h-5 w-5 text-white/45" />}
                  </div>
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button className="rounded-2xl bg-yellow-300 px-4 py-2 text-zinc-950" onClick={() => setCategoryDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TopFrame>
  );
}
function RevealScreen({ players, currentRevealIndex, round, totalRounds, onNext, passLine, normalLine, liarLine, theme, onlineMode = false, localPlayerName = '', onlinePrivatePrompt = null, onlinePrivatePromptError = '', privatePromptLoading = false }) {
  const player = players[currentRevealIndex];
  const prompt = onlineMode
    ? (onlinePrivatePrompt?.prompt || '')
    : round.promptsByPlayerId[player.id];
  const mediaSrc = onlineMode
    ? (onlinePrivatePrompt?.mediaSrc || null)
    : (round.mediaByPlayerId?.[player.id] || null);
  const isLast = currentRevealIndex === players.length - 1;
  const isImposter = onlineMode
    ? Boolean(onlinePrivatePrompt?.isImposter)
    : (round.imposterIds || []).includes(player.id);
  const [cardFace, setCardFace] = useState('back');
  const [countdownValue, setCountdownValue] = useState(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [readyToReveal, setReadyToReveal] = useState(false);
  const [promptFontSize, setPromptFontSize] = useState(54);
  const fireAudioRef = useRef(null);
  const promptTextRef = useRef(null);
  const promptFitContainerRef = useRef(null);
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
  useEffect(() => {
    if (cardFace !== 'front') {
      try {
        fireAudioRef.current?.pause();
      } catch {}
      return undefined;
    }
    try {
      const audio = new Audio(FIRE_CRACKLE_SFX_SRC);
      audio.volume = isImposter ? 0.4 : 0.22;
      fireAudioRef.current = audio;
      audio.play().catch(() => {});
    } catch {}
    return () => {
      try {
        fireAudioRef.current?.pause();
      } catch {}
      fireAudioRef.current = null;
    };
  }, [cardFace, isImposter]);

  useLayoutEffect(() => {
    if (cardFace !== 'front') {
      setPromptFontSize((current) => (current === 54 ? current : 54));
      return;
    }
    const promptElement = promptTextRef.current;
    const fitContainer = promptFitContainerRef.current;
    if (!promptElement || !fitContainer) return;

    const maxSize = 54;
    const minSize = 12;
    let nextSize = maxSize;
    promptElement.style.fontSize = `${nextSize}px`;
    promptElement.style.lineHeight = '1.05';

    const fits = () => (
      promptElement.scrollHeight <= fitContainer.clientHeight
      && promptElement.scrollWidth <= fitContainer.clientWidth
    );

    while (nextSize > minSize && !fits()) {
      nextSize -= 1;
      promptElement.style.fontSize = `${nextSize}px`;
    }

    setPromptFontSize((current) => (current === nextSize ? current : nextSize));
  }, [prompt, mediaSrc, cardFace, isImposter]);

  const imposterEmberParticles = useMemo(() => (
    Array.from({ length: 16 }, (_, index) => {
      const left = `${6 + ((index * 17) % 84)}%`;
      const delay = `${(index % 8) * 0.23}s`;
      const duration = `${2.4 + ((index * 0.19) % 1.9)}s`;
      const size = `${4 + ((index * 5) % 10)}px`;
      return {
        id: `ember-${index}`,
        left,
        delay,
        duration,
        size,
      };
    })
  ), []);

  function startRevealCountdown() {
    if (readyToReveal || isCountingDown || cardFace !== 'back') return;
    setReadyToReveal(true);
    setCountdownValue(3);
    setIsCountingDown(true);
  }

  return (
    <TopFrame theme={theme} allowScroll={false}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col">
        <GlassPanel className="flex-1 rounded-[2.5rem] border-white/15 bg-black/25 p-5 sm:p-6 text-center overflow-hidden">
          <Badge className="rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-white">
            Secret reveal {currentRevealIndex + 1} / {players.length}
          </Badge>
          <h2 className="text-4xl font-black mt-4 text-yellow-300">
            {onlineMode ? `Reveal for ${localPlayerName || player.name}` : `Pass the phone to ${player.name}`}
          </h2>
          <p className="text-cyan-200/90 mt-3 font-medium">{passLine}</p>
          {onlineMode && onlinePrivatePromptError && (
            <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-100">
              {onlinePrivatePromptError}
            </div>
          )}

          <div className="mt-6 mx-auto w-full max-w-[22rem] sm:max-w-sm [perspective:1200px]">
            <motion.div
              animate={{ rotateY: cardFace === 'front' ? 180 : 0 }}
              transition={{ duration: 0.75, ease: 'easeInOut' }}
              className="relative w-full aspect-[2/3] [transform-style:preserve-3d]"
            >
              <div className="absolute inset-0 overflow-hidden rounded-[1.7rem] border-2 border-white/25 [backface-visibility:hidden]">
                {cardBackSrc && <img src={cardBackSrc} alt="Prompt card back" className="absolute inset-0 h-full w-full object-contain bg-black/30" />}
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 flex h-full flex-col items-center p-6 text-center text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
                  <RoundTypeLogo
                    src={roundTypeLogoSrc}
                    alt={`${round.roundTypeName} logo`}
                    className="mx-auto h-16 w-auto"
                  />
                  <div className="text-xs uppercase tracking-[0.3em] text-cyan-200/95">{round.roundTypeName}</div>
                  <div className="mt-2 text-sm font-semibold text-white/90">Round {round.roundNumber}</div>
                  <div className="mt-5 text-sm text-white/95">
                    {instructionLine}
                  </div>
                  <div className="mt-2 text-xs text-white/90">{round.roundTypeTagline}</div>
                  <div className="mt-auto pb-4 text-center">
                    <div className="text-3xl font-black uppercase tracking-[0.18em] text-yellow-200">Get Ready</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-cyan-100/95">
                      {isCountingDown && typeof countdownValue === 'number' && countdownValue > 0
                        ? `Flipping in ${countdownValue}`
                        : (readyToReveal ? 'Card flip incoming' : 'Tap I\'m Ready first')}
                    </div>
                  </div>
                </div>
                {isCountingDown && typeof countdownValue === 'number' && countdownValue > 0 && (
                  <div className="absolute inset-0 z-20 grid place-items-center">
                    <div className="text-8xl font-black text-yellow-300 [text-shadow:0_4px_18px_rgba(0,0,0,0.95)]">{countdownValue}</div>
                  </div>
                )}
              </div>

              <div className={`absolute inset-0 overflow-hidden rounded-[1.7rem] border-2 [backface-visibility:hidden] [transform:rotateY(180deg)] ${isImposter ? 'border-orange-300/90 shadow-[0_0_42px_rgba(255,94,0,0.62)]' : 'border-cyan-300/60'}`}>
                {cardFrontSrc && <img src={cardFrontSrc} alt="Prompt card front" className="absolute inset-0 h-full w-full object-contain bg-black/30" />}
                <div className={`absolute inset-0 ${isImposter ? 'bg-gradient-to-b from-orange-400/34 via-red-600/26 to-red-950/42' : 'bg-black/15'}`} />
                {isImposter && (
                  <>
                    <div className="pointer-events-none absolute -inset-2 rounded-[2rem] border-2 border-orange-300/45 shadow-[inset_0_0_30px_rgba(255,97,24,0.45)]" />
                    <div className="pointer-events-none absolute inset-0 rounded-[1.7rem] bg-[radial-gradient(circle_at_50%_90%,rgba(255,150,0,0.38)_0%,rgba(255,70,0,0.24)_35%,rgba(0,0,0,0)_68%)]" />
                    <img src={FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute -top-5 -left-3 h-14 w-14 opacity-95 animate-pulse drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
                    <img src={FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute -top-6 right-1 h-16 w-16 opacity-95 animate-pulse drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
                    <img src={FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-1 -right-3 h-14 w-14 opacity-90 animate-pulse drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
                    <img src={FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 -left-2 h-12 w-12 opacity-85 animate-pulse drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
                    {imposterEmberParticles.map((particle) => (
                      <span
                        key={particle.id}
                        className="pointer-events-none absolute rounded-full bg-orange-300/90 shadow-[0_0_8px_rgba(255,143,46,0.95)]"
                        style={{
                          left: particle.left,
                          bottom: '-10%',
                          width: particle.size,
                          height: particle.size,
                          animation: `imposter-ember-rise ${particle.duration} ease-out ${particle.delay} infinite`,
                        }}
                      />
                    ))}
                  </>
                )}
                <div className="relative z-10 flex h-full flex-col p-6 text-center text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
                  <div className="text-xs uppercase tracking-[0.3em] text-white/75">
                    {round.roundTypeName} • {round.categoryEmoji} {round.categoryLabel}
                  </div>
                  <RoundTypeLogo
                    src={roundTypeLogoSrc}
                    alt={`${round.roundTypeName} logo`}
                    className="mt-3 h-14 w-auto mx-auto"
                  />
                  <div className={`mt-3 text-xs font-semibold uppercase tracking-[0.25em] ${isImposter ? 'text-orange-100' : 'text-cyan-200'}`}>
                    {isImposter ? 'IMPOSTER CARD' : round.hint}
                  </div>
                  {round.mediaPreviewLabel && (
                    <div className="mt-3 text-sm text-white/85">{round.mediaPreviewLabel}</div>
                  )}
                  {mediaSrc && (
                    <img src={mediaSrc} alt={`${round.hint} visual clue`} className="mt-3 w-full rounded-2xl" />
                  )}
                  <div ref={promptFitContainerRef} className="mt-4 max-h-[11.5rem] overflow-hidden">
                    <div
                      ref={promptTextRef}
                      className={`font-black ${isImposter ? 'text-yellow-300' : 'text-white'}`}
                      style={{
                        fontSize: `${promptFontSize}px`,
                        wordBreak: 'normal',
                        overflowWrap: 'normal',
                        whiteSpace: 'nowrap',
                        hyphens: 'none',
                        WebkitHyphens: 'none',
                        lineHeight: 1.05,
                      }}
                    >
                      {prompt}
                    </div>
                  </div>
                  {onlineMode && privatePromptLoading && (
                    <div className="mt-3 text-sm text-cyan-100/90">
                      Loading your private prompt...
                    </div>
                  )}
                  <div className={`mt-3 text-sm font-semibold ${isImposter ? 'text-orange-200' : 'text-cyan-200'}`}>
                    {isImposter ? `🔥 ${liarLine} 🔥` : normalLine}
                  </div>
                  {round.mode === 'chaos' && round.bannedWords.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs uppercase tracking-[0.2em] text-red-300">Banned Words</div>
                      <div className="mt-1 text-xs text-red-200">{round.bannedWords.join(' • ')}</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {cardFace === 'back' && !readyToReveal && !isCountingDown && (
            <Button
              className="rounded-[1.5rem] h-14 px-8 mt-6 bg-yellow-300 text-zinc-950 border-2 border-white"
              onClick={startRevealCountdown}
            >
              I&apos;m Ready
            </Button>
          )}

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
const GRILL_TAG_KEYWORDS = {
  person: ['person', 'human', 'celebrity', 'singer', 'rapper', 'actor', 'actress', 'footballer', 'artist'],
  band: ['band', 'group', 'musician', 'song', 'album'],
  location: ['location', 'place', 'city', 'country', 'town', 'village', 'capital', 'region'],
  landmark: ['landmark', 'monument', 'tower', 'bridge', 'museum', 'opera', 'castle', 'statue'],
  animal: ['animal', 'mammal', 'bird', 'fish', 'pet', 'wild'],
  food: ['food', 'drink', 'meal', 'snack', 'dessert', 'edible', 'eat', 'taste'],
  vehicle: ['vehicle', 'car', 'plane', 'aircraft', 'train', 'bike', 'motorcycle', 'boat'],
  movie: ['movie', 'film', 'series', 'show', 'tv'],
  object: ['object', 'thing', 'device', 'tech', 'gadget'],
};
const BRITISH_MALE_VOICE_NAME_HINTS = [
  'daniel', 'george', 'thomas', 'oliver', 'arthur', 'gordon', 'malcolm',
  'male', 'uk english male',
];
const BRITISH_FEMALE_VOICE_NAME_HINTS = ['female', 'susan', 'hazel', 'serena', 'siri', 'karen', 'zira'];

function collectTagsFromText(text) {
  const normalized = String(text || '').toLowerCase();
  const tags = new Set();
  Object.entries(GRILL_TAG_KEYWORDS).forEach(([tag, keywords]) => {
    if (keywords.some((keyword) => normalized.includes(keyword))) tags.add(tag);
  });
  return tags;
}
function inferTargetTags(targetRaw = '', targetPrompt = '') {
  const tags = collectTagsFromText(`${targetRaw} ${targetPrompt}`);
  if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}$/.test(String(targetRaw || '').trim())) tags.add('person');
  if (/^The\s+[A-Z]/.test(String(targetRaw || '').trim())) tags.add('band');
  return tags;
}
function inferQuestionTags(question = '') {
  return collectTagsFromText(question);
}
function pickBritishMaleVoice(voices = []) {
  const britishVoices = voices.filter((voice) => /en-GB/i.test(voice?.lang || ''));
  if (!britishVoices.length) return null;
  const lowerName = (voice) => String(voice?.name || '').toLowerCase();
  const explicitMale = britishVoices.find((voice) => (
    BRITISH_MALE_VOICE_NAME_HINTS.some((hint) => lowerName(voice).includes(hint))
  ));
  if (explicitMale) return explicitMale;
  const filtered = britishVoices.find((voice) => (
    !BRITISH_FEMALE_VOICE_NAME_HINTS.some((hint) => lowerName(voice).includes(hint))
  ));
  return filtered || britishVoices[0];
}
function answerGrillQuestion(question = '', round = {}) {
  const asked = String(question || '').trim().toLowerCase();
  if (!asked) return 'Not really applicable';

  const targetRaw = String(round?.main || '').trim();
  const targetPrompt = String(round?.aiPrompt || '');
  const targetLower = `${targetRaw} ${targetPrompt}`.toLowerCase();
  const targetTokens = [...new Set(
    targetLower
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 4)
  )];
  const directTokenMatch = targetTokens.some((token) => asked.includes(token));
  if (directTokenMatch) return 'Yes';

  const targetTags = inferTargetTags(targetRaw, targetPrompt);
  const questionTags = inferQuestionTags(asked);
  const hasTaggedQuestion = questionTags.size > 0;
  const hasTagOverlap = [...questionTags].some((tag) => targetTags.has(tag));
  if (hasTaggedQuestion && hasTagOverlap) return 'Yes';
  if (hasTaggedQuestion && !hasTagOverlap) return 'No';

  if (/\b(is it|does it|can it|would it)\b/.test(asked)) return 'Possibly';
  if (/\b(where|when|which|who)\b/.test(asked)) return 'Kind of';
  return 'Not really applicable';
}
function GrillEmScreen({ players, round, totalRounds, onContinue, theme }) {
  const [question, setQuestion] = useState('');
  const [transcript, setTranscript] = useState(round.grillData?.transcript || []);
  const questionsPerPlayer = round.grillData?.questionsPerPlayer || getGrillQuestionsPerPlayer(players.length);
  const [askedCounts, setAskedCounts] = useState(round.grillData?.askedCounts || {});
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const [voiceRevision, setVoiceRevision] = useState(0);
  const recognitionRef = useRef(null);
  const [turnIndex, setTurnIndex] = useState(round.grillData?.turnIndex || 0);
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
  const totalQuestionsTarget = players.length * questionsPerPlayer;
  const askedSoFar = players.reduce((acc, player) => acc + Math.min(questionsPerPlayer, askedCounts[player.id] || 0), 0);

  function findNextTurnIndex(startIndex, countsSnapshot = askedCounts) {
    if (!players.length) return -1;
    for (let step = 0; step < players.length; step += 1) {
      const candidate = (startIndex + step + players.length) % players.length;
      const candidatePlayer = players[candidate];
      if ((countsSnapshot[candidatePlayer.id] || 0) < questionsPerPlayer) return candidate;
    }
    return -1;
  }
  const activeTurnIndex = findNextTurnIndex(turnIndex);
  const activePlayer = activeTurnIndex === -1 ? null : players[activeTurnIndex];
  const allAsked = activeTurnIndex === -1;

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);
  useEffect(() => {
    const validTurnIndex = findNextTurnIndex(turnIndex);
    if (validTurnIndex !== -1 && validTurnIndex !== turnIndex) {
      setTurnIndex(validTurnIndex);
    }
  }, [turnIndex, askedCounts, players.length, questionsPerPlayer]);
  useEffect(() => {
    if (!canUseSpeech) return undefined;
    const synth = window.speechSynthesis;
    const handleVoicesChanged = () => setVoiceRevision((current) => current + 1);
    synth.onvoiceschanged = handleVoicesChanged;
    synth.getVoices();
    return () => {
      if (synth.onvoiceschanged === handleVoicesChanged) synth.onvoiceschanged = null;
    };
  }, [canUseSpeech]);

  function speak(text) {
    if (!canUseSpeech) return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = pickBritishMaleVoice(voices);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || 'en-GB';
      } else {
        utterance.lang = 'en-GB';
      }
      utterance.rate = 0.98;
      utterance.pitch = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  function toggleMic() {
    if (!canUseMic || allAsked || !activePlayer) return;
    setMicError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!isListening) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-GB';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;
        recognition.onresult = (event) => {
          const text = event?.results?.[0]?.[0]?.transcript || '';
          if (text) setQuestion(text);
        };
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
          setIsListening(false);
          const reason = String(event?.error || '').toLowerCase();
          if (reason === 'not-allowed') {
            setMicError('Microphone blocked. Enable mic permission for this site and try again.');
            return;
          }
          if (reason === 'no-speech') {
            setMicError('No speech detected. Try again and speak closer to the mic.');
            return;
          }
          if (reason === 'audio-capture') {
            setMicError('No microphone input detected. Check your device mic.');
            return;
          }
          setMicError(reason ? `Mic error: ${reason}` : 'Mic failed. Try typing your question.');
        };
        recognitionRef.current = recognition;
        recognition.start();
      } catch {
        setIsListening(false);
        setMicError('Unable to start microphone on this device/browser. You can still type questions.');
      }
    } else {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
    }
  }

  function submitQuestion() {
    const trimmed = question.trim();
    if (!trimmed || allAsked || !activePlayer) return;
    const answer = answerGrillQuestion(trimmed, round);
    const playerAskedCount = (askedCounts[activePlayer.id] || 0) + 1;
    const nextCounts = { ...askedCounts, [activePlayer.id]: playerAskedCount };
    const nextRow = {
      id: `${Date.now()}-${activePlayer.id}-${playerAskedCount}`,
      player: activePlayer?.name || 'Player',
      question: trimmed,
      answer,
      turn: playerAskedCount,
    };
    setTranscript((cur) => [...cur, nextRow]);
    setAskedCounts(nextCounts);
    setTurnIndex(findNextTurnIndex(activeTurnIndex + 1, nextCounts));
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
    speak(answer);
    setQuestion('');
  }

  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-5xl space-y-6">
        <ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} />
        <GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/20 bg-black/25">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">{round.roundTypeName}</div>
            <h2 className="text-4xl font-black mt-3 text-yellow-300">Interrogate Blaze Byte 🤖</h2>
            <p className="text-cyan-200 mt-3">
              One player asks at a time. Turn rotates after each question.
            </p>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/70">Current questioner</div>
            <div className="text-2xl font-black text-yellow-300 mt-1">{allAsked ? 'All questions complete' : activePlayer?.name}</div>
            <div className="text-xs text-white/55 mt-2">Questions left: {Math.max(0, totalQuestionsTarget - askedSoFar)}</div>
            <div className="text-xs text-cyan-200 mt-2">AI voice: male British (when supported by device voices)</div>
          </div>

          <div className="grid gap-3 mt-4 md:grid-cols-[1fr_auto_auto]">
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder={allAsked ? 'All questions complete' : `Ask Blaze Byte a question (${activePlayer?.name}'s turn)`}
              className="rounded-2xl bg-white/5 border border-white/10 text-white"
              disabled={allAsked}
            />
            {canUseMic ? (
              <Button
                className={`rounded-2xl px-4 ${isListening ? 'bg-red-500 text-white' : 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-100'}`}
                onClick={toggleMic}
                disabled={allAsked}
              >
                {isListening ? 'Stop Mic' : 'Use Mic'}
              </Button>
            ) : (
              <div className="rounded-2xl px-4 py-3 border border-amber-400/30 bg-amber-500/10 text-amber-200 text-xs">
                Mic unavailable here. Use typed questions.
              </div>
            )}
            <Button
              className="rounded-2xl px-5 bg-yellow-300 text-zinc-950 border-2 border-white disabled:opacity-40"
              onClick={submitQuestion}
              disabled={allAsked || !question.trim()}
            >
              Ask AI
            </Button>
          </div>

          {micError && (
            <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-red-200 text-sm">
              {micError}
            </div>
          )}

          <div className="mt-6 space-y-3 max-h-[280px] overflow-auto pr-1">
            {transcript.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-white/60">No questions yet.</div>
            )}
            {transcript.map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-sm text-cyan-200 font-semibold">{row.player} • Q{row.turn}</div>
                <div className="text-white mt-1">{row.question}</div>
                <div className="mt-3 inline-flex rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-3 py-1 text-sm font-black text-fuchsia-200">
                  Blaze Byte: {row.answer}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              className="rounded-[1.5rem] h-14 px-8 bg-yellow-300 text-zinc-950 border-2 border-white"
              onClick={() => onContinue({ transcript, questionsPerPlayer, askedCounts, micEnabled, ttsEnabled: speechEnabled, turnIndex: activeTurnIndex })}
              disabled={!allAsked}
            >
              Continue to voting
            </Button>
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
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

function DiscussionScreen({ players, round, totalRounds, onContinue, line, theme, onlineVoiceEnabled = false, onlineVoiceMuted = false, setOnlineVoiceMuted = () => {}, canTalk = true, submitPending = false }) {
  const roundRule = getRoundRuleText(round.roundTypeId);
  return <TopFrame theme={theme}><div className="mx-auto max-w-3xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} /><VoicePartyStatusStrip onlineVoiceEnabled={onlineVoiceEnabled} onlineVoiceMuted={onlineVoiceMuted} setOnlineVoiceMuted={setOnlineVoiceMuted} canTalk={canTalk} /><GlassPanel className="rounded-[2.5rem] p-8 text-center border-emerald-400/20 bg-black/25"><Badge className="rounded-full bg-emerald-500/20 border border-emerald-400/20 text-emerald-100 px-4 py-1.5">All prompts delivered</Badge><div className="text-xs uppercase tracking-[0.3em] text-white/50 mt-4">{round.roundTypeName}</div><h2 className="text-4xl font-black mt-3 text-yellow-300">{round.roundTypeTagline}</h2><p className="text-white/75 mt-3 max-w-2xl mx-auto">{line}</p><p className="text-cyan-200 mt-3 max-w-2xl mx-auto font-semibold">{roundRule}</p><Button className="rounded-[1.5rem] h-16 px-8 mt-8 bg-yellow-300 text-zinc-950 border-2 border-white" onClick={onContinue} disabled={submitPending}><SkipForward className="mr-2 h-5 w-5 inline" />{submitPending ? 'Syncing...' : 'Finish discussion and vote'}</Button></GlassPanel></div></TopFrame>;
}
function VotingScreen({ players, round, totalRounds, votesByPlayerId, setVotesByPlayerId, onSubmitVotes, line, theme, onlineMode = false, onlinePlayerId = '', onlineVoiceEnabled = false, onlineVoiceMuted = false, setOnlineVoiceMuted = () => {}, canTalk = true, submitPending = false }) {
  const leader = players.find((p) => p.id === round.leaderId);
  const votersToRender = onlineMode && onlinePlayerId
    ? players.filter((player) => player.id === onlinePlayerId)
    : players;
  const localVoteCount = Object.values(votesByPlayerId).filter(Boolean).length;
  const completeCount = onlineMode
    ? Number(round.voteCompletionCount || 0)
    : localVoteCount;
  const voteTargetCount = onlineMode
    ? Math.max(1, Number(round.voteTargetCount || players.length || 1))
    : Math.max(1, players.length || 1);
  const onlineVoteReady = onlineMode
    ? Boolean(onlinePlayerId && votesByPlayerId[onlinePlayerId])
    : false;
  const allComplete = onlineMode
    ? onlineVoteReady
    : players.every((player) => votesByPlayerId[player.id]);
  const voteInstruction = round.roundTypeId === 'grill'
    ? "Vote for who sounded like they already knew the AI's hidden prompt."
    : (round.roundTypeId === 'chain'
      ? 'Vote for who sounded like they described the broken link.'
      : (round.roundTypeId === 'meme'
        ? 'Vote for who looked like they were faking meme culture.'
        : (round.roundTypeId === 'noise'
          ? 'Vote for whose sound felt most off-topic.'
          : (round.roundTypeId === 'offtopic'
            ? 'Vote for who defended the wrong scenario.'
            : 'Vote for who sounded most suspicious.'))));
  const progressValue = Math.max(0, Math.min(100, (completeCount / voteTargetCount) * 100));
  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-5xl space-y-6">
        <ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} />
        {onlineMode && (
          <VoicePartyStatusStrip
            onlineVoiceEnabled={onlineVoiceEnabled}
            onlineVoiceMuted={onlineVoiceMuted}
            setOnlineVoiceMuted={setOnlineVoiceMuted}
            canTalk={canTalk}
          />
        )}
        <GlassPanel className="rounded-[2.5rem] p-8 border-fuchsia-400/20 bg-black/25">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/50">{round.roundTypeName}</div>
              <h2 className="text-4xl font-black mt-3 text-yellow-300">{round.roundTypeTagline}</h2>
              <p className="text-white/70 mt-2">
                {onlineMode
                  ? 'Vote from your own device. Pick one suspect and submit.'
                  : <>Pass the phone to <span className="font-semibold text-cyan-300">{leader?.name}</span>. </>}
                {line}
              </p>
              <p className="text-cyan-200 mt-2 font-semibold">{voteInstruction}</p>
            </div>
            <GlassPanel className="rounded-[1.75rem] p-4 min-w-[220px] border-cyan-400/20 bg-black/20">
              <div className="text-sm text-white/70">Votes completed</div>
              <div className="text-3xl font-black mt-1 text-yellow-300">
                {completeCount}/{voteTargetCount}
              </div>
              <Progress value={progressValue} className="mt-3" />
            </GlassPanel>
          </div>

          <div className="grid gap-4 mt-8 md:grid-cols-2 xl:grid-cols-3">
            {votersToRender.map((voter) => (
              <GlassPanel key={voter.id} className="rounded-[1.75rem] p-4 border-white/10 bg-black/20">
                <div className="font-black text-lg">{voter.name}</div>
                <div className="text-sm text-white/55 mt-1">Who do they vote for?</div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {players.filter((player) => player.id !== voter.id).map((target) => (
                    <Button
                      key={target.id}
                      className={`rounded-2xl h-11 ${votesByPlayerId[voter.id] === target.id ? 'bg-yellow-300 text-zinc-950' : 'bg-white/5 border border-white/10 text-white'}`}
                      onClick={() => setVotesByPlayerId((cur) => ({ ...cur, [voter.id]: target.id }))}
                      disabled={submitPending}
                    >
                      {target.name}
                    </Button>
                  ))}
                </div>
              </GlassPanel>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              className="rounded-[1.5rem] h-14 px-8 bg-yellow-300 text-zinc-950 border-2 border-white"
              disabled={!allComplete || submitPending}
              onClick={onSubmitVotes}
            >
              <Vote className="mr-2 h-5 w-5 inline" />
              {submitPending
                ? (onlineMode ? 'Submitting vote...' : 'Submitting votes...')
                : (onlineMode ? 'Submit my vote' : 'Reveal results')}
            </Button>
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function LiarRevealScreen({ players, round, onComplete, theme }) {
  const liars = players.filter((p) => (round.imposterIds || []).includes(p.id));
  const audioRef = useRef(null);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const announcementLines = [
    liars.length > 1 ? 'The Liars are......' : 'The Liar was......',
    liars.length > 0
      ? `${liars.map((player) => player.name).join(', ')}`
      : 'No liar data available.',
    'Hearts pounding. Friendships wobbling. Truth incoming.',
  ];
  const isTalking = announcementIndex < announcementLines.length - 1;
  const animatedHostSrc = useTalkingAnimation({ enabled: isTalking, themeName: theme });
  useEffect(() => {
    try {
      audioRef.current = new Audio(HEARTBEAT_SFX_SRC);
      audioRef.current.volume = 0.5;
      audioRef.current.play().catch(() => {});
    } catch {}
    return () => {
      try { audioRef.current?.pause(); } catch {}
    };
  }, []);
  useEffect(() => {
    if (announcementIndex >= announcementLines.length - 1) return undefined;
    const timer = setTimeout(() => {
      setAnnouncementIndex((current) => Math.min(current + 1, announcementLines.length - 1));
    }, HOST_DIALOGUE_TIMINGS.liarRevealAdvanceMs);
    return () => clearTimeout(timer);
  }, [announcementIndex, announcementLines.length]);
  useEffect(() => {
    if (announcementIndex < announcementLines.length - 1) return undefined;
    const timer = setTimeout(() => {
      try { audioRef.current?.pause(); } catch {}
      onComplete();
    }, HOST_DIALOGUE_TIMINGS.liarRevealCompleteMs);
    return () => clearTimeout(timer);
  }, [announcementIndex, announcementLines.length, onComplete]);
  return (
    <TopFrame theme={theme}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col justify-center">
        <GlassPanel className="relative overflow-hidden rounded-[2.5rem] border-red-400/25 bg-black/35 p-6 sm:p-8 text-center">
          <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle,_rgba(255,0,80,0.16)_0%,_rgba(255,0,80,0.08)_35%,_transparent_70%)]" />
          <div className="relative z-10">
            <div className="text-xs uppercase tracking-[0.35em] text-white/50">Final accusation</div>
            <div className="relative mx-auto mt-4 w-full max-w-3xl min-h-[230px] sm:min-h-[280px]">
              <ThemeArt
                src={animatedHostSrc}
                alt={`${theme} presenter`}
                className="pointer-events-none absolute bottom-0 left-0 w-32 sm:w-44"
              />
              <motion.div
                key={`liar-announce-${announcementIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="ml-[6rem] sm:ml-[10.5rem] h-[11rem] sm:h-[12rem] p-1 text-white"
              >
                <div className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center rounded-[2rem] border-2 border-red-300/70 bg-[#2a0f2e] px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.42)]">
                  <div className="absolute -left-3 top-[58%] h-6 w-6 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-red-300/70 bg-[#2a0f2e]" />
                  <p className="text-lg sm:text-2xl font-black leading-snug text-red-200">
                    {announcementLines[Math.min(announcementIndex, announcementLines.length - 1)]}
                  </p>
                  {announcementIndex >= 1 && liars.length > 0 && (
                    <div className="mt-3 inline-flex flex-wrap justify-center gap-2">
                      {liars.map((player) => (
                        <span
                          key={player.id}
                          className="rounded-full border border-red-300/35 bg-red-500/15 px-4 py-1.5 text-sm sm:text-base font-black text-yellow-200"
                        >
                          🔥 {player.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function ResultsScreen({ players, round, totalRounds, tally, roundGains, roundBreakdown, imposterCaught, onNextRound, onEndGame, resultLine, theme }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const lastRound = round.roundNumber >= totalRounds;
  const roundInfoTitle = round.roundTypeId === 'grill'
    ? 'AI Hidden Prompt'
    : ((round.roundTypeId === 'chain')
      ? 'Broken Link Topic'
      : ((round.roundTypeId === 'meme')
        ? 'Wrong Meme Scenario'
        : ((round.roundTypeId === 'noise')
          ? 'Off-Note Sound Prompt'
          : ((round.roundTypeId === 'offtopic')
            ? 'Irrelevant Scenario'
            : 'Liar Prompt'))));
  const roundInfoValue = round.roundTypeId === 'opinion'
    ? 'Truth or Twisted uses one shared scenario for everyone.'
    : (round.roundTypeId === 'chain'
      ? (round.imposterPrompt || 'N/A')
      : (round.imposterPrompt || round.aiPrompt || 'N/A'));
  const promptByPlayerId = round.promptsByPlayerId || {};

  return <TopFrame theme={theme}><div className="mx-auto max-w-5xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} /><GlassPanel className="rounded-[2.5rem] p-8 border-white/15 bg-black/25"><div className="space-y-6"><div className="text-center space-y-4"><div className="text-xs uppercase tracking-[0.3em] text-white/50">Liar Reveal</div><h2 className="text-5xl md:text-6xl font-black text-red-400">🔥 WHO WAS THE LIAR? 🔥</h2><div className={`text-2xl font-black ${imposterCaught ? 'text-yellow-300' : 'text-fuchsia-400'}`}>{imposterCaught ? 'LIAR EXPOSED 🔥' : 'THE LIAR ESCAPED 😈'}</div><div className="text-white/75">{resultLine}</div></div><div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">{players.map((player) => { const isLiar = (round.imposterIds || []).includes(player.id); const breakdown = roundBreakdown?.[player.id] || { voteHit: 0, liarSurvived: 0, grillTeamBonus: 0, grillLiarSwing: 0 }; return <div key={player.id} className={`relative rounded-[1.5rem] p-4 text-center border transition-all duration-300 ${isLiar ? 'bg-red-500/20 border-red-400 shadow-[0_0_20px_rgba(255,0,0,0.6)] scale-105' : 'bg-white/5 border-white/10'}`}><img src={FLAME_SRC} alt="flame" className={`absolute -top-4 right-2 h-8 w-8 ${isLiar ? 'block' : 'hidden'}`} />{isLiar && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-black rounded-full bg-red-500 text-white">🔥 THE LIAR</div>}<div className={`text-lg font-bold ${isLiar ? 'text-red-300' : 'text-white'}`}>{player.name}</div><div className="text-xs text-white/60 mt-2">{promptByPlayerId[player.id] || '—'}</div><div className="mt-3 text-sm font-bold text-cyan-200">+{roundGains?.[player.id] || 0} this round</div><div className="mt-2 text-[11px] text-white/70">Vote hit +{breakdown.voteHit} • Liar survived +{breakdown.liarSurvived}</div>{round.roundTypeId === 'grill' && <div className="mt-1 text-[11px] text-cyan-200">Team bonus +{breakdown.grillTeamBonus} • Swing {breakdown.grillLiarSwing >= 0 ? '+' : ''}{breakdown.grillLiarSwing}</div>}</div>; })}</div><div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]"><div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><GlassPanel className="rounded-[1.75rem] p-5 border-cyan-400/20 bg-black/20"><div className="text-sm text-white/55">Hint / Subcategory</div><div className="text-2xl font-black mt-2">{round.hint}</div><div className="text-xs text-cyan-200 mt-2">{round.roundTypeTagline}</div></GlassPanel><GlassPanel className="rounded-[1.75rem] p-5 border-orange-400/20 bg-black/20"><div className="text-sm text-white/55">{roundInfoTitle}</div><div className="text-2xl font-black mt-2 text-orange-300">{roundInfoValue}</div></GlassPanel></div><GlassPanel className="rounded-[1.75rem] p-5 border-cyan-400/20 bg-black/20"><div className="text-sm text-white/55">Scoring rules</div><div className="mt-2 text-sm text-cyan-100">Correct liar vote: +1 point. Liar survives: +2 points to that liar.</div>{round.roundTypeId === 'grill' && <div className="mt-2 text-xs text-cyan-200">Grill 'Em bonus: if liars are caught, everyone gains +2. If liars survive, liars gain +2 and non-liars lose 1 (floor 0).</div>}</GlassPanel>{round.roundTypeId === 'grill' && (round.grillData?.transcript || []).length > 0 && <GlassPanel className="rounded-[1.75rem] p-5 border-fuchsia-400/20 bg-black/20"><div className="text-sm text-white/55 mb-3">Grill 'Em transcript</div><div className="space-y-2 max-h-56 overflow-auto pr-1">{round.grillData.transcript.map((row) => <div key={row.id} className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="text-xs text-cyan-200">{row.player} • Q{row.turn}</div><div className="text-sm text-white mt-1">{row.question}</div><div className="text-xs text-fuchsia-200 mt-1">Blaze Byte: {row.answer}</div></div>)}</div></GlassPanel>}{round.mode === 'chaos' && round.bannedWords.length > 0 && <GlassPanel className="rounded-[1.75rem] p-5 border-red-400/20 bg-black/20"><div className="text-sm text-white/55 mb-3">Banned Words</div><div className="flex flex-wrap gap-2">{round.bannedWords.map((word) => <span key={word} className="px-3 py-1 rounded-full bg-red-500/20 border border-red-400/30 text-red-200 text-xs">{word}</span>)}</div></GlassPanel>}<GlassPanel className="rounded-[1.75rem] p-5 border-white/10 bg-black/20"><div className="text-sm text-white/55 mb-3">Vote tally</div><div className="grid gap-3 sm:grid-cols-2">{players.map((player) => <div key={player.id} className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-between gap-3"><span>{player.name}</span><Badge className="rounded-full bg-white/10 border border-white/10 text-white">{tally[player.id] || 0} votes</Badge></div>)}</div></GlassPanel></div><div className="space-y-5"><GlassPanel className="rounded-[1.75rem] p-5 border-yellow-300/20 bg-black/20"><div className="flex items-center gap-2 text-yellow-200"><Trophy className="h-5 w-5" /> Scoreboard</div><div className="space-y-3 mt-4">{ranked.map((player, index) => <div key={player.id} className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center justify-between gap-3"><div><div className="text-sm text-white/55">Place {index + 1}</div><div className="font-semibold">{player.name}</div></div><div className="text-right"><div className="text-2xl font-black">{player.score}</div><div className="text-xs text-cyan-200">+{roundGains?.[player.id] || 0} this round</div></div></div>)}</div></GlassPanel>{!lastRound ? <Button className="rounded-[1.5rem] h-14 bg-yellow-300 text-zinc-950 w-full border-2 border-white" onClick={onNextRound}><TimerReset className="mr-2 h-5 w-5 inline" />Start next round</Button> : <Button className="rounded-[1.5rem] h-14 bg-yellow-300 text-zinc-950 w-full border-2 border-white" onClick={onEndGame}><Trophy className="mr-2 h-5 w-5 inline" />View final winner</Button>}</div></div></div></GlassPanel></div></TopFrame>;
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
    meme: 'hostStingerMeme',
    noise: 'hostStingerNoise',
    offtopic: 'hostStingerOfftopic',
    chain: 'hostStingerChain',
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
  const [onlinePrivatePrompt, setOnlinePrivatePrompt] = useState(null);
  const [onlinePrivatePromptError, setOnlinePrivatePromptError] = useState('');
  const [onlinePhasePending, setOnlinePhasePending] = useState(false);
  const [onlineVoteSubmissionPending, setOnlineVoteSubmissionPending] = useState(false);
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
        const hostForClient = snapshotPlayers.find((player) => player.clientId === onlineClientId && player.isHost);
        const nextRole = hostForClient ? 'host' : 'player';
        const nextJoinedPlayer = snapshotPlayers.find((player) => player.clientId === onlineClientId) || null;
        if (onlineMode) {
          setOnlineRole(nextRole);
          const sessionSnapshot = onlineSessionRef.current;
          if (sessionSnapshot) {
            const nextSession = {
              ...sessionSnapshot,
              role: nextRole,
              playerId: nextJoinedPlayer?.id || sessionSnapshot.playerId,
              playerName: nextJoinedPlayer?.name || sessionSnapshot.playerName,
            };
            onlineSessionRef.current = nextSession;
            setStoredOnlineSession(nextSession);
          }
          if (screen === 'online-lobby-waiting' && nextRole === 'host') {
            setScreen('online-lobby-created');
          }
        }
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
            void syncOnlineRoundFromSnapshot(
              {
                ...snapshot,
                players: snapshotPlayers,
                code: snapshot.code || effectiveLobbyCode,
              },
              { openHostIntro: true }
            );
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
        hostStingerMeme: 'gangsterHostStingerPicture',
        hostStingerNoise: 'gangsterHostStingerPrompt',
        hostStingerOfftopic: 'gangsterHostStingerOpinion',
        hostStingerGrill: 'gangsterHostStingerGrill',
      }[key] || key);
    }
    if (nameTheme === 'Monsters') {
      return ({
        hostStingerPrompt: 'monsterHostStingerPrompt',
        hostStingerOpinion: 'monsterHostStingerOpinion',
        hostStingerPicture: 'monsterHostStingerPicture',
        hostStingerMeme: 'monsterHostStingerPicture',
        hostStingerNoise: 'monsterHostStingerPrompt',
        hostStingerOfftopic: 'monsterHostStingerOpinion',
        hostStingerGrill: 'monsterHostStingerGrill',
      }[key] || key);
    }
    if (nameTheme === 'Rock Stars') {
      return ({
        hostStingerPrompt: 'rockHostStingerPrompt',
        hostStingerOpinion: 'rockHostStingerOpinion',
        hostStingerPicture: 'rockHostStingerPicture',
        hostStingerMeme: 'rockHostStingerPicture',
        hostStingerNoise: 'rockHostStingerPrompt',
        hostStingerOfftopic: 'rockHostStingerOpinion',
        hostStingerGrill: 'rockHostStingerGrill',
      }[key] || key);
    }
    if (nameTheme === 'Aliens') {
      return ({
        hostStingerPrompt: 'alienHostStingerPrompt',
        hostStingerOpinion: 'alienHostStingerOpinion',
        hostStingerPicture: 'alienHostStingerPicture',
        hostStingerMeme: 'alienHostStingerPicture',
        hostStingerNoise: 'alienHostStingerPrompt',
        hostStingerOfftopic: 'alienHostStingerOpinion',
        hostStingerGrill: 'alienHostStingerGrill',
      }[key] || key);
    }
    return key;
  };
  const refreshCopy = (keys) => setCopyState((cur) => ({ ...cur, ...Object.fromEntries(keys.map((key) => [key, getLine(themedKey(key))])) }));
  const totalRounds = winCondition === 'rounds' ? (players.length * roundsPerPlayer) : 99;
  const hasScoreWinner = (list) => winCondition === 'points' && list.some((player) => player.score >= pointsToWin);

  async function fetchOnlinePrivatePrompt({
    lobbyCodeValue,
    playerId,
    sessionToken,
    clearErrorOnSuccess = true,
  }) {
    const normalizedCode = String(lobbyCodeValue || '').trim().toUpperCase();
    if (!normalizedCode || !playerId || !sessionToken) return null;
    try {
      const payload = await readPrivateRoundOnServer(normalizedCode, { playerId, sessionToken });
      const nextPrompt = payload?.round || null;
      if (nextPrompt) {
        setOnlinePrivatePrompt(nextPrompt);
        if (clearErrorOnSuccess) setOnlinePrivatePromptError('');
      }
      return nextPrompt;
    } catch (error) {
      setOnlinePrivatePromptError(
        mapLobbyErrorToMessage(error, 'Unable to load your private prompt right now.')
      );
      return null;
    }
  }

  async function syncOnlineRoundFromSnapshot(snapshot, { openHostIntro = false } = {}) {
    if (!snapshot?.activeRound) return null;
    const snapshotPlayers = Array.isArray(snapshot.players) ? snapshot.players : [];
    if (snapshotPlayers.length) {
      setPlayers(toGamePlayers(snapshotPlayers));
    }
    const serverRound = snapshot.activeRound;
    const normalizedPhase = String(serverRound.phase || '').trim() || 'host-intro';
    const stingerCopyKey = HOST_STINGER_COPY_KEYS[serverRound.roundTypeId] || HOST_STINGER_COPY_KEYS.prompt;
    setRound(serverRound);
    setRoundNumber(serverRound.roundNumber || 1);
    setRevealIndex(0);
    setVotesByPlayerId(serverRound.votesByPlayerId || {});
    const resolution = serverRound.resolution || null;
    setTally(resolution?.tally || {});
    setRoundGains(resolution?.roundGains || {});
    setRoundBreakdown(resolution?.roundBreakdown || {});
    setImposterCaught(Boolean(resolution?.imposterCaught));
    setOnlinePrivatePrompt(null);
    setOnlinePrivatePromptError('');
    const sessionSnapshot = onlineSessionRef.current;
    if (sessionSnapshot?.playerId && sessionSnapshot?.sessionToken) {
      await fetchOnlinePrivatePrompt({
        lobbyCodeValue: snapshot.code || lobbyCode,
        playerId: sessionSnapshot.playerId,
        sessionToken: sessionSnapshot.sessionToken,
      });
    }
    if (openHostIntro || normalizedPhase === 'host-intro') {
      refreshCopy(['passPhone', 'revealNormal', 'revealLiar']);
      setCopyState((cur) => ({ ...cur, hostStinger: getLine(themedKey(stingerCopyKey)) }));
      setScreen('host-intro');
      return serverRound;
    }
    if (normalizedPhase === 'reveal') {
      refreshCopy(['passPhone', 'revealNormal', 'revealLiar']);
      setScreen('reveal');
      return serverRound;
    }
    if (normalizedPhase === 'discussion' || normalizedPhase === 'grill') {
      refreshCopy([normalizedPhase === 'grill' ? 'voting' : 'discussion']);
      setScreen(normalizedPhase === 'grill' ? 'grill' : 'discussion');
      return serverRound;
    }
    if (normalizedPhase === 'voting') {
      refreshCopy(['voting']);
      setScreen('voting');
      return serverRound;
    }
    if (normalizedPhase === 'liar-reveal') {
      refreshCopy([Boolean(resolution?.imposterCaught) ? 'caught' : 'escaped']);
      setScreen('liar-reveal');
      return serverRound;
    }
    if (normalizedPhase === 'results') {
      refreshCopy([Boolean(resolution?.imposterCaught) ? 'caught' : 'escaped']);
      setScreen('results');
      return serverRound;
    }
    if (normalizedPhase === 'final') {
      refreshCopy(['winner']);
      setScreen('final');
      return serverRound;
    }
    setScreen('host-intro');
    return serverRound;
  }

  async function runOnlinePhaseAdvance() {
    if (!onlineMode || !lobbyCode) return null;
    const sessionSnapshot = onlineSessionRef.current;
    const playerId = sessionSnapshot?.playerId || onlineJoinedPlayerId;
    const sessionToken = sessionSnapshot?.sessionToken || '';
    if (!playerId || !sessionToken) {
      setOnlineLobbyError('Session expired. Rejoin lobby to continue.');
      return null;
    }
    setOnlinePhasePending(true);
    try {
      const result = await advanceRoundPhaseOnServer(lobbyCode, { playerId, sessionToken });
      if (result?.rotatedSessionToken && result.rotatedSessionToken !== sessionToken) {
        const nextSession = {
          ...(sessionSnapshot || {}),
          sessionToken: result.rotatedSessionToken,
        };
        onlineSessionRef.current = nextSession;
        setStoredOnlineSession(nextSession);
      }
      setOnlineLobbyError('');
      if (result?.lobby?.activeRound) {
        return await syncOnlineRoundFromSnapshot(result.lobby, { openHostIntro: false });
      }
      const synced = await onlineTransportRef.current?.syncSnapshot();
      if (synced?.activeRound) {
        return await syncOnlineRoundFromSnapshot(synced, { openHostIntro: false });
      }
      return null;
    } catch (error) {
      setOnlineLobbyError(mapLobbyErrorToMessage(error, 'Unable to advance phase right now.'));
      return null;
    } finally {
      setOnlinePhasePending(false);
    }
  }

  async function submitOnlineVotes() {
    if (!onlineMode || !lobbyCode) return null;
    const sessionSnapshot = onlineSessionRef.current;
    const playerId = sessionSnapshot?.playerId || onlineJoinedPlayerId;
    const sessionToken = sessionSnapshot?.sessionToken || '';
    if (!playerId || !sessionToken) {
      setOnlineLobbyError('Session expired. Rejoin lobby to continue.');
      return null;
    }
    setOnlineVoteSubmissionPending(true);
    try {
      const votesByPlayerIdToSubmit = onlineMode
        ? { [playerId]: votesByPlayerId[playerId] || '' }
        : votesByPlayerId;
      const result = await submitRoundVotesOnServer(lobbyCode, {
        playerId,
        sessionToken,
        votesByPlayerId: votesByPlayerIdToSubmit,
      });
      if (result?.rotatedSessionToken && result.rotatedSessionToken !== sessionToken) {
        const nextSession = {
          ...(sessionSnapshot || {}),
          sessionToken: result.rotatedSessionToken,
        };
        onlineSessionRef.current = nextSession;
        setStoredOnlineSession(nextSession);
      }
      setOnlineLobbyError('');
      if (result?.lobby?.activeRound) {
        return await syncOnlineRoundFromSnapshot(result.lobby, { openHostIntro: false });
      }
      const synced = await onlineTransportRef.current?.syncSnapshot();
      if (synced?.activeRound) {
        return await syncOnlineRoundFromSnapshot(synced, { openHostIntro: false });
      }
      return null;
    } catch (error) {
      setOnlineLobbyError(mapLobbyErrorToMessage(error, 'Unable to submit votes right now.'));
      return null;
    } finally {
      setOnlineVoteSubmissionPending(false);
    }
  }

  async function createNextOnlineRound({ openHostIntro = true } = {}) {
    if (!onlineMode || onlineRole !== 'host' || !lobbyCode) return null;
    const currentSession = onlineSessionRef.current;
    const hostSessionToken = currentSession?.sessionToken || '';
    if (!hostSessionToken) {
      setOnlineLobbyError('Host session token missing. Please leave and recreate the lobby.');
      return null;
    }
    try {
      const result = await createNextRoundOnServer(lobbyCode, {
        hostClientId: onlineClientId,
        sessionToken: hostSessionToken,
      });
      const rotatedHostToken = result?.rotatedSessionToken || hostSessionToken;
      if (rotatedHostToken && rotatedHostToken !== hostSessionToken) {
        const nextSession = {
          ...(currentSession || {}),
          sessionToken: rotatedHostToken,
        };
        onlineSessionRef.current = nextSession;
        setStoredOnlineSession(nextSession);
      }
      if (result?.lobby?.activeRound) {
        await syncOnlineRoundFromSnapshot(result.lobby, { openHostIntro });
      }
      setOnlineLobbyError('');
      return result?.lobby?.activeRound || result?.round || null;
    } catch (error) {
      setOnlineLobbyError(mapLobbyErrorToMessage(error, 'Unable to generate the next round.'));
      return null;
    }
  }

  async function handleAdvanceReveal() {
    if (onlineMode) {
      if (revealIndex < players.length - 1) {
        setRevealIndex((currentIndex) => currentIndex + 1);
        return;
      }
      await runOnlinePhaseAdvance();
      return;
    }
    if (revealIndex < players.length - 1) {
      setRevealIndex((r) => r + 1);
      return;
    }
    if (round?.roundTypeId === 'grill') {
      setScreen('grill');
      return;
    }
    refreshCopy(['discussion']);
    setScreen('discussion');
  }

  function startGame(seedPlayers = null) {
    const basePlayers = seedPlayers && seedPlayers.length ? seedPlayers : players;
    const options = shuffle(activeCategories).slice(0, Math.min(4, activeCategories.length));
    if (!options.length) return;
    const resetPlayers = basePlayers.map((player) => ({ ...player, score: 0 }));
    setPlayers(resetPlayers);
    setRoundNumber(1);
    setCurrentRoundOwnerIndex(0);
    setPreviousRoundType(null);
    setSelectedRoundType(null);
    setRoundTypeOptions([]);
    setCategoryOptions(options);
    setRound({ chooserId: resetPlayers[0]?.id, roundNumber: 1 });
    setRecentPromptKeys([]);
    setVotesByPlayerId({});
    setTally({});
    setRoundGains({});
    setRoundBreakdown({});
    setImposterCaught(false);
    setOnlinePrivatePrompt(null);
    setOnlinePrivatePromptError('');
    refreshCopy(['chooser']);
    setScreen('game-intro');
  }
  function chooseCategory(categoryId) {
    const category = activeCategories.find((c) => c.id === categoryId);
    if (!category) return;
    const selectedTypeForRound = roundNumber === 1 ? pickRandom(PASS_THE_PHONE_ROUND_TYPES).id : selectedRoundType;
    const built = buildLocalRound(
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
    setRound(built);
    setPreviousRoundType(built.roundTypeId);
    setRecentPromptKeys((cur) => [...cur, built.promptKey]);
    setRevealIndex(0);
    setVotesByPlayerId({});
    setOnlinePrivatePrompt(null);
    setOnlinePrivatePromptError('');
    refreshCopy(['passPhone', 'revealNormal', 'revealLiar']);
    setCopyState((cur) => ({ ...cur, hostStinger: getLine(themedKey(stingerCopyKey)) }));
    setScreen('host-intro');
  }
  async function revealResults() {
    if (onlineMode) {
      await submitOnlineVotes();
      return;
    }
    const resolution = calculateRoundResolutionLocal(players, round, votesByPlayerId);
    setPlayers(resolution.nextPlayers);
    setTally(resolution.tally);
    setRoundGains(resolution.roundGains);
    setRoundBreakdown(resolution.roundBreakdown);
    setImposterCaught(Boolean(resolution.imposterCaught));
    setScreen('liar-reveal');
  }
  async function finishLiarReveal() {
    if (onlineMode) {
      await runOnlinePhaseAdvance();
      return;
    }
    if (hasScoreWinner(players)) {
      refreshCopy(['winner']);
      setScreen('final');
    } else {
      setScreen('results');
    }
  }
  async function nextRound() {
    if (onlineMode) {
      const nextRoundData = await createNextOnlineRound();
      if (nextRoundData) {
        setScreen('host-intro');
      }
      return;
    }
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
  function endGame() {
    setOnlinePrivatePrompt(null);
    setOnlinePrivatePromptError('');
    refreshCopy(['winner']);
    setScreen('final');
  }
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
    setOnlinePrivatePrompt(null);
    setOnlinePrivatePromptError('');
    setOnlinePhasePending(false);
    setOnlineVoteSubmissionPending(false);
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
    let sessionToken = '';
    try {
      const result = await createLobbyOnServer({ hostName: host, hostPlayer });
      snapshot = result?.lobby || null;
      resolvedHostPlayer = result?.player || hostPlayer;
      sessionToken = result?.sessionToken || '';
    } catch (error) {
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
      sessionToken,
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
    let sessionToken = '';
    try {
      const result = await joinLobbyOnServer(normalizedCode, joiner);
      nextSnapshot = result?.lobby || null;
      resolvedPlayer = result?.player || joiner;
      sessionToken = result?.sessionToken || '';
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
      sessionToken,
    };
    onlineSessionRef.current = session;
    setStoredOnlineSession(session);
    setPlayers(toGamePlayers(nextSnapshot.players || []));
    setScreen('online-lobby-waiting');
  }
  async function startOnlineMatch() {
    if (onlineRole !== 'host' || !lobbyCode) return;
    const currentSession = onlineSessionRef.current;
    const hostSessionToken = currentSession?.sessionToken || '';
    if (!hostSessionToken) {
      setOnlineLobbyError('Host session token missing. Please leave and recreate the lobby.');
      return;
    }
    let result = null;
    try {
      result = await startLobbyOnServer(lobbyCode, {
        hostClientId: onlineClientId,
        sessionToken: hostSessionToken,
      });
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
      setOnlineLobbyError(mapLobbyErrorToMessage(error, 'Unable to start match. Please try again.'));
      return;
    }
    const rotatedHostToken = result?.rotatedSessionToken || hostSessionToken;
    if (rotatedHostToken !== hostSessionToken) {
      const nextSession = {
        ...(currentSession || {}),
        sessionToken: rotatedHostToken,
      };
      onlineSessionRef.current = nextSession;
      setStoredOnlineSession(nextSession);
    }
    setOnlinePrivatePrompt(null);
    setOnlinePrivatePromptError('');
    const synced = await onlineTransportRef.current?.syncSnapshot();
    if (synced?.activeRound) {
      await syncOnlineRoundFromSnapshot(synced, { openHostIntro: false });
      setScreen('game-intro');
    }
  }
  function restartToHome() {
    setPlayers(createPlayers(3)); setLiarCount(1); setNameTheme('Default'); setMode('classic'); setWinCondition('rounds'); setPointsToWin(15); setRoundsPerPlayer(1); setGrillSettings({ micEnabled: true, ttsEnabled: true }); setRound(null); setRoundNumber(1); setCurrentRoundOwnerIndex(0); setPreviousRoundType(null); setRoundTypeOptions([]); setSelectedRoundType(null); setRevealIndex(0); setVotesByPlayerId({}); setTally({}); setRoundGains({}); setRoundBreakdown({}); setImposterCaught(false); setRecentPromptKeys([]); refreshCopy(['home','onlineLobby']);
    setOnlinePhasePending(false);
    setOnlineVoteSubmissionPending(false);
    setOnlinePrivatePrompt(null);
    setOnlinePrivatePromptError('');
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
    {screen === 'game-intro' && (
      <GameIntroScreen
        theme={nameTheme}
        isOnlineMode={onlineMode}
        totalRounds={totalRounds}
        playerCount={players.length}
        onContinue={() => setScreen('rules')}
      />
    )}
    {screen === 'rules' && <RulesSplashScreen mode={mode} onContinue={() => setScreen('category-choice')} theme={nameTheme} isOnlineMode={onlineMode} />}
    {screen === 'round-type-choice' && round && <TopFrame theme={nameTheme}><div className="mx-auto max-w-3xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} /><GlassPanel className="rounded-[2.5rem] p-8 text-center border-fuchsia-400/25 bg-black/25 relative overflow-hidden"><div className="text-xs uppercase tracking-[0.3em] text-white/50">Round owner: {players[currentRoundOwnerIndex]?.name}</div><h2 className="text-4xl font-black mt-3 text-yellow-300">Choose round type</h2><p className="text-white/70 mt-3">Pick one of two options. Previous round type is excluded.</p><div className="grid gap-3 sm:grid-cols-2 mt-8">{roundTypeOptions.map((type) => <div key={type.id} className="space-y-2"><RoundMascot roundTypeId={type.id} /><div className="rounded-[1.5rem] border border-white/20 bg-black/20 p-3"><RoundTypeLogo src={type.logoSrc} alt={`${type.name} logo`} className="mx-auto h-16 w-auto rounded-md border border-white/20 bg-black/25 px-2 py-1" /><ThemeArt src={`/assets/themes/default/cards/prompt-front-${type.id}.svg`} alt={`${type.name} default card front`} className="mx-auto mt-3 h-28 w-auto rounded-xl border border-white/20 bg-black/25 p-1" /><div className="mt-3 text-xs uppercase tracking-[0.2em] text-white/60">Round Type Logo + Default Front Card</div></div><Button className={`rounded-[1.75rem] h-20 text-lg bg-gradient-to-r ${themeMeta.gradient} text-white border-2 border-white/20 shadow-lg w-full`} onClick={() => { setSelectedRoundType(type.id); setScreen('category-choice'); }}>{type.name}</Button></div>)}</div></GlassPanel></div></TopFrame>}
    {screen === 'category-choice' && round && (
      <TopFrame theme={nameTheme}>
        <div className="mx-auto max-w-3xl space-y-6">
          <ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} />
          <GlassPanel className="relative overflow-hidden rounded-[2.5rem] border-fuchsia-400/25 bg-black/25 p-8 text-center">
            <LightningBolt className="right-8 top-6" />
            <LightningBolt className="left-10 bottom-6" />
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">Round owner: {players[currentRoundOwnerIndex]?.name}</div>
            <h2 className="mt-3 text-4xl font-black text-yellow-300">Choose the next category</h2>
            <p className="mt-3 text-white/70">{copyState.chooser}</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
              {categoryOptions.map((category) => {
                const categoryCardArtSrc = resolveCategoryChoiceCardArt(category, nameTheme);
                return (
                  <button
                    key={category.id}
                    type="button"
                    className="w-full"
                    onClick={() => chooseCategory(category.id)}
                  >
                    <div className="relative mx-auto aspect-[2/3] w-full max-w-[11.5rem] overflow-hidden rounded-[1.35rem] border-2 border-white/25 bg-black/30 shadow-lg">
                      {categoryCardArtSrc && (
                        <img
                          src={categoryCardArtSrc}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full object-contain bg-black/25"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-b ${themeMeta.gradient} opacity-45`} />
                      <div className="absolute inset-0 bg-black/35" />
                      <div className="relative z-10 flex h-full flex-col items-center justify-center p-3">
                        <div className="text-3xl">{category.emoji}</div>
                        <div className="mt-2 text-lg font-black text-white">{category.name}</div>
                        <div className="mt-2 rounded-full border border-white/40 bg-black/35 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-cyan-100">
                          Pick category
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassPanel>
        </div>
      </TopFrame>
    )}
    {screen === 'host-intro' && round && (
      <HostIntroScreen
        round={round}
        stingerLine={copyState.hostStinger}
        onContinue={() => {
          if (onlineMode) {
            void runOnlinePhaseAdvance();
            return;
          }
          setScreen('reveal');
        }}
        theme={nameTheme}
      />
    )}
    {screen === 'reveal' && round && (
      <RevealScreen
        key={`${round.promptKey || round.id || 'online-round'}-${revealIndex}-${onlinePrivatePrompt?.roundId || 'local'}`}
        players={players}
        currentRevealIndex={revealIndex}
        round={round}
        totalRounds={totalRounds}
        onNext={handleAdvanceReveal}
        passLine={copyState.passPhone}
        normalLine={copyState.revealNormal}
        liarLine={copyState.revealLiar}
        theme={nameTheme}
        onlineMode={onlineMode}
        localPlayerName={onlinePlayerName}
        onlinePrivatePrompt={onlinePrivatePrompt}
        onlinePrivatePromptError={onlinePrivatePromptError}
      />
    )}
    {screen === 'grill' && round && (
      <GrillEmScreen
        players={players}
        round={round}
        totalRounds={totalRounds}
        onContinue={(grillData) => {
          setRound((cur) => ({ ...cur, grillData }));
          setVotesByPlayerId(Object.fromEntries(players.map((p) => [p.id, ''])));
          if (onlineMode) {
            void runOnlinePhaseAdvance();
            return;
          }
          refreshCopy(['voting']);
          setScreen('voting');
        }}
        theme={nameTheme}
      />
    )}
    {screen === 'discussion' && round && (
      <DiscussionScreen
        players={players}
        round={round}
        totalRounds={totalRounds}
        onContinue={() => {
          setVotesByPlayerId(Object.fromEntries(players.map((p) => [p.id, ''])));
          if (onlineMode) {
            void runOnlinePhaseAdvance();
            return;
          }
          refreshCopy(['voting']);
          setScreen('voting');
        }}
        line={copyState.discussion}
        theme={nameTheme}
        onlineVoiceEnabled={onlineMode}
        onlineVoiceMuted={onlineVoiceMuted}
        setOnlineVoiceMuted={setOnlineVoiceMuted}
        canTalk={onlineVoiceEnabled}
        submitPending={onlinePhasePending}
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
        onlinePlayerId={onlineJoinedPlayerId}
        onlineVoiceEnabled={onlineMode}
        onlineVoiceMuted={onlineVoiceMuted}
        setOnlineVoiceMuted={setOnlineVoiceMuted}
        canTalk={onlineVoiceEnabled}
        submitPending={onlineVoteSubmissionPending}
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
