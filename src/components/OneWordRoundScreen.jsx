import { useEffect, useState } from "react";
import { Check, Mic, MicOff } from "lucide-react";
import { filterProfanity } from "../lib/profanityFilter.js";

export const ONE_WORD_HINT =
  "Pick one word that relates to your prompt. Don't make it too obvious, or the liar can blend in!";

export function buildOneWordHostLine(playerName = "Player") {
  const name = String(playerName || "Player").trim() || "Player";
  return `${name}, say your one word!`;
}

function validateTypedWord(raw = "") {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return { ok: false, message: "Type one word first." };
  if (/\s/.test(trimmed)) return { ok: false, message: "One word only — no spaces." };
  const filtered = filterProfanity(trimmed);
  if (filtered !== trimmed) return { ok: false, message: "That word isn't allowed." };
  return { ok: true, word: trimmed };
}

function PlayerOneWordStrip({
  players,
  oneWordByPlayerId,
  oneWordSpokenByPlayerId,
  oneWordSkippedByPlayerId,
  currentPlayerId,
  themeName = "Default",
}) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {players.map((player, index) => {
        const word = oneWordByPlayerId?.[player.id];
        const spoken = oneWordSpokenByPlayerId?.[player.id];
        const skipped = oneWordSkippedByPlayerId?.[player.id];
        const isCurrent = player.id === currentPlayerId;
        return (
          <div
            key={player.id}
            className={`flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold ${
              isCurrent
                ? "border-yellow-300/70 bg-yellow-400/20 text-yellow-50"
                : "border-white/15 bg-white/5 text-white/85"
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[0.55rem] font-bold">
              {(player.name || "?").slice(0, 1).toUpperCase()}
            </span>
            <span className="max-w-[5rem] truncate">{player.name}</span>
            {word ? (
              <span className="text-cyan-200">&ldquo;{word}&rdquo;</span>
            ) : spoken ? (
              <Check className="h-3.5 w-3.5 text-emerald-300" aria-label="said it" />
            ) : skipped ? (
              <span className="text-white/50">—</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function OneWordRoundPanel({
  players = [],
  currentPlayerId = "",
  currentPlayerName = "Player",
  isLocalTurn = false,
  onlineMode = false,
  turnDeadlineAt = "",
  oneWordByPlayerId = {},
  oneWordSpokenByPlayerId = {},
  oneWordSkippedByPlayerId = {},
  hostLine = "",
  hintLine = ONE_WORD_HINT,
  micAvailable = true,
  micPermissionDenied = false,
  voiceChatEnabled = true,
  onSubmitTyped = async () => {},
  onDoneSpeaking = async () => {},
  onLocalNext = () => {},
  isLastLocalTurn = false,
  submitPending = false,
  themeName = "Default",
}) {
  const [typedWord, setTypedWord] = useState("");
  const [typedError, setTypedError] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(null);

  const useTextFallback =
    !micAvailable || micPermissionDenied || !voiceChatEnabled;

  useEffect(() => {
    if (!onlineMode || !turnDeadlineAt) {
      setSecondsLeft(null);
      return undefined;
    }
    const tick = () => {
      const ms = Date.parse(turnDeadlineAt) - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(ms / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [onlineMode, turnDeadlineAt, currentPlayerId]);

  useEffect(() => {
    setTypedWord("");
    setTypedError("");
  }, [currentPlayerId]);

  const headline = hostLine || buildOneWordHostLine(currentPlayerName);

  async function handleSubmitTyped() {
    const validated = validateTypedWord(typedWord);
    if (!validated.ok) {
      setTypedError(validated.message);
      return;
    }
    setTypedError("");
    await onSubmitTyped(validated.word);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 text-center">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200/90">
        One word round
      </div>
      <h2 className="text-2xl font-black text-yellow-200">{headline}</h2>
      <p className="text-sm font-medium text-white/90">{hintLine}</p>
      {onlineMode && secondsLeft != null && (
        <div className="text-xs font-semibold text-cyan-100/80">
          {secondsLeft}s left this turn
        </div>
      )}

      <PlayerOneWordStrip
        players={players}
        oneWordByPlayerId={oneWordByPlayerId}
        oneWordSpokenByPlayerId={oneWordSpokenByPlayerId}
        oneWordSkippedByPlayerId={oneWordSkippedByPlayerId}
        currentPlayerId={currentPlayerId}
        themeName={themeName}
      />

      {onlineMode && isLocalTurn && (
        <div className="mt-5 space-y-3 text-left">
          {useTextFallback ? (
            <>
              <div className="flex items-center gap-2 text-xs text-white/75">
                <MicOff className="h-4 w-4" />
                Mic off or unavailable — type your one word instead.
              </div>
              <input
                type="text"
                value={typedWord}
                onChange={(event) => setTypedWord(event.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-white"
                placeholder="One word…"
                autoComplete="off"
                data-testid="one-word-type-input"
              />
              {typedError && (
                <div className="text-xs font-semibold text-red-200">{typedError}</div>
              )}
              <button
                type="button"
                className="pof-btn pof-btn-fire pof-btn-sm pof-focus w-full"
                disabled={submitPending}
                data-testid="one-word-submit-typed"
                onClick={() => void handleSubmitTyped()}
              >
                Submit word
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 text-sm text-emerald-100">
                <Mic className="h-4 w-4" />
                Your mic is live — say one word, then tap Done.
              </div>
              <button
                type="button"
                className="pof-btn pof-btn-blue pof-btn-lg pof-focus w-full text-lg font-black"
                disabled={submitPending}
                data-testid="one-word-done-speaking"
                onClick={() => void onDoneSpeaking()}
              >
                Done
              </button>
            </>
          )}
        </div>
      )}

      {!onlineMode && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-white/80 text-center">
            Pass the phone to{" "}
            <strong className="text-yellow-200">{currentPlayerName}</strong> to say their word out
            loud.
          </p>
          <button
            type="button"
            className="pof-btn pof-btn-blue pof-btn-sm pof-focus"
            data-testid="one-word-local-next"
            onClick={onLocalNext}
          >
            {isLastLocalTurn ? "Discussion time!" : "Next player"}
          </button>
        </div>
      )}
    </div>
  );
}
