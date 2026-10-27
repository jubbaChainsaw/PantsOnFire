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

## Source & previews

In `source/`:

- `pantsonfire_glyph_sheet.png` — master glyph sheet used to build the font
- `pantsonfire_preview_outline.png` — outline sample
- `pantsonfire_preview_color.png` — colour sample

## Loading in this project

`@font-face` rules for the WOFF2 (and TTF/OTF fallbacks) live in `src/styles.css`. Apply with `font-family: 'Pants on Fire'` or `'Pants on Fire Color'`; the app default body font is unchanged.
