# PouchTools

**Plattformübergreifende Entwicklertools für den täglichen Arbeitsablauf.**

**Dokumentation:** [English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md) · [Italiano](README.it-IT.md) · [Français](README.fr-FR.md) · [Deutsch](README.de-DE.md)

PouchTools ist eine schlanke Desktop-Werkzeugsammlung für Entwickler. Die Anwendung basiert auf Rust und Tauri 2, verwendet eine React-Oberfläche und unterstützt macOS, Windows und Linux aus einer gemeinsamen Codebasis.

> **Projektstatus:** Frühe Vorschauversion. Base64 ist das erste nutzbare Werkzeug; die MD5- und Zeitstempelansichten zeigen derzeit das geplante Bedienkonzept.

## Funktionen

- Lokale Verarbeitung der unterstützten Textoperationen
- Schließen des Fensters mit weiterlaufender Anwendung im System-Tray
- Ausblenden des Dock-Symbols unter macOS, wenn das Fenster verborgen ist
- Helles und dunkles Design
- Benutzeroberfläche auf Englisch und vereinfachtem Chinesisch
- Release-Builds über GitHub Actions für macOS ARM64, macOS Intel, Windows x64 und Linux x64

## Status der Werkzeuge

| Werkzeug | Status | Hinweise |
| --- | --- | --- |
| Base64 | Verfügbar | UTF-8-Text kodieren / dekodieren, kopieren und löschen |
| MD5 | Vorschau | Oberfläche für Hash und Prüfung; Berechnung folgt |
| Zeitstempel | Vorschau | Oberfläche für Datum/Zeitstempel; Umrechnung folgt |
| JSON-Formatierung | Geplant | Platzhalter |
| URL-Kodierung / -Dekodierung | Geplant | Platzhalter |
| UUID-Generator | Geplant | Platzhalter |

## Installation

Laden Sie die aktuellen Pakete über [GitHub Releases](https://github.com/songqii/PouchTools/releases) herunter. Unterstützt werden macOS Apple Silicon / Intel, Windows x64 und Linux x64. Jeder Build enthält `SHA256SUMS-<target>.txt`.

Die Vorschaupakete sind noch nicht offiziell signiert oder notariell beglaubigt. macOS kann eine Gatekeeper-Warnung und Windows eine Warnung zu einem nicht verifizierten Herausgeber anzeigen.

## Entwicklung

Voraussetzungen: Node.js 24, Rust 1.92.0 und die Tauri-2-Abhängigkeiten der jeweiligen Plattform.

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

Beim Schließen des Hauptfensters bleibt PouchTools im System-Tray aktiv. Mit „Show window“ wird das Fenster wiederhergestellt, mit „Quit“ wird die Anwendung beendet.

## Release-Automatisierung

[`.github/workflows/release.yml`](.github/workflows/release.yml) erstellt die Pakete auf GitHub-Runnern. Ein Push nach `main` erstellt Actions-Artefakte; ein Tag wie `v0.1.0` erstellt einen Release-Entwurf mit Installationspaketen, SHA-256-Dateien und den Notizen aus `docs/releases/`.

## Einschränkungen

Die MD5- und Zeitstempelansichten zeigen derzeit feste Vorschauwerte. JSON, URL und UUID sind Platzhalter. Suche, Einstellungen, Dateieingabe, Verlauf, Echtzeit und das Speichern von Einstellungen sind noch nicht angebunden. MD5 ist ein Einweg-Hash und kann nicht entschlüsselt werden.

## Lizenz

PouchTools wird unter der [MIT License](LICENSE) veröffentlicht.
