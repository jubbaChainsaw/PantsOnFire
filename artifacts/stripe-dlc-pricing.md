# Stripe DLC pricing — Jubba approval checklist

**Confirmed retail price:** £0.99 per individual DLC theme pack (all channels).

This repo’s **UI and catalog defaults** now show **£0.99**. **Checkout still charges whatever amount is on the linked Stripe Price object** until those Prices are updated or replaced in Stripe Dashboard / Railway env — we did **not** change live Stripe products from code.

## Environment variables (Railway / lobby server)

These hold Stripe **Price** ids (`price_…`), not amounts. Jubba should ensure each linked Price is **£0.99 GBP** (99 pence) one-time.

| Variable | Used for |
|----------|----------|
| `STRIPE_PRICE_DLC_PACK` | Default Stripe Price for **any** DLC pack checkout when no per-pack override is set |
| `STRIPE_PRICE_DLC_YE_OLDE_BALONEY` | Optional override for pack `ye-olde-baloney` |
| `STRIPE_PRICE_DLC_MYTH_TAKEN_IDENTITY` | Optional override for pack `myth-taken-identity` |
| `STRIPE_PRICE_DLC_LICENCE_TO_FIB` | Optional override for pack `licence-to-fib` |
| `STRIPE_PRICE_DLC_WANTED_BETTER_ALIBIS` | Optional override for pack `wanted-better-alibis` |
| `STRIPE_PRICE_DLC_RANK_AND_FILE_MOSTLY_FILE` | Optional override for pack `rank-and-file-mostly-file` |
| `STRIPE_PRICE_DLC_BEAST_MODE_DECEIT` | Optional override for pack `beast-mode-deceit` |
| `STRIPE_PRICE_DLC_CTRL_ALT_ELIEVE` | Optional override for pack `ctrl-alt-elieve` |
| `STRIPE_PRICE_DLC_DARK_ARTS_KRAFTY_LIES` | Optional override for pack `dark-arts-krafty-lies` |
| `STRIPE_PRICE_DLC_DRAWN_TO_LIE` | Optional override for pack `drawn-to-lie` |
| `STRIPE_PRICE_DLC_GLITTER_AND_SUSPECTS` | Optional override for pack `glitter-and-suspects` |

Per-pack env names are derived in `server/stripeCatalog.js`:  
`STRIPE_PRICE_DLC_` + `packId` with hyphens → underscores, uppercased.

## Optional JSON overrides

| Variable | Purpose |
|----------|---------|
| `STRIPE_CATALOG_JSON` | Maps checkout skus to Price ids, e.g. `"dlc:ye-olde-baloney":"price_…"` |
| `STRIPE_CATALOG_DISPLAY_JSON` | Maps display labels only, e.g. `"dlc:pack":"£0.99"` (overrides catalog API text) |

## What to do in Stripe (manual)

1. For each DLC Price currently set to **£2.99**, either create a new **£0.99** Price on the same Product and update the env var / `STRIPE_CATALOG_JSON` entry, or archive the old Price after switching.
2. Verify a test checkout for one pack shows **£0.99** before promoting env changes to production.

## Not DLC (unchanged)

Subscription / add-on Stripe env vars (`STRIPE_PRICE_TIER_*`, `STRIPE_PRICE_ADDON_TWIST_TRUTH`) are separate and were not part of this DLC price correction.
