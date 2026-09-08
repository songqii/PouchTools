# PouchTools

**日常の開発作業向けクロスプラットフォーム開発者ツール。**

**ドキュメント:** [English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md) · [Italiano](README.it-IT.md) · [Français](README.fr-FR.md) · [Deutsch](README.de-DE.md)

Rust と Tauri 2 で構築された軽量なデスクトップ開発者ツール集です。React の UI と単一のコードベースで macOS、Windows、Linux をサポートします。

> **プロジェクトの状態:** 初期プレビュー版です。Base64 は現在利用できる最初のツールで、MD5 とタイムスタンプ画面は操作モデルのプレビューです。

## 主な機能

- 対応するテキスト処理をローカルで実行
- ウィンドウを閉じるとシステムトレイへ移動
- macOS でトレイに隠した際に Dock アイコンを非表示
- ライト / ダークテーマ
- 英語 / 中国語 UI 切り替え
- GitHub Actions による macOS ARM64、macOS Intel、Windows x64、Linux x64 のリリースビルド

## ツールの状態

| ツール | 状態 | 内容 |
| --- | --- | --- |
| Base64 | 利用可能 | UTF-8 テキストのエンコード / デコード、コピー、消去 |
| MD5 | プレビュー | ハッシュ表示と検証 UI。計算処理は準備中 |
| タイムスタンプ | プレビュー | 日付とタイムスタンプの変換 UI。変換処理は準備中 |
| JSON 整形 | 予定 | プレースホルダー |
| URL エンコード / デコード | 予定 | プレースホルダー |
| UUID 生成 | 予定 | プレースホルダー |

## インストール

[GitHub Releases](https://github.com/songqii/PouchTools/releases) から最新版をダウンロードしてください。macOS は Apple Silicon / Intel、Windows は x64、Linux は x64 に対応しています。各ビルドには `SHA256SUMS-<target>.txt` が含まれます。

現在のプレビューパッケージは正式署名・公証されていません。macOS の Gatekeeper や Windows の未検証発行元の警告が表示される場合があります。

## 開発

必要な環境: Node.js 24、Rust 1.92.0、および対象 OS 用の Tauri 2 依存関係。

```bash
npm ci
npm run tauri:dev
```

```bash
npm run build
npm run tauri:build
node scripts/check-release-version.mjs
node --test scripts/release.test.mjs
```

メインウィンドウを閉じると PouchTools はトレイで実行を続けます。トレイメニューの「Show window」で復元し、「Quit」で終了します。

## リリース自動化

[`.github/workflows/release.yml`](.github/workflows/release.yml) が GitHub の runner 上でインストーラーをビルドします。`main` への push は Actions アーティファクトを作成し、`v0.1.0` のようなバージョンタグはインストーラー、SHA-256 ファイル、`docs/releases/` のリリースノートを含む Release 下書きを作成します。

## 制限事項

MD5 とタイムスタンプは現在固定値のプレビュー画面です。JSON、URL、UUID はプレースホルダーです。検索、設定、ファイル入力、履歴、リアルタイム時刻、設定の保存は未接続です。MD5 は一方向ハッシュであり、復号できません。

## ライセンス

PouchTools は [MIT License](LICENSE) で公開されています。
