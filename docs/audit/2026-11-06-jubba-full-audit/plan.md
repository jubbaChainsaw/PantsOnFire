# Plan: Jubba full requirements vs implementation audit

## 0. Preconditions (honest)

- **Superpowers** skill files (`using-superpowers/writing-plans`, etc.) are **not present** in this repo or the installed Cursor skills path; workflow below follows the *intent* of plan-first + verification, without claiming a missing skill executed.
- **No production mutation**, no real-money flows, no Play/deploy/release in this audit.

## 1. Baseline inputs

1. **Sanitized JubbaWorld inventory** (user-provided) — **pending**.  
2. Repo **requirements**: `README.md`, `docs/PRODUCT_REQUIREMENTS.md`, `docs/LOBBY_ARCHITECTURE.md`, `docs/ONLINE_SECURITY_MODEL.md`, `docs/ACCOUNT_AND_ENTITLEMENTS.md`, `docs/BUILD_PIPELINE.md`, security/playtest docs, store docs.  
3. **Implementation map**: critical paths in `src/App.jsx`, `server/`, billing bridges, `tests/`, `.github/workflows/`.

## 2. Coverage dimensions (checklist)

For each dimension, record: **requirement quote → code path → automated test (if any) → manual/unverified**.

- Game loop (local + online): setup → rules → round type/category → reveal → discussion → voting → results → winner/next round.  
- **All round types** in `src/data/roundTypes.js` vs README canonical list; online-only vs pass-the-phone.  
- **Scoring / win rules / randomization / prompts** (server vs client; seeding).  
- **Pass-phone privacy** (snapshot redaction, phase gating).  
- **Online**: lobbies, reconnect, host-only phase advance, rate limits, JWT/session.  
- **One-word**: mic / text fallback, turn enforcement, transition to discussion, default voice.  
- **Moderation / compliance**: report, block, account deletion, 13+ / 18+ gating.  
- **Entitlements**: RevenueCat mapping, Stripe **sandbox** paths, web vs native (no live keys).  
- **Game source**: bundled vs newest live / cache / debug (`tests/nativeShell/gameSourceSelection.test.mjs`, env flags).  
- **Android**: packaging workflow, offline, security model docs vs code.  
- **UI**: safe areas, fonts, assets, audio, **a11y** (screen reader, contrast — largely unautomated).  
- **CI / test quality**: what runs where; doc drift (`docs/TEST_STRATEGY.md` vs current workflows).

## 3. Traceability matrix rules

- One row per **tracker ID** from JubbaWorld inventory (after merge).  
- **Status**: pass | partial | missing | untested | blocked | deferred.  
- **Confidence**: low / medium / high.  
- **Evidence**: file paths + test name + command, or “none — manual only”.  
- **No automatic “Done”** from code presence without test or explicit acceptance match.

## 4. Verification commands (non-exhaustive)

Already exercised this session where noted in `STATUS.md`. Planned extensions:

- `npm test`, `npm run test:server`  
- `npm run test:e2e` (requires time + browsers; label as **local exercised** when run)  
- `npm run test:mobile-dist-smoke` (bundled dist)  
- Grep/architecture passes for security-sensitive routes

## 5. Outputs

- Deduplicated **proposed** work-task JSON (`external_ref`, problem, expected/actual, repro, priority, acceptance, verification plan).  
- Prefer **linking** existing JubbaWorld IDs over inventing duplicates.  
- Pending human decisions (e.g. PR #112 Android workflow) stay **pending** with explicit label.

## 6. Exit criteria

Audit is **complete** only when:

1. Full inventory received and **every** item (including Done/deferred) mapped.  
2. Matrix + findings + proposed tasks reviewed for duplicates.  
3. User explicitly accepts or defers remaining gaps.
