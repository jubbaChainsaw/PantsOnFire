/**
 * Primary persona name clips (950) under public/assets/audio/persona-handoff/<personaId>.mp3
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const EXPECTED_COUNT = 950;
const AUDIO_DIR = join(process.cwd(), 'public/assets/audio/persona-handoff');

test('persona handoff folder has 950 primary mp3 files', async () => {
  const entries = await readdir(AUDIO_DIR);
  const mp3s = entries.filter((f) => f.endsWith('.mp3'));
  assert.equal(mp3s.length, EXPECTED_COUNT);
});
