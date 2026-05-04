# Host image generation references

Inputs for `scripts/generateOpenAiThemeHostImages.cjs` (OpenAI Images Edit). Paths are public on purpose.

## Files

| File | Role |
|------|------|
| **`host-face.png`** | Head-and-shoulders portrait (likeness). Centered, facing camera, neutral or slight smile. PNG or JPEG. |
| **`host-default-key-art.png`** | **Default theme** look target: comic/cel-shaded host on the game stage (purple jacket, mic, neon, **PANTS ON FIRE!** branding when you use full key art). Same file is the **style** reference for every theme. The repo currently seeds this from `public/assets/themes/default/characters/host-idle.png`; replace this file with your full-bleed key art PNG when you have it. |

## Run

```bash
npm run host:generate-openai-theme-stills:defaults
```

Requires `OPENAI_API_KEY` **or** an `openaiApiKey` field in the same JSON file used for royalty-free imports (`scripts/royaltyFreeApiKeys.local.json`). You can also set `ROYALTYFREE_API_KEYS_FILE` to point at your file, or pass `--keys-file ./path/to/keys.json`. Optional non-gitignored fallback: `scripts/royaltyFreeApiKeys.json`.

Explicit paths:

```bash
npm run host:generate-openai-theme-stills -- \
  --face ./public/assets/host-generation/host-face.png \
  --style ./public/assets/host-generation/host-default-key-art.png
```
