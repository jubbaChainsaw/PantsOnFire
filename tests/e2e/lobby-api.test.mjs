import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const PORT = 18788;

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

test('REST lobby create and join', async (t) => {
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
      hostPlayer: { id: 'h1', name: 'Host', clientId: 'client-host' },
      maxPlayers: 8,
      settings: { themeName: 'Default', hostPromptEditorUnlocked: true },
    }),
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  const code = created?.lobby?.code;
  assert.ok(code);

  const joinRes = await fetch(`${base}/api/lobbies/${code}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player: { id: 'p2', name: 'Guest', clientId: 'client-guest' },
    }),
  });
  assert.equal(joinRes.status, 200);
  const joined = await joinRes.json();
  assert.ok((joined?.lobby?.players || []).length >= 2);
  const settings =
    created?.lobby?.settings || joined?.lobby?.settings || {};
  assert.equal(settings.hostPromptEditorUnlocked, true);
});
