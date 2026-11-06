# ENHC0024 — display heading caps (status)

**Intent:** Jubba ALL-CAPS for display titles; preserve mixed case for player names via `.pof-preserve-heading-case`.

**Implemented in repo:**

- `src/pof-components.css` — `h1`/`h2`/`h3` and `.font-black` use `text-transform: uppercase` unless `.pof-preserve-heading-case` (see comment `ENHC0024`).

**Remaining:** per-screen / per-component pass on physical devices (S24) to catch custom `className` stacks that bypass these rules — tracked as manual QA, not blocked on CI.
