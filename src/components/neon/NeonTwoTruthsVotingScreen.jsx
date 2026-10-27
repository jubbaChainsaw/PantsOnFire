import { useMemo } from 'react';
import { Vote } from 'lucide-react';

export default function NeonTwoTruthsVotingScreen({
  players,
  round,
  votesByVoterId,
  setVotesByVoterId,
  onSubmitVotes,
  votingPlayerOrder = [],
  onlineMode = false,
  onlinePlayerId = '',
  submitPending = false,
  TopFrame,
  GlassPanel,
  Progress,
  ScoreStrip = () => null,
  totalRounds,
  theme,
}) {
  const presentations = round?.twoTruthsData?.presentationsByPlayerId || {};
  const authors = players.filter((player) => {
    const deck = presentations[player.id];
    return deck && !deck.burnedOut && deck.items?.length === 3;
  });

  const localVoters = useMemo(() => {
    if (onlineMode) {
      return onlinePlayerId ? players.filter((p) => p.id === onlinePlayerId) : [];
    }
    const order = votingPlayerOrder.length
      ? votingPlayerOrder
      : players.map((p) => p.id);
    const pending = order
      .map((id) => players.find((p) => p.id === id))
      .filter(Boolean)
      .filter((voter) => {
        const votes = votesByVoterId[voter.id] || {};
        const needed = authors.filter((a) => a.id !== voter.id);
        return needed.some((a) => votes[a.id] === undefined);
      });
    return pending.length ? [pending[0]] : [];
  }, [players, votingPlayerOrder, votesByVoterId, authors, onlineMode, onlinePlayerId]);

  const activeVoter = localVoters[0] || null;
  const voteTargetAuthors = activeVoter
    ? authors.filter((a) => a.id !== activeVoter.id)
    : [];

  const allLocalDone =
    !onlineMode &&
    players.every((voter) => {
      const votes = votesByVoterId[voter.id] || {};
      return authors
        .filter((a) => a.id !== voter.id)
        .every((a) => votes[a.id] !== undefined);
    });

  const pickLie = (voterId, authorId, lieIndex) => {
    setVotesByVoterId((current) => ({
      ...current,
      [voterId]: {
        ...(current[voterId] || {}),
        [authorId]: lieIndex,
      },
    }));
  };

  return (
    <TopFrame theme={theme}>
      <div className="mx-auto max-w-5xl space-y-5 px-1">
        <ScoreStrip
          players={players}
          roundNumber={round.roundNumber}
          totalRounds={totalRounds}
          themeName={theme}
        />
        <GlassPanel className="rounded-[2.5rem] border-fuchsia-400/20 bg-black/25 p-6">
          <h2 className="text-3xl font-black text-yellow-300">Spot the lie</h2>
          <p className="mt-2 text-white/75" data-testid="twotruths-voting-pass">
            {activeVoter ? (
              <>
                Pass the phone to{' '}
                <span className="font-semibold text-cyan-300">{activeVoter.name}</span>
                . Pick the lie in each list.
              </>
            ) : (
              'All votes are in.'
            )}
          </p>
          {activeVoter &&
            voteTargetAuthors.map((author) => {
              const deck = presentations[author.id];
              return (
                <div
                  key={`${activeVoter.id}-${author.id}`}
                  data-testid={`twotruths-author-panel-${author.id}`}
                >
                <GlassPanel
                  className="mt-5 rounded-2xl border-white/10 bg-black/20 p-4"
                >
                  <div className="font-black text-lg text-cyan-200">{author.name}</div>
                  <div className="mt-3 grid gap-2">
                    {deck.items.map((text, index) => (
                      <button
                        key={index}
                        type="button"
                        data-testid={`twotruths-vote-${author.id}-${index}`}
                        className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold ${
                          votesByVoterId[activeVoter.id]?.[author.id] === index
                            ? 'border-yellow-300 bg-yellow-300/20 text-yellow-100'
                            : 'border-white/15 bg-white/5 text-white/90'
                        }`}
                        onClick={() => pickLie(activeVoter.id, author.id, index)}
                        disabled={submitPending}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                </GlassPanel>
                </div>
              );
            })}
          <div className="mt-8 flex justify-center">
            {onlineMode ? (
              <button
                type="button"
                data-testid="twotruths-submit-votes"
                className="pof-btn pof-btn-fire pof-focus h-14 px-8"
                disabled={submitPending || !activeVoter}
                onClick={onSubmitVotes}
              >
                <Vote className="mr-2 inline h-5 w-5" />
                Submit votes
              </button>
            ) : (
              allLocalDone && (
                <button
                  type="button"
                  data-testid="twotruths-submit-votes"
                  className="pof-btn pof-btn-fire pof-focus h-14 px-8"
                  onClick={onSubmitVotes}
                >
                  Reveal results
                </button>
              )
            )}
          </div>
        </GlassPanel>
      </div>
    </TopFrame>
  );
}
