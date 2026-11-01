import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import express from 'express';
import { createServer } from 'node:http';
import { createRateLimiter } from '../../server/rateLimit.js';

test('lobbyServer wires resumeLimiter and lookupLimiter on public round routes', () => {
  const src = readFileSync(new URL('../../server/lobbyServer.js', import.meta.url), 'utf8');
  assert.match(
    src,
    /app\.post\('\/api\/lobbies\/:code\/resume', resumeLimiter,/,
    'resume route must use resumeLimiter',
  );
  assert.match(
    src,
    /app\.get\('\/api\/lobbies\/:code\/round', lookupLimiter,/,
    'public round route must use lookupLimiter',
  );
  assert.match(
    src,
    /app\.get\('\/api\/lobbies\/:code\/round\/private', lookupLimiter,/,
    'private round route must use lookupLimiter',
  );
});

async function withTestServer(app, fn) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

async function expectRateLimitedAfterBurst(baseUrl, { method, path, max }) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  let lastStatus = 0;
  for (let i = 0; i < max + 1; i += 1) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...opts,
      body: method === 'POST' ? '{}' : undefined,
    });
    lastStatus = res.status;
    if (i < max) {
      assert.notEqual(res.status, 429, `request ${i + 1} should not be rate limited yet`);
    }
  }
  assert.equal(lastStatus, 429, 'final request should be rate limited');
  const body = await fetch(`${baseUrl}${path}`, {
    ...opts,
    body: method === 'POST' ? '{}' : undefined,
  }).then((r) => r.json());
  assert.equal(body.error, 'rate-limited');
}

test('resume and round read routes return 429 after limiter max', async () => {
  await withTestServer(
    (() => {
      const resumeLimiter = createRateLimiter({ windowMs: 60_000, max: 2 });
      const app = express();
      app.set('trust proxy', true);
      app.post('/api/lobbies/:code/resume', resumeLimiter, (_req, res) => {
        res.json({ ok: true });
      });
      return app;
    })(),
    async (baseUrl) => {
      await expectRateLimitedAfterBurst(baseUrl, {
        method: 'POST',
        path: '/api/lobbies/TEST/resume',
        max: 2,
      });
    },
  );

  await withTestServer(
    (() => {
      const lookupLimiter = createRateLimiter({ windowMs: 60_000, max: 2 });
      const app = express();
      app.set('trust proxy', true);
      app.get('/api/lobbies/:code/round', lookupLimiter, (_req, res) => {
        res.json({ ok: true });
      });
      return app;
    })(),
    async (baseUrl) => {
      await expectRateLimitedAfterBurst(baseUrl, {
        method: 'GET',
        path: '/api/lobbies/TEST/round',
        max: 2,
      });
    },
  );

  await withTestServer(
    (() => {
      const lookupLimiter = createRateLimiter({ windowMs: 60_000, max: 2 });
      const app = express();
      app.set('trust proxy', true);
      app.get('/api/lobbies/:code/round/private', lookupLimiter, (_req, res) => {
        res.json({ ok: true });
      });
      return app;
    })(),
    async (baseUrl) => {
      await expectRateLimitedAfterBurst(baseUrl, {
        method: 'GET',
        path: '/api/lobbies/TEST/round/private?playerId=a&sessionToken=b',
        max: 2,
      });
    },
  );
});
