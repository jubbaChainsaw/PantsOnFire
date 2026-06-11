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
- Log entitlement changes.

## Future Improvements

- Entitlement audit history.
- Restore purchase diagnostics.
- Account merge support.
- Cross-platform purchase recovery.
