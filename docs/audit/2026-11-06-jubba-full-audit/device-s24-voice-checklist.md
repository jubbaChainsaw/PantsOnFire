# S24+ multi-device voice / mic checklist (manual)

**Status:** device-blocked in automation — requires physical hardware and (optional) LiveKit project.  
**Not proven by CI.**

## Preconditions

- Two or more Android devices on same network; one hosts online lobby.
- Lobby server reachable (dev: `npm run lobby:server` on `8787`).
- Optional: `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` set on server for real tokens (never commit).

## Pass criteria

1. **Lobby join:** all devices join with distinct names; ready-up syncs.
2. **Mic permission:** first time entering voice-active phase (e.g. one-word), browser/app prompts for microphone; denying shows non-crashing degraded UI (muted / blocked strip).
3. **Token path (if LiveKit configured):** `POST /api/lobbies/:code/voice/token` returns 200 with `token`, `url`, `roomName`; 503 when not configured is acceptable for local-only runs.
4. **Turn-taking:** only current speaker’s client should show “can talk” affordance when voice UI is visible.
5. **Reconnect:** force-kill app on one device; resume with session token; no duplicate ghost players within grace period.

## Failure notes

- Capture logcat / browser console + screenshot for JubbaWorld tracker.
