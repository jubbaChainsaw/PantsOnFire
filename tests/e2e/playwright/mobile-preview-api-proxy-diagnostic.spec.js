import { test, expect } from '@playwright/test';

/**
 * Diagnostic: `npm run test:mobile-dist-smoke` runs `vite preview` only (port 4177).
 * Unlike `npm run dev`, preview does not proxy `/api` to the lobby server, so auth
 * probes return HTML shell or non-API responses when nothing listens on 8787.
 * This is intentional evidence for the mobile-auth / proxy gap — not a production fix.
 */
test('diagnostic: mobile dist preview does not proxy /api/auth/status to lobby', async ({
  request,
}) => {
  const res = await request.get('/api/auth/status', {
    headers: { Accept: 'application/json' },
  });
  const body = await res.text();
  const looksLikeSpaShell = /<!doctype html/i.test(body) || /<html[\s>]/i.test(body);
  const isApiShape =
    !looksLikeSpaShell &&
    body.trim().startsWith('{') &&
    /"ok"\s*:/.test(body);

  expect(
    isApiShape,
    `Expected non-JSON or SPA fallback without lobby proxy; got status=${res.status()} bodyStart=${body.slice(0, 120)}`,
  ).toBe(false);
});
