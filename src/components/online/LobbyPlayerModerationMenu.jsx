import { useState } from 'react';
import { Flag, ShieldBan, UserX } from 'lucide-react';

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment' },
  { id: 'hate', label: 'Hate speech' },
  { id: 'sexual', label: 'Sexual content' },
  { id: 'spam', label: 'Spam' },
  { id: 'other', label: 'Other' },
];

export default function LobbyPlayerModerationMenu({
  player,
  isSelf = false,
  isHost = false,
  blocked = false,
  onReport,
  onBlock,
  onKick,
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('harassment');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (isSelf || !player?.id) return null;

  async function run(action) {
    setBusy(true);
    setMessage('');
    try {
      if (action === 'report') {
        await onReport?.({ reason, note });
        setMessage('Report sent.');
      } else if (action === 'block') {
        await onBlock?.();
        setMessage(blocked ? 'Unblocked.' : 'Blocked for you.');
      } else if (action === 'kick') {
        await onKick?.();
        setMessage('Player removed.');
      }
      setOpen(false);
    } catch (err) {
      setMessage(String(err?.message || err || 'Action failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative ml-auto shrink-0">
      <button
        type="button"
        className="rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-white/80"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid={`lobby-player-menu-${player.id}`}
      >
        ···
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-xl border border-white/15 bg-[#1a0337] p-2 shadow-xl">
          <div className="px-1 pb-1 text-[0.65rem] font-semibold text-cyan-100 truncate">
            {player.name}
          </div>
          <label className="block px-1 text-[0.58rem] uppercase tracking-wider text-white/50">
            Report reason
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REPORT_REASONS.map((entry) => (
              <option key={entry.id} value={entry.id} className="text-black">
                {entry.label}
              </option>
            ))}
          </select>
          <textarea
            className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
            rows={2}
            placeholder="Optional note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            disabled={busy}
            className="mt-2 flex w-full items-center gap-1 rounded-lg bg-rose-500/20 px-2 py-1.5 text-xs text-rose-100"
            onClick={() => run('report')}
          >
            <Flag className="h-3.5 w-3.5" />
            Report
          </button>
          <button
            type="button"
            disabled={busy}
            className="mt-1 flex w-full items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-1.5 text-xs text-amber-100"
            onClick={() => run('block')}
          >
            <ShieldBan className="h-3.5 w-3.5" />
            {blocked ? 'Unblock' : 'Block'}
          </button>
          {isHost && (
            <button
              type="button"
              disabled={busy}
              className="mt-1 flex w-full items-center gap-1 rounded-lg bg-fuchsia-500/15 px-2 py-1.5 text-xs text-fuchsia-100"
              onClick={() => run('kick')}
            >
              <UserX className="h-3.5 w-3.5" />
              Kick
            </button>
          )}
          {message && (
            <p className="mt-2 px-1 text-[0.62rem] text-cyan-100/90">{message}</p>
          )}
        </div>
      )}
    </div>
  );
}
