# PR #112 vs branch Android debug APK workflow

**Decision id:** POF-DEC-112  
**Context:** [PR #112](https://github.com/jubbaChainsaw/PantsOnFire/pull/112) on `main` (`bef0969`, `3a39254`) simplified `.github/workflows/android-debug-apk.yml`. This branch (`cursor/ionos-web-deploy-6e4c`) carries the fuller pipeline used for **1.0.3** bundled-web debug builds.

## Side-by-side

| Aspect | **main (PR #112)** | **This branch** |
|--------|-------------------|-----------------|
| **Triggers** | `workflow_dispatch` only | `workflow_dispatch` + push to branch via `.github/trigger-android-debug-apk` |
| **Default ref** | `cursor/ionos-web-deploy-6e4c` | Same (input or triggering ref) |
| **Web build** | `vite build --base ./ --outDir dist-android` | `scripts/buildMobileBundledWeb.mjs` (mobile trim + env stamps) |
| **Verification** | None | `verifyDistAndroidAssets`, Playwright `test:mobile-dist-smoke`, embedded bundle verify |
| **Native prep** | Prebuild + stage web only | Prebuild, WebView asset-loader patch, Play Billing ≥8 verify |
| **Version** | Default Gradle version | `-PandroidVersionName=1.0.3`, `EXPO_PUBLIC_*` build metadata |
| **SDK setup** | `android-actions/setup-android@v3` | Manual `sdkmanager` license accept on runner image |
| **Artifact path** | Raw Gradle APK output | Copied to `artifacts/pants-on-fire-debug.apk` |

## Recommendation: **keep ours (this branch), do not replace with main’s file wholesale**

**Why**

1. **Shippable debug APKs** — Branch pipeline matches how we actually bundle `dist-android`, trim assets, and catch broken references before Gradle runs.
2. **Play compliance** — Billing library verification and mobile smoke tests are already wired; main’s workflow skips them.
3. **Release alignment** — Version **1.0.3** and bundled-web env vars are required for current QA; main’s workflow is a minimal manual escape hatch, not a drop-in for this release line.

**What to borrow from main (optional merge-both, small hunks only)**

- Consider switching license/SDK setup to `android-actions/setup-android@v3` **if** it reduces flake on `ubuntu-latest` (test on one CI run before swapping).
- Keep main’s **manual-only** trigger as an *additional* workflow name only if we want zero push-triggered Android minutes on `main` after merge — not by deleting branch verification steps.

**Merge strategy when integrating to `main`**

1. Land **this branch’s** `android-debug-apk.yml` (or rename branch workflow to remain canonical).
2. Close or retarget PR #112 as superseded; do **not** merge #112’s minimal YAML over the verified pipeline without re-adding smoke, billing verify, and `buildMobileBundledWeb.mjs`.
3. Resolve any duplicate trigger files (`.github/trigger-android-debug-apk`) explicitly in the same PR so only one debug APK workflow is active.

**Status:** Decision recorded; **no merge** performed in this change set.
