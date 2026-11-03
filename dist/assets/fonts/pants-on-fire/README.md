# Pants on Fire (custom font)

Game wordmark and display typeface for *Pants on Fire: Find the Liar*.

## Outline (single-colour)

Use these when you need a reliable outline that works in browsers, desktop apps, print, and design tools.

| File | Use |
|------|-----|
| `PantsOnFire-Regular.woff2` | **Web (preferred)** — smallest transfer; outline everywhere |
| `PantsOnFire-Regular-otf.woff2` | Web alternate built from the OTF source |
| `PantsOnFire-Regular.ttf` | Desktop, bundlers, or `format('truetype')` fallbacks |
| `PantsOnFire-Regular.otf` | Design tools (Illustrator, Figma import), or `format('opentype')` |

CSS family name (when loaded via `src/styles.css`): **`Pants on Fire`**.

## Colour (flame gradient)

Bitmap colour font (CBDT + SVG). The flame gradient renders in **Chrome, Edge, and Firefox** when you use the colour family. Other environments may fall back to a monochrome glyph.

| File | Use |
|------|-----|
| `PantsOnFireColor-Regular.woff2` | **Web (preferred)** |
| `PantsOnFireColor-Regular.ttf` | Desktop or non-WOFF2 pipelines |

CSS family name: **`Pants on Fire Color`**.

## Narrow (tighter spacing)

Same glyphs as the regular width, with reduced side bearings for tighter lines and UI labels.

### Outline

| File | Use |
|------|-----|
| `PantsOnFireNarrow-Regular.woff2` | **Web (preferred)** |
| `PantsOnFireNarrow-Regular-otf.woff2` | Web alternate from OTF |
| `PantsOnFireNarrow-Regular.ttf` | Desktop or `format('truetype')` fallbacks |
| `PantsOnFireNarrow-Regular.otf` | Design tools or `format('opentype')` |

CSS family name: **`Pants on Fire Narrow`**.

### Colour

| File | Use |
|------|-----|
| `PantsOnFireNarrowColor-Regular.woff2` | **Web (preferred)** |
| `PantsOnFireNarrowColor-Regular.ttf` | Desktop or non-WOFF2 pipelines |

CSS family name: **`Pants on Fire Narrow Color`**.

## Source & previews

In `source/`:

- `pantsonfire_glyph_sheet.png` — master glyph sheet used to build the font
- `pantsonfire_preview_outline.png` — regular outline sample
- `pantsonfire_preview_color.png` — regular colour sample
- `pantsonfire_narrow_preview_outline.png` — narrow outline sample
- `pantsonfire_narrow_preview_color.png` — narrow colour sample
- `pantsonfire_regular_vs_narrow.png` — regular vs narrow comparison

## Loading in this project

`@font-face` rules for the WOFF2 (and TTF/OTF fallbacks) live in `src/styles.css`. Apply with `font-family: 'Pants on Fire'`, `'Pants on Fire Color'`, `'Pants on Fire Narrow'`, or `'Pants on Fire Narrow Color'`; the app default body font is unchanged.
