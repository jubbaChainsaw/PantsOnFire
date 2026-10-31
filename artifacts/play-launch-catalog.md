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

## Paid – subscription tiers (Google Play / Stripe / RevenueCat)

| Tier | Product ID | Configured price |
|------|------------|------------------|
| Local Liar | `local_liar` | £2.99 |
| Suspect | `suspect` | £4.99 |
| Host with the Most | `host_most` | £9.99 |

RevenueCat entitlement IDs match tier ids (`local_liar`, `suspect`, `host_most`).

### Add-on
| Add-on | Product ID | Price |
|--------|------------|-------|
| Twist the Truth (category editor) | `twist_truth` | £1.99 |

## Paid – DLC theme packs (£0.99 each in pack metadata; store blurb £2.99 Stripe default)

Google Play / RevenueCat product id pattern: `dlc_pack_<packId>`

| Pack name | Pack ID | Themes included |
|-----------|---------|-----------------|
| Ye Olde Baloney | `ye-olde-baloney` | Vikings, Gladiators, Medieval |
| Myth-Taken Identity | `myth-taken-identity` | Royalty, Mythology (Gods & Legends), Time Travelers |
| Licence to Fib | `licence-to-fib` | Cops and Robbers*, Gangsters, Law and Order |
| Wanted: Better Alibis | `wanted-better-alibis` | (see themePack.js) |
| Rank and File (Mostly File) | `rank-and-file-mostly-file` | Military, Medical, Flying Squad |
| Beast Mode Deceit | `beast-mode-deceit` | Animals, Monsters, Under the Sea |
| Ctrl Alt Elieve | `ctrl-alt-elieve` | Sci-Fi, Cyberpunk, Post-Apocalypse |
| Dark Arts & Krafty Lies | `dark-arts-krafty-lies` | Wizards & Witches, Mythology, Medieval |
| Drawn to Lie | `drawn-to-lie` | Cartoons, Anime, Superheroes |
| Glitter and Suspects | `glitter-and-suspects` | Drag Queens, Rock Stars, Carnival |

*Licence to Fib includes additional themes per pack definition in `src/data/dlc/themePacks/`.

Host with the Most includes all DLC packs.

## Not sold – referral secret packs
- `fever-dream-1`, `fever-dream-2` (unlock via referrals only)
