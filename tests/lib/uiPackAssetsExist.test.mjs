import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_ASSETS = path.join(__dirname, '../../public/assets');

/** Critical pass-the-phone / neon UI files referenced in src (cards, wallpaper, modes, categories). */
const REQUIRED_RELATIVE_PATHS = [
  'ui/cards/default-back.png',
  'ui/cards/default-front.png',
  'ui/cards/liar-front.png',
  'ui/wallpapers/in-game.png',
  'ui/wallpapers/home-page.png',
  'ui/logos/main-logo.png',
  'ui/game-modes/chain.png',
  'ui/game-modes/prompt.png',
  'ui/categories/mythical-creatures.png',
  'ui/categories/sports.png',
  'ui/categories/food.png',
  'ui/neon/btn-2.png',
  'ui/neon/btn-3.png',
  'themes/default/hosts/persona-host-idle.png',
  'themes/default/hosts/persona-host-talking.mp4',
];

test('critical UI pack image files exist under public/assets', () => {
  const missing = REQUIRED_RELATIVE_PATHS.filter(
    (rel) => !fs.existsSync(path.join(PUBLIC_ASSETS, rel)),
  );
  assert.equal(
    missing.length,
    0,
    `Missing UI assets:\n${missing.map((m) => `  - ${m}`).join('\n')}`,
  );
});
