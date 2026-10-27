# PoF Display (derived trial)

**Not wired into the app** — evaluation build only.

Derived from **`PantsOnFireNarrow-Regular`** (CSS family `Pants on Fire Narrow`), the brush display face used for headings and button labels.

| File | Description |
|------|-------------|
| `PoFDisplay-Narrow-Regular.ttf` / `.woff2` | Lighter strokes, more open counters |
| `pof-display-comparison.png` | Current vs PoF Display at 360px width |

**CSS family name (trial):** `PoF Display`  
**Build:** `scripts/fonts/build_pof_display.py` — inward offset **11 u** (~9% thinning at UPM 1000), original `hmtx` and left-edge alignment preserved, `usWeightClass` **375**. Preview includes a **stroke + glow** row (Pillow `stroke_width`, not in app CSS yet).

```bash
pip install fonttools shapely pillow
python3 scripts/fonts/build_pof_display.py
python3 -m fontTools ttLib.woff2 compress -o public/assets/fonts/pants-on-fire/derived/PoFDisplay-Narrow-Regular.woff2 public/assets/fonts/pants-on-fire/derived/PoFDisplay-Narrow-Regular.ttf
python3 scripts/fonts/render_display_font_preview.py
```
