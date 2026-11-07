import test from 'node:test';
import assert from 'node:assert/strict';

process.env.POF_AUTH_JWT_SECRET = 'test-secret-for-jwt';

const { signPoFAccessToken, verifyPoFAccessToken } = await import('../../server/pofAuthJwt.js');

test('PoF JWT round-trip', () => {
  const token = signPoFAccessToken({
    sub: 'user-abc',
    email: 'player@example.com',
    displayName: 'Player',
  });
  const parsed = verifyPoFAccessToken(token);
  assert.equal(parsed.userId, 'user-abc');
  assert.equal(parsed.email, 'player@example.com');
  assert.equal(parsed.displayName, 'Player');
});

test('PoF JWT rejects tampered token', () => {
  const token = signPoFAccessToken({ sub: 'user-abc' });
  const bad = `${token}x`;
  assert.equal(verifyPoFAccessToken(bad), null);
});
