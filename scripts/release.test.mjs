import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scripts = dirname(fileURLToPath(import.meta.url));
function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'pouchtools-release-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  mkdirSync(join(cwd, 'src-tauri'));
  const write = (file, value) => writeFileSync(join(cwd, file), value);
  write('package.json', JSON.stringify({ version: '0.1.0' }));
  write('package-lock.json', JSON.stringify({ version: '0.1.0', packages: { '': { version: '0.1.0' } } }));
  write('src-tauri/tauri.conf.json', JSON.stringify({ version: '0.1.0' }));
  write('src-tauri/Cargo.toml', '[package]\nname = "pouchtools"\nversion = "0.1.0"\n\n[dependencies]\n');
  write('src-tauri/Cargo.lock', '[[package]]\nname = "pouchtools"\nversion = "0.1.0"\n');
  const run = (script, env = {}) => spawnSync(process.execPath, [join(scripts, script)], {
    cwd, env: { ...process.env, RELEASE_TAG: '', ...env }, encoding: 'utf8',
  });
  return { cwd, run, write };
}

test('allows manual builds and a tag matching every manifest', (t) => {
  const { run } = fixture(t);
  for (const RELEASE_TAG of ['', 'v0.1.0']) {
    const result = run('check-release-version.mjs', { RELEASE_TAG });
    assert.equal(result.status, 0, result.stderr);
  }
});

test('rejects a wrong release tag and a prerelease tag', (t) => {
  const { run } = fixture(t);
  for (const RELEASE_TAG of ['v0.2.0', 'v0.1.0-beta.1']) {
    assert.notEqual(run('check-release-version.mjs', { RELEASE_TAG }).status, 0);
  }
});

test('rejects stale manifests and lockfiles', (t) => {
  const { run, write, cwd } = fixture(t);
  for (const file of ['src-tauri/tauri.conf.json', 'src-tauri/Cargo.toml', 'src-tauri/Cargo.lock', 'package-lock.json']) {
    const original = readFileSync(join(cwd, file), 'utf8');
    write(file, original.replaceAll('0.1.0', '0.0.9'));
    assert.notEqual(run('check-release-version.mjs').status, 0, file);
    write(file, original);
  }
});

test('collects all platform formats with unique names and valid checksums', (t) => {
  const { cwd, run } = fixture(t);
  const cases = [
    ['aarch64-apple-darwin', { dmg: '.dmg' }],
    ['x86_64-apple-darwin', { dmg: '.dmg' }],
    ['x86_64-pc-windows-msvc', { nsis: '.exe', msi: '.msi' }],
    ['x86_64-unknown-linux-gnu', { deb: '.deb', appimage: '.AppImage' }],
  ];
  for (const [target, formats] of cases) {
    for (const [format, ext] of Object.entries(formats)) {
      const dir = join(cwd, 'src-tauri', 'target', target, 'release', 'bundle', format);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `installer${ext}`), `fixture ${target} ${format}`);
    }
    const result = run('collect-installers.mjs', { BUILD_TARGET: target, BUNDLE_FORMATS: Object.keys(formats).join(',') });
    assert.equal(result.status, 0, result.stderr);
    const lines = readFileSync(join(cwd, 'artifacts', `SHA256SUMS-${target}.txt`), 'utf8').trim().split('\n');
    assert.equal(lines.length, Object.keys(formats).length);
    for (const line of lines) {
      const [digest, name] = line.split('  ');
      assert.ok(name.startsWith(`PouchTools_0.1.0_${target}`));
      assert.equal(digest, createHash('sha256').update(readFileSync(join(cwd, 'artifacts', name))).digest('hex'));
    }
  }
});

test('fails instead of uploading an empty or ambiguous installer set', (t) => {
  const { cwd, run } = fixture(t);
  const env = { BUILD_TARGET: 'x86_64-pc-windows-msvc', BUNDLE_FORMATS: 'nsis' };
  const directory = join(cwd, 'src-tauri', 'target', env.BUILD_TARGET, 'release', 'bundle', 'nsis');
  mkdirSync(directory, { recursive: true });
  assert.notEqual(run('collect-installers.mjs', env).status, 0);
  writeFileSync(join(directory, 'a.exe'), 'a');
  writeFileSync(join(directory, 'b.exe'), 'b');
  assert.notEqual(run('collect-installers.mjs', env).status, 0);
});
