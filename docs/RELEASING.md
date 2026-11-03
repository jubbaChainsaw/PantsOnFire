# Releasing Pants on Fire (mobile)

The Android app is an **Expo** shell (`App.js`) with a **bundled Vite web build** (`npm run build:mobile` → `android/app/src/main/assets/pof-web`). Online play uses the lobby server; bug reports POST to `/api/bug-reports` on that server (or `VITE_BUG_REPORT_API_URL` in the web build).

## Architecture choice (Expo + WebView, not Capacitor)

We use **Expo EAS Update** for the **native/React Native layer** (shell, plugins, embedded asset packaging). The in-game UI is HTML/JS inside a WebView. **Standard EAS Update does not replace the `pof-web` folder inside the APK** unless you ship a new store binary or load the game from a remote URL (`EXPO_PUBLIC_GAME_URL`). Document this when planning hotfixes:

| Change type | Delivery |
|-------------|----------|
| Native shell, permissions, WebView flags | New Play build + optional EAS Update for RN bundle |
| Game UI (`src/`, prompts, neon CSS) in bundled mode | New Play build **or** host web at a URL and point production builds to it |
| Lobby server / bug API | Deploy `npm run lobby:server` (e.g. Render) |

Capacitor Live Updates could push web assets similarly; we stayed on Expo because the project already uses Expo prebuild, RevenueCat, and `expo-file-system` for content packs.

## Prerequisites

- Node 20+, `npm install`
- [EAS CLI](https://docs.expo.dev/build/setup/): `npm i -g eas-cli` and `eas login`
- Run once in repo root: `eas init` (links `extra.eas.projectId` in `app.json`)

## Runtime version & channels

- **Policy:** `runtimeVersion` uses **`appVersion`** (see `app.json`) — bump `expo.version` when native or bundled-web compatibility changes.
- **Channels:** `preview` (internal APK) and `production` (Play AAB), defined in `eas.json`.

## Over-the-air (EAS Update)

1. Build a binary with a channel, e.g. `eas build --profile production --platform android`.
2. Publish JS/asset updates to that channel:

```bash
eas update --channel production --message "Describe the change"
```

3. On launch, the shell checks for updates (`expo-updates` in `App.js`). If fetch fails or no network, the app **continues with the embedded bundle** (graceful fallback).

Preview channel:

```bash
eas update --channel preview --message "QA build"
```

## Local release binaries

### Debug / CI APK (bundled web)

```bash
npm run android:apk
```

Output: `android/app/build/outputs/apk/release/app-release.apk` (or project root copy if scripted).

### Release AAB (Play Store)

```bash
npm run android:aab
```

Output: `android/app/build/outputs/bundle/release/app-release.aab` and `pants-on-fire-release.aab` at repo root when the script succeeds.

**Versioning:** Edit `app.json`:

- `expo.version` → `versionName`
- `expo.android.versionCode` → increment integer every Play upload

`scripts/bump-android-version.cjs` syncs these into Gradle during `android:apk` / `android:aab`.

### Upload keystore (never commit)

Generate (Martin or CI secret store):

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore upload-keystore.pks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

Set env before `android:aab` / EAS build secrets:

| Variable | Purpose |
|----------|---------|
| `POF_ANDROID_KEYSTORE_PATH` | Path to `.pks` / `.jks` |
| `POF_ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `POF_ANDROID_KEY_ALIAS` | Key alias |
| `POF_ANDROID_KEY_PASSWORD` | Key password |

Without these, local `bundleRelease` uses the **debug keystore** (fine for artifacts attached to GitHub releases, **not** for Play).

EAS: configure the same credentials under **Project → Android → Keystore** in the Expo dashboard.

## What Martin must supply

1. **Upload keystore** (or use Play App Signing and provide the upload key Expo/EAS should use).
2. **Google Play Console** app created (or approval to create) for package **`app.pantsonfire.liar`**.
3. **Package name confirmation** — must remain `app.pantsonfire.liar` unless migrating with Play support.
4. **Privacy policy URL** — required for Play listing and often for account/data safety forms.
5. **Expo account / EAS project** — run `eas init`, add billing if needed for cloud builds.
6. **Bug report email (optional):** `BUG_REPORT_EMAIL_TO` on the lobby server for notification stubs.

## Bug reports

- In-app: Settings → **Report a bug**, or in-game **Pause → Report a bug**.
- API: `POST /api/bug-reports` (JSON body with `description`, optional `screenshotDataUrl`, `context`, `diagnostics`).
- Reports stored under `data/bug-reports/` on the server (override dir with `POF_BUG_REPORTS_DIR`).
- Web build can point to production API: `VITE_BUG_REPORT_API_URL=https://your-lobby-host`.

## Deploy lobby server (Render example)

- Build: `npm install`
- Start: `npm run lobby:server`
- Bind: `0.0.0.0:$PORT`
- Env: `LOBBY_CLIENT_ORIGINS`, optional Redis, `BUG_REPORT_EMAIL_TO`

## Checklist before Play submission

- [ ] Bump `version` + `android.versionCode` in `app.json`
- [ ] `npm test` and `npm run build`
- [ ] `npm run android:aab` with release keystore
- [ ] Smoke-test APK/AAB on 360×780 device
- [ ] `eas update` only if runtime-compatible and scope is RN shell-only
