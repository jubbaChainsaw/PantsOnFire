# End-to-end and integration tests

## Commands

| Command | Scope |
|---------|--------|
| `npm test` | All `tests/**/*.test.mjs` including `tests/e2e/*.test.mjs` |
| `npm run test:e2e` | Playwright UI smoke tests (requires build) |
| `npm run test:server` | Lobby store unit tests |

## Coverage

- **turn-draw.test.mjs**: Two round types, six categories, no Grill in draws.
- **persona-unique.test.mjs**: No duplicate persona names when exclusions apply.
- **lobby-api.test.mjs**: REST create/join; `hostPromptEditorUnlocked` in lobby settings.
- **lobby-socket.test.mjs**: Socket.IO `lobby:snapshot` after subscribe.
- **tier-gating.test.mjs**: Tier entitlements matrix (Fibber → Host).
- **draw-stress.test.mjs**: 100 random turn draws.
- **playwright/**: Neon home, setup navigation, Fibber gating, settings entry.

## Gaps (not yet automated)

- Full pass-the-phone playthrough through voting and final screen (needs stable `data-testid` hooks).
- LiveKit voice and Supabase auth flows.
- RevenueCat purchase flows in the native shell.
- All round types and win-condition matrix (3–12 players) — partial logic covered by unit draws only.
- Android APK WebView smoke (manual sideload).
