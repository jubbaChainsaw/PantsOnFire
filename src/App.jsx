import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { getThemeAssets, getThemeHostAssets, ROUND_TYPE_CARD_FRONT_BY_ID } from './data/themeAssets';
import { NAME_POOLS, randomNameFromTheme } from './data/names';
import { toCanonicalThemeName } from './data/themeAliases';
import { getThemePersonas, pickRandomThemePersona } from './data/themePersonas';
import {
  getThemeHostPersona,
  buildThemeIntroDialogue,
  pickThemeHostRoundStinger,
  pickThemeGuestHostName,
} from './data/themeHosts';
import {
  DLC_THEME_PACKS,
  getThemeOptions,
  normalizeUnlockedThemePackIds,
} from './data/themeCatalog';
import { getThemePackRedeemOffer } from './data/dlc/themeRedeemCodes';
import { COPY_BANK, createCopyPicker, THEME_STINGER_KEY_OVERRIDES } from './data/gameTextContent';
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
const LOGO_18PLUS_SRC = '/assets/images/logo-18plus.png';
const INTRO_LOGO_VIDEO_SRC = '/assets/videos/intro-logo.mp4';
const FIRE_FRAME_VIDEO_SRC = '/assets/videos/fire-frame.mp4';
const BYTEBLITZ_VIDEO_PLACEHOLDER_SRC = '/assets/videos/byteblitz/placeholder.mp4';
const FLAME_SRC = '/assets/images/flames/flame-8.png';
const HOME_FLAME_SOURCES = [
  '/assets/images/flames/flame-1.png',
  '/assets/images/flames/flame-2.png',
  '/assets/images/flames/flame-3.png',
  '/assets/images/flames/flame-8.png',
  '/assets/images/flames/flame-9.png',
  '/assets/images/flames/flame-5.png',
  '/assets/images/flames/flame-7.png',
];
const CARD_FIRE_FLAME_SOURCES = [
  '/assets/images/flames/flame-4.png',
  '/assets/images/flames/flame-6.png',
  '/assets/images/flames/flame-7.png',
  '/assets/images/flames/flame-9.png',
];
const APP_INTRO_VIDEO_SEEN_KEY = 'imposter-intro-video-seen-v1';
const INTRO_THEME_BGM_SRC = '/assets/audio/music/intro-theme.mp3';
const VOTING_THEME_BGM_SRC = '/assets/audio/music/voting-suspense.mp3';
const HEARTBEAT_SFX_SRC = '/assets/sfx/heartbeat.mp3';
const FIRE_CRACKLE_SFX_SRC = '/assets/sfx/fire-crackle.wav';
const IMPOSTER_FOUND_SFX_SRC = '/assets/sfx/imposter-found.wav';
const IMPOSTER_ANNOUNCED_SFX_SRC = '/assets/sfx/imposter-announced.wav';
const CARD_FLIP_SFX_SRC = '/assets/sfx/card-flip.wav';
const BYTEBLITZ_CUE_MEDIA = {
  yes: {
    videoSrc: BYTEBLITZ_VIDEO_PLACEHOLDER_SRC,
    sfxSrc: '/assets/sfx/byteblitz/yes.wav',
  },
  no: {
    videoSrc: BYTEBLITZ_VIDEO_PLACEHOLDER_SRC,
    sfxSrc: '/assets/sfx/byteblitz/no.wav',
  },
  maybe: {
    videoSrc: BYTEBLITZ_VIDEO_PLACEHOLDER_SRC,
    sfxSrc: '/assets/sfx/byteblitz/maybe.wav',
  },
  kindOf: {
    videoSrc: BYTEBLITZ_VIDEO_PLACEHOLDER_SRC,
    sfxSrc: '/assets/sfx/byteblitz/kind-of.wav',
  },
  notApplicable: {
    videoSrc: BYTEBLITZ_VIDEO_PLACEHOLDER_SRC,
    sfxSrc: '/assets/sfx/byteblitz/not-applicable.wav',
  },
  correct: {
    videoSrc: BYTEBLITZ_VIDEO_PLACEHOLDER_SRC,
    sfxSrc: '/assets/sfx/byteblitz/correct.wav',
  },
  cheatWarning: {
    videoSrc: BYTEBLITZ_VIDEO_PLACEHOLDER_SRC,
    sfxSrc: '/assets/sfx/byteblitz/cheat-warning.wav',
  },
  cheatPenalty: {
    videoSrc: BYTEBLITZ_VIDEO_PLACEHOLDER_SRC,
    sfxSrc: '/assets/sfx/byteblitz/cheat-penalty.wav',
  },
  liarCorrect: {
    videoSrc: BYTEBLITZ_VIDEO_PLACEHOLDER_SRC,
    sfxSrc: '/assets/sfx/byteblitz/liar-correct.wav',
  },
};
const BYTEBLITZ_CUE_KEYS = Object.keys(BYTEBLITZ_CUE_MEDIA);
const INTRO_THEME_BGM_SCREENS = new Set([
  'intro-video',
  'home',
  'setup',
  'online-setup',
  'online-join',
  'online-lobby-created',
  'online-lobby-waiting',
  'game-intro',
]);
const UI_ICON_BOXERS_RED_SRC = '/assets/images/ui-icons/boxers-red.png';
const UI_ICON_BOXERS_GREEN_SRC = '/assets/images/ui-icons/boxers-green.png';
const UI_ICON_FLAME_RED_SRC = '/assets/images/ui-icons/flame-red.png';
const UI_ICON_FLAME_GREEN_SRC = '/assets/images/ui-icons/flame-green.png';
const UI_ICON_CROWN_GOLD_SRC = '/assets/images/ui-icons/crown-gold.png';
const UI_ICON_BADGE_18_PLUS_SRC = '/assets/images/ui-icons/badge-18-plus.png';
const UI_ICON_BADGE_LIAR_SRC = '/assets/images/ui-icons/badge-liar.png';
const UI_ICON_MAGNIFIER_FIRE_SRC = '/assets/images/ui-icons/magnifier-fire.png';
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
const DEFAULT_PLAYER_COLOR_OPTIONS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];
function getThemePlayerColorOptions(themeName = 'Default') {
  const canonicalThemeName = toCanonicalThemeName(themeName);
  const themeColorOptions = THEME_META[canonicalThemeName]?.playerColorOptions;
  if (Array.isArray(themeColorOptions) && themeColorOptions.length) return themeColorOptions;
  return DEFAULT_PLAYER_COLOR_OPTIONS;
}
function normalizePlayerColor(color, fallbackIndex = 0, themeName = 'Default') {
  const options = getThemePlayerColorOptions(themeName);
  const fallback = options[fallbackIndex % options.length] || DEFAULT_PLAYER_COLOR_OPTIONS[0];
  if (!color) return fallback;
  const normalized = String(color).trim().toLowerCase();
  return options.find((option) => option.toLowerCase() === normalized) || fallback;
}
function getPlayerColor(player, fallbackIndex = 0, themeName = 'Default') {
  return normalizePlayerColor(player?.color, fallbackIndex, themeName);
}
function getHostSizeConfig(themeName = 'Default') {
  return {
    intro: 'w-32 sm:w-44 md:w-52',
    hostIntro: 'w-32 sm:w-44 md:w-50',
    liarReveal: 'w-34 sm:w-48 md:w-54',
    introBubbleMargin: 'ml-[5.5rem] sm:ml-[9.5rem] md:ml-[12rem]',
    hostIntroBubbleMargin: 'ml-[5.25rem] sm:ml-[8.75rem] md:ml-[10.75rem]',
    liarBubbleMargin: 'ml-[6rem] sm:ml-[10.5rem] md:ml-[12.5rem]',
  };
}
function getPlayerInitials(name = 'P') {
  return String(name || 'P')
    .trim()
    .split(/\s+/)
    .map((chunk) => chunk.slice(0, 1))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
function clearPlayerPersonaData(player = {}) {
  const { personaId, personaBio, personaImageSrc, ...rest } = player;
  return rest;
}
function buildRandomizedPlayerIdentity(
  themeName,
  excludeNames = [],
  { personaOnly = false, preferPersona = true } = {}
) {
  if (preferPersona) {
    const persona = pickRandomThemePersona(themeName, excludeNames);
    if (persona) {
      return {
        name: persona.name,
        personaId: persona.id,
        personaBio: persona.bio,
        personaImageSrc: persona.imageSrc,
      };
    }
  }
  if (personaOnly) {
    return {
      name: randomNameFromTheme(themeName, excludeNames),
      personaId: '',
      personaBio: '',
      personaImageSrc: '',
    };
  }
  return {
    name: randomNameFromTheme(themeName, excludeNames),
    personaId: '',
    personaBio: '',
    personaImageSrc: '',
  };
}
function speakHostLine(text = '') {
  if (typeof window === 'undefined') return;
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  const trimmed = String(text || '').trim();
  if (!trimmed) return;
  try {
    const utterance = new window.SpeechSynthesisUtterance(trimmed);
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis failures on unsupported browsers.
  }
}
const VOTING_STINGER_BY_ROUND_TYPE = {
  prompt: [
    'Time to vote. Pass the phone and call your suspect.',
    'One tap, one accusation. Keep it spicy.',
    'Vote quietly, accuse loudly.',
  ],
  opinion: [
    'Truth or Twisted verdict time. Pick your chaos agent.',
    'Debate is over. Suspicion is in session.',
    'Cast your vote and protect your alibi.',
  ],
  picture: [
    'Picture perfect? Time to expose the fake frame.',
    'Pass the phone and spot the wrong snapshot.',
    'Vote for the player whose details felt staged.',
  ],
  meme: [
    'Meme court is open. Point at the poser.',
    'Pass the phone and vote the fake format out.',
    'Who forced meme culture the hardest? Vote now.',
  ],
  noise: [
    'Noisy round, quiet judgement. Pass and vote.',
    'Vote for the sound that felt least believable.',
    'Keep it moving: one phone, one vote, one suspect.',
  ],
  offtopic: [
    'Off-topic defence complete. Time to call it.',
    'Vote for whoever never truly fit the topic.',
    'Pass the phone and lock your accusation.',
  ],
  chain: [
    'Chain check: who broke the link? Vote now.',
    'Pass the phone and choose the weakest link.',
    'One vote each. Find the decoy clue.',
  ],
  grill: [
    "AI grilling done. Vote who sounded too prepared.",
    'Pass the phone and call out the over-confident answerer.',
    "Blaze Byte is done talking. Now it's your turn to judge.",
  ],
};
function pickVotingStinger(roundTypeId = 'prompt') {
  const pool = VOTING_STINGER_BY_ROUND_TYPE[roundTypeId] || VOTING_STINGER_BY_ROUND_TYPE.prompt;
  return pool[Math.floor(Math.random() * pool.length)] || VOTING_STINGER_BY_ROUND_TYPE.prompt[0];
}
function normalizePlayerRecord(player = {}) {
  const next = {
    id: player.id,
    name: String(player?.name || '').trim() || 'Player',
    score: Math.max(0, Number(player?.score || 0)),
  };
  if (typeof player?.color === 'string') next.color = player.color;
  if (typeof player?.personaId === 'string') next.personaId = player.personaId;
  if (typeof player?.personaBio === 'string') next.personaBio = player.personaBio;
  if (typeof player?.personaImageSrc === 'string') next.personaImageSrc = player.personaImageSrc;
  return next;
}
function createPlayers(count = 3, themeName = 'Default') {
  return Array.from({ length: count }, (_, i) => ({
    id: `p-${Date.now()}-${i + 1}`,
    name: `Player ${i + 1}`,
    score: 0,
    color: normalizePlayerColor('', i, themeName),
  }));
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
      cheatStrikesByPlayerId: {},
      disqualifiedPlayerIds: [],
      scoreAdjustmentsByPlayerId: {},
      guessWinnerId: '',
      endedByCorrectGuess: false,
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
  const grillData = round?.grillData && typeof round.grillData === 'object'
    ? round.grillData
    : {};
  const grillScoreAdjustments = grillData?.scoreAdjustmentsByPlayerId
    && typeof grillData.scoreAdjustmentsByPlayerId === 'object'
    ? grillData.scoreAdjustmentsByPlayerId
    : {};
  const grillGuessWinnerId = String(grillData?.guessWinnerId || '').trim();
  const roundGains = {};
  const roundBreakdown = {};
  const nextPlayers = players.map((player) => {
    let gain = 0;
    let voteHit = 0;
    let liarSurvived = 0;
    let grillTeamBonus = 0;
    let grillLiarSwing = 0;
    let grillGuessBonus = 0;
    let grillCheatPenalty = 0;
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
      const extraAdjustment = Number(grillScoreAdjustments[player.id] || 0);
      if (Number.isFinite(extraAdjustment) && extraAdjustment !== 0) {
        gain += extraAdjustment;
        if (player.id === grillGuessWinnerId) {
          grillGuessBonus = extraAdjustment;
        } else if (extraAdjustment < 0) {
          grillCheatPenalty += extraAdjustment;
        }
      }
    }
    roundGains[player.id] = gain;
    roundBreakdown[player.id] = {
      voteHit,
      liarSurvived,
      grillTeamBonus,
      grillLiarSwing,
      grillGuessBonus,
      grillCheatPenalty,
    };
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

function applyGrillRoundDataToRound(round, grillData = {}, players = []) {
  if (!round || round.roundTypeId !== 'grill') return round;
  const playerIds = new Set((players || []).map((player) => player.id));
  const normalizedGrillData = grillData && typeof grillData === 'object' ? grillData : {};
  const scoreAdjustmentsByPlayerId = normalizedGrillData.scoreAdjustmentsByPlayerId
    && typeof normalizedGrillData.scoreAdjustmentsByPlayerId === 'object'
    ? normalizedGrillData.scoreAdjustmentsByPlayerId
    : {};
  const sanitizedAdjustments = Object.fromEntries(
    Object.entries(scoreAdjustmentsByPlayerId).filter(([playerId, value]) => {
      if (!playerIds.has(playerId)) return false;
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric !== 0;
    }).map(([playerId, value]) => [playerId, Number(value)])
  );
  const disqualifiedPlayerIds = Array.isArray(normalizedGrillData.disqualifiedPlayerIds)
    ? normalizedGrillData.disqualifiedPlayerIds
      .map((value) => String(value || '').trim())
      .filter((value) => value && playerIds.has(value))
    : [];
  const guessWinnerId = String(normalizedGrillData.guessWinnerId || '').trim();
  const normalizedGuessWinnerId = guessWinnerId && playerIds.has(guessWinnerId) ? guessWinnerId : '';
  return {
    ...round,
    grillData: {
      ...(round.grillData || {}),
      ...normalizedGrillData,
      disqualifiedPlayerIds,
      scoreAdjustmentsByPlayerId: sanitizedAdjustments,
      guessWinnerId: normalizedGuessWinnerId,
      endedByCorrectGuess: Boolean(normalizedGrillData.endedByCorrectGuess),
    },
  };
}

function GlassPanel({ children, className = '' }) {
  return <div className={`backdrop-blur-xl bg-white/8 border border-white/10 shadow-2xl ${className}`}>{children}</div>;
}
function ZanyAccentBurst({ className = '', glowClass = 'bg-fuchsia-500/25' }) {
  return <div className={`pointer-events-none absolute ${className}`}><div className="relative h-16 w-16"><div className={`absolute inset-0 rotate-12 rounded-[30%] ${glowClass} blur-xl`} /><div className="absolute left-6 top-0 h-16 w-2 rounded-full bg-yellow-300" /><div className="absolute left-0 top-6 h-16 w-2 rounded-full bg-cyan-300 rotate-90 origin-top-left" /></div></div>;
}
function LightningBolt({ className = '', boltClass = 'text-yellow-300' }) {
  return <div className={`pointer-events-none absolute ${className}`}><div className={`${boltClass} drop-shadow-[0_0_12px_rgba(255,220,0,0.95)] text-4xl font-black`}>⚡</div></div>;
}
function TopFrame({ children, theme = 'Default', allowScroll = false }) {
  const themeMeta = THEME_META[theme] || THEME_META.Default;
  const gradient = themeMeta.gradient || THEME_META.Default.gradient;
  const uiGlowClass = themeMeta.uiGlowClass || THEME_META.Default.uiGlowClass || 'bg-fuchsia-500/25';
  const uiBoltClass = themeMeta.uiBoltClass || THEME_META.Default.uiBoltClass || 'text-yellow-300';
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
      <ZanyAccentBurst className="left-5 top-12" glowClass={uiGlowClass} />
      <ZanyAccentBurst className="right-5 bottom-20 scale-125" glowClass={uiGlowClass} />
      <LightningBolt className="left-8 bottom-28" boltClass={uiBoltClass} />
      <LightningBolt className="right-8 top-24 -rotate-12" boltClass={uiBoltClass} />
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
function PlayerPersonaAvatar({
  player,
  fallbackIndex = 0,
  className = '',
  sizeClass = 'h-8 w-8',
  initialsClass = 'text-xs',
  useColorFallback = false,
  themeName = 'Default',
}) {
  const [failed, setFailed] = useState(false);
  const imageSrc = !failed ? String(player?.personaImageSrc || '').trim() : '';
  const initials = getPlayerInitials(player?.name);
  const color = getPlayerColor(player, fallbackIndex, themeName);
  return (
    <div
      className={`relative overflow-hidden rounded-full border border-white/30 bg-black/30 ${sizeClass} ${className}`}
      style={{ backgroundColor: useColorFallback ? color : 'rgba(17,24,39,0.7)' }}
      aria-hidden="true"
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={`flex h-full w-full items-center justify-center font-black text-white ${initialsClass}`}>
          {initials || 'P'}
        </div>
      )}
    </div>
  );
}
function PersonaScorePill({ player, fallbackIndex = 0, isLeader = false, themeName = 'Default' }) {
  const score = Math.max(0, Number(player?.score || 0));
  return (
    <div className={`flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-2.5 py-1 ${isLeader ? 'shadow-[0_0_10px_rgba(250,204,21,0.45)]' : ''}`}>
      <PlayerPersonaAvatar
        player={player}
        fallbackIndex={fallbackIndex}
        sizeClass="h-7 w-7"
        initialsClass="text-[0.55rem]"
        useColorFallback={false}
        themeName={themeName}
      />
      <div className="text-sm font-black text-white">{score}</div>
      {isLeader && (
        <img
          src={UI_ICON_CROWN_GOLD_SRC}
          alt=""
          aria-hidden="true"
          className="h-4 w-4 object-contain"
        />
      )}
    </div>
  );
}
function CustomFireScoreIcon({ player, fallbackIndex = 0, isLeader = false, themeName = 'Default' }) {
  const score = Math.max(0, Number(player?.score || 0));
  const color = getPlayerColor(player, fallbackIndex, themeName);
  return (
    <div className="flex min-w-[2.8rem] items-center justify-center">
      <div className={`relative h-11 w-11 rounded-full border border-white/30 ${isLeader ? 'drop-shadow-[0_0_10px_rgba(250,204,21,0.55)]' : ''}`} style={{ backgroundColor: color }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={color.toLowerCase().includes('22c55e') || color.toLowerCase().includes('16a34a') ? UI_ICON_FLAME_GREEN_SRC : UI_ICON_FLAME_RED_SRC}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 object-contain opacity-90"
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-sm font-black text-white [text-shadow:0_2px_6px_rgba(0,0,0,0.55)]">
          {score}
        </div>
        {isLeader && (
          <img
            src={UI_ICON_CROWN_GOLD_SRC}
            alt=""
            aria-hidden="true"
            className="absolute -top-2 -right-1 h-4 w-4 object-contain"
          />
        )}
      </div>
    </div>
  );
}
function ScoreStrip({ players, roundNumber, totalRounds, scoreStyleMode = 'persona', themeName = 'Default' }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const useCustomStyle = scoreStyleMode === 'custom';
  const scoreThemeMeta = THEME_META[themeName] || THEME_META.Default;
  const scoreStripBorderClass = scoreThemeMeta.scoreStripBorderClass || THEME_META.Default.scoreStripBorderClass || 'border-fuchsia-400/20';
  const scoreProgressLabelClass = scoreThemeMeta.scoreProgressLabelClass || THEME_META.Default.scoreProgressLabelClass || 'text-cyan-200/80';
  const scoreProgressValueClass = scoreThemeMeta.scoreProgressValueClass || THEME_META.Default.scoreProgressValueClass || 'text-yellow-300';
  return (
    <GlassPanel className={`rounded-[1.6rem] ${scoreStripBorderClass} bg-black/25 p-3`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={`text-[0.62rem] uppercase tracking-[0.26em] ${scoreProgressLabelClass}`}>Match progress</div>
          <div className={`text-base font-black ${scoreProgressValueClass}`}>Round {roundNumber} of {totalRounds}</div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {sorted.map((player, index) => (
            useCustomStyle ? (
              <CustomFireScoreIcon
                key={player.id}
                player={player}
                fallbackIndex={index}
                isLeader={index === 0}
                themeName={themeName}
              />
            ) : (
              <PersonaScorePill
                key={player.id}
                player={player}
                fallbackIndex={index}
                isLeader={index === 0}
                themeName={themeName}
              />
            )
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
function BoxerToggle({ checked = false, onCheckedChange = () => {}, disabled = false, className = '', label = 'Toggle option' }) {
  const active = Boolean(checked);
  const shellClass = active
    ? 'border-emerald-300/75 bg-emerald-500/28'
    : 'border-red-300/70 bg-red-500/24';
  const iconSrc = active ? UI_ICON_BOXERS_GREEN_SRC : UI_ICON_BOXERS_RED_SRC;
  return (
    <button
      type="button"
      className={`relative inline-flex h-14 w-20 items-center justify-center rounded-2xl border-2 shadow-[0_6px_16px_rgba(0,0,0,0.35)] transition-transform ${disabled ? 'cursor-not-allowed opacity-45' : 'hover:scale-[1.04] active:scale-[0.98]'} ${shellClass} ${className}`}
      aria-pressed={active}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        onCheckedChange(!active);
      }}
    >
      <img src={iconSrc} alt="" className="h-10 w-12 object-contain" aria-hidden="true" />
      <span className="pointer-events-none absolute bottom-1 text-[0.55rem] font-black uppercase tracking-[0.15em] text-white/90">
        {active ? 'On' : 'Off'}
      </span>
    </button>
  );
}
function ThemedIcon({ src, alt = '', className = '' }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(event) => { event.currentTarget.style.display = 'none'; }}
    />
  );
}
function ThemeArt({ src, alt, className = '' }) {
  const [isBroken, setIsBroken] = useState(false);
  useEffect(() => {
    setIsBroken(false);
  }, [src]);
  if (!src || isBroken) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setIsBroken(true)}
    />
  );
}
function toWebmSrc(src = '') {
  const normalized = String(src || '').trim();
  if (!normalized || !normalized.toLowerCase().endsWith('.mp4')) return '';
  return `${normalized.slice(0, -4)}.webm`;
}
function MultiSourceVideo({
  src = '',
  className = '',
  poster = '',
  autoPlay = false,
  loop = false,
  muted = true,
  playsInline = true,
  preload = 'metadata',
  ariaHidden = true,
  onLoadedData,
  onEnded,
  onError,
}) {
  const [isBroken, setIsBroken] = useState(false);
  const normalizedSrc = String(src || '').trim();
  const webmSrc = toWebmSrc(normalizedSrc);
  useEffect(() => {
    setIsBroken(false);
  }, [normalizedSrc, webmSrc, poster]);
  if (!normalizedSrc || isBroken) return null;
  return (
    <video
      className={className}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
      poster={poster || undefined}
      aria-hidden={ariaHidden ? 'true' : undefined}
      onLoadedData={onLoadedData}
      onEnded={onEnded}
      onError={(event) => {
        setIsBroken(true);
        if (typeof onError === 'function') onError(event);
      }}
    >
      {webmSrc && <source src={webmSrc} type="video/webm" />}
      <source src={normalizedSrc} type="video/mp4" />
    </video>
  );
}
function ThemeHostVisual({
  themeName = 'Default',
  isTalking = false,
  alt = '',
  className = '',
}) {
  const hostAssets = useMemo(() => getThemeHostAssets(themeName), [themeName]);
  const animatedHostSrc = useTalkingAnimation({ enabled: isTalking, themeName });
  const talkingVideoSrc = hostAssets?.talkingVideo || '';
  const [videoBroken, setVideoBroken] = useState(false);

  useEffect(() => {
    setVideoBroken(false);
  }, [talkingVideoSrc, themeName]);

  if (talkingVideoSrc && !videoBroken) {
    return (
      <MultiSourceVideo
        src={talkingVideoSrc}
        className={className}
        autoPlay={isTalking}
        loop={isTalking}
        muted
        playsInline
        preload="metadata"
        poster={animatedHostSrc || undefined}
        ariaHidden
        onError={() => setVideoBroken(true)}
      />
    );
  }

  return <ThemeArt src={animatedHostSrc} alt={alt} className={className} />;
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
function IntroVideoScreen({ onDone }) {
  const [canSkip, setCanSkip] = useState(false);
  const hasCompletedRef = useRef(false);
  const completeIntro = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onDone();
  }, [onDone]);
  useEffect(() => {
    const timer = setTimeout(() => setCanSkip(true), 850);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    // Safety net for browsers/webviews where intro video never fires ended/error.
    const fallbackTimer = setTimeout(() => completeIntro(), 4200);
    return () => clearTimeout(fallbackTimer);
  }, [completeIntro]);
  return (
    <TopFrame theme="Default" allowScroll={false}>
      <div className="relative h-[calc(100vh-2rem)] min-h-[calc(100vh-2rem)] overflow-hidden rounded-[2.2rem] border border-orange-300/25 bg-black">
        <MultiSourceVideo
          className="absolute inset-0 h-full w-full object-cover"
          src={INTRO_LOGO_VIDEO_SRC}
          autoPlay
          muted
          playsInline
          preload="auto"
          poster={LOGO_SRC}
          ariaHidden
          onLoadedData={() => setCanSkip(true)}
          onEnded={completeIntro}
          onError={completeIntro}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/30" />
        <div className="absolute inset-x-0 bottom-6 flex justify-center">
          <Button
            className="rounded-[1.2rem] border border-white/30 bg-black/35 px-5 py-2 text-white backdrop-blur-sm"
            onClick={completeIntro}
            disabled={!canSkip}
          >
            {canSkip ? 'Skip intro' : 'Loading intro...'}
          </Button>
        </div>
      </div>
    </TopFrame>
  );
}
function getThemeHostFrameSources(themeName = 'Default', state = 'idle') {
  const hostAssets = getThemeHostAssets(themeName);
  const idleFrame = hostAssets?.idle || '';
  const talkingFrames = Array.isArray(hostAssets?.talkingFrames)
    ? hostAssets.talkingFrames.filter(Boolean)
    : [];
  if (state !== 'talking') return [idleFrame || talkingFrames[0]].filter(Boolean);
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
    }, 760);
    return () => clearInterval(timer);
  }, [enabled, talkingFrames.length]);
  if (enabled && talkingFrames.length > 0) {
    return talkingFrames[talkIndex] || talkingFrames[0];
  }
  return idleFrames[0] || '';
}
function fitTextToBubble(textElement, containerElement, {
  maxSize = 34,
  minSize = 12,
  lineHeight = 1.1,
} = {}) {
  if (!textElement || !containerElement) return maxSize;
  let nextSize = maxSize;
  textElement.style.fontSize = `${nextSize}px`;
  textElement.style.lineHeight = String(lineHeight);
  textElement.style.whiteSpace = 'normal';
  textElement.style.wordBreak = 'normal';
  textElement.style.overflowWrap = 'break-word';
  textElement.style.hyphens = 'manual';
  textElement.style.WebkitHyphens = 'manual';

  const fits = () => (
    textElement.scrollHeight <= containerElement.clientHeight
    && textElement.scrollWidth <= containerElement.clientWidth
  );

  while (nextSize > minSize && !fits()) {
    nextSize -= 1;
    textElement.style.fontSize = `${nextSize}px`;
  }
  return nextSize;
}
const HOST_DIALOGUE_TIMINGS = {
  gameIntroAdvanceMs: 6000,
  roundIntroAdvanceMs: 6000,
  liarRevealAdvanceMs: 6000,
  liarRevealCompleteMs: 6000,
};
function GameIntroScreen({ theme, onContinue, isOnlineMode = false, totalRounds = 1, playerCount = 0 }) {
  const hostSizeConfig = useMemo(() => getHostSizeConfig(theme), [theme]);
  const themedHostPersona = useMemo(
    () => getThemeHostPersona(theme),
    [theme]
  );
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();
  const resolvedRoundCount = Math.max(1, Number(totalRounds) || 1);
  const resolvedPlayerCount = Math.max(1, Number(playerCount) || 1);
  const introLines = useMemo(
    () => buildThemeIntroDialogue({
      themeName: theme,
      greeting,
      totalRounds: resolvedRoundCount,
      playerCount: resolvedPlayerCount,
      isOnlineMode,
    }),
    [theme, greeting, resolvedRoundCount, resolvedPlayerCount, isOnlineMode]
  );
  const [lineIndex, setLineIndex] = useState(0);
  const introSpeechTextRef = useRef(null);
  const introSpeechBubbleRef = useRef(null);
  const [introLineFontSize, setIntroLineFontSize] = useState(30);
  const isTalking = lineIndex < introLines.length - 1;
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
  useLayoutEffect(() => {
    const nextSize = fitTextToBubble(introSpeechTextRef.current, introSpeechBubbleRef.current, {
      maxSize: 32,
      minSize: 14,
      lineHeight: 1.1,
    });
    setIntroLineFontSize((current) => (current === nextSize ? current : nextSize));
  }, [lineIndex, introLines]);
  const canContinue = lineIndex >= introLines.length - 1;
  function advanceIntroLine() {
    setLineIndex((current) => Math.min(current + 1, introLines.length - 1));
  }
  return (
    <TopFrame theme={theme} allowScroll={false}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col justify-center">
        <GlassPanel className="rounded-[2.5rem] border-cyan-400/20 bg-black/25 p-6 sm:p-8">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Game intro</div>
            <h2 className="mt-3 text-4xl font-black text-yellow-300">Host briefing</h2>
            <p className="mt-2 text-sm text-cyan-100/90">
              Your host tonight: <span className="font-black text-yellow-200">{themedHostPersona.name}</span>
            </p>
          </div>
          <div className="relative mx-auto mt-6 w-full max-w-3xl min-h-[240px] sm:min-h-[300px]">
            <ThemeHostVisual
              themeName={theme}
              isTalking={isTalking}
              alt={`${theme} host ${themedHostPersona.name}`}
              className={`pointer-events-none absolute bottom-0 left-0 ${hostSizeConfig.intro}`}
            />
            <motion.div
              key={`intro-line-${lineIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`${hostSizeConfig.introBubbleMargin} h-[10.75rem] sm:h-[11.75rem] pt-2 text-white`}
            >
              <div ref={introSpeechBubbleRef} className="relative mx-auto flex h-full max-w-2xl items-center justify-center rounded-[2rem] border-2 border-cyan-200/80 bg-[#1d2376] px-4 py-4 text-center shadow-[0_12px_24px_rgba(0,0,0,0.35)] overflow-hidden">
                <div className="absolute -left-3 top-[55%] h-6 w-6 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-cyan-200/80 bg-[#1d2376]" />
                <p
                  ref={introSpeechTextRef}
                  className="text-white/95"
                  style={{
                    fontSize: `${introLineFontSize}px`,
                    lineHeight: 1.1,
                    whiteSpace: 'normal',
                    wordBreak: 'normal',
                    overflowWrap: 'break-word',
                    hyphens: 'manual',
                    WebkitHyphens: 'manual',
                  }}
                >
                  {introLines[lineIndex]}
                </p>
              </div>
            </motion.div>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {!canContinue && (
              <Button
                className="h-14 rounded-[1.5rem] border border-white/25 bg-white/10 px-6 text-white"
                onClick={advanceIntroLine}
              >
                Next line
              </Button>
            )}
            <Button
              className="h-14 min-w-[16rem] rounded-[1.5rem] border-2 border-white bg-yellow-300 px-8 text-zinc-950"
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
  const hostSizeConfig = useMemo(() => getHostSizeConfig(theme), [theme]);
  const themedHostPersona = useMemo(
    () => getThemeHostPersona(theme),
    [theme]
  );
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
    stingerLine || `${themedHostPersona.name} is in the building. Let the chaos begin.`,
    'Get ready. Cards are about to flip after the countdown.',
  ].filter(Boolean);
  const [speechIndex, setSpeechIndex] = useState(0);
  const speechBubbleTextRef = useRef(null);
  const speechBubbleFitRef = useRef(null);
  const [speechBubbleFontSize, setSpeechBubbleFontSize] = useState(28);
  const canContinue = speechIndex >= speechSentences.length - 1;
  const isTalking = speechIndex < speechSentences.length - 1;
  const introLine = round.roundTypeId === 'grill'
    ? `${themedHostPersona.name} is live. Mic up and question the AI.`
    : `${themedHostPersona.name} is in the building. Let the chaos begin.`;
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
  useLayoutEffect(() => {
    const nextSize = fitTextToBubble(speechBubbleTextRef.current, speechBubbleFitRef.current, {
      maxSize: 28,
      minSize: 12,
      lineHeight: 1.16,
    });
    setSpeechBubbleFontSize((current) => (current === nextSize ? current : nextSize));
  }, [speechIndex, speechSentences]);
  function advanceSpeechLine() {
    setSpeechIndex((current) => Math.min(current + 1, speechSentences.length - 1));
  }
  return (
    <TopFrame theme={theme} allowScroll={false}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col justify-center">
        <GlassPanel className="relative overflow-hidden rounded-[2.5rem] border-cyan-400/20 bg-black/25 p-6 sm:p-8 text-center">
          <div className="text-xs uppercase tracking-[0.35em] text-white/50">Host enters</div>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black text-yellow-300">{themedHostPersona.name}</h2>
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
            <ThemeHostVisual
              themeName={theme}
              isTalking={isTalking}
              alt={`${theme} presenter`}
              className={`pointer-events-none absolute bottom-0 left-0 ${hostSizeConfig.hostIntro}`}
            />
            <motion.div
              key={`${round.id || round.roundNumber}-${speechIndex}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className={`${hostSizeConfig.hostIntroBubbleMargin} h-full p-1 text-white`}
            >
              <div ref={speechBubbleFitRef} className="relative mx-auto flex h-full max-w-xl items-center justify-center overflow-hidden rounded-[2rem] border-2 border-cyan-200/80 bg-[#1d2376] px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
                <div className="absolute -left-3 top-[58%] h-6 w-6 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-cyan-200/80 bg-[#1d2376]" />
                <p
                  ref={speechBubbleTextRef}
                  className="text-white/95"
                  style={{
                    fontSize: `${speechBubbleFontSize}px`,
                    lineHeight: 1.16,
                    wordBreak: 'normal',
                    overflowWrap: 'normal',
                    whiteSpace: 'normal',
                    hyphens: 'manual',
                    WebkitHyphens: 'manual',
                  }}
                >
                  {speechSentences[speechIndex]}
                </p>
              </div>
            </motion.div>
            {round.roundTypeId === 'grill' && (
              <p className="mt-3 text-xs font-semibold text-yellow-200">
                Each player gets {round.grillData?.questionsPerPlayer || 1} questions this round.
              </p>
            )}
            <div className="mt-3 text-xs text-white/70">{round.roundTypeName} • {round.categoryEmoji} {round.categoryLabel}</div>
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {!canContinue && (
              <Button
                className="h-14 rounded-[1.5rem] border border-white/25 bg-white/10 px-6 text-white"
                onClick={advanceSpeechLine}
              >
                Next line
              </Button>
            )}
            <Button
              className="h-14 min-w-[16rem] rounded-[1.5rem] border-2 border-white bg-yellow-300 px-8 text-zinc-950"
              onClick={onContinue}
              disabled={!canContinue}
            >
              {canContinue ? 'Deal cards' : 'Host is explaining...'}
            </Button>
          </div>
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
function HomeScreen({ onNavigate, homeLine, adultMode, fireFrameVideoSrc = FIRE_FRAME_VIDEO_SRC }) {
  const logoSrc = adultMode ? LOGO_18PLUS_SRC : LOGO_SRC;
  const bottomFlames = [
    { src: HOME_FLAME_SOURCES[0] || FLAME_SRC, left: '4%', size: 'h-24 w-20', delay: '0s', duration: '2.4s', drift: '3deg', rise: '-22px' },
    { src: HOME_FLAME_SOURCES[1] || FLAME_SRC, left: '17%', size: 'h-28 w-24', delay: '0.15s', duration: '2.8s', drift: '-4deg', rise: '-28px' },
    { src: HOME_FLAME_SOURCES[2] || FLAME_SRC, left: '31%', size: 'h-22 w-20', delay: '0.35s', duration: '2.2s', drift: '2deg', rise: '-20px' },
    { src: HOME_FLAME_SOURCES[3] || FLAME_SRC, left: '47%', size: 'h-26 w-22', delay: '0.1s', duration: '2.95s', drift: '-3deg', rise: '-24px' },
    { src: HOME_FLAME_SOURCES[4] || FLAME_SRC, left: '62%', size: 'h-24 w-20', delay: '0.25s', duration: '2.5s', drift: '4deg', rise: '-21px' },
    { src: HOME_FLAME_SOURCES[5] || FLAME_SRC, left: '76%', size: 'h-27 w-24', delay: '0.4s', duration: '2.65s', drift: '-2deg', rise: '-26px' },
    { src: HOME_FLAME_SOURCES[6] || FLAME_SRC, left: '90%', size: 'h-23 w-20', delay: '0.2s', duration: '2.3s', drift: '3deg', rise: '-19px' },
  ];
  const topFlames = [
    { src: HOME_FLAME_SOURCES[6] || FLAME_SRC, right: '6%', size: 'h-18 w-16', delay: '0.05s', duration: '2.35s', drift: '-2deg', rise: '18px' },
    { src: HOME_FLAME_SOURCES[5] || FLAME_SRC, right: '24%', size: 'h-20 w-18', delay: '0.2s', duration: '2.7s', drift: '3deg', rise: '22px' },
    { src: HOME_FLAME_SOURCES[4] || FLAME_SRC, right: '43%', size: 'h-16 w-14', delay: '0.35s', duration: '2.25s', drift: '-3deg', rise: '16px' },
    { src: HOME_FLAME_SOURCES[3] || FLAME_SRC, right: '62%', size: 'h-19 w-16', delay: '0.1s', duration: '2.5s', drift: '2deg', rise: '19px' },
    { src: HOME_FLAME_SOURCES[2] || FLAME_SRC, right: '80%', size: 'h-17 w-15', delay: '0.3s', duration: '2.2s', drift: '-2deg', rise: '15px' },
  ];
  return (
    <TopFrame theme="Default" allowScroll={false}>
      <div className="relative h-[calc(100dvh-2rem)] px-2 flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 overflow-visible">
          <MultiSourceVideo
            className="absolute inset-x-0 bottom-0 h-56 w-full object-cover opacity-45 mix-blend-screen"
            src={fireFrameVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            ariaHidden
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_50%_100%,rgba(255,94,0,0.45)_0%,rgba(255,94,0,0.2)_35%,rgba(0,0,0,0)_74%)] animate-pulse" />
          {bottomFlames.map((flame, index) => (
            <img
              key={`bottom-flame-${index}`}
              src={flame.src}
              alt=""
              aria-hidden="true"
              className={`absolute -bottom-9 ${flame.size} opacity-85 drop-shadow-[0_0_16px_rgba(255,98,0,0.98)]`}
              style={{
                left: flame.left,
                animation: `home-flame-ripple ${flame.duration} ease-in-out ${flame.delay} infinite`,
                '--home-flame-drift': flame.drift,
                '--home-flame-rise': flame.rise,
              }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <MultiSourceVideo
            className="absolute inset-0 h-full w-full object-cover opacity-22 mix-blend-screen"
            src={fireFrameVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            ariaHidden
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 overflow-visible">
          <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_50%_0%,rgba(255,94,0,0.2)_0%,rgba(255,94,0,0.1)_32%,rgba(0,0,0,0)_75%)]" />
          {topFlames.map((flame, index) => (
            <img
              key={`top-flame-${index}`}
              src={flame.src}
              alt=""
              aria-hidden="true"
              className={`absolute -top-6 ${flame.size} opacity-75 drop-shadow-[0_0_14px_rgba(255,98,0,0.9)]`}
              style={{
                right: flame.right,
                transform: 'scaleY(-1)',
                animation: `home-flame-ripple ${flame.duration} ease-in-out ${flame.delay} infinite`,
                '--home-flame-drift': flame.drift,
                '--home-flame-rise': flame.rise,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 w-full max-w-xl h-full max-h-[calc(100dvh-2.5rem)] text-center flex flex-col justify-between gap-2 py-1">
          <div className="relative px-2 pt-0.5">
            <img src={logoSrc} alt="Pants On Fire logo" className="mx-auto w-full max-w-xl object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]" />
            {adultMode && (
              <div className="mt-1 flex items-center justify-center gap-2 text-[0.7rem] sm:text-xs uppercase tracking-[0.2em] text-red-100">
                <img src={UI_ICON_BADGE_18_PLUS_SRC} alt="" aria-hidden="true" className="h-5 w-5 object-contain" />
                <span>18+ CONTENT ENABLED</span>
              </div>
            )}
            <p className="mt-1 text-white/80 text-xs sm:text-sm">{homeLine}</p>
          </div>
          <div className="grid gap-2">
            <Button className="h-14 rounded-[1.8rem] text-lg sm:text-xl bg-yellow-300 text-zinc-950 hover:bg-yellow-200 border-2 border-white" onClick={() => onNavigate('setup')}><Play className="mr-2 h-5 w-5" />Setup Game</Button>
            <Button className="h-14 rounded-[1.8rem] text-lg sm:text-xl bg-cyan-500/20 text-white hover:bg-cyan-500/30 border border-cyan-300/40" onClick={() => onNavigate('online-setup')}><Wifi className="mr-2 h-5 w-5" />Create Online Lobby</Button>
            <Button className="h-14 rounded-[1.8rem] text-lg sm:text-xl bg-indigo-500/15 text-white hover:bg-indigo-500/30 border border-indigo-300/30" onClick={() => onNavigate('online-join')}><KeyRound className="mr-2 h-5 w-5" />Join Online Lobby</Button>
            <Button className="h-14 rounded-[1.8rem] text-lg sm:text-xl bg-fuchsia-500/15 text-white hover:bg-fuchsia-500/25 border border-fuchsia-400/30" onClick={() => onNavigate('store')}><ShoppingBag className="mr-2 h-5 w-5" />Store</Button>
            <Button className="h-14 rounded-[1.8rem] text-lg sm:text-xl bg-cyan-500/15 text-white hover:bg-cyan-500/25 border border-cyan-400/30" onClick={() => onNavigate('settings')}><Settings className="mr-2 h-5 w-5" />Settings</Button>
          </div>
          <button
            type="button"
            className="mx-auto text-xs sm:text-sm text-cyan-200 underline underline-offset-4 hover:text-cyan-100 transition-colors"
            onClick={() => onNavigate('development-progress')}
          >
            See Development Progress
          </button>
        </div>
      </div>
    </TopFrame>
  );
}
function DevelopmentProgressScreen({ onBack, onlineLobbyLine, theme = 'Default' }) {
  return (
    <TopFrame theme={theme} allowScroll={false}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col justify-center">
        <GlassPanel className="rounded-[2.2rem] border-cyan-400/20 bg-black/30 p-6 sm:p-8 text-center">
          <div className="text-xs uppercase tracking-[0.32em] text-cyan-200/80">Development Progress</div>
          <h2 className="mt-3 text-3xl sm:text-4xl font-black text-yellow-300">Current Beta Snapshot</h2>
          <p className="mt-3 text-sm sm:text-base text-white/80">
            We are in active beta testing with rapid UI and gameplay iteration.
          </p>
          <div className="mt-5 grid gap-3 text-left">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Currently testing</div>
              <div className="mt-2 text-sm text-white/85">
                Host-guided round flow, anti-cheat logic in Grill 'Em, and full-screen mobile UI fitting without scroll.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Online beta focus</div>
              <div className="mt-2 text-sm text-white/85">{onlineLobbyLine}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-200">Coming soon</div>
              <div className="mt-2 text-sm text-white/85">
                More polished multiplayer progression, expanded themed assets, deeper round balancing, and improved QA coverage.
              </div>
            </div>
          </div>
          <Button className="mt-6 rounded-[1.5rem] h-12 px-7 bg-yellow-300 text-zinc-950 border-2 border-white" onClick={onBack}>
            Back to home
          </Button>
        </GlassPanel>
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
    grillSettings, setGrillSettings, adultMode, categoryCount, onOpenAdmin, onStart, onBack, setupLine,
    personaOnlyMode, setPersonaOnlyMode,
    themeOptions = [], startLabel = 'Start Match', requiredMinPlayers = MIN_PLAYERS,
  } = props;
  const canStart = players.length >= requiredMinPlayers && players.every((p) => p.name.trim().length > 0);
  const maxLiars = Math.max(1, Math.floor(players.length / 2));
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const hasThemePersonas = useMemo(() => getThemePersonas(nameTheme).length > 0, [nameTheme]);
  const usePersonaOnlyForTheme = hasThemePersonas && Boolean(personaOnlyMode);
  const setupThemeMeta = THEME_META[nameTheme] || THEME_META.Default;
  const setupThemeLabelClass = setupThemeMeta.setupThemeLabelClass || THEME_META.Default.setupThemeLabelClass || 'text-cyan-200';
  const setupThemeButtonClass = setupThemeMeta.setupThemeButtonClass || THEME_META.Default.setupThemeButtonClass || 'border-cyan-400/30 bg-cyan-500/15 text-cyan-100';
  const setupPlayerIconClass = setupThemeMeta.setupPlayerIconClass || THEME_META.Default.setupPlayerIconClass || 'text-cyan-300';
  const setupRulesIconClass = setupThemeMeta.setupRulesIconClass || THEME_META.Default.setupRulesIconClass || 'text-yellow-300';
  useEffect(() => {
    if (!hasThemePersonas && personaOnlyMode) setPersonaOnlyMode(false);
  }, [hasThemePersonas, personaOnlyMode, setPersonaOnlyMode]);
  const assignRandomPlayerIdentity = useCallback((targetPlayerId) => {
    setPlayers((currentPlayers) => {
      const excludeNames = currentPlayers
        .filter((x) => x.id !== targetPlayerId)
        .map((x) => x.name);
      return currentPlayers.map((item) => {
        if (item.id !== targetPlayerId) return item;
        return {
          ...item,
          ...buildRandomizedPlayerIdentity(nameTheme, excludeNames, { personaOnly: usePersonaOnlyForTheme }),
        };
      });
    });
  }, [nameTheme, setPlayers, usePersonaOnlyForTheme]);
  const randomizeAllPlayersForTheme = useCallback(() => {
    setPlayers((currentPlayers) => {
      const nextPlayers = [];
      for (const currentPlayer of currentPlayers) {
        const excludeNames = nextPlayers.map((player) => player.name);
        nextPlayers.push({
          ...currentPlayer,
          ...buildRandomizedPlayerIdentity(nameTheme, excludeNames, { personaOnly: usePersonaOnlyForTheme }),
        });
      }
      return nextPlayers;
    });
  }, [nameTheme, setPlayers, usePersonaOnlyForTheme]);
  const allThemeOptions = themeOptions.length
    ? themeOptions
    : Object.keys(NAME_POOLS).map((themeName) => ({
      name: themeName,
      isDlc: false,
      isUnlocked: true,
      packId: null,
    }));
  const visibleThemeOptions = allThemeOptions.filter((themeOption) => themeOption?.isUnlocked !== false);
  const selectableThemeOptions = visibleThemeOptions.length
    ? visibleThemeOptions
    : [{
      name: 'Default',
      isDlc: false,
      isUnlocked: true,
      packId: null,
    }];
  return (
    <TopFrame theme={nameTheme}>
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex items-center justify-between gap-4">
          <Button className="rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-2 text-white" onClick={onBack}>Back</Button>
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Create Pass the Phone Game</div>
            <div className="mt-1 text-sm text-white/80">{setupLine}</div>
          </div>
          <div className="w-[72px]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <GlassPanel className="aspect-square rounded-[1.6rem] border-cyan-400/20 bg-black/25 p-4 flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">Players</div>
            <div className="mt-2 text-4xl sm:text-5xl font-black text-yellow-300">{players.length}</div>
          </GlassPanel>
          <GlassPanel className="aspect-square rounded-[1.6rem] border-orange-400/20 bg-black/25 p-4 flex flex-col items-center justify-center">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">Liars</div>
            <div className="mt-2 text-4xl sm:text-5xl font-black text-yellow-300">{liarCount}</div>
          </GlassPanel>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="rounded-[2.5rem] border-fuchsia-400/25 bg-black/25 p-5">
            <div className="mb-4 rounded-[1.7rem] border border-white/15 bg-black/25 p-4">
              <div className={`text-xs uppercase tracking-[0.3em] ${setupThemeLabelClass}`}>Game Theme</div>
              <p className="mt-2 text-sm text-white/75">
                This impacts randomised names, card styling and in game dialog.
              </p>
              <select
                value={nameTheme}
                onChange={(event) => {
                  const nextThemeName = event.target.value;
                  const nextTheme = selectableThemeOptions.find((option) => option.name === nextThemeName);
                  if (!nextTheme) return;
                  setNameTheme(nextThemeName);
                  setPlayers((currentPlayers) => currentPlayers.map((player, playerIndex) => ({
                    ...clearPlayerPersonaData(player),
                    color: normalizePlayerColor(player.color, playerIndex, nextThemeName),
                  })));
                }}
                className="mt-3 w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-3 text-white"
              >
                {selectableThemeOptions.map((themeOption) => (
                  <option key={themeOption.name} value={themeOption.name} className="text-black">
                    {themeOption.name}{themeOption.isDlc ? ' 🔥' : ''}
                  </option>
                ))}
              </select>
              {hasThemePersonas && (
                <Button
                  type="button"
                  className={`mt-3 rounded-2xl border px-4 ${setupThemeButtonClass}`}
                  onClick={randomizeAllPlayersForTheme}
                >
                  <Dice6 className="mr-2 h-4 w-4" />
                  Randomize all personas for this theme
                </Button>
              )}
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/60">Persona only mode</div>
                    <div className="mt-1 text-xs text-white/70">
                      {hasThemePersonas
                        ? 'Lock randomization to this theme\'s persona pool and matching portraits.'
                        : 'No persona pack is available for this theme yet.'}
                    </div>
                  </div>
                  <BoxerToggle
                    checked={usePersonaOnlyForTheme}
                    onCheckedChange={(next) => setPersonaOnlyMode(Boolean(next))}
                    disabled={!hasThemePersonas}
                    label="Toggle persona-only mode"
                  />
                </div>
              </div>
            </div>
            <div className="mb-4 flex items-center justify-center gap-2">
              <Users className={`h-5 w-5 ${setupPlayerIconClass}`} />
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
                        onClick={() => assignRandomPlayerIdentity(player.id)}
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
                      item.id === player.id
                        ? {
                          ...clearPlayerPersonaData(item),
                          name: event.target.value,
                        }
                        : item
                    )))}
                    className="rounded-2xl border border-white/10 bg-white/5 text-white"
                    disabled={usePersonaOnlyForTheme}
                  />
                  {usePersonaOnlyForTheme && (
                    <div className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-cyan-200/85">
                      Name locked to selected persona
                    </div>
                  )}
                  {(player.personaImageSrc || player.personaBio) && (
                    <div className="mt-3 rounded-2xl border border-cyan-300/20 bg-cyan-500/5 p-3">
                      <div className="flex items-start gap-3">
                        {player.personaImageSrc && (
                          <ThemeArt
                            src={player.personaImageSrc}
                            alt={`${player.name} persona portrait`}
                            className="h-16 w-16 shrink-0 rounded-xl border border-white/20 bg-black/30 object-cover"
                          />
                        )}
                        <div>
                          <div className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Persona profile</div>
                          {player.personaBio && <p className="mt-1 text-xs leading-relaxed text-white/75">{player.personaBio}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button
                className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-cyan-100"
                disabled={players.length >= MAX_PLAYERS}
                onClick={() => setPlayers((currentPlayers) => [
                  ...currentPlayers,
                  {
                    id: `p-${Date.now()}-${currentPlayers.length + 1}`,
                    name: `Player ${currentPlayers.length + 1}`,
                    score: 0,
                    color: normalizePlayerColor('', currentPlayers.length, nameTheme),
                  },
                ])}
              >
                <PlusCircle className="mr-2 inline h-4 w-4" />
                Add Player
              </Button>
            </div>
          </GlassPanel>
          <GlassPanel className="rounded-[2.5rem] border-yellow-300/20 bg-black/25 p-5">
            <div className="mb-4 flex items-center justify-center gap-2">
              <ShieldAlert className={`h-5 w-5 ${setupRulesIconClass}`} />
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
function RevealScreen({ players, currentRevealIndex, round, totalRounds, onNext, passLine, normalLine, liarLine, theme, onlineMode = false, localPlayerName = '', onlinePrivatePrompt = null, onlinePrivatePromptError = '', privatePromptLoading = false, playSfx = () => {} }) {
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
      playSfx(CARD_FLIP_SFX_SRC, { volume: 0.58 });
      setIsCountingDown(false);
      setCardFace('front');
      return undefined;
    }
    const timer = setTimeout(() => {
      setCountdownValue((value) => (typeof value === 'number' ? value - 1 : 0));
    }, 700);
    return () => clearTimeout(timer);
  }, [isCountingDown, countdownValue, playSfx]);
  useEffect(() => {
    if (cardFace !== 'front') {
      try {
        fireAudioRef.current?.pause();
      } catch {}
      return undefined;
    }
    if (!isImposter) return undefined;
    try {
      const audio = new Audio(FIRE_CRACKLE_SFX_SRC);
      audio.volume = 0.4;
      audio.loop = true;
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
    const minSize = 10;
    let nextSize = maxSize;
    promptElement.style.fontSize = `${nextSize}px`;
    promptElement.style.lineHeight = '1.08';

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
        <GlassPanel className="flex-1 rounded-[2.5rem] border-white/15 bg-black/25 px-4 py-4 sm:px-5 sm:py-5 text-center overflow-hidden">
          <Badge className="rounded-full bg-white/10 border border-white/10 px-4 py-1.5 text-white">
            Secret reveal {currentRevealIndex + 1} / {players.length}
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black mt-2.5 text-yellow-300 leading-tight">
            {onlineMode ? `Reveal for ${localPlayerName || player.name}` : `Pass the phone to ${player.name}`}
          </h2>
          <p className="text-cyan-200/90 mt-1.5 text-sm sm:text-base font-medium leading-tight">{passLine}</p>
          {onlineMode && onlinePrivatePromptError && (
            <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-500/10 p-3 text-sm text-red-100">
              {onlinePrivatePromptError}
            </div>
          )}

          <div className="mt-3 mx-auto w-full max-w-[16.75rem] sm:max-w-[18.5rem] [perspective:1200px]">
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
                  <div className="mt-5 rounded-xl border border-cyan-200/30 bg-black/45 px-3 py-2 shadow-[0_0_16px_rgba(34,211,238,0.28)]">
                    <div className="text-sm text-white/95">
                      {instructionLine}
                    </div>
                    <div className="mt-2 text-xs text-white/90">{round.roundTypeTagline}</div>
                  </div>
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
                    <img src={CARD_FIRE_FLAME_SOURCES[0] || FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute -top-5 -left-3 h-14 w-14 opacity-95 animate-pulse drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
                    <img src={CARD_FIRE_FLAME_SOURCES[1] || FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute -top-6 right-1 h-16 w-16 opacity-95 animate-pulse drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
                    <img src={CARD_FIRE_FLAME_SOURCES[2] || FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-1 -right-3 h-14 w-14 opacity-90 animate-pulse drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
                    <img src={CARD_FIRE_FLAME_SOURCES[3] || FLAME_SRC} alt="" aria-hidden="true" className="pointer-events-none absolute bottom-0 -left-2 h-12 w-12 opacity-85 animate-pulse drop-shadow-[0_0_12px_rgba(255,98,0,0.95)]" />
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
                  <div className={`mt-3 inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] ${isImposter ? 'text-orange-100' : 'text-cyan-200'}`}>
                    <img
                      src={isImposter ? UI_ICON_BADGE_LIAR_SRC : UI_ICON_MAGNIFIER_FIRE_SRC}
                      alt=""
                      aria-hidden="true"
                      className="h-4 w-4 object-contain"
                    />
                    <span>{isImposter ? 'IMPOSTER CARD' : round.hint}</span>
                  </div>
                  {round.mediaPreviewLabel && (
                    <div className="mt-3 text-sm text-white/85">{round.mediaPreviewLabel}</div>
                  )}
                  {mediaSrc && (
                    <img src={mediaSrc} alt={`${round.hint} visual clue`} className="mt-3 w-full rounded-2xl" />
                  )}
                  <div ref={promptFitContainerRef} className="mt-4 max-h-[12.5rem] overflow-hidden px-1">
                    <div
                      ref={promptTextRef}
                      className={`font-black ${isImposter ? 'text-yellow-300' : 'text-white'}`}
                      style={{
                        fontSize: `${promptFontSize}px`,
                        wordBreak: 'normal',
                        overflowWrap: 'normal',
                        whiteSpace: 'normal',
                        hyphens: 'manual',
                        WebkitHyphens: 'manual',
                        lineHeight: 1.1,
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
              className="rounded-[1.5rem] h-12 sm:h-13 px-6 mt-3 bg-yellow-300 text-zinc-950 border-2 border-white"
              onClick={startRevealCountdown}
            >
              I&apos;m Ready
            </Button>
          )}

          {cardFace === 'front' && (
            <Button className="rounded-[1.5rem] h-12 sm:h-13 px-6 mt-3 bg-white/10 border border-white/10 text-white" onClick={onNext}>
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
const GRILL_YES_VARIANTS = ['Yes.', 'Yep.', 'Absolutely yes.', 'Correct.', 'Spot on.'];
const GRILL_NO_VARIANTS = ['No.', 'Nah.', 'Nope.', 'Negative.', 'Not a chance.'];
const GRILL_MAYBE_VARIANTS = ['Possibly.', 'Maybe.', 'Could be.', 'Not impossible.', 'Hard maybe.'];
const GRILL_KIND_OF_VARIANTS = ['Kind of.', 'Sort of.', 'In a way.', 'Depends how you see it.', 'Close-ish.'];
const GRILL_NOT_APPLICABLE_VARIANTS = ['Not really applicable.', 'Not the right angle.', 'That does not map cleanly.', 'Not quite relevant.'];
const GRILL_CHEAT_WARNING_VARIANTS = [
  'Cheeky cheat detected. Naughty naughty, good try... guess again.',
  'Sneaky move. I am not giving hints, so have another guess.',
  'Nice try, cheat. No hints from me. Guess again.',
];
const GRILL_CHEAT_PENALTY_VARIANTS = [
  'You did it again, filthy cheat. Point deducted and you are disqualified for this round.',
  'Second sneaky request detected. You lose a point and you are out of this round.',
  'Naughty naughty... again. Minus one point, and you are disqualified this round.',
];
const GRILL_CORRECT_GUESS_VARIANTS = [
  'Bingo. Correct guess.',
  'Yes. You got it exactly right.',
  'Spot on. That is the answer.',
];
const GRILL_LIAR_CORRECT_GUESS_VARIANTS = [
  'Correct... but filthy cheat behavior from a liar. Minus one.',
  'You guessed it, liar. Sneaky and shameless. Minus one point.',
  'Right answer, wrong morals. Liar penalty applied: minus one.',
];

function pickVariant(options = [], fallback = '') {
  if (!Array.isArray(options) || options.length === 0) return fallback;
  return options[Math.floor(Math.random() * options.length)] || fallback;
}

function normalizeForGuess(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isHintOrAnswerRequest(question = '') {
  const asked = normalizeForGuess(question);
  if (!asked) return false;
  const hintPatterns = [
    /\b(hint|clue)\b/,
    /\b(answer|give the answer|tell me the answer|what is the answer)\b/,
    /\b(reveal it|say it|tell me what it is|what is it exactly)\b/,
  ];
  return hintPatterns.some((pattern) => pattern.test(asked));
}

function evaluateGrillQuestion(question = '', round = {}) {
  const asked = normalizeForGuess(question);
  if (!asked) {
    return { answer: pickVariant(GRILL_NOT_APPLICABLE_VARIANTS, 'Not really applicable.'), isCorrectGuess: false, isCheatRequest: false };
  }
  if (isHintOrAnswerRequest(asked)) {
    return { answer: pickVariant(GRILL_CHEAT_WARNING_VARIANTS, 'No hints from me. Guess again.'), isCorrectGuess: false, isCheatRequest: true };
  }

  const targetRaw = String(round?.main || '').trim();
  const targetCore = targetRaw.includes(':') ? targetRaw.split(':').slice(1).join(':').trim() : targetRaw;
  const targetPrompt = String(round?.aiPrompt || '');
  const targetNormalized = normalizeForGuess(targetCore || targetRaw);
  const targetTokens = [...new Set(targetNormalized.split(/\s+/).filter((token) => token.length >= 3))];

  const hasGuessIntent = /\b(is it|is this|is that|could it be|my guess|answer is|it is|it s|its)\b/.test(asked);
  const fullTargetMatch = targetNormalized && asked.includes(targetNormalized);
  const tokenGuessMatch = targetTokens.length > 1 && targetTokens.every((token) => asked.includes(token));
  const isCorrectGuess = Boolean(fullTargetMatch || (hasGuessIntent && tokenGuessMatch));
  if (isCorrectGuess) {
    return { answer: pickVariant(GRILL_CORRECT_GUESS_VARIANTS, 'Correct.'), isCorrectGuess: true, isCheatRequest: false };
  }

  const targetTags = inferTargetTags(targetRaw, targetPrompt);
  const questionTags = inferQuestionTags(asked);
  const hasTaggedQuestion = questionTags.size > 0;
  const hasTagOverlap = [...questionTags].some((tag) => targetTags.has(tag));
  if (hasTaggedQuestion && hasTagOverlap) {
    return { answer: pickVariant(GRILL_YES_VARIANTS, 'Yes.'), isCorrectGuess: false, isCheatRequest: false };
  }
  if (hasTaggedQuestion && !hasTagOverlap) {
    return { answer: pickVariant(GRILL_NO_VARIANTS, 'No.'), isCorrectGuess: false, isCheatRequest: false };
  }
  if (/\b(is it|does it|can it|would it)\b/.test(asked)) {
    return { answer: pickVariant(GRILL_MAYBE_VARIANTS, 'Possibly.'), isCorrectGuess: false, isCheatRequest: false };
  }
  if (/\b(where|when|which|who)\b/.test(asked)) {
    return { answer: pickVariant(GRILL_KIND_OF_VARIANTS, 'Kind of.'), isCorrectGuess: false, isCheatRequest: false };
  }
  return { answer: pickVariant(GRILL_NOT_APPLICABLE_VARIANTS, 'Not really applicable.'), isCorrectGuess: false, isCheatRequest: false };
}
function GrillEmScreen({ players, round, totalRounds, onContinue, theme, playSfx = () => {}, onByteBlitzCue = () => {} }) {
  const [question, setQuestion] = useState('');
  const [transcript, setTranscript] = useState(round.grillData?.transcript || []);
  const questionsPerPlayer = round.grillData?.questionsPerPlayer || getGrillQuestionsPerPlayer(players.length);
  const [askedCounts, setAskedCounts] = useState(round.grillData?.askedCounts || {});
  const [cheatStrikesByPlayerId, setCheatStrikesByPlayerId] = useState(round.grillData?.cheatStrikesByPlayerId || {});
  const [disqualifiedPlayerIds, setDisqualifiedPlayerIds] = useState(round.grillData?.disqualifiedPlayerIds || []);
  const [scoreAdjustmentsByPlayerId, setScoreAdjustmentsByPlayerId] = useState(round.grillData?.scoreAdjustmentsByPlayerId || {});
  const [guessWinnerId, setGuessWinnerId] = useState(round.grillData?.guessWinnerId || '');
  const [endedByCorrectGuess, setEndedByCorrectGuess] = useState(Boolean(round.grillData?.endedByCorrectGuess));
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState('');
  const [, setVoiceRevision] = useState(0);
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
  const disqualifiedSet = useMemo(
    () => new Set((disqualifiedPlayerIds || []).map((value) => String(value || '').trim()).filter(Boolean)),
    [disqualifiedPlayerIds]
  );
  const totalQuestionsTarget = players.reduce((acc, player) => {
    const asked = Math.min(questionsPerPlayer, Number(askedCounts[player.id] || 0));
    if (disqualifiedSet.has(player.id)) return acc + asked;
    return acc + questionsPerPlayer;
  }, 0);
  const askedSoFar = players.reduce((acc, player) => acc + Math.min(questionsPerPlayer, askedCounts[player.id] || 0), 0);

  function findNextTurnIndex(startIndex, countsSnapshot = askedCounts, disqualifiedSnapshot = disqualifiedSet) {
    if (!players.length) return -1;
    for (let step = 0; step < players.length; step += 1) {
      const candidate = (startIndex + step + players.length) % players.length;
      const candidatePlayer = players[candidate];
      if (disqualifiedSnapshot?.has(candidatePlayer.id)) continue;
      if ((countsSnapshot[candidatePlayer.id] || 0) < questionsPerPlayer) return candidate;
    }
    return -1;
  }
  const activeTurnIndex = endedByCorrectGuess ? -1 : findNextTurnIndex(turnIndex);
  const activePlayer = activeTurnIndex === -1 ? null : players[activeTurnIndex];
  const allAsked = endedByCorrectGuess || activeTurnIndex === -1;

  useEffect(() => () => {
    try { recognitionRef.current?.stop(); } catch {}
  }, []);
  useEffect(() => {
    const validTurnIndex = findNextTurnIndex(turnIndex, askedCounts, disqualifiedSet);
    if (validTurnIndex !== -1 && validTurnIndex !== turnIndex) {
      setTurnIndex(validTurnIndex);
    }
  }, [turnIndex, askedCounts, disqualifiedSet, players.length, questionsPerPlayer, endedByCorrectGuess]);
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
          if (text) {
            setQuestion(text);
            submitQuestion(text, { source: 'mic' });
          }
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

  function submitQuestion(questionInput = question, { source = 'typed' } = {}) {
    const trimmed = String(questionInput || '').trim();
    if (!trimmed || allAsked || !activePlayer) return;

    const evaluation = evaluateGrillQuestion(trimmed, round);
    let answer = evaluation.answer;
    const playerAskedCount = (askedCounts[activePlayer.id] || 0) + 1;
    const nextCounts = { ...askedCounts, [activePlayer.id]: playerAskedCount };
    const nextCheatStrikes = { ...cheatStrikesByPlayerId };
    const nextScoreAdjustments = { ...scoreAdjustmentsByPlayerId };
    const nextDisqualified = Array.isArray(disqualifiedPlayerIds) ? [...disqualifiedPlayerIds] : [];
    let nextGuessWinnerId = String(guessWinnerId || '').trim();
    let nextEndedByCorrectGuess = endedByCorrectGuess;

    if (evaluation.isCheatRequest) {
      const nextStrikeCount = Number(nextCheatStrikes[activePlayer.id] || 0) + 1;
      nextCheatStrikes[activePlayer.id] = nextStrikeCount;
      if (nextStrikeCount >= 2) {
        if (!nextDisqualified.includes(activePlayer.id)) nextDisqualified.push(activePlayer.id);
        nextScoreAdjustments[activePlayer.id] = Number(nextScoreAdjustments[activePlayer.id] || 0) - 1;
        answer = pickVariant(GRILL_CHEAT_PENALTY_VARIANTS, 'Minus one point and disqualified for this round.');
      } else {
        answer = pickVariant(
          GRILL_CHEAT_WARNING_VARIANTS,
          'Cheeky cheat detected. Guess again. Do it again and you lose a point plus disqualification.'
        );
      }
    } else if (evaluation.isCorrectGuess) {
      const isLiar = (round.imposterIds || []).includes(activePlayer.id);
      const adjustment = isLiar ? -1 : 2;
      nextScoreAdjustments[activePlayer.id] = Number(nextScoreAdjustments[activePlayer.id] || 0) + adjustment;
      nextGuessWinnerId = activePlayer.id;
      nextEndedByCorrectGuess = true;
      answer = isLiar
        ? pickVariant(GRILL_LIAR_CORRECT_GUESS_VARIANTS, 'Correct, liar. Minus one for cheating.')
        : pickVariant(GRILL_CORRECT_GUESS_VARIANTS, 'Correct guess. Round ending now.');
    }

    const nextDisqualifiedSet = new Set(nextDisqualified.map((value) => String(value || '').trim()).filter(Boolean));
    const nextTurnIndex = nextEndedByCorrectGuess
      ? -1
      : findNextTurnIndex(activeTurnIndex + 1, nextCounts, nextDisqualifiedSet);

    const nextRow = {
      id: `${Date.now()}-${activePlayer.id}-${playerAskedCount}`,
      player: activePlayer?.name || 'Player',
      question: trimmed,
      answer,
      turn: playerAskedCount,
      source,
      isCheatRequest: Boolean(evaluation.isCheatRequest),
      isCorrectGuess: Boolean(evaluation.isCorrectGuess),
    };
    const nextTranscript = [...transcript, nextRow];
    setTranscript(nextTranscript);
    setAskedCounts(nextCounts);
    setCheatStrikesByPlayerId(nextCheatStrikes);
    setDisqualifiedPlayerIds(nextDisqualified);
    setScoreAdjustmentsByPlayerId(nextScoreAdjustments);
    setGuessWinnerId(nextGuessWinnerId);
    setEndedByCorrectGuess(nextEndedByCorrectGuess);
    setTurnIndex(nextTurnIndex >= 0 ? nextTurnIndex : activeTurnIndex);
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
    speak(answer);
    const cueType = evaluation.isCheatRequest
      ? (Number(nextCheatStrikes[activePlayer.id] || 0) >= 2 ? 'cheatPenalty' : 'cheatWarning')
      : (evaluation.isCorrectGuess
        ? ((round.imposterIds || []).includes(activePlayer.id) ? 'liarCorrect' : 'correct')
        : (/^yes[.!]?$/i.test(answer)
          ? 'yes'
          : (/^no[.!]?$/i.test(answer)
            ? 'no'
            : (/^possibly[.!]?$/i.test(answer)
              ? 'maybe'
              : (/^kind of[.!]?$/i.test(answer) ? 'kindOf' : 'notApplicable')))));
    onByteBlitzCue({
      cueType,
      answer,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
    });
    setQuestion('');

    if (nextEndedByCorrectGuess) {
      onContinue({
        transcript: nextTranscript,
        questionsPerPlayer,
        askedCounts: nextCounts,
        micEnabled,
        ttsEnabled: speechEnabled,
        turnIndex: nextTurnIndex,
        cheatStrikesByPlayerId: nextCheatStrikes,
        disqualifiedPlayerIds: nextDisqualified,
        scoreAdjustmentsByPlayerId: nextScoreAdjustments,
        guessWinnerId: nextGuessWinnerId,
        endedByCorrectGuess: true,
      });
    }
  }

  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-5xl space-y-6">
        <ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} themeName={theme} />
        <GlassPanel className="rounded-[2.5rem] p-8 border-cyan-400/20 bg-black/25">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">{round.roundTypeName}</div>
            <h2 className="text-4xl font-black mt-3 text-yellow-300">Interrogate Blaze Byte 🤖</h2>
            <p className="text-cyan-200 mt-3">
              One player asks at a time. Turn rotates after each question.
            </p>
            <p className="text-xs text-yellow-200 mt-2">
              Correct guess ends the round instantly. Honest guessers get +2. Liar guessers lose 1.
            </p>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/70">Current questioner</div>
            <div className="text-2xl font-black text-yellow-300 mt-1">{allAsked ? 'All questions complete' : activePlayer?.name}</div>
            <div className="text-xs text-white/55 mt-2">
              Questions left: {Math.max(0, totalQuestionsTarget - askedSoFar)} / {totalQuestionsTarget}
            </div>
            <div className="text-xs text-cyan-200 mt-2">AI voice: male British (when supported by device voices)</div>
            {disqualifiedPlayerIds.length > 0 && (
              <div className="text-xs text-red-200 mt-2">
                Disqualified this round: {disqualifiedPlayerIds.map((id) => players.find((player) => player.id === id)?.name || id).join(', ')}
              </div>
            )}
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

          <div className="mt-6 flex justify-center">
            <Button
              className="rounded-[1.5rem] h-14 px-8 bg-yellow-300 text-zinc-950 border-2 border-white"
              onClick={() => onContinue({
                transcript,
                questionsPerPlayer,
                askedCounts,
                micEnabled,
                ttsEnabled: speechEnabled,
                turnIndex: activeTurnIndex,
                cheatStrikesByPlayerId,
                disqualifiedPlayerIds,
                scoreAdjustmentsByPlayerId,
                guessWinnerId,
                endedByCorrectGuess,
              })}
              disabled={!allAsked}
            >
              {endedByCorrectGuess ? 'Correct guess locked. Continue to voting' : 'Continue to voting'}
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
  return <TopFrame theme={theme}><div className="mx-auto max-w-3xl space-y-6"><ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} themeName={theme} /><VoicePartyStatusStrip onlineVoiceEnabled={onlineVoiceEnabled} onlineVoiceMuted={onlineVoiceMuted} setOnlineVoiceMuted={setOnlineVoiceMuted} canTalk={canTalk} /><GlassPanel className="rounded-[2.5rem] p-8 text-center border-emerald-400/20 bg-black/25"><Badge className="rounded-full bg-emerald-500/20 border border-emerald-400/20 text-emerald-100 px-4 py-1.5">All prompts delivered</Badge><div className="text-xs uppercase tracking-[0.3em] text-white/50 mt-4">{round.roundTypeName}</div><h2 className="text-4xl font-black mt-3 text-yellow-300">{round.roundTypeTagline}</h2><p className="text-white/75 mt-3 max-w-2xl mx-auto">{line}</p><p className="text-cyan-200 mt-3 max-w-2xl mx-auto font-semibold">{roundRule}</p><div className="mt-8 flex justify-center"><Button className="rounded-[1.5rem] h-16 min-w-[16rem] px-8 bg-yellow-300 text-zinc-950 border-2 border-white" onClick={onContinue} disabled={submitPending}><SkipForward className="mr-2 h-5 w-5 inline" />{submitPending ? 'Syncing...' : 'Finish discussion and vote'}</Button></div></GlassPanel></div></TopFrame>;
}
function VotingScreen({ players, round, totalRounds, votesByPlayerId, setVotesByPlayerId, onSubmitVotes, line, theme, onlineMode = false, onlinePlayerId = '', onlineVoiceEnabled = false, onlineVoiceMuted = false, setOnlineVoiceMuted = () => {}, canTalk = true, submitPending = false, playSfx = () => {} }) {
  const leader = players.find((p) => p.id === round.leaderId);
  const localVoters = useMemo(() => players.filter((player) => player.id), [players]);
  const activeLocalVoter = useMemo(
    () => localVoters.find((player) => !votesByPlayerId[player.id]) || null,
    [localVoters, votesByPlayerId]
  );
  const votersToRender = onlineMode
    ? (onlinePlayerId ? players.filter((player) => player.id === onlinePlayerId) : [])
    : (activeLocalVoter ? [activeLocalVoter] : []);
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
  const canRevealResults = !onlineMode && allComplete;
  const canSubmitOnlineVote = onlineMode && onlineVoteReady;
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
        <ScoreStrip players={players} roundNumber={round.roundNumber} totalRounds={totalRounds} themeName={theme} />
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
                  : activeLocalVoter
                    ? <>Pass the phone to <span className="font-semibold text-cyan-300">{activeLocalVoter.name}</span>. </>
                    : <>All votes are in. Get ready to reveal the results. </>}
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
            {!onlineMode && !activeLocalVoter && (
              <GlassPanel className="rounded-[1.75rem] p-5 border-emerald-300/25 bg-emerald-500/10">
                <div className="text-sm uppercase tracking-[0.2em] text-emerald-200">All votes submitted</div>
                <div className="mt-2 text-xl font-black text-yellow-200">Reveal the results when ready.</div>
              </GlassPanel>
            )}
            {onlineMode && !votersToRender.length && (
              <GlassPanel className="rounded-[1.75rem] p-5 border-cyan-300/25 bg-cyan-500/10">
                <div className="text-sm uppercase tracking-[0.2em] text-cyan-200">Other players are voting</div>
                <div className="mt-2 text-base text-white/85">Please wait for your turn to submit your vote.</div>
              </GlassPanel>
            )}
          </div>

          <div className="mt-8 flex justify-center">
            {onlineMode ? (
              <Button
                className="rounded-[1.5rem] h-14 px-8 bg-yellow-300 text-zinc-950 border-2 border-white"
                disabled={!canSubmitOnlineVote || submitPending}
                onClick={onSubmitVotes}
              >
                <Vote className="mr-2 h-5 w-5 inline" />
                {submitPending ? 'Submitting vote...' : 'Submit my vote'}
              </Button>
            ) : (
              <Button
                className="rounded-[1.5rem] h-14 px-8 bg-yellow-300 text-zinc-950 border-2 border-white"
                disabled={!canRevealResults || submitPending}
                onClick={onSubmitVotes}
              >
                <Vote className="mr-2 h-5 w-5 inline" />
                Reveal results
              </Button>
            )}
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function LiarRevealScreen({ players, round, onComplete, theme, playSfx = () => {} }) {
  const liars = players.filter((p) => (round.imposterIds || []).includes(p.id));
  const hostSizeConfig = getHostSizeConfig(theme);
  const audioRef = useRef(null);
  const hasCompletedRef = useRef(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const announcementBubbleTextRef = useRef(null);
  const announcementBubbleFitRef = useRef(null);
  const [announcementBubbleFontSize, setAnnouncementBubbleFontSize] = useState(34);
  useEffect(() => {
    playSfx(IMPOSTER_ANNOUNCED_SFX_SRC, { volume: 0.72 });
  }, [playSfx]);
  const announcementLines = [
    liars.length > 1 ? 'The Liars are......' : 'The Liar was......',
    liars.length > 0
      ? `${liars.map((player) => player.name).join(', ')}`
      : 'No liar data available.',
    'Hearts pounding. Friendships wobbling. Truth incoming.',
  ];
  const isTalking = announcementIndex < announcementLines.length - 1;
  const finishReveal = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    try { audioRef.current?.pause(); } catch {}
    onComplete();
  }, [onComplete]);
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
      finishReveal();
    }, HOST_DIALOGUE_TIMINGS.liarRevealCompleteMs);
    return () => clearTimeout(timer);
  }, [announcementIndex, announcementLines.length, finishReveal]);
  useLayoutEffect(() => {
    const nextSize = fitTextToBubble(announcementBubbleTextRef.current, announcementBubbleFitRef.current, {
      maxSize: 34,
      minSize: 14,
      lineHeight: 1.1,
    });
    setAnnouncementBubbleFontSize((current) => (current === nextSize ? current : nextSize));
  }, [announcementIndex, announcementLines]);
  function advanceAnnouncementLine() {
    if (announcementIndex >= announcementLines.length - 1) {
      finishReveal();
      return;
    }
    setAnnouncementIndex((current) => Math.min(current + 1, announcementLines.length - 1));
  }
  return (
    <TopFrame theme={theme}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col justify-center">
        <GlassPanel className="relative overflow-hidden rounded-[2.5rem] border-red-400/25 bg-black/35 p-6 sm:p-8 text-center">
          <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle,_rgba(255,0,80,0.16)_0%,_rgba(255,0,80,0.08)_35%,_transparent_70%)]" />
          <div className="relative z-10">
            <div className="text-xs uppercase tracking-[0.35em] text-white/50">Final accusation</div>
            <div className="relative mx-auto mt-4 w-full max-w-3xl min-h-[230px] sm:min-h-[280px]">
              <ThemeHostVisual
                themeName={theme}
                isTalking={isTalking}
                alt={`${theme} presenter`}
                className={`pointer-events-none absolute bottom-0 left-0 ${hostSizeConfig.liarReveal}`}
              />
              <motion.div
                key={`liar-announce-${announcementIndex}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`${hostSizeConfig.liarBubbleMargin} h-[11rem] sm:h-[12rem] p-1 text-white`}
              >
                <div ref={announcementBubbleFitRef} className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center overflow-hidden rounded-[2rem] border-2 border-red-300/70 bg-[#2a0f2e] px-4 py-4 shadow-[0_12px_24px_rgba(0,0,0,0.42)]">
                  <div className="absolute -left-3 top-[58%] h-6 w-6 -translate-y-1/2 rotate-45 border-b-2 border-l-2 border-red-300/70 bg-[#2a0f2e]" />
                  <p
                    ref={announcementBubbleTextRef}
                    className="font-black text-red-200"
                    style={{
                      fontSize: `${announcementBubbleFontSize}px`,
                      lineHeight: 1.1,
                      whiteSpace: 'normal',
                      wordBreak: 'normal',
                      overflowWrap: 'break-word',
                      hyphens: 'manual',
                      WebkitHyphens: 'manual',
                    }}
                  >
                    {announcementLines[Math.min(announcementIndex, announcementLines.length - 1)]}
                  </p>
                  {announcementIndex >= 1 && liars.length > 0 && (
                    <div className="mt-3 inline-flex flex-wrap justify-center gap-2">
                      {liars.map((player) => (
                        <span
                          key={player.id}
                          className="rounded-full border border-red-300/35 bg-red-500/15 px-4 py-1.5 text-sm sm:text-base font-black text-yellow-200"
                        >
                          <img src={UI_ICON_BADGE_LIAR_SRC} alt="" aria-hidden="true" className="mr-1 inline h-4 w-4 object-contain align-[-2px]" />{player.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            <div className="mt-6 flex justify-center">
              <Button
                className="h-14 rounded-[1.5rem] border border-white/30 bg-white/10 px-6 text-white"
                onClick={advanceAnnouncementLine}
              >
                {announcementIndex >= announcementLines.length - 1 ? 'Continue' : 'Next line'}
              </Button>
            </div>
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function ResultsScreen({ players, round, totalRounds, tally, roundGains, roundBreakdown, imposterCaught, onNextRound, onEndGame, resultLine, theme }) {
  const [resultsStage, setResultsStage] = useState('summary');
  const lastRound = round.roundNumber >= totalRounds;
  const promptByPlayerId = round.promptsByPlayerId || {};
  const rankedPlayers = [...players].sort((a, b) => b.score - a.score);
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
  const sortedVoteRows = [...players].sort((a, b) => (tally?.[b.id] || 0) - (tally?.[a.id] || 0));
  const ctaLabel = resultsStage === 'summary'
    ? 'Show round details'
    : (resultsStage === 'details'
      ? 'Show leaderboard'
      : (lastRound ? 'View final winner' : 'Start next round'));

  useEffect(() => {
    setResultsStage('summary');
  }, [round.id, round.roundNumber]);

  function handleResultsAction() {
    if (resultsStage === 'summary') {
      setResultsStage('details');
      return;
    }
    if (resultsStage === 'details') {
      setResultsStage('leaderboard');
      return;
    }
    if (lastRound) {
      onEndGame();
      return;
    }
    onNextRound();
  }

  return (
    <TopFrame theme={theme} allowScroll={false}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col">
        <GlassPanel className="flex-1 rounded-[2.3rem] border-white/15 bg-black/25 p-4 sm:p-6">
          {resultsStage === 'summary' ? (
            <div className="flex h-full flex-col">
              <div className="text-center">
                <h2 className="text-3xl leading-tight sm:text-4xl font-black text-[#ff7d87] [text-shadow:0_4px_16px_rgba(0,0,0,0.45)]">
                  🔥 WHO WAS THE LIAR? 🔥
                </h2>
                <div className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight ${imposterCaught ? 'text-yellow-300' : 'text-fuchsia-400'}`}>
                  {imposterCaught ? 'THE LIAR WAS CAUGHT 😤' : 'THE LIAR ESCAPED 😈'}
                </div>
                <p className="mx-auto mt-2 max-w-3xl text-sm sm:text-base font-semibold text-white/75">
                  {resultLine}
                </p>
              </div>
              <div className="mt-4 grid flex-1 auto-rows-fr gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((player, index) => {
                  const isLiar = (round.imposterIds || []).includes(player.id);
                  const breakdown = roundBreakdown?.[player.id] || { voteHit: 0, liarSurvived: 0, grillTeamBonus: 0, grillLiarSwing: 0 };
                  const roundGain = roundGains?.[player.id] || 0;
                  const centeredOnSm = players.length % 2 === 1 && index === players.length - 1;
                  const centeredOnLg = players.length % 3 === 1 && index === players.length - 1;
                  return (
                    <div
                      key={player.id}
                      className={`relative rounded-[1.2rem] border p-3 text-center transition-all duration-300 ${
                        isLiar
                          ? 'border-red-300/75 bg-gradient-to-b from-red-500/12 to-white/5 shadow-[0_0_22px_rgba(255,62,62,0.55)]'
                          : 'border-white/10 bg-white/5'
                      } ${centeredOnSm ? 'sm:col-span-2 sm:mx-auto sm:w-full sm:max-w-[22rem] lg:col-span-1 lg:max-w-none' : ''} ${centeredOnLg ? 'lg:col-start-2' : ''}`}
                    >
                      {isLiar && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-red-200/70 bg-red-500 px-2.5 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.1em] text-white">
                          🔥 The Liar
                        </div>
                      )}
                      <div className={`text-xl sm:text-2xl font-black leading-tight ${isLiar ? 'text-[#ffc0ab]' : 'text-white'}`}>
                        {player.name}
                      </div>
                      <div className="mt-1 text-sm font-black uppercase leading-tight text-white/70">
                        {promptByPlayerId[player.id] || '—'}
                      </div>
                      <div className="mt-2 text-lg font-black uppercase leading-none text-cyan-200">
                        {`${roundGain >= 0 ? '+' : ''}${roundGain} THIS ROUND`}
                      </div>
                      <div className="mt-1 text-[0.65rem] font-bold uppercase leading-tight text-white/65">
                        {`VOTE HIT +${breakdown.voteHit} • LIAR SURVIVED +${breakdown.liarSurvived}`}
                      </div>
                      {round.roundTypeId === 'grill' && (
                        <div className="mt-1 text-[0.6rem] font-semibold uppercase leading-tight text-cyan-200/90">
                          {`TEAM BONUS +${breakdown.grillTeamBonus} • SWING ${breakdown.grillLiarSwing >= 0 ? '+' : ''}${breakdown.grillLiarSwing}`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (resultsStage === 'details' ? (
            <div className="grid h-full grid-cols-1 gap-2 sm:grid-cols-2">
              <GlassPanel className="rounded-[1.2rem] border border-white/10 bg-black/25 p-3 text-center">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/55">Hint / Subcategory</div>
                <div className="mt-1 text-xl sm:text-2xl font-black uppercase leading-tight text-white">{round.hint}</div>
                <div className="mx-auto mt-2 max-w-3xl text-sm font-black uppercase leading-tight text-cyan-200/95">{round.roundTypeTagline}</div>
              </GlassPanel>

              <GlassPanel className="rounded-[1.2rem] border border-white/10 bg-black/25 p-3 text-center">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/55">{roundInfoTitle}</div>
                <div className="mx-auto mt-1 max-w-3xl text-base sm:text-lg font-black uppercase leading-tight text-[#ffb866]">
                  {roundInfoValue}
                </div>
              </GlassPanel>

              <GlassPanel className="rounded-[1.2rem] border border-white/10 bg-black/25 p-3 text-center">
                <div className="text-xs font-black uppercase tracking-[0.14em] text-white/55">Scoring Rules</div>
                <div className="mx-auto mt-1 max-w-3xl text-sm font-black uppercase leading-tight text-cyan-100">
                  Correct liar vote: +1 point. Liar survives: +2 points to that liar.
                </div>
              </GlassPanel>

              <GlassPanel className="rounded-[1.2rem] border border-white/10 bg-black/25 p-3">
                <div className="text-center text-sm font-black uppercase tracking-[0.14em] text-white/65">Vote Tally</div>
                <div className="mt-2 space-y-1.5">
                  {sortedVoteRows.map((player) => {
                    const votes = tally?.[player.id] || 0;
                    const voteLabel = `${votes} ${votes === 1 ? 'VOTE' : 'VOTES'}`;
                    return (
                      <div key={player.id} className="flex items-center justify-between rounded-[0.9rem] border border-white/10 bg-white/5 px-3 py-2">
                        <div className="text-sm font-black uppercase text-white">{player.name}</div>
                        <div className="rounded-full border border-white/15 bg-white/15 px-3 py-1 text-xs font-black uppercase text-white/90">
                          {voteLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassPanel>
            </div>
          ) : (
            <GlassPanel className="h-full rounded-[1.2rem] border border-yellow-300/20 bg-black/25 p-3 sm:p-4">
              <div className="flex items-center gap-3 text-yellow-200">
                <Trophy className="h-5 w-5" />
                <div className="text-xl font-black uppercase tracking-[0.06em]">Scoreboard</div>
              </div>
              <div className="mt-3 space-y-2">
                {rankedPlayers.map((player, index) => (
                  <div key={player.id} className="rounded-[0.95rem] border border-white/12 bg-white/5 px-3 py-2">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <div className="flex items-center gap-3">
                        <PlayerPersonaAvatar
                          player={player}
                          fallbackIndex={index}
                          sizeClass="h-10 w-10"
                          initialsClass="text-[0.65rem]"
                        />
                        <div>
                        <div className="text-[0.7rem] sm:text-xs font-black uppercase tracking-[0.08em] text-white/55">{`Place ${index + 1}`}</div>
                        <div className="mt-0.5 text-lg sm:text-xl font-black uppercase leading-tight text-white">{player.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl sm:text-3xl font-black leading-none text-white">{player.score}</div>
                        <div className="mt-0.5 text-[0.7rem] sm:text-xs font-black uppercase leading-tight text-cyan-200">
                          {`${(roundGains?.[player.id] || 0) >= 0 ? '+' : ''}${roundGains?.[player.id] || 0} THIS ROUND`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          ))}

          <div className="mt-4">
            <Button
              className="h-14 w-full rounded-[1.5rem] border-2 border-white bg-yellow-300 text-zinc-950"
              onClick={handleResultsAction}
            >
              {resultsStage !== 'leaderboard'
                ? <SkipForward className="mr-2 inline h-5 w-5" />
                : (lastRound ? <Trophy className="mr-2 inline h-5 w-5" /> : <TimerReset className="mr-2 inline h-5 w-5" />)}
              {ctaLabel}
            </Button>
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function FinalScreen({ players, onRestart, line, theme }) {
  const ranked = [...players].sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-4xl space-y-6">
        <GlassPanel className="rounded-[2.5rem] border-yellow-300/20 bg-black/25 p-8 text-center">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">Match complete</div>
          <h2 className="mt-3 text-5xl font-black text-yellow-300">Winner: {winner?.name}</h2>
          <p className="mt-3 text-white/75">{line}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {ranked.map((player, index) => (
              <GlassPanel key={player.id} className="rounded-[1.75rem] border-white/10 bg-black/20 p-5">
                <div className="mx-auto flex w-fit items-center gap-2">
                  <PlayerPersonaAvatar
                    player={player}
                    fallbackIndex={index}
                    sizeClass="h-9 w-9"
                    initialsClass="text-[0.6rem]"
                  />
                  <div className="text-sm text-white/55">{`Place ${index + 1}`}</div>
                </div>
                <div className="mt-2 text-2xl font-black">{player.name}</div>
                <div className="mt-3 text-4xl font-black">{player.score}</div>
              </GlassPanel>
            ))}
          </div>
          <Button className="mt-8 h-14 rounded-[1.5rem] border-2 border-white bg-yellow-300 px-8 text-zinc-950" onClick={onRestart}>
            <Star className="mr-2 inline h-5 w-5" />
            New match
          </Button>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
function StoreScreen({
  onBack,
  theme,
  dlcThemePacks = [],
  unlockedThemePackIds = [],
  onUnlockThemePack = () => {},
  onRedeemThemeCode = () => ({ status: 'invalid-code' }),
}) {
  const unlocked = new Set(unlockedThemePackIds || []);
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemFeedback, setRedeemFeedback] = useState(null);
  const packNameById = useMemo(
    () => Object.fromEntries((dlcThemePacks || []).map((pack) => [pack.id, pack.name || pack.id])),
    [dlcThemePacks]
  );
  const handleRedeemSubmit = (event) => {
    event.preventDefault();
    const redemption = onRedeemThemeCode(redeemCodeInput);
    if (!redemption || redemption.status === 'invalid-code') {
      setRedeemFeedback({
        tone: 'error',
        message: 'Invalid code. Double-check the code and try again.',
      });
      return;
    }
    if (redemption.status === 'already-unlocked') {
      setRedeemFeedback({
        tone: 'neutral',
        message: 'Code accepted, but those DLC packs are already unlocked on this device.',
      });
      setRedeemCodeInput('');
      return;
    }
    if (redemption.status === 'unlocked') {
      const unlockedNames = (redemption.newlyUnlockedPackIds || [])
        .map((packId) => packNameById[packId] || packId);
      setRedeemFeedback({
        tone: 'success',
        message: unlockedNames.length
          ? `Code redeemed! Unlocked: ${unlockedNames.join(', ')}.`
          : 'Code redeemed! New DLC unlocked.',
      });
      setRedeemCodeInput('');
      return;
    }
    setRedeemFeedback({
      tone: 'error',
      message: 'Could not redeem this code right now. Please try again.',
    });
  };
  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex justify-between items-center gap-4">
          <Button className="rounded-[1.4rem] bg-white/5 border border-white/10 px-4 py-2 text-white" onClick={onBack}>Back</Button>
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">Store</div>
            <div className="text-white/80 text-sm mt-1">Unlock DLC theme bundles.</div>
          </div>
          <div className="w-[72px]" />
        </div>
        <GlassPanel className="rounded-[2.5rem] p-8 border-fuchsia-400/20 bg-black/25">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="h-6 w-6 text-yellow-300" />
            <h2 className="text-2xl font-black text-yellow-300">Theme DLC Bundles</h2>
          </div>
          <p className="text-white/75 mb-5">
            Each pack is 99p and adds DLC themes marked with a fire icon in the setup dropdown.
          </p>
          <div className="space-y-3">
            {(dlcThemePacks || []).map((pack) => {
              const isUnlocked = unlocked.has(pack.id);
              return (
                <div key={pack.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-black text-lg text-white">{pack.name}</div>
                      <div className="text-xs text-cyan-200 mt-1">
                        {(pack.themes || []).map((themeName) => `${themeName} 🔥`).join(' • ')}
                      </div>
                      {pack.description && (
                        <div className="text-xs text-white/65 mt-2">{pack.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-300 font-black">{pack.priceLabel || '99p'}</div>
                      <Button
                        className="mt-2 rounded-xl bg-yellow-300 text-zinc-950 border border-white disabled:opacity-60"
                        disabled={isUnlocked}
                        onClick={() => onUnlockThemePack(pack.id)}
                      >
                        {isUnlocked ? 'Unlocked' : 'Unlock'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-2xl border border-cyan-400/25 bg-cyan-500/10 p-4">
            <div className="flex items-center gap-2 text-cyan-100">
              <KeyRound className="h-5 w-5" />
              <div className="font-black">Redeem promo code</div>
            </div>
            <p className="text-sm text-white/75 mt-2">
              Enter giveaway or marketing codes to unlock certain DLC bundles instantly.
            </p>
            <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={handleRedeemSubmit}>
              <Input
                value={redeemCodeInput}
                onChange={(event) => setRedeemCodeInput(event.target.value)}
                placeholder="e.g. HISTORY-99"
                className="rounded-xl bg-white/10 border-white/20 text-white"
              />
              <Button type="submit" className="rounded-xl bg-cyan-300 text-zinc-950 border border-white">
                Redeem
              </Button>
            </form>
            {redeemFeedback && (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                  redeemFeedback.tone === 'success'
                    ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
                    : redeemFeedback.tone === 'neutral'
                      ? 'border-amber-300/40 bg-amber-500/15 text-amber-100'
                      : 'border-red-300/40 bg-red-500/15 text-red-100'
                }`}
              >
                {redeemFeedback.message}
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}

function normalizeThemeSelection(themeName, themeOptions = []) {
  const canonicalTheme = toCanonicalThemeName(themeName || 'Default');
  if (!themeOptions.length) return canonicalTheme;
  const optionByName = new Map(themeOptions.map((option) => [option.name, option]));
  const canonicalOption = optionByName.get(canonicalTheme);
  if (canonicalOption?.isUnlocked !== false) return canonicalTheme;
  const defaultOption = optionByName.get('Default');
  if (defaultOption?.isUnlocked !== false) return 'Default';
  const fallback = themeOptions.find((option) => option.isUnlocked !== false);
  return fallback?.name || 'Default';
}

function unlockThemePackIds(currentPackIds = [], packId = '') {
  const next = new Set(normalizeUnlockedThemePackIds(currentPackIds));
  if (packId) next.add(packId);
  return [...next];
}

function redeemThemePackIds(currentPackIds = [], rawCode = '') {
  const current = normalizeUnlockedThemePackIds(currentPackIds);
  const offer = getThemePackRedeemOffer(rawCode);
  if (!offer) {
    return {
      status: 'invalid-code',
      offer: null,
      newlyUnlockedPackIds: [],
      nextPackIds: current,
    };
  }
  const unlocked = new Set(current);
  const redeemablePackIds = (offer.packIds || []).filter((packId) => !unlocked.has(packId));
  if (!redeemablePackIds.length) {
    return {
      status: 'already-unlocked',
      offer,
      newlyUnlockedPackIds: [],
      nextPackIds: current,
    };
  }
  return {
    status: 'unlocked',
    offer,
    newlyUnlockedPackIds: redeemablePackIds,
    nextPackIds: normalizeUnlockedThemePackIds([...current, ...redeemablePackIds]),
  };
}

function SettingsScreen({
  onBack,
  premiumEnabled,
  setPremiumEnabled,
  adultMode,
  setAdultMode,
  audioSettings,
  setAudioSettings,
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
            <div><div className="font-black text-lg">Background Music</div><div className="text-sm text-white/60 mt-1">Enable or disable background tracks (intro/setup/voting).</div></div>
            <Switch checked={audioSettings.musicEnabled} onCheckedChange={(next) => setAudioSettings((cur) => ({ ...cur, musicEnabled: next }))} />
          </div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 flex items-center justify-between gap-4">
            <div><div className="font-black text-lg">Sound Effects</div><div className="text-sm text-white/60 mt-1">Toggle fire, card flip, imposter, and ByteBlitz cue SFX.</div></div>
            <Switch checked={audioSettings.sfxEnabled} onCheckedChange={(next) => setAudioSettings((cur) => ({ ...cur, sfxEnabled: next }))} />
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
  const [screen, setScreen] = useState(() => {
    const hasSeenIntro = Boolean(getStored(APP_INTRO_VIDEO_SEEN_KEY, false));
    return hasSeenIntro ? 'home' : 'intro-video';
  });
    const [players, setPlayers] = useState(createPlayers(3, toCanonicalThemeName(getStored('imposter-theme-v3', 'Default'))));
  const [liarCount, setLiarCount] = useState(1);
  const [nameTheme, setNameTheme] = useState(
    toCanonicalThemeName(getStored('imposter-theme-v3', 'Default'))
  );
  const [personaOnlyMode, setPersonaOnlyMode] = useState(getStored('imposter-persona-only-v1', false));
  const [premiumEnabled, setPremiumEnabled] = useState(false);
  const [adultMode, setAdultMode] = useState(getStored('imposter-adult-mode-v1', false));
  const [customCategories, setCustomCategories] = useState(getStored('imposter-custom-categories-v2', []));
  const [enabledCategories, setEnabledCategories] = useState(getStored('imposter-enabled-categories-v2', Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.id, true]))));
  const [enabledPicturePacks, setEnabledPicturePacks] = useState(getStored('imposter-enabled-picture-packs-v1', normalizeEnabledPicturePacks({}, PICTURE_DLC_MANIFESTS)));
  const [picturePackWeights, setPicturePackWeights] = useState(getStored('imposter-picture-pack-weights-v1', normalizePackWeights({}, PICTURE_DLC_MANIFESTS)));
  const [enabledPictureReleaseChannels, setEnabledPictureReleaseChannels] = useState(getStored('imposter-enabled-picture-release-channels-v1', normalizeEnabledPictureReleaseChannels({}, PICTURE_DLC_MANIFESTS)));
  const [unlockedThemePackIds, setUnlockedThemePackIds] = useState(
    normalizeUnlockedThemePackIds(getStored('imposter-unlocked-theme-packs-v1', []))
  );
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
  const [audioSettings, setAudioSettings] = useState(getStored('imposter-audio-settings-v1', { musicEnabled: true, sfxEnabled: true }));
  const [adminOpen, setAdminOpen] = useState(false);
  const [recentPromptKeys, setRecentPromptKeys] = useState([]);
  const getLine = useMemo(() => createCopyPicker(COPY_BANK), []);
  const [copyState, setCopyState] = useState({ home: COPY_BANK.home[0], setup: COPY_BANK.setup[0], chooser: COPY_BANK.chooser[0], passPhone: COPY_BANK.passPhone[0], revealNormal: COPY_BANK.revealNormal[0], revealLiar: COPY_BANK.revealLiar[0], discussion: COPY_BANK.discussion[0], voting: COPY_BANK.voting[0], result: COPY_BANK.caught[0], winner: COPY_BANK.winner[0], onlineLobby: COPY_BANK.onlineLobby[0], hostStinger: COPY_BANK.hostStingerPrompt[0] });
  const themeOptions = useMemo(
    () => getThemeOptions(unlockedThemePackIds),
    [unlockedThemePackIds]
  );
  const normalizedThemeName = useMemo(
    () => normalizeThemeSelection(nameTheme, themeOptions),
    [nameTheme, themeOptions]
  );
  const canonicalThemeName = normalizedThemeName;
  const themeMeta = THEME_META[normalizedThemeName] || THEME_META.Default;
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
  useEffect(() => setStored('imposter-unlocked-theme-packs-v1', unlockedThemePackIds), [unlockedThemePackIds]);
  useEffect(() => setStored('imposter-theme-v3', normalizedThemeName), [normalizedThemeName]);
  useEffect(() => setStored('imposter-persona-only-v1', Boolean(personaOnlyMode)), [personaOnlyMode]);
  useEffect(() => setStored('imposter-audio-settings-v1', audioSettings), [audioSettings]);
  const bgmAudioRef = useRef(null);
  const playSfx = useCallback((src, { volume = 0.55 } = {}) => {
    if (!audioSettings?.sfxEnabled) return;
    if (!src) return;
    try {
      const audio = new Audio(src);
      audio.volume = Math.max(0, Math.min(1, Number(volume) || 0.55));
      audio.play().catch(() => {});
    } catch {}
  }, [audioSettings?.sfxEnabled]);
  const resolveBgmForScreen = useCallback((currentScreen) => {
    if (currentScreen === 'intro-video') return INTRO_THEME_BGM_SRC;
    if (currentScreen === 'home') return INTRO_THEME_BGM_SRC;
    if (currentScreen === 'setup') return INTRO_THEME_BGM_SRC;
    if (currentScreen === 'game-intro') return INTRO_THEME_BGM_SRC;
    if (currentScreen === 'voting') return VOTING_THEME_BGM_SRC;
    return '';
  }, []);
  useEffect(() => {
    const trackSrc = resolveBgmForScreen(screen);
    if (!audioSettings?.musicEnabled || !trackSrc) {
      try {
        bgmAudioRef.current?.pause();
      } catch {}
      bgmAudioRef.current = null;
      return;
    }
    const currentAudio = bgmAudioRef.current;
    if (currentAudio && currentAudio.src.includes(trackSrc)) {
      currentAudio.volume = 0.42;
      if (currentAudio.paused) currentAudio.play().catch(() => {});
      return;
    }
    try {
      currentAudio?.pause();
    } catch {}
    try {
      const next = new Audio(trackSrc);
      next.loop = true;
      next.volume = 0.42;
      bgmAudioRef.current = next;
      next.play().catch(() => {});
    } catch {
      bgmAudioRef.current = null;
    }
  }, [screen, audioSettings?.musicEnabled, resolveBgmForScreen]);
  useEffect(() => () => {
    try {
      bgmAudioRef.current?.pause();
    } catch {}
    bgmAudioRef.current = null;
  }, []);
  useEffect(() => {
    if (nameTheme !== normalizedThemeName) setNameTheme(normalizedThemeName);
  }, [nameTheme, normalizedThemeName]);
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
    const overridesByTheme = THEME_STINGER_KEY_OVERRIDES[canonicalThemeName]
      || THEME_STINGER_KEY_OVERRIDES[toCanonicalThemeName(canonicalThemeName)]
      || {};
    return overridesByTheme[key] || key;
  };
  const refreshCopy = (keys) => setCopyState((cur) => ({ ...cur, ...Object.fromEntries(keys.map((key) => [key, getLine(themedKey(key))])) }));
  const themedHostStingerLineByRoundTypeId = useMemo(
    () => Object.fromEntries(
      Object.values(ROUND_TYPES).map((roundType) => [
        roundType.id,
        pickThemeHostRoundStinger(canonicalThemeName, roundType.id, roundType.name),
      ])
    ),
    [canonicalThemeName]
  );
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
      setCopyState((cur) => ({
        ...cur,
        hostStinger: pickThemeHostRoundStinger(canonicalThemeName, serverRound.roundTypeId, serverRound.roundTypeName),
      }));
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
      playSfx(IMPOSTER_FOUND_SFX_SRC, { volume: 0.8 });
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
        const syncedRound = await syncOnlineRoundFromSnapshot(result.lobby, { openHostIntro: false });
        if (result?.lobby?.activeRound?.phase === 'liar-reveal') {
          playSfx(IMPOSTER_FOUND_SFX_SRC, { volume: 0.8 });
        }
        return syncedRound;
      }
      const synced = await onlineTransportRef.current?.syncSnapshot();
      if (synced?.activeRound) {
        const syncedRound = await syncOnlineRoundFromSnapshot(synced, { openHostIntro: false });
        if (synced?.activeRound?.phase === 'liar-reveal') {
          playSfx(IMPOSTER_FOUND_SFX_SRC, { volume: 0.8 });
        }
        return syncedRound;
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
    setRound(built);
    setPreviousRoundType(built.roundTypeId);
    setRecentPromptKeys((cur) => [...cur, built.promptKey]);
    setRevealIndex(0);
    setVotesByPlayerId({});
    setOnlinePrivatePrompt(null);
    setOnlinePrivatePromptError('');
    refreshCopy(['passPhone', 'revealNormal', 'revealLiar']);
    setCopyState((cur) => ({
      ...cur,
      hostStinger: pickThemeHostRoundStinger(canonicalThemeName, built.roundTypeId, built.roundTypeName),
    }));
    setScreen('host-intro');
  }
  async function revealResults() {
    if (onlineMode) {
      const syncedRound = await submitOnlineVotes();
      if (syncedRound?.resolution) {
        playSfx(IMPOSTER_FOUND_SFX_SRC, { volume: 0.78 });
      }
      return;
    }
    const resolution = calculateRoundResolutionLocal(players, round, votesByPlayerId);
    setPlayers(resolution.nextPlayers);
    setTally(resolution.tally);
    setRoundGains(resolution.roundGains);
    setRoundBreakdown(resolution.roundBreakdown);
    setImposterCaught(Boolean(resolution.imposterCaught));
    playSfx(IMPOSTER_FOUND_SFX_SRC, { volume: 0.74 });
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
  async function leaveOnlineLobby({ nextScreen = 'intro-video' } = {}) {
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
  function goToHomeScreen() {
    setStored(APP_INTRO_VIDEO_SEEN_KEY, true);
    setScreen('home');
  }
  function restartToHome() {
    setPlayers(createPlayers(3, 'Default')); setLiarCount(1); setNameTheme(normalizeThemeSelection('Default', themeOptions)); setPersonaOnlyMode(false); setMode('classic'); setWinCondition('rounds'); setPointsToWin(15); setRoundsPerPlayer(1); setGrillSettings({ micEnabled: true, ttsEnabled: true }); setRound(null); setRoundNumber(1); setCurrentRoundOwnerIndex(0); setPreviousRoundType(null); setRoundTypeOptions([]); setSelectedRoundType(null); setRevealIndex(0); setVotesByPlayerId({}); setTally({}); setRoundGains({}); setRoundBreakdown({}); setImposterCaught(false); setRecentPromptKeys([]); refreshCopy(['home', 'onlineLobby']);
    setOnlinePhasePending(false);
    setOnlineVoteSubmissionPending(false);
    setOnlinePrivatePrompt(null);
    setOnlinePrivatePromptError('');
    if (onlineMode || lobbyCode) {
      void leaveOnlineLobby({ nextScreen: 'intro-video' });
      return;
    }
    setScreen('intro-video');
  }

  return <>
    {screen === 'intro-video' && <IntroVideoScreen onDone={goToHomeScreen} />}
    {screen === 'home' && <HomeScreen onNavigate={(to) => to === 'setup' ? (refreshCopy(['setup']), setScreen('setup')) : setScreen(to)} homeLine={copyState.home} adultMode={adultMode} />}
    {screen === 'development-progress' && (
      <DevelopmentProgressScreen
        onBack={() => setScreen('intro-video')}
        onlineLobbyLine={copyState.onlineLobby}
        theme={canonicalThemeName}
      />
    )}
    {screen === 'setup' && <SetupScreen players={players} setPlayers={setPlayers} liarCount={liarCount} setLiarCount={setLiarCount} nameTheme={canonicalThemeName} setNameTheme={setNameTheme} mode={mode} setMode={setMode} winCondition={winCondition} setWinCondition={setWinCondition} pointsToWin={pointsToWin} setPointsToWin={setPointsToWin} roundsPerPlayer={roundsPerPlayer} setRoundsPerPlayer={setRoundsPerPlayer} grillSettings={grillSettings} setGrillSettings={setGrillSettings} adultMode={adultMode} enabledCategories={enabledCategories} onToggleCategory={(id) => setEnabledCategories((cur) => ({ ...cur, [id]: !cur[id] }))} premiumEnabled={premiumEnabled} setPremiumEnabled={setPremiumEnabled} categoryCount={activeCategories.length} onOpenAdmin={() => setAdminOpen(true)} onStart={startGame} onBack={() => setScreen('intro-video')} setupLine={copyState.setup} themeOptions={themeOptions} personaOnlyMode={personaOnlyMode} setPersonaOnlyMode={setPersonaOnlyMode} />}
    {screen === 'online-setup' && (
      <OnlineLobbySetupScreen
        hostName={onlineHostName}
        setHostName={setOnlineHostName}
        onBack={() => {
          if (onlineMode || lobbyCode) {
            void leaveOnlineLobby({ nextScreen: 'intro-video' });
            return;
          }
          setScreen('intro-video');
        }}
        onContinue={createOnlineLobby}
        nameTheme={canonicalThemeName}
      />
    )}
    {screen === 'online-join' && (
      <OnlineJoinLobbyScreen
        playerName={onlinePlayerName}
        setPlayerName={setOnlinePlayerName}
        joinCode={joinLobbyCodeInput}
        setJoinCode={setJoinLobbyCodeInput}
        nameTheme={canonicalThemeName}
        onBack={() => {
          if (onlineMode || lobbyCode) {
            void leaveOnlineLobby({ nextScreen: 'intro-video' });
            return;
          }
          setScreen('intro-video');
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
        nameTheme={canonicalThemeName}
      />
    )}
    {screen === 'online-lobby-waiting' && (
      <TopFrame theme={canonicalThemeName}>
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
        theme={canonicalThemeName}
        isOnlineMode={onlineMode}
        totalRounds={totalRounds}
        playerCount={players.length}
        onContinue={() => setScreen('rules')}
      />
    )}
    {screen === 'rules' && <RulesSplashScreen mode={mode} onContinue={() => setScreen('category-choice')} theme={canonicalThemeName} isOnlineMode={onlineMode} />}
    {screen === 'round-type-choice' && round && (
      <TopFrame theme={canonicalThemeName} allowScroll={false}>
        <div className="mx-auto max-w-3xl space-y-6">
          <GlassPanel className="relative overflow-hidden rounded-[2.5rem] border-fuchsia-400/25 bg-black/25 p-8 text-center">
            <h2 className="mt-3 text-4xl font-black text-yellow-300">Choose your game mode</h2>
            <p className="mt-3 text-white/70">Pick one of two options. Previous round type is excluded.</p>
            <div className="mt-8 grid grid-cols-2 gap-4 items-stretch">
              {roundTypeOptions.map((type, index) => {
                const centeredOnSm = roundTypeOptions.length % 2 === 1 && index === roundTypeOptions.length - 1;
                const isGrillRoundType = type.id === 'grill';
                return (
                  <div key={type.id} className={centeredOnSm ? 'sm:col-span-2 sm:flex sm:justify-center' : ''}>
                    <button
                      type="button"
                      className={`relative h-full min-h-[20rem] w-full rounded-[1.8rem] border border-white/20 bg-black/20 p-4 text-center transition-transform duration-200 hover:scale-[1.01] hover:border-cyan-300/40 ${centeredOnSm ? 'sm:max-w-[20rem]' : ''}`}
                      onClick={() => {
                        setSelectedRoundType(type.id);
                        setScreen('category-choice');
                      }}
                    >
                      {isGrillRoundType && (
                        <>
                          <Badge className="absolute -top-3 right-6 rounded-full border-2 border-red-300/40 bg-red-500/10 px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.1em] text-white">
                            With Special Guest Host
                          </Badge>
                          <div className="absolute -top-1.5 left-4 text-sm font-semibold text-yellow-200 drop-shadow-[0_0_8px_rgba(251,146,60,0.75)]">
                            {pickThemeGuestHostName(canonicalThemeName, type.id)}
                          </div>
                        </>
                      )}
                      <ThemeArt
                        src="/assets/themes/default/cards/prompt-back.png"
                        alt={`${type.name} round card back`}
                        className="mx-auto h-40 w-auto rounded-[1.2rem] border border-white/20 bg-black/25 p-1"
                      />
                      <div className="mt-4 text-xl sm:text-2xl font-black uppercase tracking-[0.05em] text-white leading-tight min-h-[3.2rem] flex items-center justify-center">
                        {type.name}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>
      </TopFrame>
    )}
    {screen === 'category-choice' && round && (
      <TopFrame theme={canonicalThemeName}>
        <div className="mx-auto max-w-3xl space-y-6">
          <GlassPanel className="relative overflow-hidden rounded-[2.5rem] border-fuchsia-400/25 bg-black/25 p-8 text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">Round owner: {players[currentRoundOwnerIndex]?.name}</div>
            <h2 className="mt-3 text-4xl font-black text-yellow-300">Choose the next category</h2>
            <p className="mt-3 text-white/70">{copyState.chooser}</p>
            <div className="mt-8 grid grid-cols-2 gap-4 items-stretch">
              {categoryOptions.map((category) => {
                const categoryCardArtSrc = resolveCategoryChoiceCardArt(category, canonicalThemeName);
                return (
                  <div key={category.id} className="flex">
                    <button
                      type="button"
                      className="flex h-full w-full flex-col rounded-[1.8rem] border border-white/20 bg-black/20 p-4 text-center transition-transform duration-200 hover:scale-[1.01] hover:border-cyan-300/40"
                      onClick={() => chooseCategory(category.id)}
                    >
                      <ThemeArt
                        src={categoryCardArtSrc}
                        alt={`${category.name} category card`}
                        className="mx-auto h-40 w-auto rounded-[1.2rem] border border-white/20 bg-black/25 p-1"
                      />
                      <div className="mt-4 text-lg sm:text-xl font-black uppercase tracking-[0.04em] text-white leading-tight min-h-[2.6rem] flex items-center justify-center">
                        {category.name}
                      </div>
                    </button>
                  </div>
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
        theme={canonicalThemeName}
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
        theme={canonicalThemeName}
        onlineMode={onlineMode}
        localPlayerName={onlinePlayerName}
        onlinePrivatePrompt={onlinePrivatePrompt}
        onlinePrivatePromptError={onlinePrivatePromptError}
        playSfx={playSfx}
      />
    )}
    {screen === 'grill' && round && (
      <GrillEmScreen
        players={players}
        round={round}
        totalRounds={totalRounds}
        onContinue={(grillData) => {
          setRound((cur) => applyGrillRoundDataToRound({ ...cur, grillData }, grillData, players));
          setVotesByPlayerId(Object.fromEntries(players.map((p) => [p.id, ''])));
          if (onlineMode) {
            void runOnlinePhaseAdvance();
            return;
          }
          refreshCopy(['voting']);
          setScreen('voting');
        }}
        theme={canonicalThemeName}
        playSfx={playSfx}
        onByteBlitzCue={(cue) => {
          const cueType = String(cue?.cueType || '').trim();
          const cueAsset = BYTEBLITZ_CUE_MEDIA[cueType];
          if (cueAsset?.videoSrc) {
            // Keep the media path "hot" in runtime so missing asset failures surface early.
            const preloadVideo = document.createElement('video');
            preloadVideo.preload = 'metadata';
            preloadVideo.src = cueAsset.videoSrc;
          }
          if (cueAsset?.sfxSrc) {
            playSfx(cueAsset.sfxSrc, { volume: 0.62 });
          }
        }}
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
        theme={canonicalThemeName}
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
        theme={canonicalThemeName}
        onlineMode={onlineMode}
        onlinePlayerId={onlineJoinedPlayerId}
        onlineVoiceEnabled={onlineMode}
        onlineVoiceMuted={onlineVoiceMuted}
        setOnlineVoiceMuted={setOnlineVoiceMuted}
        canTalk={onlineVoiceEnabled}
        submitPending={onlineVoteSubmissionPending}
        playSfx={playSfx}
      />
    )}
    {screen === 'liar-reveal' && round && <LiarRevealScreen players={players} round={round} onComplete={finishLiarReveal} theme={canonicalThemeName} playSfx={playSfx} />}
    {screen === 'results' && round && <ResultsScreen players={players} round={round} totalRounds={totalRounds} tally={tally} roundGains={roundGains} roundBreakdown={roundBreakdown} imposterCaught={imposterCaught} onNextRound={winCondition === 'rounds' && round.roundNumber >= totalRounds ? endGame : nextRound} onEndGame={endGame} resultLine={copyState.result} theme={canonicalThemeName} />}
    {screen === 'final' && <FinalScreen players={players} onRestart={restartToHome} line={copyState.winner} theme={canonicalThemeName} />}
    {screen === 'store' && (
      <StoreScreen
        onBack={() => setScreen('intro-video')}
        theme={canonicalThemeName}
        dlcThemePacks={DLC_THEME_PACKS}
        unlockedThemePackIds={unlockedThemePackIds}
        onUnlockThemePack={(packId) => setUnlockedThemePackIds((current) => unlockThemePackIds(current, packId))}
        onRedeemThemeCode={(rawCode) => {
          const redemption = redeemThemePackIds(unlockedThemePackIds, rawCode);
          if (redemption.status === 'unlocked') {
            setUnlockedThemePackIds(redemption.nextPackIds);
          }
          return redemption;
        }}
      />
    )}
    {screen === 'settings' && (
      <SettingsScreen
        onBack={() => setScreen('intro-video')}
        premiumEnabled={premiumEnabled}
        setPremiumEnabled={setPremiumEnabled}
        adultMode={adultMode}
        setAdultMode={setAdultMode}
        audioSettings={audioSettings}
        setAudioSettings={setAudioSettings}
        theme={canonicalThemeName}
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
    <BgmController screen={screen} audioSettings={audioSettings} />
    <AdminDialog open={adminOpen} onOpenChange={setAdminOpen} premiumEnabled={premiumEnabled} customCategories={customCategories} setCustomCategories={setCustomCategories} />
  </>;
}
