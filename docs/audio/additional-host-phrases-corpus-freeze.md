# Modular host banter — frozen fragment corpus (t220u)

**Status:** frozen for parent/narrator handoff — `frozenCorpusId` and `corpusSha256` in `docs/audio/additional-host-phrases-manifest.json`.

## What changed vs placeholder “Player” lines

The three picker **export** strings must **not** contain the literal word `Player`; runtime uses **name audio** (persona catalog) + **fixed fragments** + `buildComposedSubtitleLine` for full subtitles. Manifest rows use only the fixed fragments.

## Diff vs git baselines (for reuse / no wasted regen)

Compare the committed manifest after this freeze:

```bash
git diff 4de7c9e HEAD -- docs/audio/additional-host-phrases-manifest.json
git diff 09a8180 HEAD -- docs/audio/additional-host-phrases-manifest.json
```

**Reuse rule:** if a fragment’s **words** match an existing MP3 (e.g. bank `e639a9`), **reuse** the file; regenerate only when the spoken words change (not for cosmetic casing/punctuation unless you intentionally rebake audio).

## Shared theme paths (deliberate)

`getIanPosterThemeSlug('Cowboys')`, `('Gangsters')`, and `('Cops and Robbers')` all resolve to `cops-and-robbers`. The additional-host manifest lists the same `stableFilename` under each theme name on purpose — **one folder, multiple theme rows** — not accidental overwrite.

## Counts

- **112** manifest rows = **14** unique fragment texts × **8** Ian Poster voice themes (see `lineCount` / `uniqueFragmentCount` in the JSON). One fragment (`Alright —`) is **persona-mode-only** for picker variant **v2** (audio: **lead → NAME →** suffix; subtitle unchanged: `Alright {name} — …`). **v3** persona audio: **NAME →** “stops here.” fragment; subtitle: `{name}. The wheel of bad decisions stops here.`
