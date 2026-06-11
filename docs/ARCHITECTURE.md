# Pants On Fire Architecture

## Current Architecture

Pants On Fire is structured as a React + Vite web game with an Expo mobile wrapper and an Express/Socket.IO online lobby server.

The current architecture supports:

- Local pass-the-phone gameplay.
- Online lobby play.
- Theme and DLC content.
- Host/persona systems.
- RevenueCat/native purchase bridging.
- Supabase-backed entitlement checks.
- LiveKit voice-party support.

## Main Layers

### Web Game Client

Location: `src/`

Responsibilities:

- Home screen.
- Lobby setup.
- Local pass-the-phone flow.
- Round selection.
- Player reveal screens.
- Voting.
- Scoring.
- Store/DLC UI.
- Theme and host presentation.
- Online lobby client transport.

The current `src/App.jsx` imports and orchestrates a large amount of behaviour, including game state, account/session logic, themes, DLC, online transport, voice transport, assets, audio, and round flows. This is a priority area for gradual refactoring.

### Data Layer

Location: `src/data/`

Responsibilities:

- Categories.
- Round types.
- Theme metadata.
- Theme assets.
- Name pools.
- Host voice mappings.
- Persona callouts.
- Picture DLC manifests.
- UI assets.

This layer is a strength of the project. New content should continue to be added through data files and manifests rather than hardcoded into screens.

### Account and Entitlements

Location: `src/account/`, `src/auth/`, `server/entitlementsRoutes.js`

Responsibilities:

- Account session storage.
- Entitlement calculation.
- Remote entitlement fetching.
- Tier and add-on modelling.
- RevenueCat webhook mapping.
- Supabase token validation.

Security principle: client entitlement state should be treated as display-only. Server-side validation should be the source of truth for online or paid-gated features.

### Billing Bridge

Location: `App.js`, `src/billing/`

Responsibilities:

- Native RevenueCat configuration.
- WebView-to-native purchase messages.
- Purchase sync.
- User identity forwarding.

The Expo wrapper currently hosts the web game and configures RevenueCat using platform-specific environment variables.

### Online Lobby Server

Location: `server/`

Responsibilities:

- Express HTTP server.
- Socket.IO realtime lobby events.
- Lobby creation.
- Lobby joining.
- Session recovery.
- Ready state.
- Round phase advancement.
- Vote submission.
- Private round reads.
- Disconnect grace handling.
- LiveKit voice token support.

Security principle: private round data, lobby authority, phase changes, votes, and host-only actions should be validated server-side.

### Lobby Storage

Location: `server/storage/`

Responsibilities:

- In-memory lobby store for local/dev use.
- Redis lobby store for deployable shared-state use.
- Lobby code generation.
- Player sanitisation.
- Settings sanitisation.
- Server-side prompt and scoring logic.

Production should use Redis or another durable/shared store. In-memory storage is appropriate for development and single-process testing only.

### Voice Party Layer

Location: LiveKit support in `server/lobbyServer.js` and client voice transport.

Responsibilities:

- LiveKit room naming.
- LiveKit token generation.
- Optional voice rooms per lobby.

Security principle: voice tokens must be short-lived and tied to validated lobby/player sessions.

### Tooling Scripts

Location: `scripts/`, `tools/`

Responsibilities:

- DLC pack creation.
- Picture manifest linting and syncing.
- Royalty-free picture importing.
- Persona/avatar generation.
- Host voice export and generation.
- Media validation.

Scripts that use external APIs must keep keys out of source control and keep attribution/audit files where required.

## Recommended Future Structure

A safer long-term structure would split the frontend into feature modules:

```text
src/
  features/
    lobby/
    rounds/
    voting/
    scoring/
    host/
    themes/
    dlc/
    account/
    online/
    store/
  services/
    lobbyService.js
    entitlementService.js
    voiceService.js
    purchaseService.js
    mediaService.js
  state/
    gameState.js
    lobbyState.js
    playerState.js
  data/
    ...existing data files
```

## Refactoring Priorities

1. Extract lobby setup and player management from `App.jsx`.
2. Extract round flow state machine.
3. Extract voting and scoring logic.
4. Extract host/audio/media playback logic.
5. Extract entitlement/store logic.
6. Extract online lobby client hooks.
7. Add tests around each extracted module.

## Architecture Rules

- Keep pass-the-phone gameplay working at all times.
- Do not rewrite the whole app at once.
- Use incremental feature extraction.
- Keep content data-driven.
- Keep server authority for online game state.
- Treat client state as untrusted for online and purchase-gated flows.
- Keep secrets server-side or native-only as appropriate.
