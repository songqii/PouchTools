# PouchTools

**日常の開発作業向けクロスプラットフォーム開発者ツール。**

**ドキュメント:** [English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md) · [Italiano](README.it-IT.md) · [Français](README.fr-FR.md) · [Deutsch](README.de-DE.md)

Rust と Tauri 2 で構築された軽量なデスクトップ開発者ツール集です。React の UI と単一のコードベースで macOS、Windows、Linux をサポートします。

> **プロジェクトの状態:** 機能プレビュー版です。6 つのツールを Tauri クライアント上でローカルに利用でき、現在はコア変換とコンパクトなデスクトップ操作に重点を置いています。

## 主な機能

- 対応するテキスト処理をローカルで実行
- ウィンドウを閉じるとシステムトレイへ移動
- macOS でトレイに隠した際に Dock アイコンを非表示
- ライト / ダークテーマ
- 英語 / 中国語 UI 切り替え
- 設定の保存、ツール検索、お気に入り、コピー、消去、ダウンロード
- GitHub Actions による macOS ARM64、macOS Intel、Windows x64、Linux x64 のリリースビルド

## ツールの状態

| ツール | 状態 | 内容 |
| --- | --- | --- |
| Base64 | 利用可能 | UTF-8 / URL-safe のエンコードとデコード、履歴、コピー、消去、ダウンロード |
| MD5 | 利用可能 | テキストとファイルのハッシュ、大小文字切り替え、検証 |
| タイムスタンプ | 利用可能 | 秒 / ミリ秒、タイムゾーン、ライブ時計、コピー |
| JSON 整形 | 利用可能 | 整形、圧縮、インデント、キーソート、コピー、ダウンロード |
| URL エンコード / デコード | 利用可能 | コンポーネント / URL 全体モード、コピー、消去、交換 |
| UUID 生成 | 利用可能 | RFC 4122 v4 UUID を 1 件以上生成 |

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
npm run test:utils
npm run tauri:build
node scripts/check-release-version.mjs
node --test scripts/release.test.mjs
```

メインウィンドウを閉じると PouchTools はトレイで実行を続けます。トレイメニューの「Show window」で復元し、「Quit」で終了します。

## リリース自動化

[`.github/workflows/release.yml`](.github/workflows/release.yml) が GitHub の runner 上でインストーラーをビルドします。`main` への push は Actions アーティファクトを作成し、`v0.1.0` のようなバージョンタグはインストーラー、SHA-256 ファイル、`docs/releases/` のリリースノートを含む Release 下書きを作成します。

## 制限事項

すべての変換はクライアント内でローカルに処理され、入力データをアップロードしません。MD5 は一方向ハッシュであり、復号できません。

## ライセンス

PouchTools は [MIT License](LICENSE) で公開されています。
