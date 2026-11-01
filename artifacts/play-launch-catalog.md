# Play launch catalog (from src/data/themeCatalog.js + tierModel.js)

## Free / bundled at launch

### Core themes (always free)
- Default
- Murder Mystery
- Pirates
- Cops and Robbers
- Ghosts and Ghouls

### Account tier (Fibber – free)
- Join online lobbies (not create)
- Product / entitlement: `fibber` (no purchase)

## Paid – subscription tiers

| Tier (internal) | Stripe / web | **Google Play subscription product id** | Base plan id | Price |
|-----------------|--------------|----------------------------------------|--------------|-------|
| Local Liar (`local_liar`) | `local_liar` | `local_liar` | `monthly` | £2.99 |
| Suspect (`suspect`) | `suspect` | `suspect` | `monthly` | £4.99 |
| Host with the Most (`host_most`) | `host_most` | `host_most` | `monthly` | £9.99 |

RevenueCat entitlements (configure separately in RC dashboard) still use internal tier ids: `local_liar`, `suspect`, `host_most`.

### Add-on

| Add-on (internal) | Stripe / web | **Google Play one-time product id** | Price |
|-------------------|--------------|-------------------------------------|-------|
| Twist the Truth (`twist_truth`) | `twist_truth` | `twist_truth` | £1.99 |

## Paid – DLC theme packs

Internal pack ids (hyphens, used in game data) map to **Google Play one-time product ids** by replacing hyphens with underscores in the `dlc_pack_` prefix:

`googlePlayProductId = dlc_pack_` + `internalPackId.replace(/-/g, '_')`

Implementation: `src/billing/googlePlayProductCatalog.js` (`googlePlayDlcProductIdForPack`).

| Pack name | Internal pack id | Google Play product id |
|-----------|------------------|-------------------------|
| Ye Olde Baloney | `ye-olde-baloney` | `dlc_pack_ye_olde_baloney` |
| Myth-Taken Identity | `myth-taken-identity` | `dlc_pack_myth_taken_identity` |
| Licence to Fib | `licence-to-fib` | `dlc_pack_licence_to_fib` |
| Wanted: Better Alibis | `wanted-better-alibis` | `dlc_pack_wanted_better_alibis` |
| Rank and File (Mostly File) | `rank-and-file-mostly-file` | `dlc_pack_rank_and_file_mostly_file` |
| Beast Mode Deceit | `beast-mode-deceit` | `dlc_pack_beast_mode_deceit` |
| Ctrl Alt Elieve | `ctrl-alt-elieve` | `dlc_pack_ctrl_alt_elieve` |
| Dark Arts & Krafty Lies | `dark-arts-krafty-lies` | `dlc_pack_dark_arts_krafty_lies` |
| Drawn to Lie | `drawn-to-lie` | `dlc_pack_drawn_to_lie` |
| Glitter and Suspects | `glitter-and-suspects` | `dlc_pack_glitter_and_suspects` |

All sold DLC packs: **£0.99** each (`pricePence: 99`, `priceLabel: 99p` in pack metadata; web catalog default `£0.99`).

Host with the Most includes all DLC packs.

## Not sold – referral secret packs
- `fever-dream-1`, `fever-dream-2` (unlock via referrals only; not listed in Play)

## Notes
- **Do not use hyphens in Google Play product ids.** Internal catalog ids keep hyphens.
- Native Android shell resolves purchases via `googlePlayProductIdForPurchase()` → RevenueCat / Play Billing (`App.js` + `nativeShell/googlePlayPurchase.js`).
- Server entitlement webhook maps `dlc_pack_*` Play/RC ids back to internal pack ids via `resolveInternalThemePackIdFromStoreKey()` in `server/entitlementsRoutes.js`.
