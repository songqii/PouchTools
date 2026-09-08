# PouchTools

**Strumenti per sviluppatori multipiattaforma, pensati per il lavoro quotidiano.**

**Documentazione:** [English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md) · [Italiano](README.it-IT.md) · [Français](README.fr-FR.md) · [Deutsch](README.de-DE.md)

PouchTools è una raccolta leggera di strumenti desktop per sviluppatori, realizzata con Rust e Tauri 2, con interfaccia React e supporto per macOS, Windows e Linux da un unico codice sorgente.

> **Stato del progetto:** anteprima iniziale. Base64 è il primo strumento utilizzabile; le schermate MD5 e timestamp sono ancora anteprime dell'interazione prevista.

## Funzionalità

- Elaborazione locale delle operazioni di testo supportate
- Chiusura della finestra con permanenza nel vassoio di sistema
- Nascondimento dell'icona Dock su macOS quando l'app è nel vassoio
- Temi chiaro e scuro
- Interfaccia in inglese e cinese semplificato
- Build release tramite GitHub Actions per macOS ARM64, macOS Intel, Windows x64 e Linux x64

## Stato degli strumenti

| Strumento | Stato | Note |
| --- | --- | --- |
| Base64 | Disponibile | Codifica / decodifica UTF-8, copia e cancellazione |
| MD5 | Anteprima | UI per hash e verifica; il calcolo è in lavorazione |
| Timestamp | Anteprima | UI per conversione data/timestamp; la conversione è in lavorazione |
| Formattatore JSON | Pianificato | Segnaposto |
| Codifica / decodifica URL | Pianificato | Segnaposto |
| Generatore UUID | Pianificato | Segnaposto |

## Installazione

Scarica i pacchetti più recenti da [GitHub Releases](https://github.com/songqii/PouchTools/releases). Sono supportati macOS Apple Silicon / Intel, Windows x64 e Linux x64. Ogni build include `SHA256SUMS-<target>.txt`.

I pacchetti di anteprima non sono ancora firmati o autenticati ufficialmente. macOS potrebbe mostrare un avviso Gatekeeper e Windows un avviso relativo all'autore non verificato.

## Sviluppo

Requisiti: Node.js 24, Rust 1.92.0 e le dipendenze Tauri 2 della piattaforma.

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

Chiudendo la finestra principale, PouchTools resta attivo nel vassoio di sistema. Usa “Show window” per ripristinare la finestra e “Quit” per uscire.

## Automazione delle release

[`.github/workflows/release.yml`](.github/workflows/release.yml) crea i pacchetti sui runner GitHub. Un push su `main` crea gli artifact di Actions; un tag come `v0.1.0` crea una bozza di Release con installer, file SHA-256 e note da `docs/releases/`.

## Limitazioni

Le pagine MD5 e timestamp mostrano attualmente valori fissi di anteprima. JSON, URL e UUID sono segnaposto. Ricerca, impostazioni, input di file, cronologia, ora in tempo reale e salvataggio delle preferenze non sono ancora collegati. MD5 è un hash a senso unico e non può essere decifrato.

## Licenza

PouchTools è distribuito con [MIT License](LICENSE).
