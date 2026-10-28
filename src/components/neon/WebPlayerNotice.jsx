import React from 'react';
import { Smartphone } from 'lucide-react';
import { MOBILE_STORE_LINKS } from '../../lib/webPlayerMode.js';

/**
 * Friendly UK copy: purchases sync, but hosting and themed content need the app.
 */
export default function WebPlayerNotice({
  variant = 'home',
  className = '',
  dataTestId = 'web-player-notice',
}) {
  const compact = variant === 'shop';
  return (
    <aside
      className={`rounded-2xl border border-amber-300/35 bg-amber-500/10 px-4 py-3 text-left ${className}`}
      data-testid={dataTestId}
    >
      <div className="flex items-start gap-2">
        <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-amber-200" aria-hidden />
        <div className="min-w-0">
          <p className="pof-heading text-sm text-amber-100">
            {compact ? 'Play on your phone or tablet' : 'Website player mode'}
          </p>
          <p className="pof-desc mt-1 text-xs leading-relaxed text-white/80">
            {compact ? (
              <>
                You can buy upgrades here and they will sync to your account. To{' '}
                <strong className="font-semibold text-white">host games</strong> or{' '}
                <strong className="font-semibold text-white">use themes, personas and add-ons</strong>,
                open Pants on Fire on an Android or Apple device signed in with the same account.
              </>
            ) : (
              <>
                Join online lobbies with a code from your host. Creating games, hosting lobbies, and
                using purchased themes and personas are only available in the{' '}
                <strong className="font-semibold text-white">Android</strong> or{' '}
                <strong className="font-semibold text-white">Apple</strong> app — purchases you make
                here still sync to your account.
              </>
            )}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={MOBILE_STORE_LINKS.android}
              className="pof-heading rounded-full border border-cyan-300/40 bg-cyan-500/15 px-3 py-1 text-[0.62rem] text-cyan-50"
              data-testid="web-store-link-android"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Play
            </a>
            <a
              href={MOBILE_STORE_LINKS.ios}
              className="pof-heading rounded-full border border-fuchsia-300/40 bg-fuchsia-500/15 px-3 py-1 text-[0.62rem] text-fuchsia-50"
              data-testid="web-store-link-ios"
              target="_blank"
              rel="noopener noreferrer"
            >
              App Store
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}
