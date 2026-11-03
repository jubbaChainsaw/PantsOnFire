# Downloadable content packs (mobile)

The slim Android APK ships **Default** theme assets only. Optional **theme packs** download on demand and are stored under the app’s private files directory (`pof-content-packs/`). The WebView loads them via `https://appassets.androidplatform.net/dlc/<packId>/assets/...`.

## Manifest & hosting

- Source manifest: `public/content-packs/manifest.json`
- Build zips + refresh manifest: `npm run content-packs:build`
- Artifacts: `content-packs/dist/*.zip` (upload to a GitHub Release; default `baseUrl` targets `content-packs-v1`)

Override hosting without code changes:

```bash
POF_CONTENT_PACK_BASE_URL=https://your-cdn.example/packs/ npm run content-packs:build
```

Or set `VITE_CONTENT_PACK_MANIFEST_URL` when building the web bundle.

Each pack entry includes `version`, `sizeBytes`, `sha256`, and `file`. Paid DLC packs use `tier: "paid"` and `entitlementPackId` matching `src/data/themeCatalog.js`.

## App behaviour

- First visit to **Home** (if packs are missing and the user has not tapped **Later**) shows the neon download prompt.
- **Settings → Downloads** lists packs, progress, retry, and delete.
- Native shell (`App.js`) handles `POF_CONTENT_PACK_*` messages and uses `expo-file-system` + `fflate` to download, verify, and unzip.

## Testing

### Unit tests

```bash
npm test
```

### Playwright (prompt UI)

```bash
npm run build
npx playwright test tests/e2e/playwright/content-pack-prompt.spec.js
```

Force the prompt in any build: `/?pofForceContentPackPrompt=1`

### On-device (APK)

1. Upload `content-packs/dist/*.zip` to the GitHub release matching `manifest.json` `baseUrl`.
2. `npm run android:apk` and install the APK.
3. Clear app data, launch, open **Home** — confirm prompt, download, then pick a non-Default theme and verify host/persona art loads without 404s.
4. **Settings → Downloads** — delete a pack and confirm the game falls back to Default art for that theme.
