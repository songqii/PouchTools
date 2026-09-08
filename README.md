# PouchTools

**Documentation:** English · [简体中文](README.zh-CN.md)

A cross-platform developer utility collection built with Rust and Tauri 2.

## Features

- Base64 UTF-8 encoding and decoding
- MD5 hashing and checksum verification
- Timestamp and date conversion
- Light and dark themes
- English and Simplified Chinese interface switching
- Close-to-tray behavior with native macOS, Windows, and Linux window controls

Some tools are still preview placeholders. See [Current limitations](#current-limitations).

## Development

Install dependencies and start the Tauri desktop client:

```bash
npm install
npm run tauri:dev
```

Build the frontend or a local release bundle:

```bash
npm run build
npm run tauri:build
```

When the main window is closed, PouchTools stays in the system tray. On macOS the Dock icon is hidden while the window is hidden. Select **Show window** from the tray menu to restore it, or select **Quit** to exit completely.

## GitHub Actions installers

The workflow in `.github/workflows/release.yml` uses Rust 1.92.0 and Node.js 24, installs locked dependencies, and builds release installers in GitHub-hosted runners.

| Platform | Architecture | Packages |
| --- | --- | --- |
| macOS | Apple Silicon (ARM64) | `.dmg` |
| macOS | Intel (x64) | `.dmg` |
| Windows | x64 | NSIS `.exe`, WiX `.msi` |
| Linux | x64 | `.deb`, `.AppImage` |

Each target also produces a `SHA256SUMS-<target>.txt` file. Linux packages are built on Ubuntu 22.04. The `.deb` declares its WebKitGTK runtime dependencies, and tray support depends on the desktop environment's AppIndicator support.

### Build from a branch

Pushes to `main` build all four targets. You can also use **Actions → Build installers → Run workflow**. Branch and manual builds do not create a Release; their artifacts are retained for 30 days.

### Publish a release

Keep the versions in `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `package-lock.json`, and `src-tauri/Cargo.lock` aligned. Check them with:

```bash
node scripts/check-release-version.mjs
```

After committing a version update, push a matching tag:

```bash
git tag -a v0.1.0 -m "PouchTools 0.1.0"
git push origin v0.1.0
```

The workflow builds every target, creates a draft GitHub Release, attaches six installers and their checksum files, and uses the matching file in `docs/releases/` as the release description. Review the draft and publish it from GitHub Releases.

If macOS DMG packaging fails transiently, the workflow retries it up to three times. A `repository_dispatch` event with type `release-retry` and `client_payload.tag` can rebuild an existing tag using the latest workflow on `main`.

The release job uses GitHub's built-in `GITHUB_TOKEN`; no personal access token is required. It needs `contents: write` permission.

## Current limitations

- MD5 and timestamp screens are currently preview interfaces with fixed sample results; they are not ready for production calculations.
- JSON formatting, URL encoding/decoding, and UUID generation are placeholder entries.
- Search, settings, favorites, file input, Base64 URL-safe mode, conversion history, live current time, and preference persistence are not connected yet.
- MD5 is a one-way hash and cannot decrypt or restore the original input.
- macOS packages use ad-hoc signing without Developer ID notarization. Windows packages do not use Authenticode signing, so the operating system may show an unverified publisher warning.

## License

PouchTools is released under the [MIT License](LICENSE).
