# Missing & placeholder graphics audit

Generated: **2026-10-27** (run `node scripts/audit-missing-graphics.cjs` to refresh). Audience: **Martin** (art). **Hot Seat (`prompt`) and Grill 'Em (`grill`) excluded** from this list.

Checks **public/** (full game) and flags **offline APK** gaps per `scripts/slim-dist-for-mobile.cjs`.

### Priority for Martin

1. **Player-facing now:** `assets/ui/game-modes/*.png` (except removed Hot Seat/Grill), especially **offtopic** tile; category icons under `assets/ui/categories/`.
2. **Default host (APK):** `assets/themes/default/hosts/persona-host-idle.png` + `persona-host-talking.webm/mp4`.
3. **DLC / online themes:** full host sets under `assets/themes/<slug>/hosts/` (not shipped in offline APK today).
4. **Picture rounds:** `assets/graphic-packs/picture/*` (web only until CDN).

## Round type / game mode

| Item | What's missing / issue | Expected path | Format & size | Notes |
| --- | --- | --- | --- | --- |
| meme (orphan icon) | icon on disk but no active round type id `meme` in roundTypes.js | `assets/ui/game-modes/meme.png` | 768×768 PNG | Use or remove |
| noise | dual art paths (legacy logo + ui/game-modes); ensure they match visually | `assets/ui/game-modes/noise.png` | 768×768 PNG | Legacy: assets/images/round-types/noise-logo.svg |
| Off Topic Defense | no assets/ui/game-modes/offtopic.png (legacy SVG only in roundTypes) | `assets/ui/game-modes/offtopic.png` | 768×768 PNG | Legacy: `assets/images/round-types/offtopic-logo.svg` (exists) |
| opinion | dual art paths (legacy logo + ui/game-modes); ensure they match visually | `assets/ui/game-modes/opinion.png` | 768×768 PNG | Legacy: assets/images/round-types/opinion-logo-top.png |
| picture | dual art paths (legacy logo + ui/game-modes); ensure they match visually | `assets/ui/game-modes/picture.png` | 768×768 PNG | Legacy: assets/images/round-types/picture-logo.svg |
| sound | dual art paths (legacy logo + ui/game-modes); ensure they match visually | `assets/ui/game-modes/sound.png` | 768×768 PNG | Legacy: assets/images/round-types/sound-logo.svg |
| video | dual art paths (legacy logo + ui/game-modes); ensure they match visually | `assets/ui/game-modes/video.png` | 768×768 PNG | Legacy: assets/images/round-types/video-logo.svg |
| twotruths (Two Truths, One Fire) | placeholder reuses Off Topic SVG; needs dedicated mode art | `assets/ui/game-modes/twotruths.png` + `assets/images/round-types/twotruths-logo.svg` | 768×768 PNG + SVG | Currently: `offtopic-logo.svg` |

## Category icon

| Item | What's missing / issue | Expected path | Format & size | Notes |
| --- | --- | --- | --- | --- |
| memes-viral-alt | duplicate/unused variant (code uses memes-viral.png) | `assets/ui/categories/memes-viral.png` | 768×768 PNG |  |

## Host

| Item | What's missing / issue | Expected path | Format & size | Notes |
| --- | --- | --- | --- | --- |
| aliens/hosts/persona-host-idle.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/aliens/hosts/persona-host-idle.png` | 916×1004 PNG |  |
| aliens/hosts/persona-host-talk-1.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/aliens/hosts/persona-host-talk-1.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| aliens/hosts/persona-host-talk-2.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/aliens/hosts/persona-host-talk-2.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| aliens/hosts/persona-host-talk-3.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/aliens/hosts/persona-host-talk-3.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| carnival/hosts/persona-host-idle.png | missing in public/ | `assets/themes/carnival/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| carnival/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/carnival/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| carnival/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/carnival/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| carnival/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/carnival/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| cyberpunk/hosts/persona-host-idle.png | missing in public/ | `assets/themes/cyberpunk/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| cyberpunk/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/cyberpunk/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| cyberpunk/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/cyberpunk/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| cyberpunk/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/cyberpunk/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| default/hosts/persona-host-talk-1.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/default/hosts/persona-host-talk-1.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| default/hosts/persona-host-talk-2.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/default/hosts/persona-host-talk-2.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| default/hosts/persona-host-talk-3.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/default/hosts/persona-host-talk-3.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| gangsters/hosts/persona-host-idle.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/gangsters/hosts/persona-host-idle.png` | 858×1072 PNG |  |
| gangsters/hosts/persona-host-talk-1.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/gangsters/hosts/persona-host-talk-1.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| gangsters/hosts/persona-host-talk-2.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/gangsters/hosts/persona-host-talk-2.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| gangsters/hosts/persona-host-talk-3.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/gangsters/hosts/persona-host-talk-3.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| ghosts-and-ghouls/hosts/persona-host-idle.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/hosts/persona-host-idle.png` | 858×1072 PNG |  |
| ghosts-and-ghouls/hosts/persona-host-talk-1.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/ghosts-and-ghouls/hosts/persona-host-talk-1.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| ghosts-and-ghouls/hosts/persona-host-talk-2.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/ghosts-and-ghouls/hosts/persona-host-talk-2.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| ghosts-and-ghouls/hosts/persona-host-talk-3.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/ghosts-and-ghouls/hosts/persona-host-talk-3.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| gladiators/hosts/persona-host-idle.png | missing in public/ | `assets/themes/gladiators/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| gladiators/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/gladiators/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| gladiators/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/gladiators/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| gladiators/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/gladiators/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| grillem/hosts/persona-host-idle.png | missing in public/ | `assets/themes/grillem/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| grillem/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/grillem/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| grillem/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/grillem/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| grillem/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/grillem/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| medical/hosts/persona-host-idle.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/medical/hosts/persona-host-idle.png` | 830×1108 PNG |  |
| medical/hosts/persona-host-talk-1.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/medical/hosts/persona-host-talk-1.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| medical/hosts/persona-host-talk-2.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/medical/hosts/persona-host-talk-2.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| medical/hosts/persona-host-talk-3.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/medical/hosts/persona-host-talk-3.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| murder-mystery/hosts/persona-host-idle.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/hosts/persona-host-idle.png` | 782×1176 PNG |  |
| murder-mystery/hosts/persona-host-talk-1.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/murder-mystery/hosts/persona-host-talk-1.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| murder-mystery/hosts/persona-host-talk-2.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/murder-mystery/hosts/persona-host-talk-2.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| murder-mystery/hosts/persona-host-talk-3.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/murder-mystery/hosts/persona-host-talk-3.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| mythology-gods-legends/hosts/persona-host-idle.png | missing in public/ | `assets/themes/mythology-gods-legends/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| mythology-gods-legends/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/mythology-gods-legends/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| mythology-gods-legends/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/mythology-gods-legends/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| mythology-gods-legends/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/mythology-gods-legends/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| ninjas/hosts/persona-host-idle.png | missing in public/ | `assets/themes/ninjas/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| ninjas/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/ninjas/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| ninjas/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/ninjas/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| ninjas/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/ninjas/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| pirates/hosts/persona-host-idle.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/hosts/persona-host-idle.png` | 858×1072 PNG |  |
| pirates/hosts/persona-host-talk-1.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/pirates/hosts/persona-host-talk-1.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| pirates/hosts/persona-host-talk-2.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/pirates/hosts/persona-host-talk-2.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| pirates/hosts/persona-host-talk-3.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/pirates/hosts/persona-host-talk-3.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| post-apocalypse/hosts/persona-host-idle.png | missing in public/ | `assets/themes/post-apocalypse/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| post-apocalypse/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/post-apocalypse/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| post-apocalypse/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/post-apocalypse/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| post-apocalypse/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/post-apocalypse/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| rock-stars/hosts/persona-host-idle.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/rock-stars/hosts/persona-host-idle.png` | 784×1176 PNG |  |
| rock-stars/hosts/persona-host-talk-1.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/rock-stars/hosts/persona-host-talk-1.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| rock-stars/hosts/persona-host-talk-2.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/rock-stars/hosts/persona-host-talk-2.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| rock-stars/hosts/persona-host-talk-3.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/rock-stars/hosts/persona-host-talk-3.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| royalty/hosts/persona-host-idle.png | missing in public/ | `assets/themes/royalty/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| royalty/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/royalty/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| royalty/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/royalty/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| royalty/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/royalty/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| time-travelers/hosts/persona-host-idle.png | missing in public/ | `assets/themes/time-travelers/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| time-travelers/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/time-travelers/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| time-travelers/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/time-travelers/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| time-travelers/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/time-travelers/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| vikings/hosts/persona-host-idle.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/vikings/hosts/persona-host-idle.png` | 858×1072 PNG |  |
| vikings/hosts/persona-host-talk-1.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/vikings/hosts/persona-host-talk-1.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| vikings/hosts/persona-host-talk-2.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/vikings/hosts/persona-host-talk-2.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| vikings/hosts/persona-host-talk-3.png | legacy still-frame path in themeAssets (theme uses persona-host-talking video instead) | `assets/themes/vikings/hosts/persona-host-talk-3.png` | 900×900 PNG or retire ref | Video present in hosts/ |
| wizards-witches/hosts/persona-host-idle.png | missing in public/ | `assets/themes/wizards-witches/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| wizards-witches/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/wizards-witches/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| wizards-witches/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/wizards-witches/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| wizards-witches/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/wizards-witches/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |
| wrestlers/hosts/persona-host-idle.png | missing in public/ | `assets/themes/wrestlers/hosts/persona-host-idle.png` | Match sibling assets in same folder |  |
| wrestlers/hosts/persona-host-talk-1.png | missing in public/ | `assets/themes/wrestlers/hosts/persona-host-talk-1.png` | Match sibling assets in same folder |  |
| wrestlers/hosts/persona-host-talk-2.png | missing in public/ | `assets/themes/wrestlers/hosts/persona-host-talk-2.png` | Match sibling assets in same folder |  |
| wrestlers/hosts/persona-host-talk-3.png | missing in public/ | `assets/themes/wrestlers/hosts/persona-host-talk-3.png` | Match sibling assets in same folder |  |

## Persona / avatar

| Item | What's missing / issue | Expected path | Format & size | Notes |
| --- | --- | --- | --- | --- |
| Arthur Bellamy | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/04-arthur-bellamy.png` | 768×768 PNG |  |
| assets/themes/cops-and-robbers/personas/01-sergeant-brickjaw.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/01-sergeant-brickjaw.png` | 768×768 PNG |  |
| assets/themes/cops-and-robbers/personas/02-whisper-kev.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/02-whisper-kev.png` | 768×768 PNG |  |
| assets/themes/cops-and-robbers/personas/03-pc-bubblegum-harris.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/03-pc-bubblegum-harris.png` | 768×768 PNG |  |
| assets/themes/cops-and-robbers/personas/04-redline-ricky.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/04-redline-ricky.png` | 768×768 PNG |  |
| assets/themes/cops-and-robbers/personas/06-detective-crowe.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/06-detective-crowe.png` | 768×768 PNG |  |
| assets/themes/cops-and-robbers/personas/07-nosey-nadine.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/07-nosey-nadine.png` | 768×768 PNG |  |
| assets/themes/ghosts-and-ghouls/personas/01-count-smoulder.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/01-count-smoulder.png` | 768×768 PNG |  |
| assets/themes/ghosts-and-ghouls/personas/02-rotgut-eddie.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/02-rotgut-eddie.png` | 768×768 PNG |  |
| assets/themes/ghosts-and-ghouls/personas/03-bride-static.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/03-bride-static.png` | 768×768 PNG |  |
| assets/themes/ghosts-and-ghouls/personas/07-medusa-mel.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/07-medusa-mel.png` | 768×768 PNG |  |
| assets/themes/ghosts-and-ghouls/personas/09-wailer-beth.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/09-wailer-beth.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/01-agatha-primrose.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/01-agatha-primrose.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/02-reginald-crowhurst.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/02-reginald-crowhurst.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/03-lillian-devereaux.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/03-lillian-devereaux.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/05-edith-pritchard.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/05-edith-pritchard.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/06-father-benedict-hale.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/06-father-benedict-hale.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/07-margaret-whitlock.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/07-margaret-whitlock.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/13-mabel-thorne.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/13-mabel-thorne.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/15-beatrice-holloway.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/15-beatrice-holloway.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/16-cedric-vale.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/16-cedric-vale.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/19-winifred-dalloway.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/19-winifred-dalloway.png` | 768×768 PNG |  |
| assets/themes/murder-mystery/personas/25-mildred-finchley.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/25-mildred-finchley.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/01-captain-grizzlehook.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/01-captain-grizzlehook.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/02-coral-red-tide-maeve.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/02-coral-red-tide-maeve.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/03-scurvy-len.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/03-scurvy-len.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/04-dreadlock-nyx.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/04-dreadlock-nyx.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/05-barnacle-bill.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/05-barnacle-bill.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/06-old-salt-garrick.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/06-old-salt-garrick.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/07-biscuit-tom.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/07-biscuit-tom.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/08-blackfeather-vex.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/08-blackfeather-vex.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/09-hooknose-redd.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/09-hooknose-redd.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/10-mad-coil-jenkins.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/10-mad-coil-jenkins.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/11-silent-fang-lin.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/11-silent-fang-lin.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/13-mirelurk-lira.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/13-mirelurk-lira.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/14-sultan-ash-rami.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/14-sultan-ash-rami.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/16-knuckles-dreg.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/16-knuckles-dreg.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/18-gullcoat-harlan.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/18-gullcoat-harlan.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/20-barrelgut-donny.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/20-barrelgut-donny.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/23-master-kaito-grey.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/23-master-kaito-grey.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/24-tidecaller-zuri.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/24-tidecaller-zuri.png` | 768×768 PNG |  |
| assets/themes/pirates/personas/25-admiral-rustbane.png | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/25-admiral-rustbane.png` | 768×768 PNG |  |
| Bernard Griggs | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/12-bernard-griggs.png` | 768×768 PNG |  |
| Bogrot Bill | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/25-bogrot-bill.png` | 768×768 PNG |  |
| Bucket Hat Lenny | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/13-bucket-hat-lenny.png` | 768×768 PNG |  |
| Captain Holloway | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/25-captain-holloway.png` | 768×768 PNG |  |
| Captain Rupert Shaw | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/24-captain-rupert-shaw.png` | 768×768 PNG |  |
| Ciggy Claire | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/15-ciggy-claire.png` | 768×768 PNG |  |
| Clara Winslow | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/11-clara-winslow.png` | 768×768 PNG |  |
| Crookback Hilda | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/15-crookback-hilda.png` | 768×768 PNG |  |
| Detective Bloom | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/17-detective-bloom.png` | 768×768 PNG |  |
| Dolly Knots | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/22-dolly-knots.png` | 768×768 PNG |  |
| Douglas Harker | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/18-douglas-harker.png` | 768×768 PNG |  |
| Dr. Plagueworth | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/10-dr-plagueworth.png` | 768×768 PNG |  |
| Dusty Bones | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/11-dusty-bones.png` | 768×768 PNG |  |
| Evelyn Marlowe | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/21-evelyn-marlowe.png` | 768×768 PNG |  |
| Fangridge Barry | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/06-fangridge-barry.png` | 768×768 PNG |  |
| Father Hollow | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/20-father-hollow.png` | 768×768 PNG |  |
| Flatcap Ronnie | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/20-flatcap-ronnie.png` | 768×768 PNG |  |
| Frank "Two-Bolts" Malone | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/04-frank-two-bolts-malone.png` | 768×768 PNG |  |
| Frostbraid Elin | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/15-frostbraid-elin.png` | 768×768 PNG |  |
| Granny Nettles | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/17-granny-nettles.png` | 768×768 PNG |  |
| Grease Mick | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/10-grease-mick.png` | 768×768 PNG |  |
| Grinlock | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/13-grinlock.png` | 768×768 PNG |  |
| Harold Sykes | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/10-harold-sykes.png` | 768×768 PNG |  |
| Helena Voss | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/23-helena-voss.png` | 768×768 PNG |  |
| Hollow Annie | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/05-hollow-annie.png` | 768×768 PNG |  |
| Inspector Doyle | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/14-inspector-doyle.png` | 768×768 PNG |  |
| Inspector Vale | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/11-inspector-vale.png` | 768×768 PNG |  |
| Ironjaw Burke | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/12-ironjaw-burke.png` | 768×768 PNG |  |
| Jester Grin | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/19-jester-grin.png` | 768×768 PNG |  |
| Lady Mourne | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/12-lady-mourne.png` | 768×768 PNG |  |
| Leonard Graves | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/20-leonard-graves.png` | 768×768 PNG |  |
| Lipbite Laura | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/23-lipbite-laura.png` | 768×768 PNG |  |
| Misty Floe | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/21-misty-floe.png` | 768×768 PNG |  |
| Mumsy Carol | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/19-mumsy-carol.png` | 768×768 PNG |  |
| Nora Pritchard | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/17-nora-pritchard.png` | 768×768 PNG |  |
| Nosfer Stu | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/08-nosfer-stu.png` | 768×768 PNG |  |
| Old Man Latchford | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/05-old-man-latchford.png` | 768×768 PNG |  |
| Pale Prince Alaric | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/17-pale-prince-alaric.png` | 768×768 PNG |  |
| Panic Pete | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/18-panic-pete.png` | 768×768 PNG |  |
| PC Dullahan | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/09-pc-dullahan.png` | 768×768 PNG |  |
| PC Glitch | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/21-pc-glitch.png` | 768×768 PNG |  |
| PC Rigs | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/14-pc-rigs.png` | 768×768 PNG |  |
| Reefspawn Glim | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/21-reefspawn-glim.png` | 768×768 PNG |  |
| Scarlet Rook | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/22-scarlet-rook.png` | 768×768 PNG |  |
| Shifty Ellis | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/22-shifty-ellis.png` | 768×768 PNG |  |
| Silas the Slick | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/pirates/personas/19-silas-the-slick.png` | 768×768 PNG |  |
| Silent Omar | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/16-silent-omar.png` | 768×768 PNG |  |
| Skint Davey | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/12-skint-davey.png` | 768×768 PNG |  |
| Sniffer Dan | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/24-sniffer-dan.png` | 768×768 PNG |  |
| Stringhair Sadie | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/14-stringhair-sadie.png` | 768×768 PNG |  |
| Thomas Finch | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/08-thomas-finch.png` | 768×768 PNG |  |
| Topper Graves | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/16-topper-graves.png` | 768×768 PNG |  |
| Two-Coat Tony | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/cops-and-robbers/personas/08-two-coat-tony.png` | 768×768 PNG |  |
| Undertaker Voss | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/18-undertaker-voss.png` | 768×768 PNG |  |
| Velvet Fang | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/24-velvet-fang.png` | 768×768 PNG |  |
| Victor Kane | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/22-victor-kane.png` | 768×768 PNG |  |
| Vivian Blackwood | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/murder-mystery/personas/09-vivian-blackwood.png` | 768×768 PNG |  |
| Void Walker | present in repo; not in offline APK (non-default theme dir removed from APK) | `assets/themes/ghosts-and-ghouls/personas/23-void-walker.png` | 768×768 PNG |  |

## Prompt card (picture pack)

| Item | What's missing / issue | Expected path | Format & size | Notes |
| --- | --- | --- | --- | --- |
| city-scenes-v1 | not bundled in offline APK (graphic-packs stripped) | `assets/graphic-packs/picture/city-scenes-v1/images` | — | Full web build only unless CDN added |
| coastal-v1 | not bundled in offline APK (graphic-packs stripped) | `assets/graphic-packs/picture/coastal-v1/images` | — | Full web build only unless CDN added |
| core-v1 | not bundled in offline APK (graphic-packs stripped) | `assets/graphic-packs/picture/core-v1/images` | — | Full web build only unless CDN added |
| music-albums-complete-v1 | not bundled in offline APK (graphic-packs stripped) | `assets/graphic-packs/picture/music-albums-complete-v1/images` | — | Full web build only unless CDN added |

## Code reference (misc)

| Item | What's missing / issue | Expected path | Format & size | Notes |
| --- | --- | --- | --- | --- |
| assets/themes/vikings/personas/01-rolf-icefang.png | referenced in src but missing in public/ | `assets/themes/vikings/personas/01-rolf-icefang.png` | — |  |

## Reference dimensions (match these)

- **Game mode icon**: 768×768 png
- **Category icon**: 768×768 png
- **Default host idle**: 858×1072 png
- **In-game wallpaper**: 1280×2770 png
- **Card front**: 768×1152 png

## Summary counts

- **Total rows:** 192
- Round type / game mode: 7
- Category icon: 1
- Host: 79
- Persona / avatar: 100
- Prompt card (picture pack): 4
- Code reference (misc): 1
