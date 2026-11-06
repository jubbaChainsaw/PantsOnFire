/**
 * t220u — Fixed script bank for modular host banter (prefix / suffix / name-free clips).
 * Parent ElevenLabs generation uses stable filenames; see docs/audio/additional-host-phrases-manifest.json
 */

/** @type {ReadonlyArray<{ id: string; spokenText: string; segmentRole: 'prefix'|'suffix'|'name_free'; filenameStem: string }>} */
export const MODULAR_BANTER_FIXED_SCRIPTS = Object.freeze([
  {
    id: 'banter_picker_prefix_v1',
    segmentRole: 'prefix',
    spokenText: "you're choosing the chaos this round.",
    filenameStem: 'banter_picker_prefix_v1',
  },
  {
    id: 'banter_picker_prefix_v2',
    segmentRole: 'prefix',
    spokenText: 'pick a mode, pick a category, try not to look guilty before we start.',
    filenameStem: 'banter_picker_prefix_v2',
  },
  {
    id: 'banter_picker_prefix_v3',
    segmentRole: 'prefix',
    spokenText: 'the wheel of bad decisions stops here.',
    filenameStem: 'banter_picker_prefix_v3',
  },
  {
    id: 'banter_reveal_suffix_singular_v1',
    segmentRole: 'suffix',
    spokenText: 'was bluffing the whole time.',
    filenameStem: 'banter_reveal_suffix_singular_v1',
  },
  {
    id: 'banter_reveal_suffix_singular_v2',
    segmentRole: 'suffix',
    spokenText: '— called it.',
    filenameStem: 'banter_reveal_suffix_singular_v2',
  },
  {
    id: 'banter_result_caught_v1',
    segmentRole: 'name_free',
    spokenText: 'that round had actual detective energy. shocking, honestly.',
    filenameStem: 'banter_result_caught_v1',
  },
  {
    id: 'banter_result_caught_v2',
    segmentRole: 'name_free',
    spokenText: 'clean vote — the table actually agreed. suspiciously organised.',
    filenameStem: 'banter_result_caught_v2',
  },
  {
    id: 'banter_result_escaped_v1',
    segmentRole: 'name_free',
    spokenText: 'somehow the lie walked out wearing flip-flops. tough scene.',
    filenameStem: 'banter_result_escaped_v1',
  },
  {
    id: 'banter_result_escaped_v2',
    segmentRole: 'name_free',
    spokenText: 'the fib survived — not a compliment, just a fact.',
    filenameStem: 'banter_result_escaped_v2',
  },
  {
    id: 'banter_result_chaos_v1',
    segmentRole: 'name_free',
    spokenText: 'that was a chaotic round. beautiful, but chaotic.',
    filenameStem: 'banter_result_chaos_v1',
  },
  {
    id: 'banter_wrap_v1',
    segmentRole: 'name_free',
    spokenText: "that's a wrap — crown the chaos and run it back.",
    filenameStem: 'banter_wrap_v1',
  },
  {
    id: 'banter_reveal_liar_is_prefix_v1',
    segmentRole: 'prefix',
    spokenText: 'the liar is',
    filenameStem: 'banter_reveal_liar_is_prefix_v1',
  },
  {
    id: 'banter_reveal_plural_v1',
    segmentRole: 'name_free',
    spokenText: "we've got a whole team tonight.",
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
