# Account And Entitlements

## Current Components

- Supabase authentication.
- RevenueCat purchases.
- Entitlement endpoint.
- Theme pack unlocks.
- Tier unlocks.

## Principles

- Client state is not trusted.
- Server validates entitlements.
- RevenueCat remains purchase authority.
- Supabase remains identity authority.

## Entitlement Types

### Subscription Tiers

- Fibber
- Local Liar
- Suspect
- Host Most

### Add Ons

- Theme packs.
- Picture packs.
- Future host packs.

## Security Rules

- Validate tokens server-side.
- Validate purchases server-side.
- Do not trust client unlock flags.

Implementation: `server/entitlementsRoutes.js`, `server/stripeBillingRoutes.js`,
Postgres or Redis-backed store (`server/pofEntitlementsStore.js`). There is
**no persistent entitlement audit log** in code yet — "Log entitlement changes"
and audit history remain future work.

## Future Improvements

- Entitlement audit history.
- Restore purchase diagnostics.
- Account merge support.
- Cross-platform purchase recovery.
