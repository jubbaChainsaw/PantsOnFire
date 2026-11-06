/**
 * t220u — Fixed script bank for modular host banter (prefix / suffix / name-free clips).
 * Parent ElevenLabs generation uses stable filenames; see docs/audio/additional-host-phrases-manifest.json
 * Design: docs/design/t220u-modular-name-banter-design.md (§7). `exportSpokenText` is the literal line for
 * parent TTS (Player placeholder); runtime uses `buildSpokenLine` / `buildExportSpokenText` in the engine.
 */

/**
 * @typedef {{ id: string; segmentRole: 'prefix'|'suffix'|'name_free'; filenameStem: string; spokenText?: string; exportSpokenText?: string; buildSpokenLine?: (name: string) => string }} ModularBanterScriptDef
 */

/** @type {ReadonlyArray<ModularBanterScriptDef>} */
export const MODULAR_BANTER_FIXED_SCRIPTS = Object.freeze([
  {
    id: 'banter_picker_prefix_v1',
    segmentRole: 'prefix',
    filenameStem: 'banter_picker_prefix_v1',
    exportSpokenText: "Player, you're choosing the chaos this round.",
    buildSpokenLine: (chooserName) => {
      const n = String(chooserName || '').trim();
      if (!n) return "You're choosing the chaos this round.";
      return `${n}, you're choosing the chaos this round.`;
    },
  },
  {
    id: 'banter_picker_prefix_v2',
    segmentRole: 'prefix',
    filenameStem: 'banter_picker_prefix_v2',
    exportSpokenText:
      'Alright Player — pick a mode, pick a category, try not to look guilty before we start.',
    buildSpokenLine: (chooserName) => {
      const n = String(chooserName || '').trim();
      if (!n) {
        return 'Pick a mode, pick a category, try not to look guilty before we start.';
      }
      return `Alright ${n} — pick a mode, pick a category, try not to look guilty before we start.`;
    },
  },
  {
    id: 'banter_picker_prefix_v3',
    segmentRole: 'prefix',
    filenameStem: 'banter_picker_prefix_v3',
    exportSpokenText: 'The wheel of bad decisions stops with Player.',
    buildSpokenLine: (chooserName) => {
      const n = String(chooserName || '').trim();
      if (!n) return 'The wheel of bad decisions stops here.';
      return `The wheel of bad decisions stops with ${n}.`;
    },
  },
  {
    id: 'banter_reveal_suffix_singular_v1',
    segmentRole: 'suffix',
    spokenText: 'Was bluffing the whole time.',
    exportSpokenText: 'Was bluffing the whole time.',
    filenameStem: 'banter_reveal_suffix_singular_v1',
  },
  {
    id: 'banter_reveal_suffix_singular_v2',
    segmentRole: 'suffix',
    spokenText: 'Called it.',
    exportSpokenText: 'Called it.',
    filenameStem: 'banter_reveal_suffix_singular_v2',
  },
  {
    id: 'banter_result_caught_v1',
    segmentRole: 'name_free',
    spokenText: 'That round had actual detective energy. Shocking, honestly.',
    exportSpokenText: 'That round had actual detective energy. Shocking, honestly.',
    filenameStem: 'banter_result_caught_v1',
  },
  {
    id: 'banter_result_caught_v2',
    segmentRole: 'name_free',
    spokenText: 'Clean vote — the table actually agreed. Suspiciously organised.',
    exportSpokenText: 'Clean vote — the table actually agreed. Suspiciously organised.',
    filenameStem: 'banter_result_caught_v2',
  },
  {
    id: 'banter_result_escaped_v1',
    segmentRole: 'name_free',
    spokenText: 'Somehow the lie walked out wearing flip-flops. Tough scene.',
    exportSpokenText: 'Somehow the lie walked out wearing flip-flops. Tough scene.',
    filenameStem: 'banter_result_escaped_v1',
  },
  {
    id: 'banter_result_escaped_v2',
    segmentRole: 'name_free',
    spokenText: 'The fib survived — not a compliment, just a fact.',
    exportSpokenText: 'The fib survived — not a compliment, just a fact.',
    filenameStem: 'banter_result_escaped_v2',
  },
  {
    id: 'banter_result_chaos_v1',
    segmentRole: 'name_free',
    spokenText: 'That was a chaotic round. Beautiful, but chaotic.',
    exportSpokenText: 'That was a chaotic round. Beautiful, but chaotic.',
    filenameStem: 'banter_result_chaos_v1',
  },
  {
    id: 'banter_wrap_v1',
    segmentRole: 'name_free',
    spokenText: "That's a wrap — crown the chaos and run it back.",
    exportSpokenText: "That's a wrap — crown the chaos and run it back.",
    filenameStem: 'banter_wrap_v1',
  },
  {
    id: 'banter_reveal_liar_is_prefix_v1',
    segmentRole: 'prefix',
    spokenText: 'The liar is…',
    exportSpokenText: 'The liar is…',
    filenameStem: 'banter_reveal_liar_is_prefix_v1',
  },
  {
    id: 'banter_reveal_plural_v1',
    segmentRole: 'prefix',
    spokenText: 'The liars are…',
    exportSpokenText: 'The liars are…',
    filenameStem: 'banter_reveal_plural_v1',
  },
]);

export const BANTER_EVENT_IDS = Object.freeze({
  pickerTurn: 'picker_turn',
  liarRevealSingular: 'liar_reveal_singular',
  liarRevealPlural: 'liar_reveal_plural',
  resultBanter: 'result_banter',
  finalWrap: 'final_wrap',
});
