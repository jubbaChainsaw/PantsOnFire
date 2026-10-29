import { Clock } from 'lucide-react';

export default function NeonTimerBar({ secondsLeft, totalSeconds = 30 }) {
  const left = Math.max(0, Number(secondsLeft) || 0);
  const total = Math.max(1, Number(totalSeconds) || 30);
  return (
    <div className="pof-glass rounded-2xl px-3 py-2" data-testid="selection-timer">
      <div className="flex items-center justify-between gap-2">
        <div
          className={`pof-title flex items-center gap-1.5 text-2xl leading-none ${
            left <= 3
              ? 'animate-pulse text-fuchsia-300 drop-shadow-[0_0_12px_#ff2bd6]'
              : left <= 10
                ? 'text-orange-300'
                : 'text-cyan-200'
          }`}
        >
          <Clock size={20} aria-hidden />
          0:{String(left).padStart(2, '0')}
        </div>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-orange-400 to-yellow-300 shadow-[0_0_10px_#ff2bd6] transition-[width] duration-1000 ease-linear"
          style={{ width: `${(left / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
