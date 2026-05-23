# DLC host voice exports (Ian Poster)

Each DLC trio pack has its own folder with a **voice ID registry** and generated line lists for bulk TTS (e.g. ElevenLabs).

## Pack folders

| Pack ID | Display name | Themes |
|---------|--------------|--------|
| `wanted-better-alibis` | Wanted: Better Alibis | Cowboys, Gangsters, Wrestlers |
| `ye-olde-baloney` | Ye Olde Baloney | Vikings, Gladiators, Medieval |
| `myth-taken-identity` | Myth-Taken Identity | Royalty, Mythology (Gods & Legends), Time Travelers |
| `licence-to-fib` | Licence to Fib | Spies, Ninjas, Law and Order |
| `rank-and-file-mostly-file` | Rank & File (Mostly File) | Medical, Military, Flying Squad |
| `beast-mode-deceit` | Beast Mode: Deceit | Sports, Animals, Monsters |
| `ctrl-alt-elieve` | Ctrl+Alt+ELIEVE | Cyberpunk, Sci-Fi, Aliens |
| `dark-arts-krafty-lies` | Dark Arts & Krafty Lies | Wizards & Witches, Post-Apocalypse, Carnival |
| `drawn-to-lie` | Drawn to Lie | Under the Sea, Cartoons, Anime |
| `glitter-and-suspects` | Glitter & Suspects | Rock Stars, Drag Queens, Superheroes |

## Workflow (per pack)

1. Edit `exports/dlc/<pack-id>/host-voice-master.csv` — set `voice_id` per theme (can differ per theme in the same pack).
2. Ensure scripts exist in `src/data/dlc/ianPosterDlcThemeVoice.js` for those themes.
3. Export:

```bash
npm run host:export-dlc-voice -- --pack wanted-better-alibis
```

Outputs:

- `host-voice-lines.csv` — full metadata + SSML
- `host-voice-lines-ssml.csv` — compact for pipelines

4. Install generated MP3s under:

`public/assets/audio/host/<theme-slug>/tts/`

Core themes (non-DLC) use `exports/host-voice-master.csv` and `npm run host:export-voice-master`.
