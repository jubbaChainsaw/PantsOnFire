import test from 'node:test';
import assert from 'node:assert/strict';

process.env.POF_AUTH_JWT_SECRET = 'hosting-gate-test-secret';
process.env.POF_ENFORCE_APP_HOSTING = '1';
process.env.POF_ALLOW_LOCAL_WEB_HOST = '0';

const { createAppInstallToken, verifyAppInstallToken } = await import('../../server/appInstallToken.js');
const {
  assertMayHostLobby,
  CLIENT_SURFACE_HEADER,
  APP_INSTALL_TOKEN_HEADER,
  NATIVE_SHELL_SURFACE,
} = await import('../../server/hostingGate.js');

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

test('production web origin cannot create lobby without app install token', () => {
  const req = {
    headers: {
      origin: 'https://www.pantsonfire.app',
    },
  };
  const res = mockRes();
  const ok = assertMayHostLobby(req, res);
  assert.equal(ok, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.error, 'hosting-web-only');
});

test('native shell with valid install token may host even when page origin is www', () => {
  const issued = createAppInstallToken({ platform: 'android' });
  assert.ok(issued.installToken);
  const req = {
    headers: {
      origin: 'https://www.pantsonfire.app',
      [CLIENT_SURFACE_HEADER]: NATIVE_SHELL_SURFACE,
      [APP_INSTALL_TOKEN_HEADER]: issued.installToken,
    },
  };
  const res = mockRes();
  assert.equal(assertMayHostLobby(req, res), true);
});

test('invalid install token is rejected', () => {
  const req = {
    headers: {
      origin: 'https://www.pantsonfire.app',
      [CLIENT_SURFACE_HEADER]: NATIVE_SHELL_SURFACE,
      [APP_INSTALL_TOKEN_HEADER]: 'not-a-real-token',
    },
  };
  const res = mockRes();
  assert.equal(assertMayHostLobby(req, res), false);
  assert.equal(res.body.error, 'invalid-app-install-token');
});

test('verifyAppInstallToken rejects tampered token', () => {
  const issued = createAppInstallToken({ platform: 'ios' });
  const tampered = `${issued.installToken}x`;
  assert.equal(verifyAppInstallToken(tampered).error, 'invalid-signature');
});
