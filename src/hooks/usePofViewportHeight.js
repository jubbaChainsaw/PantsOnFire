import { useEffect } from 'react';

/** Sets --pof-vh (1% of innerHeight) for WebViews where 100dvh is unreliable. */
export function usePofViewportHeight() {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const apply = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        '--pof-vh',
        `${Math.max(1, height) * 0.01}px`,
      );
    };
    apply();
    window.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('resize', apply);
    window.visualViewport?.addEventListener('scroll', apply);
    return () => {
      window.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('resize', apply);
      window.visualViewport?.removeEventListener('scroll', apply);
    };
  }, []);
}
