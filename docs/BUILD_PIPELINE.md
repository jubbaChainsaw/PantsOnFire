# Build Pipeline

## What runs today (CI)

GitHub Actions workflows in `.github/workflows/`:

| Workflow | Trigger | What it does |
|----------|---------|----------------|
| `android-debug-apk.yml` | `workflow_dispatch`, push to feature branch via `.github/trigger-android-debug-apk` | `npm run build`, bundle web into APK, assemble debug |
| `android-release-aab.yml` | same pattern with `trigger-android-release-aab` | Release AAB with signing secrets |
| `deploy-ionos-web.yml` | push to `main` / branch + `trigger-ionos-web-deploy`, or manual | `npm run build`, SFTP upload `dist/` to IONOS |
| `media-validation.yml` | (media paths) | Video/asset validation scripts |

**Not in CI today:** `npm test`, `npm run lint:undef`, iOS builds, automatic lobby-server deploy (Railway deploys from its own GitHub link).

Run locally before release:

```bash
npm run test:server
npm run build
npm run lint:undef   # optional eslint pass on src/
```

## Frontend

- React + Vite → `dist/` (web) or embedded in Android shell via `npm run mobile:build-bundled-web`

## Mobile

- Expo wrapper (`App.js`) + Android Gradle project under `android/`
- Debug APK / release AAB via workflows above
- iOS: Expo-capable but no automated iOS CI job in this repo

## Backend

- Express + Socket.IO lobby server (`npm run lobby:server` / `npm start`)
- Optional Redis (`REDIS_URL` / `LOBBY_REDIS_URL`), Postgres (`DATABASE_URL`), LiveKit

## Aspirational release checklist

When preparing a store or production cut, manually verify:

1. Server tests pass (`npm run test:server`).
2. Web production build (`npm run build`).
3. Asset/media validation if themes or video changed.
4. Android packages if shipping mobile.
5. RevenueCat / Stripe / Supabase env on Railway and static host.
6. Lobby server healthy at `/health` on production API origin.

See `docs/ionos-web-deploy.md`, `docs/railway-deploy.md`, and `artifacts/play-launch-catalog.md`.
