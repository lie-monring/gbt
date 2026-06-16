# GBT — Git Branch Tree

A minimalist Git GUI that puts your branch tree front and center. Built with Electron + React + TypeScript.

![dark](https://img.shields.io/badge/theme-dark-0f1117) ![platform](https://img.shields.io/badge/platform-Windows-blue) ![license](https://img.shields.io/badge/license-MIT-green)

## Why?

Most Git GUIs bury the branch graph behind menus and panels. GBT makes it the hero — open a repo and you immediately see your full branch structure. Click to explore, commit, revert, and navigate history with zero friction.

## Features

- **Interactive branch tree** — Full commit graph as SVG. Pan, zoom, hover for details.
- **Minimal interface** — Top bar, branch tree, 2 buttons. No menus, no clutter.
- **Commit panel** — Stage files, write message, commit. Auto-refreshes on completion.
- **Commit details** — Click a node → diff stats, author, date. Double-click → checkout.
- **Revert guard** — Revert a commit with one click. Already-reverted commits hide the button.
- **Auto git init** — Opening a non-Git folder prompts to `git init` with one click.
- **Bilingual** — English / 中文. Every string switches instantly.
- **Help modal** — Press `?` for keyboard shortcuts and usage tips.
- **Window controls** — Minimize & close buttons. Right-click folder → "Open with GBT" (run `scripts/install-context-menu.reg`).
- **Real Git** — Uses the git CLI under the hood. All normal workflows work.

## Screenshots

> TODO: add screenshots of branch tree, commit panel, and detail panel

## Install

### Download (Windows)

Go to [Releases](https://github.com/lie-monring/gbt/releases) and download `GBT.exe`.

### Run from source

```bash
git clone https://github.com/lie-monring/gbt.git
cd gbt
npm install
npm run dev
```

> Requires Git installed and in your PATH.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Desktop | Electron 35 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS 3 |
| State | Zustand 5 |
| Git | simple-git |
| i18n | react-i18next |
| Build | Vite 6 + electron-builder |

## Project Structure

```
gbt/
├── electron/          # Electron main process + preload
│   └── git/           # Git type definitions
├── src/
│   ├── components/
│   │   ├── graph/     # Branch tree SVG rendering
│   │   ├── panels/    # Slide-in panels (commit, detail)
│   │   └── layout/    # TopBar, BottomBar
│   ├── hooks/         # Git operation hooks
│   ├── stores/        # Zustand state stores
│   ├── lib/
│   │   ├── graph/     # Layout algorithm
│   │   └── i18n/      # Translations (en + zh)
│   └── styles/
├── scripts/           # Context menu installer
└── resources/         # App icons
```

## License

MIT
