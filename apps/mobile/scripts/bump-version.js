#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'app.config.js');
let src = fs.readFileSync(configPath, 'utf8');

// Bump semver patch: "0.1.0" → "0.1.1"
src = src.replace(/version:\s*'(\d+)\.(\d+)\.(\d+)'/, (_, maj, min, pat) => {
  const next = `version: '${maj}.${min}.${parseInt(pat, 10) + 1}'`;
  console.log(`version: ${maj}.${min}.${pat} → ${maj}.${min}.${parseInt(pat, 10) + 1}`);
  return next;
});

// Bump versionCode (integer) — insert if missing
if (/versionCode:\s*\d+/.test(src)) {
  src = src.replace(/versionCode:\s*(\d+)/, (_, n) => {
    const next = `versionCode: ${parseInt(n, 10) + 1}`;
    console.log(`versionCode: ${n} → ${parseInt(n, 10) + 1}`);
    return next;
  });
} else {
  // Insert versionCode after `package: 'io.kiddo.app'`
  src = src.replace(/(package:\s*'io\.kiddo\.app',?)/, (m) => {
    console.log('versionCode: (absent) → 1');
    return `${m}\n      versionCode: 1,`;
  });
}

fs.writeFileSync(configPath, src, 'utf8');
console.log('app.config.js mis à jour.');
