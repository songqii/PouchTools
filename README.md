# PouchTools

**Cross-platform developer utilities for everyday engineering work.**

[![Tauri 2](https://img.shields.io/badge/Tauri-2-24c8db?logo=tauri&logoColor=white)](https://tauri.app/)
[![Rust 1.92](https://img.shields.io/badge/Rust-1.92.0-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Documentation:** [English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md) · [Italiano](README.it-IT.md) · [Français](README.fr-FR.md) · [Deutsch](README.de-DE.md)

PouchTools is a lightweight desktop toolbox for developers. It uses a Rust and Tauri 2 core with a React interface, processes data locally, and targets macOS, Windows, and Linux from one codebase.

> **Project status:** Functional preview. All six tools run locally in the Tauri client; the current release focuses on core transformations and a compact desktop workflow.

## Highlights

- Local-first processing for the supported text operations
- Native desktop window behavior with close-to-tray support
- macOS Dock hiding while the application is in the tray
- Light and dark themes
- English and Simplified Chinese interface switching
- Persistent preferences, search, favorites, copy, clear, and download actions
- Release automation for macOS ARM64, macOS Intel, Windows x64, and Linux x64

## Tools

| Tool | Status | Notes |
| --- | --- | --- |
| Base64 | Available | UTF-8 text encode/decode, URL-safe mode, history, copy, clear, and download |
| MD5 | Available | Text and file hashing, case selection, copy, and expected-hash verification |
| Timestamp | Available | Seconds/milliseconds conversion, timezone formatting, live clock, and copy |
| JSON formatter | Available | Pretty-print, minify, indentation selection, key sorting, copy, and download |
| URL encoder/decoder | Available | Component or full-URL mode, copy, clear, and swap |
| UUID generator | Available | RFC 4122 version 4 generation for one or more values |

## Install

Download the latest packages from [GitHub Releases](https://github.com/songqii/PouchTools/releases).

| Platform | Architecture | Package |
| --- | --- | --- |
| macOS | Apple Silicon | `.dmg` |
| macOS | Intel | `.dmg` |
| Windows | x64 | NSIS `.exe` or WiX `.msi` |
| Linux | x64 | `.deb` or `.AppImage` |

Every build includes a `SHA256SUMS-<target>.txt` file. Linux packages are built on Ubuntu 22.04. AppImage may require executable permission:

```bash
chmod +x PouchTools_*.AppImage
```

Current preview packages are unsigned or ad-hoc signed. macOS may show a Gatekeeper warning, and Windows may show an unverified publisher warning.

## Development

### Prerequisites

- Node.js 24
- Rust 1.92.0
- Tauri 2 system dependencies for your platform

### Run locally

```bash
npm ci
npm run tauri:dev
```

Build and validate the frontend:

```bash
npm run build
npm run test:utils
node scripts/check-release-version.mjs
node --test scripts/release.test.mjs
```

Build a local desktop bundle:

```bash
npm run tauri:build
```

Closing the main window hides PouchTools in the system tray. On macOS, the Dock icon is hidden while the window is hidden. Use **Show window** in the tray menu to restore it, or **Quit** to exit.

## Release automation

The workflow at [`.github/workflows/release.yml`](.github/workflows/release.yml) builds signed/unsigned preview installers on GitHub-hosted runners:

- Pushes to `main` build all supported targets and upload workflow artifacts.
- A matching version tag such as `v0.1.0` builds all targets and creates a draft Release.
- The draft includes platform installers, SHA-256 files, and the matching notes from [`docs/releases/`](docs/releases/).
- macOS DMG packaging retries transient failures up to three times.

Before tagging a release, keep these versions aligned:

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `package-lock.json`
- `src-tauri/Cargo.lock`

Validate them with:

```bash
node scripts/check-release-version.mjs
```

Create a release tag after committing the version change:

```bash
git tag -a v0.1.0 -m "PouchTools v0.1.0"
git push origin v0.1.0
```

## Architecture

- **UI:** React, Vite, and Lucide icons
- **Desktop runtime:** Tauri 2
- **Native layer:** Rust
- **Release CI:** GitHub Actions
- **Supported targets:** `aarch64-apple-darwin`, `x86_64-apple-darwin`, `x86_64-pc-windows-msvc`, and `x86_64-unknown-linux-gnu`

## Limitations

- All transformations run in the client and do not upload input data.
- MD5 is a one-way hash; it cannot decrypt or restore the original input.
- Preview installers are not notarized or Authenticode-signed.

## License

PouchTools is released under the [MIT License](LICENSE).
