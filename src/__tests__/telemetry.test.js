// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mountTelemetryRoutes,
  createRateLimiter,
  sanitizeProps,
} from '../../server/telemetryRoutes.js';

function createMockApp() {
  const routes = {};
  return {
    routes,
    post: (path, handler) => {
      routes[path] = handler;
    },
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function mockReq(body, ip = '1.2.3.4') {
  return {
    body,
    headers: {},
    socket: { remoteAddress: ip },
  };
}

describe('telemetry routes', () => {
  let app;
  let logSpy;

  beforeEach(() => {
    app = createMockApp();
    mountTelemetryRoutes(app);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it('mounts both telemetry endpoints', () => {
    expect(app.routes['/api/telemetry/client-errors']).toBeTypeOf('function');
    expect(app.routes['/api/telemetry/events']).toBeTypeOf('function');
  });

  it('accepts a client error and logs structured JSON', () => {
    const res = createMockRes();
    app.routes['/api/telemetry/client-errors'](
      mockReq({ message: 'boom', stack: 'stack-trace', source: 'window.onerror' }),
      res,
    );
    expect(res.body).toEqual({ ok: true });
    expect(logSpy).toHaveBeenCalledOnce();
    const [prefix, json] = logSpy.mock.calls[0];
    expect(prefix).toBe('[telemetry] client-error');
    const parsed = JSON.parse(json);
    expect(parsed.message).toBe('boom');
    expect(parsed.source).toBe('window.onerror');
    expect(parsed.receivedAt).toBeTruthy();
  });

  it('accepts an analytics event', () => {
    const res = createMockRes();
    app.routes['/api/telemetry/events'](
      mockReq({ name: 'online_lobby_created', props: { maxPlayers: 8 } }),
      res,
    );
    expect(res.body).toEqual({ ok: true });
    const parsed = JSON.parse(logSpy.mock.calls[0][1]);
    expect(parsed.name).toBe('online_lobby_created');
    expect(parsed.props.maxPlayers).toBe(8);
  });

  it('rejects events without a name', () => {
    const res = createMockRes();
    app.routes['/api/telemetry/events'](mockReq({ props: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('event-name-required');
  });

  it('rate-limits client errors per IP', () => {
    let lastRes;
    for (let i = 0; i < 12; i++) {
      lastRes = createMockRes();
      app.routes['/api/telemetry/client-errors'](mockReq({ message: `err ${i}` }), lastRes);
    }
    expect(lastRes.statusCode).toBe(429);
    expect(lastRes.body.error).toBe('rate-limited');
  });

  it('different IPs have independent rate limits', () => {
    for (let i = 0; i < 10; i++) {
      app.routes['/api/telemetry/client-errors'](
        mockReq({ message: 'x' }, '10.0.0.1'),
        createMockRes(),
      );
    }
    const res = createMockRes();
    app.routes['/api/telemetry/client-errors'](mockReq({ message: 'y' }, '10.0.0.2'), res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('truncates oversized strings', () => {
    const res = createMockRes();
    app.routes['/api/telemetry/client-errors'](
      mockReq({ message: 'a'.repeat(50_000) }),
      res,
    );
    const parsed = JSON.parse(logSpy.mock.calls[0][1]);
    expect(parsed.message.length).toBeLessThanOrEqual(2000);
  });
});

describe('createRateLimiter', () => {
  it('allows up to the max per window then blocks', () => {
    const limiter = createRateLimiter(3);
    expect(limiter.isAllowed('k')).toBe(true);
    expect(limiter.isAllowed('k')).toBe(true);
    expect(limiter.isAllowed('k')).toBe(true);
    expect(limiter.isAllowed('k')).toBe(false);
  });
});

describe('sanitizeProps', () => {
  it('keeps strings, numbers, booleans and drops objects/arrays/functions', () => {
    const out = sanitizeProps({
      str: 'ok',
      num: 42,
      bool: true,
      nested: { evil: 1 },
      arr: [1, 2],
      fn: () => {},
    });
    expect(out).toEqual({ str: 'ok', num: 42, bool: true });
  });

  it('caps to 20 props', () => {
    const big = Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`k${i}`, i]));
    expect(Object.keys(sanitizeProps(big)).length).toBeLessThanOrEqual(20);
  });

  it('returns empty object for non-object input', () => {
    expect(sanitizeProps(null)).toEqual({});
    expect(sanitizeProps('nope')).toEqual({});
    expect(sanitizeProps([1, 2])).toEqual({});
  });
});
