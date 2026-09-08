# PouchTools

**Une boîte à outils multiplateforme pour les tâches de développement quotidiennes.**

**Documentation :** [English](README.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja-JP.md) · [한국어](README.ko-KR.md) · [Italiano](README.it-IT.md) · [Français](README.fr-FR.md) · [Deutsch](README.de-DE.md)

PouchTools est une collection légère d'outils de bureau pour développeurs, construite avec Rust et Tauri 2, avec une interface React et un seul code source pour macOS, Windows et Linux.

> **État du projet :** première version de prévisualisation. Base64 est le premier outil utilisable ; les écrans MD5 et timestamp présentent encore le modèle d'interaction prévu.

## Fonctionnalités

- Traitement local des opérations texte prises en charge
- Fermeture de la fenêtre avec maintien dans la zone de notification
- Masquage de l'icône du Dock sur macOS lorsque l'application est masquée
- Thèmes clair et sombre
- Interface en anglais et chinois simplifié
- Builds de publication via GitHub Actions pour macOS ARM64, macOS Intel, Windows x64 et Linux x64

## État des outils

| Outil | État | Notes |
| --- | --- | --- |
| Base64 | Disponible | Encodage / décodage UTF-8, copie et effacement |
| MD5 | Prévisualisation | Interface de hachage et de vérification ; calcul en cours |
| Timestamp | Prévisualisation | Interface de conversion date/timestamp ; conversion en cours |
| Formateur JSON | Prévu | Placeholder |
| Encodeur / décodeur URL | Prévu | Placeholder |
| Générateur UUID | Prévu | Placeholder |

## Installation

Téléchargez les paquets récents depuis [GitHub Releases](https://github.com/songqii/PouchTools/releases). macOS Apple Silicon / Intel, Windows x64 et Linux x64 sont pris en charge. Chaque build contient `SHA256SUMS-<target>.txt`.

Les paquets de prévisualisation ne sont pas encore signés ni notariés officiellement. macOS peut afficher un avertissement Gatekeeper et Windows un avertissement concernant un éditeur non vérifié.

## Développement

Prérequis : Node.js 24, Rust 1.92.0 et les dépendances Tauri 2 de votre plateforme.

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

La fermeture de la fenêtre principale laisse PouchTools actif dans la zone de notification. Utilisez « Show window » pour restaurer la fenêtre et « Quit » pour quitter.

## Automatisation des releases

[`.github/workflows/release.yml`](.github/workflows/release.yml) construit les paquets sur les runners GitHub. Un push sur `main` crée des artifacts Actions ; un tag tel que `v0.1.0` crée une Release brouillon avec les installateurs, les fichiers SHA-256 et les notes de `docs/releases/`.

## Limitations

Les écrans MD5 et timestamp affichent actuellement des valeurs fixes de prévisualisation. JSON, URL et UUID sont des placeholders. La recherche, les paramètres, les fichiers, l'historique, l'heure en direct et la sauvegarde des préférences ne sont pas encore connectés. MD5 est un hachage à sens unique et ne peut pas être déchiffré.

## Licence

PouchTools est distribué sous [MIT License](LICENSE).
