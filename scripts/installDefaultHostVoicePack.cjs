#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const exportsDir = path.join(repoRoot, 'exports');
const destRootDir = path.join(repoRoot, 'public', 'assets', 'audio', 'host', 'default');
const destDir = path.join(destRootDir, 'tts');

function listZipCandidates() {
  if (!fs.existsSync(exportsDir)) return [];
  return fs.readdirSync(exportsDir)
    .filter((name) => name.toLowerCase().endsWith('.zip'))
    .map((name) => path.join(exportsDir, name));
}

function pickZipPath() {
  const cliPath = process.argv[2] ? path.resolve(repoRoot, process.argv[2]) : '';
  if (cliPath && fs.existsSync(cliPath)) return cliPath;

  const candidates = listZipCandidates();
  const preferred = candidates.find((filePath) => /default-host|tts|voice/i.test(path.basename(filePath)));
  if (preferred) return preferred;
  return candidates[0] || '';
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function clearDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath)) {
    fs.rmSync(path.join(dirPath, entry), { recursive: true, force: true });
  }
}

function unzip(zipPath, outputDir) {
  const result = spawnSync('unzip', ['-o', zipPath, '-d', outputDir], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`Failed to unzip ${zipPath}`);
  }
}

function collectMp3Files(dirPath, matches = []) {
  if (!fs.existsSync(dirPath)) return matches;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectMp3Files(fullPath, matches);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp3')) {
      matches.push(fullPath);
    }
  }
  return matches;
}

function normalizeFilename(filePath) {
  return path.basename(filePath).toLowerCase();
}

function install(zipPath) {
  ensureDir(destDir);
  // Keep the canonical "tts" install location clean before extraction.
  clearDirectory(destDir);
  unzip(zipPath, destDir);

  const allMp3 = collectMp3Files(destDir);
  if (!allMp3.length) {
    throw new Error(`No .mp3 files were found inside ${zipPath}`);
  }

  // Flatten nested extraction paths into the destination root.
  for (const filePath of allMp3) {
    const normalized = normalizeFilename(filePath);
    const targetPath = path.join(destDir, normalized);
    if (filePath !== targetPath) {
      fs.copyFileSync(filePath, targetPath);
    }
  }

  // Remove nested directories that unzip might have created.
  for (const entry of fs.readdirSync(destDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      fs.rmSync(path.join(destDir, entry.name), { recursive: true, force: true });
    }
  }

  const installedCount = fs.readdirSync(destDir).filter((name) => name.toLowerCase().endsWith('.mp3')).length;
  console.log(`[installDefaultHostVoicePack] Installed ${installedCount} mp3 files into ${destDir}`);
}

function main() {
  const zipPath = pickZipPath();
  if (!zipPath) {
    const hint = path.join('exports', '<your-default-host-voice-pack>.zip');
    throw new Error(`No zip found. Add a voice zip in exports/ or run: node scripts/installDefaultHostVoicePack.cjs ${hint}`);
  }
  install(zipPath);
}

try {
  main();
} catch (error) {
  console.error(`[installDefaultHostVoicePack] ${error.message}`);
  process.exit(1);
}
