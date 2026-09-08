# PouchTools
跨平台开发者工具集，基于 Rust + Tauri 2。

开发时运行 `npm install`，然后运行 `npm run tauri:dev`。

关闭主窗口会隐藏到系统托盘，应用保持运行，窗口中的内容会保留。
macOS 隐藏窗口时也会隐藏 Dock 图标，顶部菜单栏保留托盘图标。
点击托盘图标，选择“显示主窗口 / Show window”恢复窗口和 Dock 图标；
选择“退出 / Quit”才会完全退出应用。系统最小化按钮仍采用系统默认行为。

## GitHub Actions 安装包

工作流位于 `.github/workflows/release.yml`，使用固定的 Rust 1.92.0 和 Node.js 24，
通过 `npm ci` 和 Cargo `--locked` 安装锁定的依赖，构建 release 模式安装包。

| 平台 | 架构 | 安装包 |
| --- | --- | --- |
| macOS | Apple Silicon（ARM64） | `.dmg` |
| macOS | Intel（x64） | `.dmg` |
| Windows | x64 | NSIS `.exe`、WiX `.msi` |
| Linux | x64 | `.deb`、`.AppImage` |

每个目标都会生成带版本号和架构的安装包，以及 `SHA256SUMS-<target>.txt` 校验文件。
Linux 使用 Ubuntu 22.04 构建；`.deb` 会声明 WebKitGTK 等运行依赖。
Linux 托盘需要桌面环境支持 AppIndicator，GNOME 可能需要相应扩展。

### 第一次使用

先将本项目源码、`.github`、`scripts`、图标、`rust-toolchain.toml`、`package-lock.json`
和 `src-tauri/Cargo.lock` 提交并推送到 GitHub。`.gitignore` 已排除依赖和本机构建产物。

推送到默认分支后，可以在仓库 **Actions → Build installers → Run workflow** 手动构建。
推送 `main` 分支也会自动构建。分支构建和手动构建不创建 Release，产物在运行页面的 **Artifacts** 中保留 30 天。

### 发布正式版本

确保 `package.json`、`src-tauri/tauri.conf.json` 和 `src-tauri/Cargo.toml` 的版本一致，
并更新两个锁文件。例如升级到 `0.1.1` 时，执行 `npm version 0.1.1 --no-git-tag-version`，
手动更新 Tauri 与 Cargo 的版本，再执行 `cargo check --manifest-path src-tauri/Cargo.toml` 更新 Cargo.lock。
可用 `node scripts/check-release-version.mjs` 提前检查。

提交并推送版本更新后，为对应提交打标签。例如当前首版：

```bash
git tag -a v0.1.0 -m "PouchTools 0.1.0"
git push origin v0.1.0
```

标签版本必须与应用版本一致。四个构建全部成功后，Actions 会创建 **Release 草稿**，
附上六份安装包和校验文件，并自动生成版本说明。检查后在 GitHub Releases 点击 **Publish release**。
失败可在 Actions 中重跑；已发布的版本不会被工作流覆盖，更新应使用新版本标签。

不需要配置个人访问令牌，发布任务使用 GitHub 自带的 `GITHUB_TOKEN`，只有该任务具有
`contents: write` 权限。如果组织策略禁止写入，需由仓库管理员允许工作流创建 Release。

### 签名状态

当前 macOS 使用 ad-hoc 签名，未做 Apple Developer ID 签名和公证；Windows 安装包未做 Authenticode 签名。
因此下载后可能显示 Gatekeeper / SmartScreen 提示。正式分发需要受信任签名时，
应先配置相应开发者证书及公证凭据，再接入签名步骤；release 模式构建本身不代表已签名或已公证。
