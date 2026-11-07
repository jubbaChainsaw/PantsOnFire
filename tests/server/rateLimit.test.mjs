import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../../server/rateLimit.js';

function mockRes() {
  return {
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
}

test('createRateLimiter allows up to max requests per window', () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 2 });
  const req = { ip: '203.0.113.1' };
  const next = () => {};
  limiter(req, mockRes(), next);
  limiter(req, mockRes(), next);
  const blocked = mockRes();
  limiter(req, blocked, next);
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.body.error, 'rate-limited');
});

test('createRateLimiter tracks IPs independently', () => {
  const limiter = createRateLimiter({ windowMs: 60_000, max: 1 });
  const next = () => {};
  limiter({ ip: '203.0.113.2' }, mockRes(), next);
  const other = mockRes();
  limiter({ ip: '203.0.113.3' }, other, next);
  assert.equal(other.statusCode, 200);
});
