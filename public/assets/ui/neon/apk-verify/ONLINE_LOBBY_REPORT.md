# Online lobby investigation (2026-10-27)

## Deployment (APK / production client)

| Item | Value |
|------|--------|
| Lobby HTTP + Socket origin | `https://api.pantsonfire.app` |
| Client resolver | `src/lib/lobbyApiEnv.js` (`VITE_LOBBY_SERVER_URL` or `DEFAULT_PUBLIC_LOBBY_FALLBACK`) |
| Health | `GET https://api.pantsonfire.app/health` |

Railway service is configured via `railway.toml` in this repo. Redis-backed lobby store and LiveKit voice are enabled in production.

## E2E result (two Playwright clients)

See `online-lobby-investigation.json` for the latest automated run metadata.

**Verdict: partially works**

- **Works:** Create lobby on production API, share code, second client joins, host sees guest in player list, ready toggles.
- **Blocked for stock WebView without CORS:** Browser `fetch` from `http://127.0.0.1` origins may be rejected unless `LOBBY_CLIENT_ORIGINS` includes the exact web origin. Android WebView (`https://appassets.androidplatform.net`) must be listed for the APK to call the API without a proxy.
- **Not completed in two-player run:** **Start match** requires **3** ready players (`MIN_PLAYERS = 3` in `App.jsx`). Two clients alone cannot start a full round.
- **Voice:** Guest may show LiveKit connect errors when tokens/permissions or mic policy fail; clue phases still work without voice.

## Go-live checklist

1. Set `LOBBY_CLIENT_ORIGINS` on Railway to production web + `https://appassets.androidplatform.net` (and any staging origins).
2. Run a **three-client** ready + start test, then one full round (category → prompts → vote).
3. Confirm LiveKit credentials and mobile mic permissions for voice party chat.
4. Monitor `/health` and lobby error rates after release.

Screenshots: `online-lobby-host-390x844.png`, `online-lobby-guest-390x844.png`.
