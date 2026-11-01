# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Pants on Fire: Find the Liar — a React + Vite party/social-deduction game with an Express/Socket.IO lobby server for online multiplayer. See `README.md` for full details.

### Running services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Vite dev server (frontend) | `npm run dev` | 5173 | Hot-reloads; proxies `/api` and `/socket.io` to lobby server |
| Lobby server (backend) | `npm run lobby:server` | 8787 | In-memory store by default; no Redis required for local dev |

### Key commands

- **Install deps:** `npm install`
- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lobby server:** `npm run lobby:server`
- **Preview prod build:** `npm run preview`

### Caveats

- The Vite proxy config (`vite.config.js`) forwards `/api` and `/socket.io` to `localhost:8787`. Start the lobby server first if testing online multiplayer features.
- **Tests:** `npm run test:server` (Node `node --test` in `tests/server/`). Full tree: `npm test`. Optional: `npm run lint:undef` (eslint), Playwright `npm run test:e2e` / `npm run test:mobile-dist-smoke` (not run on every CI workflow).
- **CI:** `.github/workflows/` — Android debug APK, release AAB, IONOS web deploy (`deploy-ionos-web.yml`), `media-validation.yml`. Workflows do not currently run `npm test` on every push; run tests locally before release.
- Redis, LiveKit, Postgres, and Expo are optional — needed for durable lobbies, voice, cloud entitlements, and the mobile shell.
- The `sharp` native module is a dependency; `npm install` handles it automatically on supported platforms.
