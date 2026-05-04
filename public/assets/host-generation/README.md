# Host image generation references

These files are **inputs** for `scripts/generateOpenAiThemeHostImages.cjs` (OpenAI Images Edit). They are committed on purpose so the repo has stable paths for CI or teammates.

## Required files

| File | Role |
|------|------|
| `host-face-reference.jpg` | Your portrait (likeness). Clear head-and-shoulders, facing camera, good light. JPEG or PNG is fine; keep this filename or update `package.json` script paths. |
| `host-style-reference.png` | Art style **and** layout reference (e.g. 90s MTV adult-animation line weight, full-body centered staging, busy themed backgrounds). |

After adding or replacing either file, run:

```bash
npm run host:generate-openai-theme-stills:defaults
```

Or call the script with explicit paths:

```bash
npm run host:generate-openai-theme-stills -- \
  --face ./public/assets/host-generation/host-face-reference.jpg \
  --style ./public/assets/host-generation/host-style-reference.png
```

Generated outputs go to `exports/generated-host-stills/` (gitignored). Set `OPENAI_API_KEY` first, or use `scripts/royaltyFreeApiKeys.local.json` like other media scripts.
