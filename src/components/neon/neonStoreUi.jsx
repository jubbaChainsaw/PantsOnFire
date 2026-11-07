import { tapFx } from '../../lib/pofFx.js';

export function DownloadBadge({ label, tone = 'neutral' }) {
  const cls =
    tone === 'success'
      ? 'border-emerald-300/40 bg-emerald-500/20 text-emerald-100'
      : tone === 'action'
        ? 'border-cyan-300/40 bg-cyan-500/15 text-cyan-50'
        : 'border-white/15 bg-white/10 text-white/80';
  return (
    <span
      className={`pof-heading rounded-full border px-2 py-0.5 text-[0.65rem] tracking-wide ${cls}`}
    >
      {label}
    </span>
  );
}

export function StoreActionChip({ label, onClick, variant = 'cyan' }) {
  const tone =
    variant === 'amber'
      ? 'border-yellow-300/45 bg-yellow-400/15 text-yellow-100'
      : 'border-cyan-300/45 bg-cyan-500/15 text-cyan-100';
  return (
    <button
      type="button"
      className={`pof-heading inline-flex min-h-0 w-auto shrink-0 rounded-full border px-2.5 py-0.5 text-[0.65rem] tracking-wide ${tone}`}
      onClick={() => {
        tapFx();
        onClick?.();
      }}
    >
      {label}
    </button>
  );
}
