#!/usr/bin/env node
/**
 * Makes dist/ load from file:///android_asset/pof-web/ in Android WebView.
 * Absolute /assets/ URLs break on file:// (they resolve to file:///assets/...).
 */
const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, '..', 'dist');
const TEXT_EXT = /\.(html|js|css|json|svg)$/i;

if (!fs.existsSync(dist)) {
  console.error('dist/ missing');
  process.exit(1);
}

function patchContent(content) {
  let out = content.replace(/\s+crossorigin(="[^"]*")?/g, '');
  out = out.replace(/"\/assets\//g, '"assets/');
  out = out.replace(/'\/assets\//g, "'assets/");
  out = out.replace(/url\(\/assets\//g, 'url(assets/');
  out = out.replace(/url\('\/assets\//g, "url('assets/");
  out = out.replace(/url\("\/assets\//g, 'url("assets/');
  out = out.replace(/href="\/assets\//g, 'href="assets/');
  out = out.replace(/`\/assets\//g, '`assets/');
  return out;
}

function walk(dir, onFile) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, onFile);
    else onFile(p);
  }
}

let files = 0;
walk(dist, (file) => {
  if (!TEXT_EXT.test(file)) return;
  const before = fs.readFileSync(file, 'utf8');
  const after = patchContent(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    files += 1;
  }
});

const index = path.join(dist, 'index.html');
if (fs.existsSync(index)) {
  let html = fs.readFileSync(index, 'utf8');
  if (!html.includes('<base ')) {
    html = html.replace(/<head>/i, '<head>\n    <base href="./" />');
    fs.writeFileSync(index, html);
  }
}

console.log(
  `Patched dist for file:// WebView (${files} files: relative assets, no crossorigin)`,
);
