# PouchTools

**面向日常开发工作的跨平台开发者工具集。**

[![Tauri 2](https://img.shields.io/badge/Tauri-2-24c8db?logo=tauri&logoColor=white)](https://tauri.app/)
[![Rust 1.92](https://img.shields.io/badge/Rust-1.92.0-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**文档语言：** [English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md) · [Italiano](README.it-IT.md) · [Français](README.fr-FR.md) · [Deutsch](README.de-DE.md)

PouchTools 是一个轻量的桌面开发者工具集，使用 Rust 和 Tauri 2 构建核心能力，使用 React 构建界面，在单一代码库中支持 macOS、Windows 和 Linux，并优先在本地处理数据。

> **项目状态：** 功能预览版。六个工具均已在 Tauri 客户端中接入本地处理，当前版本聚焦核心转换能力和紧凑的桌面工作流。

## 项目特点

- 支持功能优先采用本地处理
- 使用原生桌面窗口行为，关闭窗口后隐藏到系统托盘
- macOS 隐藏到托盘时同步隐藏 Dock 图标
- 支持浅色和深色主题
- 支持英文和简体中文界面切换
- 支持偏好持久化、工具搜索、收藏、复制、清空和下载
- 通过 GitHub Actions 发布 macOS ARM64、macOS Intel、Windows x64 和 Linux x64 安装包

## 工具状态

| 工具 | 状态 | 说明 |
| --- | --- | --- |
| Base64 | 可用 | UTF-8 编解码、URL-safe 模式、历史记录、复制、清空和下载 |
| MD5 | 可用 | 文本和文件摘要、大小写切换、复制及预期摘要校验 |
| 时间戳 | 可用 | 秒/毫秒转换、时区格式化、实时时钟和复制 |
| JSON 格式化 | 可用 | 格式化、压缩、缩进选择、键名排序、复制和下载 |
| URL 编解码 | 可用 | 组件或完整 URL 模式、复制、清空和交换 |
| UUID 生成 | 可用 | 生成一个或多个 RFC 4122 v4 UUID |

## 安装

从 [GitHub Releases](https://github.com/songqii/PouchTools/releases) 下载最新安装包。

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| macOS | Apple Silicon | `.dmg` |
| macOS | Intel | `.dmg` |
| Windows | x64 | NSIS `.exe` 或 WiX `.msi` |
| Linux | x64 | `.deb` 或 `.AppImage` |

每个构建都会附带 `SHA256SUMS-<target>.txt` 校验文件。Linux 安装包使用 Ubuntu 22.04 构建。AppImage 可能需要添加执行权限：

```bash
chmod +x PouchTools_*.AppImage
```

当前预览包尚未完成正式签名或公证。macOS 可能显示 Gatekeeper 提示，Windows 可能显示发布者未验证提示。

## 开发

### 环境要求

- Node.js 24
- Rust 1.92.0
- 对应平台的 Tauri 2 系统依赖

### 本地运行

```bash
npm ci
npm run tauri:dev
```

构建并验证前端：

```bash
npm run build
npm run test:utils
node scripts/check-release-version.mjs
node --test scripts/release.test.mjs
```

构建本地桌面安装包：

```bash
npm run tauri:build
```

关闭主窗口后，PouchTools 会隐藏到系统托盘。在 macOS 上，窗口隐藏时 Dock 图标也会隐藏。通过托盘菜单选择“显示主窗口”恢复，或选择“退出”彻底退出。

## 发布自动化

[.github/workflows/release.yml](.github/workflows/release.yml) 使用 GitHub 云端 runner 构建预览安装包：

- 推送到 `main` 会构建全部支持的目标，并上传 Actions 产物。
- 推送匹配的版本标签（例如 `v0.1.0`）会构建全部目标并创建 Release 草稿。
- 草稿包含各平台安装包、SHA-256 校验文件，以及 [`docs/releases/`](docs/releases/) 中对应的版本说明。
- macOS DMG 遇到临时错误时最多自动重试三次。

发布前请保持以下版本一致：

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `package-lock.json`
- `src-tauri/Cargo.lock`

使用以下命令检查：

```bash
node scripts/check-release-version.mjs
```

提交版本更新后创建并推送标签：

```bash
git tag -a v0.1.0 -m "PouchTools v0.1.0"
git push origin v0.1.0
```

## 架构

- **界面：** React、Vite 和 Lucide icons
- **桌面运行时：** Tauri 2
- **原生层：** Rust
- **发布 CI：** GitHub Actions
- **支持目标：** `aarch64-apple-darwin`、`x86_64-apple-darwin`、`x86_64-pc-windows-msvc` 和 `x86_64-unknown-linux-gnu`

## 当前限制

- 所有转换均在客户端本地完成，不会上传输入数据。
- MD5 是单向摘要，不能解密或还原原文。
- 预览安装包尚未完成公证或 Authenticode 签名。

## 许可证

PouchTools 使用 [MIT License](LICENSE) 发布。
