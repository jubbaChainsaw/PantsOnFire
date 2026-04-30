import { Room, RoomEvent } from 'livekit-client';

const RAW_LOBBY_SERVER_URL = String(import.meta?.env?.VITE_LOBBY_SERVER_URL || '').trim();
const RAILWAY_API_FALLBACK = 'https://api.pantsonfire.app';
const RUNTIME_HOSTNAME = typeof window !== 'undefined' ? String(window.location?.hostname || '').toLowerCase() : '';
const IS_LOCAL_WEB_HOST = RUNTIME_HOSTNAME === 'localhost' || RUNTIME_HOSTNAME === '127.0.0.1';
const FALLBACK_LOBBY_SERVER_URL = IS_LOCAL_WEB_HOST ? '' : RAILWAY_API_FALLBACK;
const LOBBY_SERVER_URL = RAW_LOBBY_SERVER_URL || FALLBACK_LOBBY_SERVER_URL;
const LOBBY_API_BASE = LOBBY_SERVER_URL
  ? `${LOBBY_SERVER_URL.replace(/\/$/, '')}/api`
  : '/api';

function normalizeCode(rawCode = '') {
  return String(rawCode || '').trim().toUpperCase();
}

async function requestJson(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${LOBBY_API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok) {
    const code = payload?.error || 'request-failed';
    const error = new Error(code);
    error.code = code;
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export async function createVoicePartyTransport({
  lobbyCode,
  playerId,
  sessionToken,
  onEvent = () => {},
} = {}) {
  const normalizedCode = normalizeCode(lobbyCode);
  const normalizedPlayerId = String(playerId || '').trim();
  const normalizedSessionToken = String(sessionToken || '').trim();
  if (!normalizedCode) throw new Error('lobby-code-required');
  if (!normalizedPlayerId) throw new Error('player-id-required');
  if (!normalizedSessionToken) throw new Error('session-token-required');

  const voicePayload = await requestJson(`/lobbies/${encodeURIComponent(normalizedCode)}/voice/token`, {
    method: 'POST',
    body: {
      playerId: normalizedPlayerId,
      sessionToken: normalizedSessionToken,
    },
  });
  const livekitUrl = String(voicePayload?.url || '').trim();
  const token = String(voicePayload?.token || '').trim();
  const roomName = String(voicePayload?.roomName || '').trim();
  if (!livekitUrl || !token || !roomName) {
    const error = new Error('voice-token-invalid');
    error.code = 'voice-token-invalid';
    throw error;
  }

  const room = new Room({ adaptiveStream: true, dynacast: true });
  let closed = false;
  let speakingSampleRaf = null;
  let localAnalyser = null;
  let localDataArray = null;
  let localMediaSource = null;
  let localAudioContext = null;
  let lastSpeakingState = false;
  let speakingBroadcastAt = 0;

  room.on(RoomEvent.Connected, () => {
    if (closed) return;
    onEvent({ type: 'connected', roomName });
  });
  room.on(RoomEvent.Reconnecting, () => {
    if (closed) return;
    onEvent({ type: 'reconnecting', roomName });
  });
  room.on(RoomEvent.Reconnected, () => {
    if (closed) return;
    onEvent({ type: 'reconnected', roomName });
  });
  room.on(RoomEvent.Disconnected, (reason) => {
    if (closed) return;
    onEvent({ type: 'disconnected', reason, roomName });
  });
  room.on(RoomEvent.MediaDevicesError, (error) => {
    if (closed) return;
    onEvent({ type: 'media-devices-error', error, roomName });
  });
  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    if (closed || !track) return;
    const isAudioTrack = String(publication?.kind || track?.kind || '').toLowerCase() === 'audio';
    if (!isAudioTrack || typeof track.attach !== 'function') return;
    try {
      const element = track.attach();
      if (element) {
        element.autoplay = true;
        element.muted = false;
        element.playsInline = true;
      }
    } catch {}
    onEvent({
      type: 'remote-audio-subscribed',
      participantId: String(participant?.identity || ''),
      roomName,
    });
  });
  room.on(RoomEvent.TrackUnsubscribed, (track) => {
    if (!track || typeof track.detach !== 'function') return;
    try {
      const elements = track.detach();
      if (Array.isArray(elements)) {
        elements.forEach((element) => {
          try {
            element?.remove?.();
          } catch {}
        });
      } else {
        elements?.remove?.();
      }
    } catch {}
  });

  await room.connect(livekitUrl, token);
  await room.localParticipant.setMicrophoneEnabled(true);

  const startSpeakingSampler = () => {
    const localPublication = room.localParticipant.getTrackPublication('microphone');
    const mediaStreamTrack = localPublication?.track?.mediaStreamTrack;
    if (!mediaStreamTrack || typeof window === 'undefined') return;
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    try {
      localAudioContext = new AudioContextCtor();
      const mediaStream = new MediaStream([mediaStreamTrack]);
      localMediaSource = localAudioContext.createMediaStreamSource(mediaStream);
      localAnalyser = localAudioContext.createAnalyser();
      localAnalyser.fftSize = 1024;
      localDataArray = new Uint8Array(localAnalyser.frequencyBinCount);
      localMediaSource.connect(localAnalyser);
      const sampleLoop = () => {
        if (closed || !localAnalyser || !localDataArray) return;
        localAnalyser.getByteFrequencyData(localDataArray);
        let sum = 0;
        for (let i = 0; i < localDataArray.length; i += 1) {
          sum += localDataArray[i];
        }
        const avg = sum / Math.max(1, localDataArray.length);
        const speakingNow = avg >= 16;
        const nowMs = Date.now();
        if (speakingNow !== lastSpeakingState || (speakingNow && nowMs - speakingBroadcastAt > 1000)) {
          lastSpeakingState = speakingNow;
          speakingBroadcastAt = nowMs;
          onEvent({ type: 'local-speaking', isTalking: speakingNow, roomName });
        }
        speakingSampleRaf = window.requestAnimationFrame(sampleLoop);
      };
      speakingSampleRaf = window.requestAnimationFrame(sampleLoop);
    } catch {}
  };
  startSpeakingSampler();

  return {
    async setMuted(nextMuted = false) {
      if (closed) return;
      await room.localParticipant.setMicrophoneEnabled(!Boolean(nextMuted));
      if (Boolean(nextMuted)) {
        lastSpeakingState = false;
        onEvent({ type: 'local-speaking', isTalking: false, roomName });
      }
    },
    async disconnect() {
      if (closed) return;
      closed = true;
      if (typeof window !== 'undefined' && speakingSampleRaf) {
        window.cancelAnimationFrame(speakingSampleRaf);
      }
      speakingSampleRaf = null;
      try {
        localMediaSource?.disconnect();
      } catch {}
      try {
        localAnalyser?.disconnect();
      } catch {}
      localMediaSource = null;
      localAnalyser = null;
      localDataArray = null;
      try {
        await localAudioContext?.close();
      } catch {}
      localAudioContext = null;
      try {
        room.remoteParticipants.forEach((participant) => {
          participant.trackPublications.forEach((publication) => {
            const subscribedTrack = publication.track;
            if (subscribedTrack && typeof subscribedTrack.detach === 'function') {
              try {
                const detached = subscribedTrack.detach();
                if (Array.isArray(detached)) detached.forEach((element) => element?.remove?.());
              } catch {}
            }
          });
        });
      } catch {}
      room.disconnect();
    },
  };
}
