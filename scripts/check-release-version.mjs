import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const tauri = readJson('src-tauri/tauri.conf.json');
const cargo = readFileSync('src-tauri/Cargo.toml', 'utf8');
const cargoPackage = cargo.match(/\[package\]\r?\n([\s\S]*?)(?:\n\[|$)/)?.[1];
const cargoVersion = cargoPackage?.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const cargoLockVersion = readFileSync('src-tauri/Cargo.lock', 'utf8')
  .match(/\[\[package\]\]\r?\nname = "pouchtools"\r?\nversion = "([^"]+)"/)?.[1];

assert.match(pkg.version, /^\d+\.\d+\.\d+$/, 'Use a stable version such as 0.1.0');
assert.equal(tauri.version, pkg.version, 'Tauri and npm versions must match');
assert.equal(cargoVersion, pkg.version, 'Cargo and npm versions must match');
assert.equal(cargoLockVersion, pkg.version, 'Refresh Cargo.lock after changing the version');
assert.equal(lock.version, pkg.version, 'Refresh package-lock.json after changing the version');
assert.equal(lock.packages[''].version, pkg.version, 'npm lockfile root version must match');
if (process.env.RELEASE_TAG) {
  assert.equal(process.env.RELEASE_TAG, `v${pkg.version}`, 'Release tag must match the app version');
}
console.log(`PouchTools ${pkg.version}: version checks passed`);
