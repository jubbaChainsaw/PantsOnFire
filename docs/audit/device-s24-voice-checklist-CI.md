# S24+ voice checklist — CI coverage (2026-11-06)

The manual steps in [device-s24-voice-checklist.md](./2026-11-06-jubba-full-audit/device-s24-voice-checklist.md) still require **physical devices** (mic, LiveKit, install path).

**Automated on this branch (latest head):**

- `npm test` — unit/integration including persona handoff asset count (950 MP3s).
- `npm run build` — production bundle.
- `npm run lint:undef` — ESLint undefined.
- `npm run test:e2e` — Playwright (online flow, web join-only, neon store smoke).

**Still device-only:** items 1–5 in the S24 checklist (party mic, token 503 vs 200, turn-taking UX, reconnect).
