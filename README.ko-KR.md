# PouchTools

**일상적인 개발 작업을 위한 크로스플랫폼 개발자 도구 모음입니다.**

**문서:** [English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md) · [Italiano](README.it-IT.md) · [Français](README.fr-FR.md) · [Deutsch](README.de-DE.md)

Rust와 Tauri 2로 만든 경량 데스크톱 개발자 도구입니다. React UI와 하나의 코드베이스로 macOS, Windows, Linux를 지원합니다.

> **프로젝트 상태:** 초기 프리뷰 버전입니다. Base64가 현재 사용할 수 있는 첫 번째 도구이며 MD5와 타임스탬프 화면은 예정된 상호작용을 보여주는 프리뷰입니다.

## 주요 기능

- 지원되는 텍스트 작업을 로컬에서 처리
- 창을 닫으면 시스템 트레이로 숨김
- macOS에서 트레이로 숨길 때 Dock 아이콘 숨김
- 라이트 / 다크 테마
- 영어 / 중국어 UI 전환
- GitHub Actions를 통한 macOS ARM64, macOS Intel, Windows x64, Linux x64 릴리스 빌드

## 도구 상태

| 도구 | 상태 | 설명 |
| --- | --- | --- |
| Base64 | 사용 가능 | UTF-8 텍스트 인코딩 / 디코딩, 복사, 지우기 |
| MD5 | 프리뷰 | 해시 표시와 검증 UI. 계산 로직은 준비 중 |
| 타임스탬프 | 프리뷰 | 날짜와 타임스탬프 변환 UI. 변환 로직은 준비 중 |
| JSON 포맷터 | 예정 | 플레이스홀더 |
| URL 인코더 / 디코더 | 예정 | 플레이스홀더 |
| UUID 생성기 | 예정 | 플레이스홀더 |

## 설치

[GitHub Releases](https://github.com/songqii/PouchTools/releases)에서 최신 패키지를 다운로드하세요. macOS Apple Silicon / Intel, Windows x64, Linux x64를 지원합니다. 각 빌드에는 `SHA256SUMS-<target>.txt` 파일이 포함됩니다.

현재 프리뷰 패키지는 정식 서명이나 공증이 없습니다. macOS Gatekeeper 또는 Windows의 게시자 확인 경고가 표시될 수 있습니다.

## 개발

필요 환경: Node.js 24, Rust 1.92.0, 대상 운영체제용 Tauri 2 의존성.

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

메인 창을 닫으면 PouchTools는 시스템 트레이에서 계속 실행됩니다. 트레이 메뉴의 “Show window”로 복원하고 “Quit”으로 종료합니다.

## 릴리스 자동화

[`.github/workflows/release.yml`](.github/workflows/release.yml)가 GitHub runner에서 설치 패키지를 빌드합니다. `main` push는 Actions 아티팩트를 만들고, `v0.1.0` 같은 버전 태그는 설치 패키지, SHA-256 파일, `docs/releases/`의 릴리스 노트가 포함된 Release 초안을 만듭니다.

## 제한 사항

MD5와 타임스탬프는 현재 고정된 예시를 표시하는 프리뷰 화면입니다. JSON, URL, UUID는 플레이스홀더입니다. 검색, 설정, 파일 입력, 기록, 실시간 시각, 환경설정 저장은 아직 연결되지 않았습니다. MD5는 단방향 해시이며 복호화할 수 없습니다.

## 라이선스

PouchTools는 [MIT License](LICENSE)로 배포됩니다.
