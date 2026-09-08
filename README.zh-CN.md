# PouchTools

**文档语言：** [English](README.md) · 简体中文

基于 Rust 和 Tauri 2 的跨平台开发者工具集。

## 功能

- Base64 UTF-8 编码与解码
- MD5 摘要和校验
- 时间戳与日期转换
- 浅色和深色主题
- 中文和英文界面切换
- 关闭后隐藏到系统托盘，使用 macOS、Windows、Linux 原生窗口控件

部分工具仍处于预览占位状态，详见[当前限制](#当前限制)。

## 开发

安装依赖并启动 Tauri 桌面客户端：

```bash
npm install
npm run tauri:dev
```

构建前端或本地 release 安装包：

```bash
npm run build
npm run tauri:build
```

关闭主窗口后，PouchTools 会继续运行在系统托盘中。在 macOS 上，窗口隐藏时 Dock 图标也会隐藏。通过托盘菜单选择“显示主窗口”恢复，或选择“退出”彻底退出。

## GitHub Actions 安装包

`.github/workflows/release.yml` 使用 Rust 1.92.0 和 Node.js 24，在 GitHub 云端 runner 上安装锁定依赖并构建正式版安装包。

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| macOS | Apple Silicon（ARM64） | `.dmg` |
| macOS | Intel（x64） | `.dmg` |
| Windows | x64 | NSIS `.exe`、WiX `.msi` |
| Linux | x64 | `.deb`、`.AppImage` |

每个目标都会生成 `SHA256SUMS-<target>.txt` 校验文件。Linux 使用 Ubuntu 22.04 构建；`.deb` 会声明 WebKitGTK 运行依赖，托盘显示取决于桌面环境是否支持 AppIndicator。

### 从分支构建

推送到 `main` 会构建全部四个目标，也可以在 **Actions → Build installers → Run workflow** 手动运行。分支构建和手动构建不会创建 Release，产物保留 30 天。

### 发布版本

确保 `package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`、`package-lock.json` 和 `src-tauri/Cargo.lock` 的版本一致。可以运行以下命令检查：

```bash
node scripts/check-release-version.mjs
```

提交版本更新后，推送匹配的标签：

```bash
git tag -a v0.1.0 -m "PouchTools 0.1.0"
git push origin v0.1.0
```

工作流会构建全部目标，创建 GitHub Release 草稿，附加六份安装包和校验文件，并使用 `docs/releases/` 中对应的 Markdown 文件作为 Release 描述。检查无误后，在 GitHub Releases 页面发布草稿。

如果 macOS DMG 打包遇到临时错误，工作流最多会自动重试三次。也可以发送 `release-retry` 类型的 `repository_dispatch` 事件，并在 `client_payload.tag` 中指定现有标签，用 `main` 上最新的工作流重建该版本。

发布任务使用 GitHub 自带的 `GITHUB_TOKEN`，不需要个人访问令牌，但需要 `contents: write` 权限。

## 当前限制

- MD5 和时间戳页面目前是演示界面，结果使用固定示例，暂时不能用于生产计算。
- JSON 格式化、URL 编解码和 UUID 生成目前是占位入口。
- 搜索、设置、收藏、文件输入、Base64 URL-safe 模式、转换历史、实时当前时间和偏好持久化尚未接入。
- MD5 是单向摘要，不能解密或还原原文。
- macOS 安装包使用 ad-hoc 签名，未进行 Developer ID 公证；Windows 安装包未使用 Authenticode 签名，系统可能显示发布者未验证提示。

## 许可证

PouchTools 使用 [MIT License](LICENSE) 发布。
