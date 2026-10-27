import { useMemo } from 'react';
import { Flame } from 'lucide-react';

export default function NeonTwoTruthsRevealScreen({
  players,
  round,
  roundGains = {},
  roundBreakdown = {},
  onComplete,
  theme,
  TopFrame,
  GlassPanel,
  Button,
  playSfx = () => {},
}) {
  const presentations = round?.twoTruthsData?.presentationsByPlayerId || {};
  const submissions = round?.twoTruthsData?.submissionsByPlayerId || {};

  const rows = useMemo(
    () =>
      players.map((player) => ({
        player,
        presentation: presentations[player.id],
        submission: submissions[player.id],
        gain: roundGains[player.id] || 0,
        breakdown: roundBreakdown[player.id] || {},
      })),
    [players, presentations, submissions, roundGains, roundBreakdown],
  );

  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-3xl space-y-4 px-1 py-4">
        <GlassPanel className="rounded-[2.5rem] border-orange-400/30 bg-black/35 p-6 text-center">
          <div className="pof-heading text-xs tracking-[0.35em] text-orange-200/80">
            Two Truths, One Fire
          </div>
          <h2 className="pof-heading mt-2 text-3xl text-yellow-300">The lies are lit</h2>
        </GlassPanel>
        {rows.map(({ player, presentation, submission, gain, breakdown }) => {
          const burnedOut = submission?.burnedOut || presentation?.burnedOut;
          return (
            <GlassPanel
              key={player.id}
              className="rounded-2xl border-white/10 bg-black/25 p-4"
              data-testid={`twotruths-reveal-${player.id}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="pof-heading text-lg text-cyan-200">{player.name}</div>
                <div className="pof-heading text-sm text-yellow-300">+{gain}</div>
              </div>
              {burnedOut ? (
                <div
                  className="pof-heading mt-3 rounded-xl border border-red-400/40 bg-red-500/15 px-3 py-4 text-center text-red-200"
                  data-testid="twotruths-burned-out"
                >
                  Burned out
                </div>
              ) : (
                <ul className="mt-3 space-y-2">
                  {(presentation?.items || []).map((text, index) => {
                    const isLie = index === presentation.lieIndex;
                    return (
                      <li
                        key={index}
                        className={`pof-body rounded-xl border px-3 py-2 text-sm font-medium ${
                          isLie
                            ? 'border-orange-300 bg-gradient-to-r from-orange-500/35 to-red-600/30 text-yellow-100 shadow-[0_0_18px_rgba(255,90,0,0.45)]'
                            : 'border-white/10 bg-white/5 text-white/85'
                        }`}
                      >
                        {isLie && (
                          <Flame className="mr-1 inline h-4 w-4 text-orange-300" aria-hidden />
                        )}
                        {text}
                        {isLie ? ' — THE LIE' : ''}
                      </li>
                    );
                  })}
                </ul>
              )}
              {!burnedOut && (
                <div className="pof-body mt-2 text-xs text-white/55">
                  Fooled {breakdown.fooledCount || 0} · Correct spots{' '}
                  {breakdown.voteHit || 0}
                </div>
              )}
            </GlassPanel>
          );
        })}
        <div className="flex justify-center pt-2">
          <Button
            data-testid="twotruths-reveal-continue"
            className="pof-btn pof-btn-fire pof-focus pof-heading h-14 px-10"
            onClick={() => {
              playSfx();
              onComplete();
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </TopFrame>
  );
}
