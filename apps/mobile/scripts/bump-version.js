#!/usr/bin/env node
/**
 * Usage: node scripts/bump-version.js [patch|minor|major]
 * Default: patch
 *
 * - Bumpe version semver dans app.config.js
 * - Bumpe versionCode Android (+1)
 * - Commit + tag git
 */
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const bump = process.argv[2] ?? 'patch';
if (!['patch', 'minor', 'major'].includes(bump)) {
  console.error('Usage: node bump-version.js [patch|minor|major]');
  process.exit(1);
}

const configPath = path.join(__dirname, '..', 'app.config.js');
let src = fs.readFileSync(configPath, 'utf8');

// ── Bump semver ────────────────────────────────────────────────────────────────
let nextVersion;
src = src.replace(/version:\s*'(\d+)\.(\d+)\.(\d+)'/, (_, maj, min, pat) => {
  let [M, m, p] = [parseInt(maj), parseInt(min), parseInt(pat)];
  if (bump === 'major') { M++; m = 0; p = 0; }
  else if (bump === 'minor') { m++; p = 0; }
  else { p++; }
  nextVersion = `${M}.${m}.${p}`;
  console.log(`version: ${maj}.${min}.${pat} → ${nextVersion}`);
  return `version: '${nextVersion}'`;
});

// ── Bump versionCode ───────────────────────────────────────────────────────────
let nextCode;
if (/versionCode:\s*\d+/.test(src)) {
  src = src.replace(/versionCode:\s*(\d+)/, (_, n) => {
    nextCode = parseInt(n, 10) + 1;
    console.log(`versionCode: ${n} → ${nextCode}`);
    return `versionCode: ${nextCode}`;
  });
} else {
  nextCode = 1;
  src = src.replace(/(package:\s*'io\.kiddo\.app',?)/, m => {
    console.log('versionCode: (absent) → 1');
    return `${m}\n      versionCode: 1,`;
  });
}

fs.writeFileSync(configPath, src, 'utf8');
console.log('✓ app.config.js mis à jour');

// ── Git commit + tag ───────────────────────────────────────────────────────────
const tag = `v${nextVersion}`;
try {
  execSync(`git add "${configPath}"`, { stdio: 'inherit' });
  execSync(`git commit -m "chore(release): bump version to ${nextVersion} (versionCode ${nextCode})"`, { stdio: 'inherit' });
  execSync(`git tag ${tag}`, { stdio: 'inherit' });
  console.log(`✓ Commit + tag ${tag} créés`);
  console.log(`  → git push && git push origin ${tag}`);
} catch (e) {
  console.error('⚠ Git commit/tag échoué — app.config.js mis à jour mais non commité');
  process.exit(1);
}
