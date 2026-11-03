import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { io as ioClient } from 'socket.io-client';

const PORT = 18789;

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

test('socket.io receives lobby snapshot after create', async (t) => {
  const child = spawn('node', ['server/lobbyServer.js'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'pipe',
  });
  t.after(() => child.kill('SIGTERM'));
  await wait(1500);

  const base = `http://127.0.0.1:${PORT}`;
  const createRes = await fetch(`${base}/api/lobbies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hostName: 'Host',
      hostPlayer: { id: 'h1', name: 'Host', clientId: 'sock-host' },
      maxPlayers: 8,
      settings: { themeName: 'Default' },
    }),
  });
  const created = await createRes.json();
  const code = created?.lobby?.code;
  const sessionToken = created?.sessionToken;
  assert.ok(code);
  assert.ok(sessionToken);

  const socket = ioClient(base, { transports: ['websocket'], autoConnect: false });
  const snapshot = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('snapshot timeout')), 8000);
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    socket.on('lobby:snapshot', (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
    socket.connect();
    socket.emit('lobby:subscribe', {
      code,
      playerId: 'h1',
      sessionToken,
    });
  });
  socket.disconnect();

  assert.equal(snapshot?.code, code);
  assert.ok(Array.isArray(snapshot?.players));
});
