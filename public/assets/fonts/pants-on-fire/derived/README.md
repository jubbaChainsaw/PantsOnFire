# PoF Display (derived trial)

**Status:** Not wired into the app. For Martin’s display-type evaluation only.

## Source

| Item | Detail |
|------|--------|
| **Current UI font** | `PantsOnFireNarrow-Regular.*` — CSS family **`Pants on Fire Narrow`** |
| **Location** | `public/assets/fonts/pants-on-fire/` |
| **Used for** | Headings (`h1`–`h3`, `.font-black`), `.pof-btn` labels, `.pof-title`, yellow screen titles |

## Licence findings

- There is **no SIL Open Font License (OFL)** or other licence file in this repository for the Pants on Fire typeface.
- Font **name table** (from `PantsOnFireNarrow-Regular.ttf`): family **“Pants on Fire Narrow”**, subfamily **Regular**, version **1.000** — **no** copyright (nameID 0), **no** licence text (nameID 13), **no** licence URL (nameID 14) embedded.
- README describes it as a **custom game wordmark / display typeface** built from in-repo `source/` glyph sheets.

**Conclusion:** Treat **Pants on Fire / Pants on Fire Narrow** as a **proprietary project asset** (rights with the game owner). It is **not** a third-party OFL font, so OFL rename/redistribution rules do not apply; **derivation for this product is authorized by the rights holder** (Martin / project), not by a public OFL grant.

If external redistribution of the font were ever required, add an explicit licence file from the rights holder first.

## Derived build

| File | Description |
|------|-------------|
| `PoFDisplay-Narrow-Regular.ttf` | Derived outline font |
| `PoFDisplay-Narrow-Regular.woff2` | Web build of the same |
| `pof-display-comparison.png` | Old vs new preview (360px wide) |

**Family name (trial):** `PoF Display`  
**Method:** `scripts/fonts/build_pof_display.py` — flatten outlines → **~22 u inward offset** (~18% stroke thinning at UPM 1000) → simplify; `OS/2.usWeightClass` set to **350**.

## Open-licence alternatives (if derivation is not adopted)

Brushy display faces with **lighter weight / more open counters** (all **OFL**):

1. **[Knewave](https://fonts.google.com/specimen/Knewave)** — rounded brush poster style  
2. **[Rampart One](https://fonts.google.com/specimen/Rampart+One)** — heavy outline; pair with lighter weight or use at smaller sizes  
3. **[Alatsi](https://fonts.google.com/specimen/Alatsi)** — semi-brush display, generally clearer counters than ultra-black brush fonts  

These are **not** drop-in matches; they are OFL-safe fallbacks for comparison.

## Regenerate

```bash
pip install fonttools shapely pillow
python3 scripts/fonts/build_pof_display.py
python3 -m fontTools ttLib.woff2 compress -o public/assets/fonts/pants-on-fire/derived/PoFDisplay-Narrow-Regular.woff2 public/assets/fonts/pants-on-fire/derived/PoFDisplay-Narrow-Regular.ttf
python3 scripts/fonts/render_display_font_preview.py
```
