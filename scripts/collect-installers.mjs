import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = process.env.BUILD_TARGET;
const formats = process.env.BUNDLE_FORMATS?.split(',');
assert.match(target ?? '', /^[a-z0-9_-]+$/, 'BUILD_TARGET is required');
assert.ok(formats?.length, 'BUNDLE_FORMATS is required');
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const extension = { dmg: '.dmg', nsis: '.exe', msi: '.msi', deb: '.deb', appimage: '.AppImage' };
mkdirSync('artifacts', { recursive: true });
const checksums = [];

for (const format of formats) {
  assert.ok(extension[format], `Unsupported bundle format: ${format}`);
  const directory = join('src-tauri', 'target', target, 'release', 'bundle', format);
  const installers = readdirSync(directory).filter((file) => file.endsWith(extension[format]));
  assert.equal(installers.length, 1, `Expected exactly one ${format} installer in ${directory}`);
  const name = `PouchTools_${version}_${target}${extension[format]}`;
  const destination = join('artifacts', name);
  copyFileSync(join(directory, installers[0]), destination);
  const digest = createHash('sha256').update(readFileSync(destination)).digest('hex');
  checksums.push(`${digest}  ${name}`);
  console.log(`Collected ${name}`);
}

writeFileSync(join('artifacts', `SHA256SUMS-${target}.txt`), `${checksums.join('\n')}\n`);
