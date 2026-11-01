# One Word round — host voice lines to record

The **One Word** UI is implemented in `OneWordRoundScreen.jsx` (pass-the-phone card + online mic/text turn). Spoken host audio uses the Ian Poster TTS pipeline (`hostVoiceLineMap.js` + `/assets/audio/host/{theme}/tts/`).

## In-app copy (on-screen; works without new MP3s)

| Context | Line |
|---------|------|
| Turn headline | `{PlayerName}, say your one word!` (dynamic per turn) |
| Hint | `Pick one word that relates to your prompt. Don't make it too obvious, or the liar can blend in!` |
| Pass-the-phone | `Pass the phone to {PlayerName} to say their word out loud.` |
| Local advance | `Next player` / `Discussion time!` (button label) |

## New MP3s recommended (per Ian Poster theme slug)

Register in `ianPosterThemeVoice` → `flowCopy` (or dedicated one-word keys) and map in `hostVoiceLineMap.js` so `getHostVoiceSrcCandidatesForLine` resolves files.

| lineKey / purpose | Spoken line | Suggested filename pattern |
|-------------------|-------------|----------------------------|
| `discussion-from-one-word` | `Discussion time!` | `{slug}_discussion_from_one_word_01.mp3` (played when entering discussion after one-word; see `DiscussionTimeHostVoice` in `App.jsx`) |
| One-word phase intro (optional) | `One word round!` | `{slug}_one_word_intro_01.mp3` |
| Turn prompt (optional generic) | `Say your one word!` | `{slug}_one_word_turn_01.mp3` (player name stays on-screen; avoid per-name recordings) |

**Note:** Turn lines with embedded player names are **text-only** today (`buildOneWordHostLine`). Only add themed MP3s for generic stingers unless you invest in TTS.

## Themes needing files

Same set as other Ian Poster host packs: every theme in `IAN_POSTER_VOICE_THEME_NAMES` (Default + DLC themes with host voice enabled).
