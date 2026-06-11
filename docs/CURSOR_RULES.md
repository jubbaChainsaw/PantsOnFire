# Cursor Rules

## Priorities
1. Preserve gameplay.
2. Preserve pass-the-phone mode.
3. Protect online stability.
4. Protect purchases and entitlements.
5. Improve architecture incrementally.

## Do Not
- Rewrite the entire app.
- Break App.jsx functionality before extracting features.
- Trust client-side entitlement state.
- Trust client-side score calculations.

## Preferred Approach
- Small refactors.
- Add tests.
- Update docs.
- Maintain backwards compatibility.

## Online Rules
- Server remains authoritative.
- Validate socket events.
- Validate host-only actions.
- Validate votes.

## Content Rules
- Keep content data-driven.
- Add themes through manifests.
- Add personas through content packs.
- Avoid hardcoding prompts.
