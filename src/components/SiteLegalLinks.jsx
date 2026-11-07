export function SiteLegalLinks({ className = '' }) {
  const base =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://www.pantsonfire.app';
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-3 text-[0.65rem] uppercase tracking-[0.14em] text-white/55 ${className}`}
      data-testid="site-legal-links"
    >
      <a href={`${base}/privacy`} className="hover:text-cyan-200/90 underline-offset-2 hover:underline">
        Privacy
      </a>
      <span aria-hidden="true">·</span>
      <a
        href={`${base}/delete-account`}
        className="hover:text-cyan-200/90 underline-offset-2 hover:underline"
      >
        Delete account
      </a>
    </div>
  );
}
