# t220u — Modular name + host banter (design only, pending user sign-off)

**Status:** DESIGN / BRAINSTORM — **not implemented** in this batch.  
**Relationship to approved work:**

| Track | Scope | Status |
|--------|--------|--------|
| **Already approved (t213 / t214)** | Ian Poster re-record using `docs/audio/ian-poster-voice-refresh-manifest.json`; **missing round cues** (e.g. Two Truths phases, discussion bridge, one-word template) registered in `src/data/hostVoiceLineMap.js` | **Authorized** — parent runs ElevenLabs for voice `h3DRPfZTD0Z1BwDc142N` |
| **This doc (t220u)** | Extra **modular** lines: stitched name + prefix/suffix for picker, liar reveal, result quips — **beyond** the static line-per-string model | **Pending explicit user sign-off** — no expanded banter spend until approved |

**Constraints from product (this design respects them):**

- Light **13+** Ian Poster tone; aimed at **gameplay** (round flow, votes, picks), not personal identity attacks or voice characteristics.
- **No** unbounded runtime paid TTS or **new** per-session name generation — names come from **parent-approved** standalone lists (persona catalog and/or normalized custom display names).
- **No secrets/API** in this artifact.

---

## 1. How narration works today (inspection)

**Playback**

- `useIanPosterHostVoicePlayback` (`src/lib/hostSpeechPlayback.js`) resolves **one** spoken string → bundled MP3 via `getHostVoiceSrcCandidatesForLine` (normalized lowercase lookup in `src/data/hostVoiceLineMap.js`).
- Single `HTMLAudioElement` per hook; **no built-in queue** for A+B+C concatenation — chained advance is only in `useHostSpeechAutoAdvance` for **host intro** steps (`HostIntroScreen`).

**Key event hooks (client-owned today)**

- **Persona callout (persona-only):** `RevealScreen` / `LiarRevealScreen` — spoken line = persona **display** name (see `getPersonaCalloutLineTextForPlayer`). Multi-liar reveal uses **on-screen** copy join (`LiarRevealScreen` announcement lines); **no** Ian line for “The liars are …” name list today beyond persona callout when `liars.length === 1`.
- **Phase stings:** `DiscussionTimeHostVoice` (“Discussion time!”), `TwoTruthsPhaseHostVoice` (Three Truths narration strings from `TWO_TRUTHS_HOST_NARRATION`).
- **Flow copy:** rotating banks from `copyState` (not all wired to voice).

**Online / reconnect**

- Voice playback is **per-client React effect** driven by `line` + `lineKey`. **No** global server “narration event id” yet — duplicate risk if the same screen remounts with the same key or multiple clients all play host cue (today many cues are ambient / all devices; **design below** should pick **host-only** or **broadcast-once** semantics for new banter).

---

## 2. Modular vs 950×variants (recommendation)

| Approach | Clip count (order of magnitude) | Pros | Cons |
|----------|----------------------------------|------|------|
| **Full bespoke** (950 names × many variants) | **Huge** | Maximum natural sentences | Unmaintainable; parent already scoped **950** name clips separately |
| **Modular: prefix + name + suffix** | **Small** prefixes/suffixes + **950** (or fewer **canonical name forms**) + **optional** short connectors | Natural joins if TTS pacing matches; reuse across “liar is”, “your turn to pick”, results | Requires **consistent** name audio (trim silence, level), **join** strategy (pause/glue), and **grammar** templates (singular/plural) |
| **Hybrid** | Modular for **high-frequency** slots + a **small** bank of full-sentence **non-name** banter (no name) | Covers “bad round” / generic sass without 950×N | Still need rules so name lines don’t collide with generics |

**Recommendation:** **Modular with natural joins** for anything that must include **[FULL NAME]** repeatedly; keep a **separate small bank** (~20–40 clips) of **name-free** sass lines for result mood. Parent maintains **one neutral spoken form per catalog name** (already in flight); **custom** display names: **fallback** to generic line (“The liar’s exposed”) without per-name audio, or a **single** “Player” placeholder clip — **no** 950 retries for custom strings.

---

## 3. Name audio normalization (for splice-friendly joins)

Parent-generated name clips should follow **shared rules** so A+B doesn’t sound like two rooms:

- **Trim** leading/trailing silence to ~50–120 ms max padding (exact values TBD in audio QA).
- **No** trailing breath into the next segment on **name** files.
- **Intonation:** neutral announcement (not question) for middle names; **prefix** clips carry question/proclamation melody.
- **Variants:** optional second take only where grammar needs it (**“The liars are …”** vs **“The liar is …”**), not per name.
- **Custom names:** Unicode normalize (NFKC), strip control chars; cap length for subtitle; if no clip → **skip name segment** (see §6).

---

## 4. Event taxonomy (suggested — ownership & dedup)

| Event ID (conceptual) | When | Who may trigger voice | Dedup / reconnect |
|----------------------|------|------------------------|-------------------|
| `round_picker_turn` | Round-type choice; `round.chooserId` matches turn | **All clients** OK if identical cue **or** host-only policy — **prefer host-only broadcast** or **suppress if already played this round id** | Key: `${roundId}:picker:${chooserId}` |
| `liar_reveal_singular` | Liar reveal screen | All — **or** host-only for chatter overload | Key: `${roundId}:liar_reveal` |
| `liar_reveal_plural` | Multiple imposters | Template branch only | Same |
| `result_banter` | Results / transition | Host-only **or** once per `roundId` | Key: `${roundId}:result` |
| `discussion_bridge` | Already exists | As today | Existing `lineKey` |

**Online:** attach **`round.id`** (or server **`phaseUpdatedAt`**) to narration keys so **reconnect** replays **only** if explicitly “catch-up” UI (otherwise **skip** if key in `sessionStorage` for that round).

---

## 5. Anti-chatter rules

- **Cooldown:** per event **bucket** (e.g. `result_banter`) — min **N** rounds between reuse, or shuffle without repeat until pool exhausted.
- **Skip if:** voice muted, accessibility reduced motion (optional), **discussion / one-word active** (no overlay banter — only pre-baked short stings already scoped).
- **Subtitle sync:** for modular play, subtitles show **composed string** (prefix + name + suffix) **or** segment labels — implementation detail after sign-off; **no** spoiler text before public state (don’t say “liar” in picker line).

---

## 6. Placeholder conventions (sample script bank)

Use these placeholders in writing; implementation maps them to clip chains or generics.

- `[FULL_NAME]` — resolved audio from parent name list or **omitted** for custom names without a clip.
- `[NAME_LIST]` — comma-separated for multi-liar (consider **one** joint clip vs modular pieces).
- `[ROUND_TYPE]` — display name of mode (optional; may stay text-only).

---

## 7. Sample script bank (15 lines — 13+ gameplay sass, placeholders explicit)

**Round picker / turn**

1. `[FULL_NAME], you're choosing the chaos this round.`
2. `Alright [FULL_NAME] — pick a mode, pick a category, try not to look guilty before we start.`
3. `The wheel of bad decisions stops with [FULL_NAME].`

**Reveal — single liar (non-spoiling before public reveal — use only when UI already showing liar stage)**

4. `The liar is… [FULL_NAME].`
5. `Called it — [FULL_NAME] was bluffing the whole time.`
6. `Plot twist nobody paid for: [FULL_NAME].`

**Reveal — multiple liars**

7. `The liars are… [NAME_LIST].`
8. `We’ve got a whole team tonight — [NAME_LIST].`

**Results — caught / good pressure (uses public `imposterCaught` — don’t assert counts not in state)**

9. `That round had actual detective energy. Shocking, honestly.`
10. `Clean vote — the table actually agreed. Suspiciously organised.`

**Results — escaped / missed**

11. `Somehow the lie walked out wearing flip-flops. Tough scene.`
12. `The fib survived — not a compliment, just a fact.`

**“Bad round” / low-signal (no invented metrics — vague gameplay roast)**

13. `That was a chaotic round. Beautiful, but chaotic.`
14. `If that was strategy, it was strategy written in crayon.`

**Win / endgame (generic — no fabricated tournament losses)**

15. `That’s a wrap — crown the chaos and run it back.`

---

## 8. Comparison summary for approvers

- **950 standalone** name files**:** stays parent-owned; used anywhere we need **bare** address or **concat** in a **DAW** later — **not** 950 × 20 variant sentences.
- **Modular:** ~**30–60** host clips (prefix/suffix banks + grammar variants) + **950** names + **fallback generics** beats **thousands** of full-sentence files.
- **This design does not replace** approved **t214** round-cue lines in the manifest; it **adds** a **second layer** after sign-off.

---

## 9. Explicit pending sign-off checklist

- [ ] Modular vs hybrid scope (name-in-middle only vs small name-free bank)
- [ ] Online trigger: **host-only** vs **all clients**
- [ ] Custom name fallback: **silence name** vs **“Player”** clip vs **text-only**
- [ ] Subtitle policy for stitched audio
- [ ] Cooldown numbers (rounds / pools)

**Document path:** `docs/design/t220u-modular-name-banter-design.md` — suitable to paste or link from a review Page.
