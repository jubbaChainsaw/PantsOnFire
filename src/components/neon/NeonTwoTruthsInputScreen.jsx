import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import NeonTimerBar from './NeonTimerBar.jsx';
import { useTwoTruthsInputTimer } from '../../hooks/useTwoTruthsInputTimer.js';
import { handleTwoTruthsTimeout } from '../../lib/twoTruthsOneFire.js';

export default function NeonTwoTruthsInputScreen({
  players,
  round,
  inputPlayerIndex = 0,
  passLine = '',
  onSubmitSubmission,
  onlineMode = false,
  localPlayerId = '',
  theme = 'Default',
  TopFrame,
  GlassPanel,
  Button,
  Input,
  Label,
}) {
  const player = players[inputPlayerIndex];
  const promptText =
    round?.commonPrompt || round?.twoTruthsData?.promptText || 'Name three related things.';
  const [items, setItems] = useState(['', '', '']);
  const [lieIndex, setLieIndex] = useState(null);

  useEffect(() => {
    setItems(['', '', '']);
    setLieIndex(null);
  }, [player?.id, round?.promptKey]);

  const simulateOnlineTimer =
    import.meta.env.VITE_E2E_SIMULATE_ONLINE_TWOTRUTHS_TIMER === '1' ||
    (typeof window !== 'undefined' &&
      window.localStorage?.getItem('pof-e2e-online-twotruths-timer') === '1');
  const timerEnabled =
    (onlineMode &&
      Boolean(localPlayerId) &&
      player?.id === localPlayerId) ||
    simulateOnlineTimer;

  const { secondsLeft, totalSeconds, warningActive } = useTwoTruthsInputTimer({
    enabled: timerEnabled,
    onTimeout: () => {
      const outcome = handleTwoTruthsTimeout({ items, lieIndex });
      onSubmitSubmission(outcome.submission);
    },
  });

  const submitManual = () => {
    const trimmed = items.map((v) => String(v || '').trim());
    if (!trimmed.every(Boolean)) return;
    if (lieIndex === null || lieIndex === undefined) return;
    onSubmitSubmission({
      items: trimmed,
      lieIndex: Number(lieIndex),
      burnedOut: false,
      timedOut: false,
    });
  };

  if (!player) return null;

  return (
    <TopFrame theme={theme}>
      <div className="mx-auto flex h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col gap-3 px-1">
        {timerEnabled && (
          <div
            className={warningActive ? 'animate-pulse' : ''}
            data-testid="twotruths-input-timer"
          >
            <NeonTimerBar secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
          </div>
        )}
        <h2
          className="text-center text-2xl font-black text-yellow-300"
          data-testid="twotruths-pass-heading"
        >
          {onlineMode && localPlayerId === player.id
            ? 'Your turn'
            : `Pass the phone to ${player.name}`}
        </h2>
        {passLine && (
          <div className="rounded-2xl border border-fuchsia-200/35 bg-fuchsia-500/25 px-4 py-2 text-center text-sm font-semibold text-white/90">
            {passLine}
          </div>
        )}
        <GlassPanel className="flex-1 rounded-[2rem] border-cyan-400/25 bg-black/30 p-5">
          <div className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">
            Two Truths, One Fire
          </div>
          <p
            className="mt-3 text-lg font-black leading-snug text-white"
            data-testid="twotruths-prompt"
          >
            {promptText}
          </p>
          <p className="mt-2 text-sm text-white/70">
            Type two truths and one lie. Mark which line is the lie, then submit.
          </p>
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <Label className="text-white/75">Item {index + 1}</Label>
                <Input
                  data-testid={`twotruths-item-${index}`}
                  value={items[index]}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = event.target.value.slice(0, 120);
                    setItems(next);
                  }}
                  className="mt-1 rounded-2xl border border-white/15 bg-white/5 text-white"
                  disabled={onlineMode && localPlayerId && localPlayerId !== player.id}
                />
                <button
                  type="button"
                  data-testid={`twotruths-lie-${index}`}
                  className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm font-bold ${
                    lieIndex === index
                      ? 'border-orange-300 bg-orange-500/30 text-yellow-100'
                      : 'border-white/15 bg-white/5 text-white/80'
                  }`}
                  onClick={() => setLieIndex(index)}
                >
                  <Flame className="mr-1 inline h-4 w-4" aria-hidden />
                  {lieIndex === index ? 'This is the lie' : 'Mark as lie'}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              data-testid="twotruths-submit"
              className="pof-btn pof-btn-fire pof-focus h-14 px-10 text-lg font-black"
              onClick={submitManual}
            >
              Submit
            </Button>
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
