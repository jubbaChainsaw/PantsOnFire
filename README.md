# Pants on Fire - Cursor Test Build

This package is prepared for local testing in Cursor / Vite.

## Quick start

```bash
npm install
npm run dev
```

## Expo mobile test shell

This repo now includes an Expo wrapper so you can test on mobile quickly.

```bash
# Terminal 1: run the web game
npm run dev

# Terminal 2: run Expo
npm run expo:start
```

- The Expo app embeds the web game via WebView from `App.js`.
- Default URL is `http://10.0.2.2:5173` on Android emulator and `http://localhost:5173` on iOS.
- You can override with:
  - `EXPO_PUBLIC_GAME_URL=http://YOUR-IP:5173 npm run expo:start`

The current game logo is included at `public/assets/images/logo.png`. Replace it any time with your final asset.

# Pants on Fire: Find the Liar

Multi-file refactor of the party game prototype.

## Included
- Home / Setup / Store / Settings
- Round types: prompt, opinion, picture placeholder, sound placeholder, video placeholder
- Classic / Chaos mode
- Rules splash screen
- Suspense liar reveal screen
- Themed names and theme metadata
- Data split into separate files for easier maintenance
- Placeholder assets you can replace:
  - `public/assets/images/logo-placeholder.svg`
  - `public/assets/images/flame-placeholder.svg`
  - `public/assets/sfx/heartbeat-placeholder.wav`

## Replace later
- add your final logo in `public/assets/images/`
- replace placeholder flame art if desired
- replace heartbeat WAV with your preferred audio file and update `HEARTBEAT_SFX_SRC` in `src/App.jsx`
- expand category/prompt data in `src/data/categories.js`
- expand copy in `src/data/copy.js`
- expand names in `src/data/names.js`

## Audio Architecture Requirement
- `Grill 'Em` requires voice I/O:
  - player questions captured via device microphone
  - AI responses spoken back using TTS
- This same voice pipeline should be designed as shared infrastructure for future online mode party chat (Jackbox-style multi-device sessions).

## Notes
This repo uses lightweight local UI wrappers in `src/components/ui/` so it can run without shadcn setup.
